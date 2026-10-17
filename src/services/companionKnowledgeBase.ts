/**
 * Comprehensive Product Knowledge Base & System Instruction for BrainTrace Companion
 * Fully grounded in BrainTrace's implemented features, workflows, and medical safety guardrails.
 */

import { CompanionAction, NavigationDestination, NAVIGATION_REGISTRY } from './companionNavigation';

export const COMPANION_SYSTEM_INSTRUCTION = `You are the BrainTrace Companion, a friendly, concise, and supportive AI assistant embedded in the BrainTrace brain health platform.

Your primary responsibilities:
1. Help users navigate the BrainTrace web application with safe, structured action buttons.
2. Explain existing BrainTrace features clearly and concisely.
3. Answer frequently asked product questions without medical bias or diagnostic claims.
4. Help users understand cognitive assessment terminology (e.g., Working Memory, Pattern Recognition, Visual-Spatial processing, Fazekas grade) in neutral, factual terms.
5. Suggest safe, relevant next steps within the application.

Personality & Tone:
- Warm, calm, patient, and approachable.
- Respectful of older adults and users who may feel overwhelmed by complicated clinical interfaces.
- Use short paragraphs and simple everyday language.
- Explain instructions step-by-step.
- Never shame or patronize a user for an incorrect test answer or a low score.

BrainTrace Implemented Features (Source of Truth):
- **Cognitive Assessment**: Daily 5-domain activity test (Memory Recall, Attention, Working Memory, Pattern & Rule Challenge, Visual-Spatial Challenge).
- **Scoring**: Calculates an unweighted equal-average Daily Cognitive Activity Score out of 100 based on the 5 domains. This is an experimental longitudinal engagement score, NOT a clinical dementia diagnosis.
- **Reports & PDF Download**: Generates real downloadable PDF documents ("BrainTrace_Cognitive_Report_YYYY-MM-DD.pdf") formatted with BrainTrace monochrome styling, domain tables, rule-based neutral observations, and medical disclaimers.
- **My Scans**: Interactive Brain MRI viewer supporting Axial, Sagittal, and Coronal views. Displays volumetric indices, estimated Hippocampal volume (cm³), and Fazekas Grade 1 white matter hyperintensities.
- **MRI Upload**: Supports uploading Brain MRI scans (.dcm, .nii, images) for volumetric AI processing.
- **Appointments**: Directory of specialists (Dr. Rajesh Sharma, Dr. Neha Verma, Dr. Amit Desai, Dr. Priya Nair) with in-person clinic visits and telehealth video/audio booking.
- **Messages & Telehealth**: Secure patient-provider messaging with real-time thread search, cognitive report sharing, MRI attachments, and virtual audio/video consultations.
- **Settings**: Manage preferences, language, notifications, and profile details.

Navigation Actions Schema:
When suggesting navigation to an existing page, output a structured JSON action block at the end of your response:
<<<ACTION:{"type":"navigate","destination":"<destination_key>","label":"<Button Label>"}>>>

Allowed destination keys:
- "dashboard": Patient Overview Dashboard
- "cognitiveTest": Cognitive Assessment flow
- "startAssessment": Start a new cognitive session
- "assessmentResults": View assessment results
- "assessmentHistory": Open assessment history list
- "cognitiveReport": Open detailed report & PDF export
- "myScans": View Brain MRI Scans
- "uploadScan": Upload a new MRI scan
- "appointments": View Appointments & Specialists
- "bookAppointment": Book an appointment
- "messages": Open Messages & Telehealth
- "settings": Open Account Settings
- "home": Return to Home Landing Page

Medical Safety Boundaries (STRICT):
- You are an AI navigation assistant, NOT a medical doctor.
- NEVER diagnose dementia, Alzheimer's, or any neurological condition.
- NEVER tell a user what disease stage they are in.
- NEVER advise altering or stopping medications.
- If a user expresses worry about memory loss, respond with empathy and encourage discussing symptoms with a qualified neurologist or physician.
- Clarify that BrainTrace cognitive activities and MRI visualizations are experimental longitudinal tracking tools and do not substitute for in-person clinical neurological evaluations.`;

export interface CompanionKnowledgeEntry {
  patterns: RegExp[];
  answer: string;
  suggestedAction?: {
    destination: NavigationDestination;
    label: string;
  };
  followUps?: string[];
}

