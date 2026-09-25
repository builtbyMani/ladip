"""Implementation of the Naranjo Adverse Drug Reaction Probability Scale.
Automates timeline-derived questions and provides an audit trail of causality criteria.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any

from src.patient.models import Medication, PatientProfile, Symptom


@dataclass
class NaranjoQuestion:
    id: int
    text: str
    score: int
    user_choice: str  # "Yes", "No", "Do not know"
    explanation: str
    auto_evaluated: bool


@dataclass
class NaranjoResult:
    total_score: int
    probability_category: str  # "Definite", "Probable", "Possible", "Doubtful"
    questions: List[NaranjoQuestion]
    summary: str


class NaranjoAlgorithm:
    """Standardized pharmacovigilance causality assessment tool."""

    @classmethod
    def evaluate(
        cls,
        medication: Medication,
        symptom: Symptom,
        profile: Optional[PatientProfile] = None,
        has_literature_reports: bool = True,
        objective_evidence: bool = True,
        alternative_causes: bool = False,
        user_overrides: Optional[Dict[int, str]] = None,
    ) -> NaranjoResult:
        """Score the 10 Naranjo questions using patient timeline facts and clinical parameters."""
        user_overrides = user_overrides or {}
        q_results: List[NaranjoQuestion] = []

        # Q1: Previous conclusive reports? (Yes +1, No 0, Unknown 0)
        q1_choice = user_overrides.get(1, "Yes" if has_literature_reports else "Do not know")
        q1_score = 1 if q1_choice == "Yes" else 0
        q_results.append(
            NaranjoQuestion(
                id=1,
                text="Are there previous conclusive reports on this reaction?",
                score=q1_score,
                user_choice=q1_choice,
                explanation="Established FAERS signals and pharmacological literature confirm association."
                if q1_choice == "Yes"
                else "Unconfirmed in literature.",
                auto_evaluated=1 not in user_overrides,
            )
        )

        # Q2: Did adverse event appear after suspected drug was administered? (Yes +2, No -1, Unknown 0)
        auto_q2 = "Do not know"
        exp_q2 = "Medication start date or symptom onset date missing."
        if medication.start_date and symptom.onset_date:
            if symptom.onset_date >= medication.start_date:
                auto_q2 = "Yes"
                days = (symptom.onset_date - medication.start_date).days
                exp_q2 = f"Symptom appeared {days} days after drug initiation."
            else:
                auto_q2 = "No"
                days = (medication.start_date - symptom.onset_date).days
                exp_q2 = f"Symptom was present {days} days before starting the medication."

        q2_choice = user_overrides.get(2, auto_q2)
        q2_score = 2 if q2_choice == "Yes" else (-1 if q2_choice == "No" else 0)
        q_results.append(
            NaranjoQuestion(
                id=2,
                text="Did the adverse event appear after the suspected drug was administered?",
                score=q2_score,
                user_choice=q2_choice,
                explanation=exp_q2,
                auto_evaluated=2 not in user_overrides,
            )
        )

        # Q3: Did the adverse reaction improve when the drug was discontinued? (Yes +1, No 0, Unknown 0)
        auto_q3 = "Do not know"
        exp_q3 = "No dechallenge recorded (drug still active or resolution date unknown)."
        if medication.end_date and symptom.resolution_date:
            if symptom.resolution_date >= medication.end_date:
                auto_q3 = "Yes"
                exp_q3 = "Symptom resolved after medication was stopped."
            else:
                auto_q3 = "No"
                exp_q3 = "Symptom did not improve after drug discontinuation."

        q3_choice = user_overrides.get(3, auto_q3)
        q3_score = 1 if q3_choice == "Yes" else 0
        q_results.append(
            NaranjoQuestion(
                id=3,
                text="Did the adverse reaction improve when the drug was discontinued or a specific antagonist was administered?",
                score=q3_score,
                user_choice=q3_choice,
                explanation=exp_q3,
                auto_evaluated=3 not in user_overrides,
            )
        )

        # Q4: Did the adverse event reappear when the drug was readministered? (Yes +2, No -1, Unknown 0)
        q4_choice = user_overrides.get(4, "Do not know")
        q4_score = 2 if q4_choice == "Yes" else (-1 if q4_choice == "No" else 0)
        q_results.append(
            NaranjoQuestion(
                id=4,
                text="Did the adverse event reappear when the drug was readministered?",
                score=q4_score,
                user_choice=q4_choice,
                explanation="Positive rechallenge noted."
                if q4_choice == "Yes"
                else "No rechallenge attempt documented.",
                auto_evaluated=4 not in user_overrides,
            )
        )

        # Q5: Are there alternative causes that could solely have caused the reaction? (Yes -1, No +2, Unknown 0)
        q5_choice = user_overrides.get(5, "Yes" if alternative_causes else "No")
        q5_score = -1 if q5_choice == "Yes" else (2 if q5_choice == "No" else 0)
        q_results.append(
            NaranjoQuestion(
                id=5,
                text="Are there alternative causes (other than the drug) that could on their own have caused the reaction?",
                score=q5_score,
                user_choice=q5_choice,
                explanation="Alternative confounding disease causes identified."
                if q5_choice == "Yes"
                else "No obvious non-pharmacological confounding etiology found.",
                auto_evaluated=5 not in user_overrides,
            )
        )

        # Q6: Did the reaction appear when a placebo was given? (Yes -1, No +1, Unknown 0)
        q6_choice = user_overrides.get(6, "Do not know")
        q6_score = -1 if q6_choice == "Yes" else (1 if q6_choice == "No" else 0)
        q_results.append(
            NaranjoQuestion(
                id=6,
                text="Did the reaction appear when a placebo was given?",
                score=q6_score,
                user_choice=q6_choice,
                explanation="Placebo control not applicable in routine outpatient care.",
                auto_evaluated=6 not in user_overrides,
            )
        )

        # Q7: Was the drug detected in blood/fluids in toxic concentrations? (Yes +1, No 0, Unknown 0)
        q7_choice = user_overrides.get(7, "Do not know")
        q7_score = 1 if q7_choice == "Yes" else 0
        q_results.append(
            NaranjoQuestion(
                id=7,
                text="Was the drug detected in any body fluid in concentrations known to be toxic?",
                score=q7_score,
                user_choice=q7_choice,
                explanation="Serum drug concentration monitoring.",
                auto_evaluated=7 not in user_overrides,
            )
        )

        # Q8: Was reaction more severe when dose increased, or less severe when dose decreased? (Yes +1, No 0, Unknown 0)
        q8_choice = user_overrides.get(8, "Do not know")
        q8_score = 1 if q8_choice == "Yes" else 0
        q_results.append(
            NaranjoQuestion(
                id=8,
                text="Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?",
                score=q8_score,
                user_choice=q8_choice,
                explanation="Dose-response gradient analysis.",
                auto_evaluated=8 not in user_overrides,
            )
        )

        # Q9: Did the patient have a similar reaction to the same or similar drugs in any previous exposure? (Yes +1, No 0, Unknown 0)
        auto_q9 = "Do not know"
        exp_q9 = "No prior allergy or adverse reaction recorded."
        if profile and profile.allergies:
            norm_med = medication.normalized_name.lower()
            for al in profile.allergies:
                if norm_med in al.lower() or al.lower() in norm_med:
                    auto_q9 = "Yes"
                    exp_q9 = f"Known allergy record: {al}"
                    break

        q9_choice = user_overrides.get(9, auto_q9)
        q9_score = 1 if q9_choice == "Yes" else 0
        q_results.append(
            NaranjoQuestion(
                id=9,
                text="Did the patient have a similar reaction to the same or similar drugs in any previous exposure?",
                score=q9_score,
                user_choice=q9_choice,
                explanation=exp_q9,
                auto_evaluated=9 not in user_overrides,
            )
        )

        # Q10: Was the adverse event confirmed by objective evidence? (Yes +1, No 0, Unknown 0)
        q10_choice = user_overrides.get(10, "Yes" if objective_evidence else "Do not know")
        q10_score = 1 if q10_choice == "Yes" else 0
        q_results.append(
            NaranjoQuestion(
                id=10,
                text="Was the adverse event confirmed by any objective evidence?",
                score=q10_score,
                user_choice=q10_choice,
                explanation="Clinical documentation, lab results, or diagnostic imaging present."
                if q10_choice == "Yes"
                else "Subjective report only.",
                auto_evaluated=10 not in user_overrides,
            )
        )

        total_score = sum(q.score for q in q_results)

        if total_score >= 9:
            prob_cat = "Definite"
        elif 5 <= total_score <= 8:
            prob_cat = "Probable"
        elif 1 <= total_score <= 4:
            prob_cat = "Possible"
        else:
            prob_cat = "Doubtful"

        summary = (
            f"Naranjo ADR Causality Score: {total_score}/13 points ({prob_cat} Causality). "
            f"Drug: {medication.drug_name}, Reaction: {symptom.description}."
        )

        return NaranjoResult(
            total_score=total_score,
            probability_category=prob_cat,
            questions=q_results,
            summary=summary,
        )
