export type CognitiveDomain = 
  | 'memory' 
  | 'attention' 
  | 'workingMemory' 
  | 'pattern' 
  | 'visualSpatial';

export type ActivityKind =
  | 'memory_study'
  | 'attention_target'
  | 'working_memory_sequence'
  | 'pattern_reasoning'
  | 'rule_grouping'
  | 'visual_spatial_match'
  | 'memory_delayed_recall'
  | 'practice';

export interface PatientResponse {
  questionId: string;
  domain: CognitiveDomain | 'practice';
  activityKind: ActivityKind;
  userAnswer: any;
  isCorrect: boolean;
  scoreEarned: number; // 0 to 1
  rawDetails: {
    correctSelections?: number;
    totalExpected?: number;
    missedSelections?: number;
    incorrectSelections?: number;
    timeTakenSeconds?: number;
    sequenceLength?: number;
    errorsCount?: number;
    summaryText?: string;
  };
  answeredAt: string;
}

export interface DomainScore {
  domain: CognitiveDomain;
  domainName: string;
  correctResponses: number;
  totalScoredResponses: number;
  scorePercentage: number; // 0 - 100
  accuracyDescription: string;
}

export interface AssessmentScore {
  overallScore: number; // 0 - 100 unweighted average
  domainScores: Record<CognitiveDomain, DomainScore>;
  totalScoredQuestions: number;
  totalCorrectQuestions: number;
  unansweredCount: number;
  durationSeconds: number;
  observations: string[];
  medicalDisclaimer: string;
}

export interface AssessmentSession {
  id: string;
  patientId: string;
  patientName: string;
  version: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentStepIndex: number;
  responses: Record<string, PatientResponse>;
  score?: AssessmentScore;
  durationSeconds: number;
}

export interface CognitiveQuestionOption {
  id: string;
  label: string;
  iconName?: string;
  shapeSvg?: string;
  isTarget?: boolean;
}

export interface CognitiveQuestion {
  id: string;
  domain: CognitiveDomain | 'practice';
  activityKind: ActivityKind;
  title: string;
  instructions: string;
  detailPrompt: string;
  options?: CognitiveQuestionOption[];
  sequenceTarget?: number[]; // for working memory
  ruleDescription?: string;
  targetCount?: number;
  studyDurationSeconds?: number; // for memory study
  isPractice?: boolean;
  meta?: Record<string, any>;
}
