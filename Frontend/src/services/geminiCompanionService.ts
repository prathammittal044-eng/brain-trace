/**
 * Client-Side Companion Service
 * Interacts with the secure server-side Gemini endpoint `/api/companion/chat`,
 * with seamless fallback to the local structured knowledge base.
 */

import { CompanionAction, CompanionContext } from './companionNavigation';
import { getKnowledgeBaseAnswer } from './companionKnowledgeBase';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

export interface CompanionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: CompanionAction;
  isError?: boolean;
}

export interface CompanionChatResponse {
  message: string;
  action?: CompanionAction;
  modelUsed?: string;
  followUps?: string[];
}

/**
 * Sends conversation history and contextual screen info to the Gemini companion backend.
 */
export async function sendCompanionMessage(
  history: CompanionMessage[],
  context?: CompanionContext
): Promise<CompanionChatResponse> {
  const latestMessage = history[history.length - 1];
  const query = latestMessage?.content || '';

  try {
    const payloadMessages = history.map((m) => ({
      role: m.role,
      content: m.content
    }));

    // Call server-side proxy
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(`${API_BASE_URL}/api/companion/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: payloadMessages,
        context
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        message: data.message || "I'm here to assist with BrainTrace. What would you like to explore?",
        action: data.action,
        modelUsed: data.modelUsed || 'gemini',
        followUps: data.followUps
      };
    } else {
      console.warn('[Gemini Companion] Server returned non-200, activating local fallback...');
    }
  } catch (err: any) {
    console.warn('[Gemini Companion] Network/timeout error, activating local fallback:', err?.message);
  }

  // Graceful deterministic fallback
  const kbMatch = getKnowledgeBaseAnswer(query);
  if (kbMatch) {
    return {
      message: kbMatch.answer,
      action: kbMatch.action,
      modelUsed: 'knowledge-base',
      followUps: kbMatch.followUps
    };
  }

  return {
    message: "I'm right here! You can ask me how to upload MRI scans, start cognitive assessments, download PDF reports, book appointments, or message your care team.",
    action: {
      type: 'navigate',
      destination: 'cognitiveTest',
      label: 'Explore Cognitive Test →'
    },
    modelUsed: 'fallback'
  };
}
