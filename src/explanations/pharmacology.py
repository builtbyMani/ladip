"""LLM and rule-based pharmacological explanation engine.
Provides physiological mechanisms, CYP450 interactions, and actionable clinical advice.
"""
import logging
from typing import Dict, List, Optional
from src.config import GEMINI_API_KEY
from src.normalization.rxnorm import normalize_drug_name

logger = logging.getLogger(__name__)

# Known biochemical mechanisms for deterministic fallback
PHARMACOLOGICAL_RULES: Dict[str, Dict[str, str]] = {
    "warfarin|aspirin|ibuprofen": {
        "mechanism": "Additive Hemostasis Disruption: Warfarin inhibits vitamin K epoxide reductase (factors II, VII, IX, X), Aspirin irreversibly acetylates platelet COX-1, and Ibuprofen provides reversible COX-1/2 inhibition and mucosal erosion. The triple combination causes profound primary and secondary hemostatic failure.",
        "severity": "CRITICAL",
        "recommendation": "Discontinue Ibuprofen immediately. Replace with topical analgesics or acetaminophen. Closely monitor INR (target 2.0-3.0) and screen for occult gastrointestinal blood loss.",
    },
    "aspirin|ibuprofen|warfarin": {
        "mechanism": "Additive Hemostasis Disruption: Synergistic inhibition of platelet aggregation and coagulation cascade leading to severe hemorrhagic risk.",
        "severity": "CRITICAL",
        "recommendation": "Discontinue NSAID immediately; monitor INR and screen for occult GI bleeding.",
    },
    "amiodarone|amlodipine|simvastatin": {
        "mechanism": "CYP3A4 & P-glycoprotein Metabolic Inhibition: Amiodarone and Amlodipine are potent inhibitors of CYP3A4, the primary enzyme responsible for Simvastatin metabolism. This causes an exponential increase in systemic Simvastatin exposure, inducing muscle fiber breakdown and lethal rhabdomyolysis.",
        "severity": "HIGH",
        "recommendation": "Cap Simvastatin dose at 20 mg/day or switch to a non-CYP3A4 metabolized statin such as Rosuvastatin or Pravastatin. Monitor serum creatine kinase (CK).",
    },
    "methotrexate|naproxen|trimethoprim-sulfamethoxazole": {
        "mechanism": "Renal Clearance Blockade & Antifolate Synergy: Trimethoprim inhibits renal tubular secretion of Methotrexate and possesses additive antifolate activity; Naproxen decreases renal prostaglandins reducing GFR and displacing Methotrexate from serum albumin. This leads to acute Methotrexate accumulation and fatal pancytopenia.",
        "severity": "CRITICAL",
        "recommendation": "Avoid Co-trimoxazole in patients on Methotrexate; select alternative antibiotic (e.g., cephalosporin). Suspend NSAID therapy during infection. Monitor complete blood count (CBC).",
    },
    "amiodarone|ciprofloxacin": {
        "mechanism": "Additive Cardiac Repolarization Delay (hERG Blockade): Both Amiodarone and Ciprofloxacin block delayed rectifier cardiac potassium channels (IKr), causing marked QT interval prolongation and elevated risk of Torsades de Pointes.",
        "severity": "HIGH",
        "recommendation": "Obtain baseline 12-lead ECG and monitor QTc interval. Correct hypokalemia and hypomagnesemia. Switch to an alternative non-QT prolonging antibiotic.",
    },
    "clopidogrel|omeprazole": {
        "mechanism": "Bioactivation Inhibition via CYP2C19: Omeprazole competitively inhibits CYP2C19, preventing the enzymatic bioactivation of Clopidogrel into its active antiplatelet thiol metabolite, causing increased stent thrombosis and ischemic risk.",
        "severity": "MODERATE",
        "recommendation": "Switch PPI from Omeprazole to Pantoprazole (minimal CYP2C19 affinity) or an H2-receptor antagonist like Famotidine.",
    },
    "furosemide|lisinopril|naproxen": {
        "mechanism": "Triple Whammy Nephrotoxicity: Lisinopril dilates the efferent renal arteriole, Naproxen constricts the afferent renal arteriole via prostaglandin inhibition, and Furosemide reduces plasma volume, causing acute prerenal filtration failure.",
        "severity": "HIGH",
        "recommendation": "Discontinue Naproxen. Ensure adequate hydration, monitor serum creatinine and potassium within 72 hours.",
    },
}


class PharmacologyExplainer:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.gemini_model = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini model: {e}")

    def explain(
        self,
        drug_combo: List[str],
        adverse_event: str,
        prr: float,
        case_count: int,
    ) -> Dict[str, str]:
        """Generate clinical pharmacological explanation and actionable recommendations."""
        norm_drugs = sorted([normalize_drug_name(d)["normalized"] for d in drug_combo])
        combo_key = "|".join(norm_drugs)
        drugs_display = " + ".join([d.title() for d in norm_drugs])

        # 1. Check verified pharmacological rules
        if combo_key in PHARMACOLOGICAL_RULES:
            rule = PHARMACOLOGICAL_RULES[combo_key]
            template = (
                f"The combination of {drugs_display} has been associated with {adverse_event.title()} "
                f"in {case_count} reported FAERS cases (PRR={prr:.1f}, indicating a {prr:.1f}x higher than expected occurrence). "
                f"The suspected mechanism is {rule['mechanism']} "
                f"Recommendation: {rule['recommendation']}"
            )
            return {
                "mechanism": rule["mechanism"],
                "recommendation": rule["recommendation"],
                "full_narrative": template,
                "source": "Clinical Pharmacovigilance Knowledge Base",
            }

        # 2. Try Gemini LLM for synthesized explanation
        if self.gemini_model:
            try:
                prompt = (
                    f"You are a clinical pharmacologist. Explain the multi-drug interaction between {drugs_display} "
                    f"and the adverse event '{adverse_event}'.\n"
                    f"Data: {case_count} FAERS cases, PRR={prr:.1f}.\n"
                    f"Provide: (1) Proposed pharmacokinetic/pharmacodynamic mechanism (CYP enzymes, transporters, additive toxicity), "
                    f"(2) Actionable clinical recommendation for the physician.\n"
                    f"Keep it concise (3-4 sentences total) and highly professional."
                )
                resp = self.gemini_model.generate_content(prompt)
                text = resp.text.strip()
                return {
                    "mechanism": text,
                    "recommendation": "Consult clinical pharmacist for dose titrations or therapeutic alternatives.",
                    "full_narrative": text,
                    "source": "Gemini Pharmacological AI",
                }
            except Exception as e:
                logger.warning(f"Gemini explanation generation failed: {e}")

        # 3. Default pharmacological template
        mech = (
            f"Possible pharmacokinetic competition or additive pharmacodynamic receptor binding "
            f"between {drugs_display}, increasing systemic toxicity or predisposing to {adverse_event.lower()}."
        )
        rec = f"Review clinical necessity of concurrent therapy. Monitor for signs of {adverse_event.lower()}."
        narrative = (
            f"The combination of {drugs_display} has been associated with {adverse_event.title()} "
            f"in {case_count} reported FAERS cases (PRR={prr:.1f}, indicating a {prr:.1f}x higher than expected occurrence). "
            f"Suspected mechanism: {mech} "
            f"Recommendation: {rec}"
        )
        return {
            "mechanism": mech,
            "recommendation": rec,
            "full_narrative": narrative,
            "source": "Algorithmic Pharmacovigilance Heuristic",
        }
