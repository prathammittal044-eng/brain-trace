import {
  CognitiveDomain,
  PatientResponse,
  DomainScore,
  AssessmentScore
} from '../types/cognitiveAssessment';

export const DOMAIN_METADATA: Record<CognitiveDomain, { name: string; description: string }> = {
  memory: {
    name: 'Memory Recall',
    description: 'Explores episodic recognition and delayed retention of studied items.'
  },
  attention: {
    name: 'Attention Challenge',
    description: 'Explores selective visual target discrimination and distractor rejection.'
  },
  workingMemory: {
    name: 'Working Memory',
    description: 'Explores immediate sequential retention and recall of positional patterns.'
  },
  pattern: {
    name: 'Pattern & Rule Challenge',
    description: 'Explores executive function, logical sequences, and rule switching.'
  },
  visualSpatial: {
    name: 'Visual-Spatial Challenge',
    description: 'Explores 2D geometric orientation, rotation, and spatial alignment.'
  }
};

export const CLINICAL_DISCLAIMER_TEXT = 
  'This is an experimental Daily Cognitive Activity Score designed for personal longitudinal tracking and engagement. It is not a clinically validated diagnostic instrument, is not cleared by medical authorities to detect or rule out cognitive decline or dementia, and should never be used as a substitute for professional neurological evaluation.';

/**
 * Calculates domain score based strictly on scored responses for that domain.
 * Practice questions are always excluded.
 */
export function calculateDomainScore(
  domain: CognitiveDomain,
  responses: PatientResponse[]
): DomainScore {
  const domainResponses = responses.filter(
    (r) => r.domain === domain
  );

  const totalScoredResponses = domainResponses.length;
  if (totalScoredResponses === 0) {
    return {
      domain,
      domainName: DOMAIN_METADATA[domain].name,
      correctResponses: 0,
      totalScoredResponses: 0,
      scorePercentage: 0,
      accuracyDescription: 'No responses recorded for this domain'
    };
  }

  // Sum of earned credit (0.0 to 1.0 per response)
  const earnedCredit = domainResponses.reduce((sum, r) => sum + (r.scoreEarned || 0), 0);
  const correctCount = domainResponses.filter((r) => r.isCorrect).length;

  const scorePercentage = Math.min(100, Math.max(0, (earnedCredit / totalScoredResponses) * 100));

  let accuracyDescription = 'Moderate accuracy';
  if (scorePercentage >= 85) {
    accuracyDescription = 'High accuracy across presented tasks';
  } else if (scorePercentage >= 65) {
    accuracyDescription = 'Consistent engagement with occasional variance';
  } else {
    accuracyDescription = 'Varied performance on presented tasks';
  }

  return {
    domain,
    domainName: DOMAIN_METADATA[domain].name,
    correctResponses: correctCount,
    totalScoredResponses,
    scorePercentage: Math.round(scorePercentage),
    accuracyDescription
  };
}

/**
 * Calculates overall assessment score as the unweighted average of all 5 domains.
 */
export function calculateOverallAssessmentScore(
  responses: PatientResponse[],
  durationSeconds: number = 0,
  expectedTotalQuestions: number = 10
): AssessmentScore {
  const domains: CognitiveDomain[] = [
    'memory',
    'attention',
    'workingMemory',
    'pattern',
    'visualSpatial'
  ];

  const domainScores: Record<CognitiveDomain, DomainScore> = {
    memory: calculateDomainScore('memory', responses),
    attention: calculateDomainScore('attention', responses),
    workingMemory: calculateDomainScore('workingMemory', responses),
    pattern: calculateDomainScore('pattern', responses),
    visualSpatial: calculateDomainScore('visualSpatial', responses)
  };

  // Unweighted average of all 5 domain scores
  const domainScoreValues = Object.values(domainScores).map((d) => d.scorePercentage);
  const sumOfDomains = domainScoreValues.reduce((a, b) => a + b, 0);
  const overallScore = Math.round(sumOfDomains / domains.length);

  // Scored questions counts
  const scoredResponses = responses.filter((r) => r.domain !== 'practice');
  const totalScoredQuestions = scoredResponses.length;
  const totalCorrectQuestions = scoredResponses.filter((r) => r.isCorrect).length;
  const unansweredCount = Math.max(0, expectedTotalQuestions - totalScoredQuestions);

  // Generate rule-based neutral observations
  const observations = generateRuleBasedObservations(domainScores, scoredResponses);

  return {
    overallScore,
    domainScores,
    totalScoredQuestions,
    totalCorrectQuestions,
    unansweredCount,
    durationSeconds,
    observations,
    medicalDisclaimer: CLINICAL_DISCLAIMER_TEXT
  };
}