export const KNOWLEDGE_BASE_ENTRIES: CompanionKnowledgeEntry[] = [
  {
    patterns: [/upload.*(mri|scan)/i, /how.*(add|upload).*scan/i, /submit.*mri/i],
    answer: "To upload an MRI scan, go to **My Scans** and click the **Upload MRI** button. You can upload DICOM (.dcm), NIfTI (.nii), or high-resolution brain scan images. Our volumetric engine will analyze the scan orientation and calculate biomarker indices.",
    suggestedAction: {
      destination: 'uploadScan',
      label: 'Open MRI Upload Dialog →'
    },
    followUps: ["What formats are supported?", "Where can I find my MRI history?"]
  },
  {
    patterns: [/where.*(report|pdf)/i, /how.*(download|save|print).*pdf/i, /export.*report/i],
    answer: "Your reports are generated directly from completed cognitive assessments! You can click **Print Report (Save As PDF)** on any assessment results or detailed report screen to instantly download a genuine, formatted PDF (`BrainTrace_Cognitive_Report_YYYY-MM-DD.pdf`).",
    suggestedAction: {
      destination: 'assessmentHistory',
      label: 'Open Assessment History →'
    },
    followUps: ["What information is included in a report?", "How is my cognitive score calculated?"]
  },
  {
    patterns: [/how.*(cognitive|test|assessment).*work/i, /what.*cognitive.*test/i, /what.*activities/i],
    answer: "The BrainTrace Cognitive Assessment consists of 10 brief, unconstrained exercises spanning 5 key domains: **Memory Recall**, **Attention**, **Working Memory**, **Pattern & Rule Challenge**, and **Visual-Spatial Challenge**. It takes about 3 to 5 minutes to complete at your own pace.",
    suggestedAction: {
      destination: 'cognitiveTest',
      label: 'Start Cognitive Assessment →'
    },
    followUps: ["How is the activity score calculated?", "Does my score mean I have dementia?"]
  },
  {
    patterns: [/how.*(calculate|score)|scoring formula/i],
    answer: "Your Daily Cognitive Activity Score is an unweighted average of performance across all 5 domains (each scored 0–100%). It reflects consistent task engagement and response accuracy. It is designed for personal longitudinal tracking, rather than a clinical diagnostic benchmark.",
    suggestedAction: {
      destination: 'cognitiveTest',
      label: 'Go to Cognitive Test →'
    },
    followUps: ["Does my score mean I have dementia?", "Where can I find my reports?"]
  },
  {
    patterns: [/do i have dementia/i, /low score.*dementia/i, /am i sick/i, /alzheimer/i],
    answer: "A low score on a digital activity does not establish that you have dementia. These activities summarize performance on specific short exercises, which can fluctuate due to sleep, stress, or unfamiliarity with the screen. If you have concerns about memory or thinking changes, please consult a qualified neurologist or physician for a comprehensive clinical assessment.",
    suggestedAction: {
      destination: 'bookAppointment',
      label: 'Book Consultation with Neurologist →'
    },
    followUps: ["How do I find a neurologist?", "How does the cognitive assessment work?"]
  },
  {
    patterns: [/stop.*medication|change.*prescription|take.*medicine/i],
    answer: "I cannot advise you to alter, start, or stop any prescribed medication. Please discuss any medication questions directly with your prescribing physician or care team.",
    suggestedAction: {
      destination: 'messages',
      label: 'Message Your Care Team →'
    }
  },
  {
    patterns: [/book.*(appointment|doctor|visit)|find.*doctor|neurologist/i],
    answer: "You can discover neurology specialists, review their clinical profiles, and book appointments directly under the **Appointments** tab. We offer in-person hospital visits as well as virtual telehealth consultations.",
    suggestedAction: {
      destination: 'appointments',
      label: 'Explore Doctors & Appointments →'
    },
    followUps: ["How do I message my doctor?", "How do I upload an MRI?"]
  },
  {
    patterns: [/message|chat with doctor|telehealth|video call|phone call/i],
    answer: "Under the **Messages** tab, you can chat directly with your doctors (including Dr. Rajesh Sharma, Dr. Neha Verma, and Dr. Amit Desai), share your recent cognitive reports or MRI scans, and initiate telehealth audio or video calls.",
    suggestedAction: {
      destination: 'messages',
      label: 'Open Messages & Telehealth →'
    },
    followUps: ["How do I book an appointment?", "Where can I find my reports?"]
  },
  {
    patterns: [/view.*(mri|scan)|my scans|fazekas|hippocampal/i],
    answer: "Under **My Scans**, you can view interactive Axial, Sagittal, and Coronal views of your brain scans, along with automated volumetric analysis including estimated Hippocampal volume and Fazekas Grade 1 white matter hyperintensity tracking.",
    suggestedAction: {
      destination: 'myScans',
      label: 'Open My Scans →'
    },
    followUps: ["How do I upload an MRI?", "How do I book a doctor's appointment?"]
  },
  {
    patterns: [/setting|profile|edit.*name|notification/i],
    answer: "You can manage your display preferences, notifications, security settings, and demo profile information under the **Settings** tab.",
    suggestedAction: {
      destination: 'settings',
      label: 'Open Account Settings →'
    }
  },
  {
    patterns: [/history|previous.*test|past.*assessment/i],
    answer: "You can review all previously completed cognitive check-ins and longitudinal scores under **Assessment History**.",
    suggestedAction: {
      destination: 'assessmentHistory',
      label: 'Open Assessment History →'
    }
  }
];

/**
 * Searches the structured knowledge base for a deterministic match
 * Used as a dependable fallback when network or API quota spikes occur.
 */
export function getKnowledgeBaseAnswer(
  query: string
): { answer: string; action?: CompanionAction; followUps?: string[] } | null {
  for (const entry of KNOWLEDGE_BASE_ENTRIES) {
    for (const pattern of entry.patterns) {
      if (pattern.test(query)) {
        let action: CompanionAction | undefined;
        if (entry.suggestedAction) {
          action = {
            type: 'navigate',
            destination: entry.suggestedAction.destination,
            label: entry.suggestedAction.label
          };
        }
        return {
          answer: entry.answer,
          action,
          followUps: entry.followUps
        };
      }
    }
  }
  return null;
}
