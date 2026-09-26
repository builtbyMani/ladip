export type WorkflowSlug = "discovery" | "safety" | "ehr" | "faers";

export interface PatientSummary {
  patient_id: string;
  name: string;
  age: number;
  sex: string;
  weight: number;
  conditions: string[];
  allergies: string[];
  active_medications_count: number;
  symptoms_count: number;
}

export interface Medication {
  drug_name: string;
  normalized_name: string;
  rxcui: string;
  dose: number;
  dose_unit: string;
  frequency: string;
  route: string;
  start_date: string | null;
  end_date: string | null;
  indication?: string;
}

export interface Symptom {
  description: string;
  meddra_term: string;
  severity: number;
  onset_date: string | null;
  resolution_date: string | null;
}

export interface LabResult {
  test?: string;
  test_name?: string;
  name?: string;
  value: string | number;
  unit?: string;
  date?: string;
  reference_range?: string;
  status?: string;
  is_abnormal?: boolean;
}

export interface PatientProfile {
  patient_id: string;
  name: string;
  age: number;
  sex: string;
  weight: number;
  conditions: string[];
  allergies: string[];
  medications: Medication[];
  symptoms: Symptom[];
  lab_results: LabResult[];
}

export interface NaranjoQuestion {
  id: number;
  text: string;
  score: number;
  user_choice: string;
  explanation: string;
}

export interface NaranjoResult {
  total_score: number;
  probability_category: string;
  summary: string;
  trigger_drug: string;
  questions: NaranjoQuestion[];
}

export interface AlertSignal {
  combo_str: string;
  combo_drugs: string[];
  adverse_event: string;
  severity_tier: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  prr: number;
  chi_squared: number;
  case_count: number;
  signal_strength: string;
  patient_has_matching_symptom: boolean;
  matching_symptom_name: string | null;
  temporal_score: number;
  is_suppressed: boolean;
  suppression_reason: string | null;
  alert_priority_score: number;
  trigger_drug: string | null;
  clinical_rationale: string;
  mechanism: string;
  recommendation: string;
  naranjo: NaranjoResult | null;
}

export interface PatientAlertsResponse {
  status: string;
  patient_id: string;
  total_alerts: number;
  active_alerts_count: number;
  suppressed_alerts_count: number;
  alerts: AlertSignal[];
  suppressed_alerts: AlertSignal[];
}

export interface FlaggedCombination {
  combo: string;
  reaction: string;
  prr: number;
  chi2: number;
  cases: number;
  tier: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
}

export interface SafetyCheckResult {
  status: string;
  message: string;
  patient_id: string;
  patient_name: string;
  new_drug: string;
  normalized_ingredient: string;
  safety_status:
    | "CRITICAL_CONTRAINDICATION"
    | "HIGH_RISK"
    | "MODERATE_RISK"
    | "LOW_RISK_COMPATIBLE";
  risk_color: string;
  allergy_warnings: string[];
  vulnerability_warnings: string[];
  flagged_interactions: FlaggedCombination[];
  recommendation: string;
}

export interface FaersSignal {
  combo_drugs?: string[];
  adverse_event: string;
  prr: number;
  chi_squared: number;
  case_count: number;
  severity_tier: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  signal_strength: string;
}

export interface OpenFdaReaction {
  reaction_meddra: string;
  co_occurrence_count: number;
}

export interface SimulateResponse {
  status: string;
  drugs: string[];
  signals_count: number;
  signals: FaersSignal[];
  live_fda_reactions?: OpenFdaReaction[];
}

export interface ExtractTimelineResponse {
  status: string;
  message: string;
  patient_id: string;
  profile: PatientProfile;
  extracted_medications: string[];
  extracted_symptoms: string[];
  immediate_alerts: {
    combo: string;
    adverse_event: string;
    tier: string;
    priority: number;
  }[];
}