/**
 * Generates neutral, factual, rule-based observations without clinical diagnostic bias.
 */
export function generateRuleBasedObservations(
  domainScores: Record<CognitiveDomain, DomainScore>,
  responses: PatientResponse[]
): string[] {
  const observations: string[] = [];

  const totalScored = responses.length;
  const totalCorrect = responses.filter((r) => r.isCorrect).length;

  observations.push(
    `You completed ${totalScored} scored exercises, answering ${totalCorrect} of ${totalScored} with full precision.`
  );

  // Memory delayed recall observation
  const delayedRecall = responses.find((r) => r.activityKind === 'memory_delayed_recall');
  if (delayedRecall && delayedRecall.rawDetails) {
    const { correctSelections = 0, totalExpected = 6, incorrectSelections = 0 } = delayedRecall.rawDetails;
    if (correctSelections === totalExpected && incorrectSelections === 0) {
      observations.push('In the delayed memory recall task, all 6 originally studied items were successfully identified without distractor selections.');
    } else {
      observations.push(
        `In delayed memory recall, ${correctSelections} of ${totalExpected} original items were identified with ${incorrectSelections} false distractor selection(s).`
      );
    }
  }

  // Attention observation
  const attentionResponses = responses.filter((r) => r.domain === 'attention');
  if (attentionResponses.length > 0) {
    let totalMissed = 0;
    let totalFalse = 0;
    attentionResponses.forEach((r) => {
      totalMissed += r.rawDetails?.missedSelections || 0;
      totalFalse += r.rawDetails?.incorrectSelections || 0;
    });
    if (totalMissed === 0 && totalFalse === 0) {
      observations.push('Target selection in the attention challenges was completed with zero missed targets.');
    } else {
      observations.push(
        `During attention target selection, ${totalMissed} target(s) were unselected and ${totalFalse} distractor(s) were chosen.`
      );
    }
  }

  // Working memory observation
  const wmResponses = responses.filter((r) => r.domain === 'workingMemory');
  if (wmResponses.length > 0) {
    let maxSequence = 0;
    let sequenceErrors = 0;
    wmResponses.forEach((r) => {
      if (r.rawDetails?.sequenceLength && r.isCorrect) {
        maxSequence = Math.max(maxSequence, r.rawDetails.sequenceLength);
      }
      if (!r.isCorrect) sequenceErrors++;
    });
    if (sequenceErrors === 0) {
      observations.push(`Working memory sequences up to length ${maxSequence || 4} were reproduced in exact sequential order.`);
    } else {
      observations.push(
        `Sequence reproduction included ${sequenceErrors} order variance(s), with maximum successfully reproduced sequence length of ${maxSequence || 3}.`
      );
    }
  }

  // Pattern observation
  const patternScore = domainScores.pattern.scorePercentage;
  if (patternScore >= 80) {
    observations.push('Rule adherence remained consistent across both baseline sequences and rule-switching exercises.');
  } else {
    observations.push('Rule-switching exercises revealed occasional response variance following the transition to new criteria.');
  }

  // Visual Spatial observation
  const vsScore = domainScores.visualSpatial.scorePercentage;
  if (vsScore >= 80) {
    observations.push('Mental rotation and 2D spatial alignment matches were identified accurately.');
  } else {
    observations.push('Spatial rotation tasks exhibited partial variance on 90-degree axis orientations.');
  }

  return observations;
}
