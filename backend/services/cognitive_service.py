"""
Authoritative Server-Side Cognitive Scoring Service for DemenX
"""

from typing import List, Dict, Any, Tuple
from schemas.cognitive import PatientResponseDTO, DomainScoreDTO, AssessmentScoreDTO

DOMAIN_NAMES = {
    "memory": "Memory & Delayed Recall",
    "attention": "Sustained Visual Attention",
    "workingMemory": "Working Memory & Sequence",
    "pattern": "Pattern & Rule Challenge",
    "visualSpatial": "Visual-Spatial Alignment"
}

DOMAINS_ORDER = ["memory", "attention", "workingMemory", "pattern", "visualSpatial"]

DISCLAIMER = (
    "This score is an experimental Daily Cognitive Activity Score generated for tracking cognitive "
    "engagement. It is NOT a clinical diagnosis of dementia, Alzheimer's disease, or mild cognitive "
    "impairment (MCI). Please consult a qualified neurologist or physician for professional medical evaluation."
)


def calculate_cognitive_score(
    responses: List[PatientResponseDTO],
    duration_seconds: int = 0
) -> AssessmentScoreDTO:
    """
    Calculate domain scores and overall score.
    Practice questions are excluded from scoring.
    Overall score is the unweighted average of the 5 scored cognitive domain percentages.
    """
    domain_totals: Dict[str, Dict[str, float]] = {
        d: {"earned": 0.0, "count": 0.0, "correct": 0.0}
        for d in DOMAINS_ORDER
    }

    scored_count = 0
    correct_count = 0

    for r in responses:
        if r.domain == "practice":
            continue

        dom = r.domain
        if dom not in domain_totals:
            domain_totals[dom] = {"earned": 0.0, "count": 0.0, "correct": 0.0}

        domain_totals[dom]["count"] += 1.0
        domain_totals[dom]["earned"] += float(r.scoreEarned)
        scored_count += 1

        if r.isCorrect:
            domain_totals[dom]["correct"] += 1.0
            correct_count += 1

    domain_scores_result: Dict[str, DomainScoreDTO] = {}
    sum_percentages = 0.0
    active_domains = 0

    for dom in DOMAINS_ORDER:
        info = domain_totals.get(dom, {"earned": 0.0, "count": 0.0, "correct": 0.0})
        count = int(info["count"])
        correct = int(info["correct"])
        earned = info["earned"]

        pct = round((earned / count) * 100.0, 1) if count > 0 else 0.0
        sum_percentages += pct
        active_domains += 1

        desc = "High engagement" if pct >= 80 else ("Moderate engagement" if pct >= 60 else "Requires practice")

        domain_scores_result[dom] = DomainScoreDTO(
            domain=dom,
            domainName=DOMAIN_NAMES.get(dom, dom.title()),
            correctResponses=correct,
            totalScoredResponses=count,
            scorePercentage=pct,
            accuracyDescription=desc
        )

    overall = round(sum_percentages / max(1, active_domains), 1)

    observations = []
    if overall >= 80:
        observations.append("Demonstrated high accuracy across pattern recognition and visual tasks.")
    elif overall >= 60:
        observations.append("Steady execution across attention challenges with moderate response times.")
    else:
        observations.append("Daily cognitive practice recommended to support working memory engagement.")

    return AssessmentScoreDTO(
        overallScore=overall,
        domainScores=domain_scores_result,
        totalScoredQuestions=scored_count,
        totalCorrectQuestions=correct_count,
        unansweredCount=max(0, 10 - scored_count),
        durationSeconds=duration_seconds,
        observations=observations,
        medicalDisclaimer=DISCLAIMER
    )
