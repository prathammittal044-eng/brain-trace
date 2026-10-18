import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { COMPANION_SYSTEM_INSTRUCTION, getKnowledgeBaseAnswer } from './src/services/companionKnowledgeBase';
import { NAVIGATION_REGISTRY, NavigationDestination } from './src/services/companionNavigation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// Proxy /api/v1, /results, /api/ready, and /api/health requests to the FastAPI backend (port 8000)
app.use(['/api/v1', '/results', '/api/ready', '/api/health'], (req: Request, res: Response) => {
  try {
    const backendTarget = new URL(req.originalUrl, BACKEND_URL);
    const options: http.RequestOptions = {
      hostname: backendTarget.hostname,
      port: backendTarget.port,
      path: backendTarget.pathname + backendTarget.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${backendTarget.hostname}:${backendTarget.port}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy Error] Failed to proxy ${req.method} ${req.originalUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Backend unreachable on port 8000', details: err.message });
      }
    });

    req.pipe(proxyReq);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Proxy dispatch error', details: err.message });
    }
  }
});

app.use(express.json());

// Initialize Google Gemini SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI() : null;

/**
 * Parses structured navigation action from model output
 * Example format: <<<ACTION:{"type":"navigate","destination":"cognitiveTest","label":"Go to Cognitive Test"}>>>
 */
function extractActionFromText(rawText: string) {
  let cleanText = rawText;
  let action: { type: 'navigate'; destination: NavigationDestination; label: string } | undefined;

  const actionRegex = /<<<ACTION:(\{.*?\})>>>/s;
  const match = rawText.match(actionRegex);

  if (match) {
    cleanText = rawText.replace(actionRegex, '').trim();
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type === 'navigate' && parsed.destination in NAVIGATION_REGISTRY) {
        action = {
          type: 'navigate',
          destination: parsed.destination as NavigationDestination,
          label: parsed.label || NAVIGATION_REGISTRY[parsed.destination as NavigationDestination].actionText
        };
      }
    } catch (e) {
      console.warn('[Gemini Server] Failed to parse action JSON:', e);
    }
  }

  // If no action block found in output, check if text explicitly mentions key destinations
  if (!action) {
    if (/assessment history|previous tests|past results/i.test(cleanText)) {
      action = { type: 'navigate', destination: 'assessmentHistory', label: 'Open Assessment History →' };
    } else if (/upload.*(mri|scan)|my scans/i.test(cleanText)) {
      action = { type: 'navigate', destination: 'myScans', label: 'Open My Scans →' };
    } else if (/book.*appointment|see a neurologist|schedule a visit/i.test(cleanText)) {
      action = { type: 'navigate', destination: 'appointments', label: 'Open Appointments →' };
    } else if (/cognitive (assessment|test)|brain check/i.test(cleanText) && !cleanText.includes('history')) {
      action = { type: 'navigate', destination: 'cognitiveTest', label: 'Start Cognitive Assessment →' };
    } else if (/messages|telehealth|chat with/i.test(cleanText)) {
      action = { type: 'navigate', destination: 'messages', label: 'Open Messages & Chat →' };
    }
  }

  return { cleanText, action };
}

// POST /api/companion/chat - Server-side Gemini API endpoint
app.post('/api/companion/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, context } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const latestUserMessage = messages[messages.length - 1];
    const userQuery = latestUserMessage?.content || '';

    // Check deterministic knowledge base first for rapid & accurate response
    const kbMatch = getKnowledgeBaseAnswer(userQuery);

    // If Gemini API is available, generate dynamic response using GoogleGenAI
    if (ai && geminiApiKey) {
      try {
        const contextNote = context
          ? `\nUser's current screen: Page="${context.currentRoute || 'home'}", ActiveTab="${context.activeTab || 'Overview'}", SubView="${context.cognitiveSubView || 'default'}", Role="${context.userRole || 'Patient'}".`
          : '';

        const fullSystemPrompt = `${COMPANION_SYSTEM_INSTRUCTION}${contextNote}`;

        // Format conversation history for Gemini
        // We include previous turns for multi-turn conversational context
        const contents = messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        let responseText = '';
        // Attempt gemini-3.5-flash first, then gemini-3.8-flash, then gemini-3.1-flash-lite
        const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
        let lastError: any = null;

        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: contents as any,
              config: {
                systemInstruction: fullSystemPrompt,
                temperature: 0.3,
                maxOutputTokens: 600
              }
            });

            if (response.text) {
              responseText = response.text;
              break;
            }
          } catch (modelErr) {
            lastError = modelErr;
            console.warn(`[Gemini Server] Model ${model} failed, trying fallback:`, (modelErr as Error).message);
          }
        }

        if (responseText) {
          const { cleanText, action } = extractActionFromText(responseText);
          res.json({
            success: true,
            modelUsed: 'gemini',
            message: cleanText,
            action: action || kbMatch?.action
          });
          return;
        }

        throw lastError || new Error('All candidate models failed');
      } catch (geminiError) {
        console.warn('[Gemini Server] API call failed, using knowledge fallback:', (geminiError as Error).message);
      }
    }

    // Fallback if API key missing or transient quota spike
    if (kbMatch) {
      res.json({
        success: true,
        modelUsed: 'knowledge-base',
        message: kbMatch.answer,
        action: kbMatch.action,
        followUps: kbMatch.followUps
      });
      return;
    }

    // Friendly default fallback
    res.json({
      success: true,
      modelUsed: 'fallback',
      message: "I'm right here! I can help you upload MRI scans, start cognitive assessments, download PDF reports, book appointments, or message your care team. What would you like to explore?",
      action: {
        type: 'navigate',
        destination: 'cognitiveTest',
        label: 'Explore Cognitive Test →'
      }
    });
  } catch (error) {
    console.error('[Gemini Server] Unexpected server error:', error);
    res.status(500).json({
      error: 'Failed to process companion chat message',
      details: (error as Error).message
    });
  }
});

// Mount Vite or static assets depending on environment
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn('Production build dist/ not found, mounting dev Vite...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`BrainTrace Full-Stack server running at http://${HOST}:${PORT}`);
  });
}

startServer();
