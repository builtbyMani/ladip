"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowsClockwise,
  Bell,
  CheckCircle,
  CaretDown,
  CaretUp,
  ChatTeardropText,
  CloudCheck,
  FileText,
  Fingerprint,
  FunnelSimple,
  Heart,
  HourglassLow,
  Info,
  List,
  LockKey,
  MagnifyingGlass,
  Question,
  ShieldCheck,
  ShieldWarning,
  Sparkle,
  Star,
  UploadSimple,
  User,
  UserCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  clearSavedWebSession,
  getSavedWebSession,
  PATIENT_AUTH_ACCOUNTS,
  SavedWebAuthSession,
  signInWithSupabaseWeb,
  triggerWebMedicationNotification,
} from "@/lib/supabase";
import {
  AlertSignal,
  ExtractTimelineResponse,
  PatientAlertsResponse,
  PatientProfile,
  PatientSummary,
  SafetyCheckResult,
  SimulateResponse,
  WorkflowSlug,
} from "@/lib/types";
import {
  checkBackendHealth,
  extractPatientTimeline,
  FALLBACK_ALERTS,
  FALLBACK_PROFILES,
  fetchPatientAlerts,
  fetchPatientProfile,
  fetchPatients,
  runSafetyCheck,
  SCENARIO_LABELS,
  simulateDrugCombo,
} from "@/lib/api";
import {
  BlueVialsIllustration,
  ClinicianCohortAvatars,
  getPatientPersona,
  HormnBlueKitBoxIllustration,
  HormnLogoMark,
  LavenderTabletsIllustration,
  MintBottleIllustration,
  PatientCohortAvatar,
  SandInjectorsIllustration,
  TelehealthDeviceIllustration,
} from "./HormnIllustrations";
import {
  BklitHorizontalBarChart,
  BklitRingGaugeChart,
  BklitTimelineChart,
  BklitVolcanoChart,
} from "./BklitCharts";

const WORKFLOW_META: Record<
  WorkflowSlug,
  {
    slug: WorkflowSlug;
    title: string;
    shortTitle: string;
    cardSubtitle: string;
    pageTitle: string;
    metaDescription: string;
    cardBg: string;
    titleColor: string;
  }
> = {
  discovery: {
    slug: "discovery",
    title: "Multi-Drug Interaction Discovery",
    shortTitle: "Interaction Discovery",
    cardSubtitle: "Longitudinal timeline & Naranjo",
    pageTitle:
      "Multi-Drug Interaction Discovery | LADIP — Temporal Pharmacovigilance",
    metaDescription:
      "Detect hidden multi-drug adverse interactions using FDA FAERS 2x2 disproportionality ratios, Naranjo causality scoring, and longitudinal alert fatigue suppression.",
    cardBg: "bg-[#EAF2FA]",
    titleColor: "text-[#3B6EA8]",
  },
  safety: {
    slug: "safety",
    title: "Prospective Drug Safety Check",
    shortTitle: "Prospective Safety",
    cardSubtitle: "Pre-prescription simulator",
    pageTitle:
      "Prospective Drug Safety Check | LADIP — Temporal Pharmacovigilance",
    metaDescription:
      "Pre-prescription clinical safety simulator evaluating candidate medications against active regimens, documented drug allergies, and organ clearance vulnerabilities.",
    cardBg: "bg-[#F5F2EB]",
    titleColor: "text-[#6E5D4F]",
  },
  ehr: {
    slug: "ehr",
    title: "Patient Profile & Report Parser",
    shortTitle: "Patient EHR & OCR",
    cardSubtitle: "Longitudinal record & OCR",
    pageTitle:
      "Patient EHR & Clinical Report Parser | LADIP — Temporal Pharmacovigilance",
    metaDescription:
      "Longitudinal electronic health record inspector and automated PDF/OCR clinical discharge summary parser for medication timeline reconstruction.",
    cardBg: "bg-[#F0EDF8]",
    titleColor: "text-[#5E4FA2]",
  },
  faers: {
    slug: "faers",
    title: "FAERS Disproportionality Explorer",
    shortTitle: "FAERS Signal Explorer",
    cardSubtitle: "2x2 PRR & Volcano matrix",
    pageTitle:
      "FAERS Disproportionality Explorer | LADIP — Temporal Pharmacovigilance",
    metaDescription:
      "Interactive pharmacovigilance signal explorer for querying multi-drug combinations across 2x2 contingency tables and live openFDA co-occurrence reports.",
    cardBg: "bg-[#EAF5F0]",
    titleColor: "text-[#2E7D5B]",
  },
};

const WORKFLOW_ORDER: WorkflowSlug[] = ["discovery", "safety", "ehr", "faers"];

const SAFETY_PRESETS = [
  { name: "Dolo 650", dose: 650, label: "Dolo 650 (Paracetamol 650mg)" },
  { name: "Brufen 400", dose: 400, label: "Brufen 400 (Ibuprofen 400mg)" },
  { name: "Combiflam", dose: 400, label: "Combiflam (Ibuprofen + PCM)" },
  { name: "Cordarone", dose: 200, label: "Cordarone 200mg (Amiodarone)" },
  { name: "Bactrim DS", dose: 800, label: "Bactrim DS 800mg" },
  { name: "Pan 40", dose: 40, label: "Pan 40 (Pantoprazole 40mg)" },
];

function resolveWebMedicine(rawInput: string, currentDose: string) {
  const trimmed = (rawInput || "").trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const doseMatch = trimmed.match(/\b(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|ml)?\b/i);
  const embeddedDose = doseMatch ? doseMatch[1] : "";

  const BRAND_MAP: {
    keys: string[];
    medicinalName: string;
    defaultDose: string;
    indication: string;
  }[] = [
    {
      keys: ["dolo", "crocin", "calpol", "paracetamol", "acetaminophen", "tylenol"],
      medicinalName: "Paracetamol (Acetaminophen)",
      defaultDose: "650",
      indication: "Antipyretic & Analgesic (Fever & Pain Relief)",
    },
    {
      keys: ["brufen", "advil", "motrin", "ibuprofen"],
      medicinalName: "Ibuprofen (NSAID)",
      defaultDose: "400",
      indication: "Non-Steroidal Anti-Inflammatory & Painkiller",
    },
    {
      keys: ["combiflam", "imol"],
      medicinalName: "Ibuprofen (400 mg) + Paracetamol (325 mg)",
      defaultDose: "400",
      indication: "Combined NSAID + Analgesic (Inflammatory Pain & Fever)",
    },
    {
      keys: ["ecosprin", "disprin", "aspirin"],
      medicinalName: "Aspirin (Acetylsalicylic Acid)",
      defaultDose: "75",
      indication: "Antiplatelet Blood Thinner & Analgesic",
    },
    {
      keys: ["pan", "pantocid", "pantoprazole"],
      medicinalName: "Pantoprazole Sodium",
      defaultDose: "40",
      indication: "Proton Pump Inhibitor (Gastric Acid Suppression)",
    },
    {
      keys: ["omez", "prilosec", "omeprazole"],
      medicinalName: "Omeprazole",
      defaultDose: "20",
      indication: "Proton Pump Inhibitor (Acid Reflux & GERD)",
    },
    {
      keys: ["cordarone", "amiodarone"],
      medicinalName: "Amiodarone Hydrochloride",
      defaultDose: "200",
      indication: "Class III Antiarrhythmic (Cardiac Rhythm Control)",
    },
    {
      keys: ["bactrim", "septran", "septra", "trimethoprim"],
      medicinalName: "Trimethoprim + Sulfamethoxazole (Co-trimoxazole)",
      defaultDose: "800",
      indication: "Sulfonamide Combination Antibiotic",
    },
    {
      keys: ["glycomet", "glucophage", "metformin"],
      medicinalName: "Metformin Hydrochloride",
      defaultDose: "500",
      indication: "Biguanide Oral Antidiabetic",
    },
  ];

  const found = BRAND_MAP.find((entry) =>
    entry.keys.some((k) => lower.includes(k))
  );
  const resolvedDose = embeddedDose || (found ? found.defaultDose : currentDose || "400");

  return {
    entered: trimmed,
    medicinalName: found ? found.medicinalName : `${trimmed} (Active Ingredient)`,
    dose: resolvedDose,
    indication: found ? found.indication : "Active Pharmaceutical Ingredient",
  };
}

const FAERS_PRESETS = [
  { label: "Triple Bleed", query: "Warfarin, Aspirin, Ibuprofen" },
  { label: "Statin Myopathy", query: "Simvastatin, Amiodarone, Amlodipine" },
  { label: "MTX Pancytopenia", query: "Methotrexate, Trimethoprim, Naproxen" },
  { label: "Stent Thrombosis", query: "Clopidogrel, Omeprazole" },
];

const SAMPLE_DISCHARGE_NOTE = `Patient Name: Vikram Deshmukh
Patient ID: PT_CLINICAL_006
68yo male with Atrial Fibrillation and Osteoarthritis.
Allergies: Penicillin
Medications:
- Warfarin 5 mg QD started 2026-01-15
- Aspirin 81 mg QD started 2026-02-01
- Ibuprofen 400 mg TID started 2026-09-18
Symptoms:
Admitted 2026-09-21 for acute gastrointestinal hemorrhage and melena.`;

export default function LadipWorkspace() {
  // Navigation & Route State
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowSlug>("discovery");
  const [selectedPid, setSelectedPid] = useState<string>("PT_BLEED_001");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [treatmentsDropdownOpen, setTreatmentsDropdownOpen] = useState<boolean>(false);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState<boolean>(false);
  const [patientSwitchBanner, setPatientSwitchBanner] = useState<string | null>(null);
  const [notFoundReasons, setNotFoundReasons] = useState<string[]>([]);
  const treatmentsDropdownRef = useRef<HTMLDivElement | null>(null);
  const patientDropdownRef = useRef<HTMLDivElement | null>(null);

  // Backend Data State
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(
    FALLBACK_PROFILES.PT_BLEED_001
  );
  const [alertsData, setAlertsData] = useState<PatientAlertsResponse>(
    FALLBACK_ALERTS.PT_BLEED_001
  );
  const [loadingPatient, setLoadingPatient] = useState<boolean>(false);

  // Workflow 1: Discovery Controls
  const [showSuppressed, setShowSuppressed] = useState<boolean>(false);
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [refreshBanner, setRefreshBanner] = useState<string | null>(null);
  const [expandedAlertIdx, setExpandedAlertIdx] = useState<Record<number, boolean>>({
    0: true,
  });

  // Workflow 2: Prospective Drug Safety Check State
  const [candidateDrug, setCandidateDrug] = useState<string>("Ibuprofen");
  const [candidateDose, setCandidateDose] = useState<string>("400");
  const [candidateUnit, setCandidateUnit] = useState<string>("mg");
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [safetyLoading, setSafetyLoading] = useState<boolean>(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);

  // Workflow 3: EHR & Report Parser State
  const [ehrSubTab, setEhrSubTab] = useState<"inspect" | "upload">("inspect");
  const [clinicalNoteText, setClinicalNoteText] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [extractLoading, setExtractLoading] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] =
    useState<ExtractTimelineResponse | null>(null);

  // Workflow 4: FAERS Explorer State
  const [faersQuery, setFaersQuery] = useState<string>(
    "Warfarin, Aspirin, Ibuprofen"
  );
  const [liveFdaEnabled, setLiveFdaEnabled] = useState<boolean>(false);
  const [faersLoading, setFaersLoading] = useState<boolean>(false);
  const [faersError, setFaersError] = useState<string | null>(null);
  const [faersResult, setFaersResult] = useState<SimulateResponse | null>(null);

  // Supabase Auth, Biometric Quick-Unlock & Medication Dose Reminder State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>("ramesh");
  const [authPassword, setAuthPassword] = useState<string>("ramesh1234");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);
  const [savedWebSession, setSavedWebSession] =
    useState<SavedWebAuthSession | null>(null);
  const [doseReminderNotif, setDoseReminderNotif] = useState<{
    title: string;
    body: string;
    slotLabel: string;
    medications: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    const existing = getSavedWebSession();
    if (existing) {
      setSavedWebSession(existing);
    }
  }, []);

  // Close Workflows & Patient dropdowns on outside click or Escape key
  useEffect(() => {
    if (!treatmentsDropdownOpen && !patientDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        treatmentsDropdownRef.current &&
        !treatmentsDropdownRef.current.contains(event.target as Node)
      ) {
        setTreatmentsDropdownOpen(false);
      }
      if (
        patientDropdownRef.current &&
        !patientDropdownRef.current.contains(event.target as Node)
      ) {
        setPatientDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTreatmentsDropdownOpen(false);
        setPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [treatmentsDropdownOpen, patientDropdownOpen]);

  // Sync URL query parameters on initial load and browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const wfParam = (params.get("workflow") || "").trim().toLowerCase();
      const ptParam = (params.get("patient") || "").trim();
      const reasons: string[] = [];

      if (wfParam) {
        if (wfParam in WORKFLOW_META) {
          setActiveWorkflow(wfParam as WorkflowSlug);
        } else {
          reasons.push(`Unknown clinical workflow route '${wfParam}'.`);
        }
      } else {
        setActiveWorkflow("discovery");
      }

      if (ptParam) {
        if (ptParam in FALLBACK_PROFILES || ptParam.startsWith("PT_")) {
          setSelectedPid(ptParam);
        } else {
          reasons.push(
            `Patient MRN '${ptParam}' does not exist in the clinical cohort registry.`
          );
        }
      }

      setNotFoundReasons(reasons);
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  // Load initial patients list & backend health
  useEffect(() => {
    let mounted = true;
    async function init() {
      const [health, list] = await Promise.all([
        checkBackendHealth(),
        fetchPatients(),
      ]);
      if (!mounted) return;
      setBackendOnline(health.online);
      setPatients(list);
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Load selected patient profile & alerts whenever selectedPid changes
  const loadPatientBundle = useCallback(async (pid: string) => {
    setLoadingPatient(true);
    const [prof, al] = await Promise.all([
      fetchPatientProfile(pid),
      fetchPatientAlerts(pid, true),
    ]);
    const finalProfile = prof || FALLBACK_PROFILES[pid];
    if (!finalProfile) {
      setNotFoundReasons((prev) =>
        prev.some((r) => r.includes(pid))
          ? prev
          : [...prev, `Patient MRN '${pid}' could not be found.`]
      );
      setLoadingPatient(false);
      return null;
    }
    setNotFoundReasons([]);
    const activeFiltered = al.alerts.filter((a) => !a.is_suppressed);
    const suppressedFiltered =
      al.suppressed_alerts && al.suppressed_alerts.length > 0
        ? al.suppressed_alerts
        : al.alerts.filter((a) => a.is_suppressed);
    setPatientProfile(finalProfile);
    setAlertsData({
      ...al,
      alerts: activeFiltered,
      suppressed_alerts: suppressedFiltered,
    });
    setExpandedAlertIdx({ 0: true });
    setLoadingPatient(false);
    return {
      profile: finalProfile,
      totalSignals: activeFiltered.length + suppressedFiltered.length,
    };
  }, []);

  useEffect(() => {
    loadPatientBundle(selectedPid);
  }, [selectedPid, loadPatientBundle]);

  // Run default safety check when switching to safety tab or changing patient
  useEffect(() => {
    let active = true;
    async function runInitialSafety() {
      const numDose = parseFloat(candidateDose) || 400;
      if (!candidateDrug.trim() || numDose <= 0) return;
      try {
        setSafetyLoading(true);
        const res = await runSafetyCheck(
          selectedPid,
          candidateDrug,
          numDose,
          candidateUnit
        );
        if (active) {
          setSafetyResult(res);
          setSafetyError(null);
        }
      } catch (err: unknown) {
        if (active && err instanceof Error) {
          setSafetyError(err.message);
        }
      } finally {
        if (active) setSafetyLoading(false);
      }
    }
    runInitialSafety();
    return () => {
      active = false;
    };
  }, [selectedPid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Run initial FAERS simulation
  useEffect(() => {
    let active = true;
    async function initFaers() {
      const tokens = faersQuery
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tokens.length < 2) return;
      setFaersLoading(true);
      try {
        const res = await simulateDrugCombo(tokens, liveFdaEnabled);
        if (active) {
          setFaersResult(res);
          setFaersError(null);
        }
      } catch (e: unknown) {
        if (active && e instanceof Error) {
          setFaersError(e.message);
        }
      } finally {
        if (active) setFaersLoading(false);
      }
    }
    initFaers();
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamic Page Title & Meta Description Synchronization
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (notFoundReasons.length > 0) {
      document.title = "404 Page Not Found | LADIP — Temporal Pharmacovigilance";
      return;
    }
    const wfMeta = WORKFLOW_META[activeWorkflow];
    const cleanPatientName = patientProfile.name.split("(")[0].trim();
    document.title = `${wfMeta.title} — ${cleanPatientName} | LADIP Pharmacovigilance`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", wfMeta.metaDescription);
  }, [activeWorkflow, patientProfile.name, notFoundReasons]);

  // Navigation Handlers
  const navigateToWorkflow = (slug: WorkflowSlug, scrollWorkspace = false) => {
    setNotFoundReasons([]);
    setActiveWorkflow(slug);
    setMobileMenuOpen(false);
    setTreatmentsDropdownOpen(false);
    setPatientDropdownOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("workflow", slug);
      const currentPt = url.searchParams.get("patient");
      if (
        currentPt &&
        !(currentPt in FALLBACK_PROFILES || currentPt.startsWith("PT_"))
      ) {
        url.searchParams.delete("patient");
      }
      window.history.pushState({}, "", url.toString());
      if (scrollWorkspace) {
        const el = document.getElementById("clinical-workspace-anchor");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const navigateToPatient = (pid: string) => {
    setNotFoundReasons([]);
    setRefreshBanner(null);
    setSelectedPid(pid);
    setMobileMenuOpen(false);
    setPatientDropdownOpen(false);
    const persona = getPatientPersona(pid);
    setPatientSwitchBanner(
      `Switched active cohort to ${persona.shortName} (${persona.roleTag})`
    );
    setTimeout(() => {
      setPatientSwitchBanner((prev) =>
        prev && prev.includes(persona.shortName) ? null : prev
      );
    }, 2800);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("patient", pid);
      window.history.pushState({}, "", url.toString());
    }
  };

  // Supabase Auth & 1-Tap Biometric Quick-Unlock Handlers
  const handleSupabaseLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await signInWithSupabaseWeb(authUsername, authPassword);
      if (!res.success || !res.session) {
        setAuthError(res.error || "Authentication failed.");
        return;
      }
      setSavedWebSession(res.session);
      navigateToPatient(res.session.patientId);
      setAuthModalOpen(false);
      setPatientSwitchBanner(
        `Signed in via Supabase Auth as ${res.session.shortName} (${res.session.email}) — 1-Tap Biometric Unlock paired.`
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleBiometricWebUnlock = () => {
    if (!savedWebSession) return;
    navigateToPatient(savedWebSession.patientId);
    setAuthModalOpen(false);
    setPatientSwitchBanner(
      `1-Tap Biometric Quick-Unlock verified for ${savedWebSession.shortName} (${savedWebSession.email})`
    );
  };

  const handleTriggerDoseReminder = async () => {
    const notif = await triggerWebMedicationNotification(selectedPid);
    setDoseReminderNotif(notif);
  };

  // Workflow 2 Handler
  const handleRunSafetyCheck = async (
    overrideDrug?: string,
    overrideDose?: number
  ) => {
    const drugToTest = (
      overrideDrug !== undefined ? overrideDrug : candidateDrug
    ).trim();
    const doseToTest =
      overrideDose !== undefined ? overrideDose : parseFloat(candidateDose);

    if (!drugToTest || !/[a-zA-Z]/.test(drugToTest)) {
      setSafetyError(
        "Invalid candidate medication: please enter a valid medication name (letters required) before running a safety check."
      );
      setSafetyResult(null);
      return;
    }
    if (isNaN(doseToTest) || doseToTest <= 0) {
      setSafetyError(
        "Invalid dosage amount: please enter a dose greater than 0 to evaluate prospective safety."
      );
      setSafetyResult(null);
      return;
    }

    setSafetyError(null);
    setSafetyLoading(true);
    try {
      const res = await runSafetyCheck(
        selectedPid,
        drugToTest,
        doseToTest,
        candidateUnit
      );
      setSafetyResult(res);
    } catch (err: unknown) {
      setSafetyError(
        err instanceof Error ? err.message : "Safety assessment failed."
      );
    } finally {
      setSafetyLoading(false);
    }
  };

  // Workflow 3 Handler
  const handleExtractTimeline = async () => {
    if (!uploadFile && !clinicalNoteText.trim()) {
      setExtractError(
        "No clinical document provided: please upload a PDF/image file or enter clinical chart notes before extracting."
      );
      return;
    }
    setExtractError(null);
    setExtractLoading(true);
    try {
      const res = await extractPatientTimeline(uploadFile, clinicalNoteText);
      setExtractSuccess(res);
      const updatedPatients = await fetchPatients();
      setPatients(updatedPatients);
      if (res.patient_id) {
        setSelectedPid(res.patient_id);
        setPatientProfile(res.profile);
        await loadPatientBundle(res.patient_id);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("patient", res.patient_id);
          window.history.pushState({}, "", url.toString());
        }
      }
    } catch (err: unknown) {
      setExtractError(
        err instanceof Error
          ? err.message
          : "Failed to parse clinical document."
      );
    } finally {
      setExtractLoading(false);
    }
  };

  // Workflow 4 Handler
  const handleQueryFaers = async (
    overrideQuery?: string,
    overrideLiveFda?: boolean
  ) => {
    const q = overrideQuery !== undefined ? overrideQuery : faersQuery;
    const useLive =
      overrideLiveFda !== undefined ? overrideLiveFda : liveFdaEnabled;
    const tokens = q
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    if (tokens.length < 2) {
      setFaersError(
        "Invalid combination query: please enter at least 2 comma-separated medication names (for example: Warfarin, Aspirin)."
      );
      setFaersResult(null);
      return;
    }
    setFaersError(null);
    setFaersLoading(true);
    try {
      const res = await simulateDrugCombo(tokens, useLive);
      setFaersResult(res);
    } catch (err: unknown) {
      setFaersError(
        err instanceof Error ? err.message : "FAERS query failed."
      );
    } finally {
      setFaersLoading(false);
    }
  };

  // Computed metrics for Workflow 1
  const activeMedications = patientProfile.medications.filter(
    (m) => !m.end_date
  );
  const activeAlerts = alertsData.alerts || [];
  const suppressedAlerts = alertsData.suppressed_alerts || [];
  const totalEvaluated = Math.max(
    activeAlerts.length + suppressedAlerts.length,
    1
  );
  const critCount = activeAlerts.filter(
    (a) => a.severity_tier === "CRITICAL"
  ).length;
  const peakPrr =
    activeAlerts.length > 0
      ? Math.max(...activeAlerts.map((a) => a.prr))
      : 1.0;
  const peakPriority =
    activeAlerts.length > 0
      ? Math.max(...activeAlerts.map((a) => a.alert_priority_score))
      : 0.0;
  const peakDtas =
    activeAlerts.length > 0
      ? Math.max(...activeAlerts.map((a) => a.temporal_score))
      : 0.0;
  const suppressionPct =
    activeAlerts.length + suppressedAlerts.length > 0
      ? (suppressedAlerts.length / totalEvaluated) * 100
      : 100;

  const filteredActiveAlerts = activeAlerts.filter(
    (a) => tierFilter === "ALL" || a.severity_tier === tierFilter
  );

  const tierBadgeStyle = (tier: string) => {
    switch (tier) {
      case "CRITICAL":
        return "bg-red-50 text-[#DC2626] border-red-200";
      case "HIGH":
        return "bg-amber-50 text-[#B48A00] border-amber-200";
      case "MODERATE":
        return "bg-[#EAF2FA] text-[#3B6EA8] border-blue-200";
      default:
        return "bg-emerald-50 text-[#1B7A3D] border-emerald-200";
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-white text-[#111827] flex flex-col overflow-x-hidden">
      {/* =====================================================================
          1. HORMN REFERENCE IMAGE 2: TOP SLATE ANNOUNCEMENT / VALUE BAR
         ===================================================================== */}
      <div className="w-full bg-[#87909A] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-medium tracking-tight text-white/95">
            Why LADIP?
          </span>
          <div className="flex flex-wrap items-center gap-4 sm:gap-7 text-[11.5px] text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <ChatTeardropText size={14} weight="fill" className="text-white/80" />
              180K+ FDA FAERS Reports
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <HourglassLow size={14} weight="bold" className="text-white/80" />
              Temporal Exposure Windows
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserCheck size={14} weight="fill" className="text-white/80" />
              5 Indian Clinical Cohorts
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <Heart size={14} weight="fill" className="text-white/80" />
              Personalised Regimen Triage
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" className="text-white/80" />
              Anti-Fatigue Suppression
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. HORMN REFERENCE IMAGE 1: UTILITY SUB-BAR & MAIN NAVIGATION HEADER
         ===================================================================== */}
      <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Utility Row (Region indicator left, Log in / Help right — exact Reference Image 1) */}
          <div className="pt-3 pb-1 flex items-center justify-between text-xs text-slate-600 border-b border-slate-100/80">
            <div className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#1E3A8A] inline-flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
              <span className="font-medium text-slate-700">
                India Clinical Cohort
              </span>
              <span className="hidden sm:inline-block text-slate-300">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    backendOnline ? "bg-[#00B67A]" : "bg-amber-500"
                  }`}
                />
                {backendOnline
                  ? "FastAPI REST Backend Connected"
                  : "Standalone Clinical Mode"}
              </span>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4">
              <button
                type="button"
                onClick={handleTriggerDoseReminder}
                className="inline-flex items-center gap-1.5 text-[#1B7A3D] hover:text-[#145E2E] transition-colors font-semibold"
                title="Trigger Scheduled Medication Dose Notification"
              >
                <Bell size={13} weight="fill" />
                <span>Dose Reminder</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#111827] transition-colors font-semibold"
                title="Supabase Auth & 1-Tap Biometric Quick-Unlock"
              >
                <Fingerprint size={14} weight="bold" className="text-[#1B7A3D]" />
                <span>
                  {savedWebSession
                    ? `${savedWebSession.shortName.split(" ")[0]} (Supabase)`
                    : "Patient Sign In"}
                </span>
              </button>
              <a
                href="/docs"
                className="hidden sm:inline-flex items-center gap-1 text-slate-600 hover:text-[#111827] transition-colors font-medium"
              >
                <User size={13} weight="regular" />
                <span>API Portal</span>
              </a>
              <a
                href="#why-ladip-bento"
                className="hidden sm:inline-flex items-center gap-1 text-slate-600 hover:text-[#111827] transition-colors font-medium"
              >
                <Question size={13} weight="regular" />
                <span>Help</span>
              </a>
            </div>
          </div>

          {/* Main Navigation Row (Logo Left, Links Center, Pill CTA Right — Reference Image 1 & 2) */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <a
              href="?workflow=discovery"
              onClick={(e) => {
                e.preventDefault();
                navigateToWorkflow("discovery");
              }}
              className="focus:outline-none group"
              title="LADIP Home — Longitudinal Adverse Drug Interaction Predictor"
            >
              <HormnLogoMark size="md" />
            </a>

            {/* Center Navigation Links (Desktop) */}
            <nav
              aria-label="Primary Clinical Navigation"
              className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#111827]"
            >
              <button
                type="button"
                onClick={() => navigateToWorkflow("discovery")}
                className={`transition-colors ${
                  activeWorkflow === "discovery"
                    ? "text-[#111827] font-semibold"
                    : "text-slate-600 hover:text-[#111827]"
                }`}
              >
                Home
              </button>

              {/* Treatments / Workflows Dropdown (Reference Image 1 & 2 "Treatments v") */}
              <div className="relative" ref={treatmentsDropdownRef}>
                <button
                  type="button"
                  aria-expanded={treatmentsDropdownOpen}
                  onClick={() =>
                    setTreatmentsDropdownOpen(!treatmentsDropdownOpen)
                  }
                  className="inline-flex items-center gap-1 text-[#111827] hover:text-[#4A7BB7] transition-colors font-medium"
                >
                  <span>Workflows</span>
                  <CaretDown size={13} weight="bold" />
                </button>
                {treatmentsDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-diffusion p-2 z-40">
                    {WORKFLOW_ORDER.map((slug) => {
                      const item = WORKFLOW_META[slug];
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => navigateToWorkflow(slug, true)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                            activeWorkflow === slug
                              ? "bg-[#EAF2FA] text-[#3B6EA8] font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{item.title}</span>
                          <ArrowRight size={12} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigateToWorkflow("safety", true)}
                className={`transition-colors ${
                  activeWorkflow === "safety"
                    ? "text-[#111827] font-semibold"
                    : "text-slate-600 hover:text-[#111827]"
                }`}
              >
                Safety Simulator
              </button>

              <a
                href="#why-ladip-bento"
                className="text-slate-600 hover:text-[#111827] transition-colors"
              >
                How it works
              </a>

              <button
                type="button"
                onClick={() => navigateToWorkflow("faers", true)}
                className={`transition-colors ${
                  activeWorkflow === "faers"
                    ? "text-[#111827] font-semibold"
                    : "text-slate-600 hover:text-[#111827]"
                }`}
              >
                FAERS Explorer
              </button>
            </nav>

            {/* Right Actions: Custom Animated Patient Account Switcher + Dark Pill CTA + Mobile Hamburger */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block relative" ref={patientDropdownRef}>
                <button
                  id="header-patient-select"
                  type="button"
                  aria-expanded={patientDropdownOpen}
                  aria-haspopup="listbox"
                  onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
                  className="group inline-flex items-center gap-2.5 bg-[#F8FAFC] hover:bg-slate-100/90 border border-slate-200/90 rounded-full pl-1.5 pr-3.5 py-1 text-left transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#4A7BB7]/30"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedPid}
                      initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.82, rotate: 6 }}
                      transition={{ type: "spring", stiffness: 340, damping: 22 }}
                      className="flex items-center gap-2"
                    >
                      <PatientCohortAvatar patientId={selectedPid} size="sm" />
                      <div className="max-w-[155px] leading-tight">
                        <div className="text-xs font-semibold text-[#111827] truncate">
                          {
                            getPatientPersona(selectedPid, patientProfile.name)
                              .shortName
                          }
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 truncate">
                          {
                            getPatientPersona(selectedPid, patientProfile.name)
                              .roleTag
                          }
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <CaretDown
                    size={13}
                    weight="bold"
                    className={`text-slate-500 transition-transform duration-200 ${
                      patientDropdownOpen ? "rotate-180 text-[#111827]" : ""
                    }`}
                  />
                </button>

                {/* Animated Patient Account Switcher Popover */}
                <AnimatePresence>
                  {patientDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 360, damping: 26 }}
                      role="listbox"
                      aria-label="Select Active Patient Cohort"
                      className="absolute right-0 mt-2.5 w-[340px] sm:w-[380px] rounded-3xl bg-white border border-slate-200/90 shadow-diffusion p-2.5 z-50"
                    >
                      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Switch Active Patient Cohort
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          5 Indian Profiles
                        </span>
                      </div>

                      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-0.5">
                        {(patients.length > 0
                          ? patients
                          : Object.values(FALLBACK_PROFILES)
                        ).map((p) => {
                          const persona = getPatientPersona(p.patient_id, p.name);
                          const isSelected = p.patient_id === selectedPid;
                          return (
                            <button
                              key={p.patient_id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => navigateToPatient(p.patient_id)}
                              className={`w-full text-left p-2.5 rounded-2xl transition-all flex items-center gap-3 relative ${
                                isSelected
                                  ? "bg-[#111827] text-white shadow-sm"
                                  : "hover:bg-[#F8FAFC] text-[#111827]"
                              }`}
                            >
                              <PatientCohortAvatar
                                patientId={p.patient_id}
                                size="md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`font-display text-xs font-semibold truncate ${
                                      isSelected ? "text-white" : "text-[#111827]"
                                    }`}
                                  >
                                    {persona.shortName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                                      isSelected
                                        ? "bg-white/15 text-white border-white/20"
                                        : persona.riskColor
                                    }`}
                                  >
                                    {persona.riskLabel}
                                  </span>
                                </div>
                                <div
                                  className={`text-[11px] truncate mt-0.5 ${
                                    isSelected ? "text-slate-300" : "text-slate-500"
                                  }`}
                                >
                                  {persona.roleTag}
                                </div>
                                <div
                                  className={`text-[10.5px] font-mono truncate mt-0.5 ${
                                    isSelected
                                      ? "text-sky-300"
                                      : "text-[#3B6EA8]"
                                  }`}
                                >
                                  {persona.regimenShort}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => navigateToWorkflow("safety", true)}
                className="bg-[#111827] hover:bg-zinc-800 active:scale-[0.98] text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight size={13} weight="bold" />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Mobile Navigation Menu"
                className="lg:hidden p-2 rounded-full border border-slate-200 text-[#111827] hover:bg-slate-50"
              >
                {mobileMenuOpen ? <X size={18} /> : <List size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Animated Patient Account Switch Notification Toast */}
        <AnimatePresence>
          {patientSwitchBanner && (
            <motion.div
              key={patientSwitchBanner}
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="bg-[#111827] text-white border-t border-white/10 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <PatientCohortAvatar
                    patientId={selectedPid}
                    size="xs"
                    showStatusBadge={false}
                  />
                  <span className="font-medium text-white">
                    {patientSwitchBanner}
                  </span>
                  <span className="hidden md:inline-block text-slate-400">
                    • Recomputing longitudinal FAERS exposure windows &amp; Naranjo causality
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPatientSwitchBanner(null)}
                  className="text-slate-400 hover:text-white p-1"
                  aria-label="Dismiss notification"
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Medication Dose Time Notification Banner */}
        <AnimatePresence>
          {doseReminderNotif && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="bg-[#F0FDF4] border-t border-b border-[#1B7A3D]/30 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B7A3D] text-white text-[10px] font-bold uppercase tracking-wider">
                    <Bell size={12} weight="fill" />
                    <span>Time to Take Medication • {doseReminderNotif.slotLabel}</span>
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {doseReminderNotif.title}:
                  </span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {doseReminderNotif.medications}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDoseReminderNotif(null);
                      setPatientSwitchBanner(
                        `Recorded: Scheduled medications marked as taken at ${doseReminderNotif.timestamp}.`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1B7A3D] text-white font-semibold text-xs hover:bg-[#145E2E] transition-colors"
                  >
                    <CheckCircle size={13} weight="fill" />
                    <span>Mark Dose Taken</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDoseReminderNotif(null);
                      setPatientSwitchBanner(
                        "Medication dose reminder snoozed for 15 minutes."
                      );
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                  >
                    <span>Snooze 15m</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoseReminderNotif(null)}
                    className="text-slate-500 hover:text-[#111827] p-1"
                    aria-label="Dismiss medication reminder"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supabase Auth + 1-Tap Biometric Quick-Unlock Modal */}
        <AnimatePresence>
          {authModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => setAuthModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-diffusion p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1B7A3D]">
                      <ShieldCheck size={13} weight="fill" />
                      <span>Supabase Authentication + Biometric Pairing</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[#111827] mt-0.5">
                      Patient Portal Sign In
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(false)}
                    className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-[#111827]"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* 1-Tap Biometric Quick-Unlock Card when session is paired */}
                {savedWebSession && (
                  <div className="rounded-2xl bg-[#F0FDF4] border border-[#1B7A3D]/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1B7A3D] text-white text-[10px] font-bold uppercase tracking-wider">
                        <Fingerprint size={12} weight="bold" />
                        <span>1-Tap Elderly Biometric Unlock</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearSavedWebSession();
                          setSavedWebSession(null);
                        }}
                        className="text-[11px] font-medium text-slate-500 underline hover:text-[#111827]"
                      >
                        Reset Token
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <PatientCohortAvatar
                        patientId={savedWebSession.patientId}
                        size="md"
                      />
                      <div>
                        <div className="font-display text-sm font-semibold text-[#111827]">
                          Welcome back, {savedWebSession.shortName}
                        </div>
                        <div className="text-[11px] text-[#1B7A3D] font-mono">
                          {savedWebSession.email} • Paired with SecureStore
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleBiometricWebUnlock}
                      className="w-full py-2.5 px-4 rounded-full bg-[#1B7A3D] hover:bg-[#145E2E] text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Fingerprint size={16} weight="bold" />
                      <span>
                        Unlock Schedule with 1-Tap Fingerprint ({savedWebSession.shortName})
                      </span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSupabaseLogin} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Username or Supabase Email
                    </label>
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => {
                        setAuthUsername(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="ramesh or ramesh@ladip.health"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="ramesh1234"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] font-medium">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-2.5 px-4 rounded-full bg-[#111827] hover:bg-zinc-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <LockKey size={14} weight="bold" />
                    <span>
                      {authSubmitting
                        ? "Authenticating with Supabase..."
                        : "Sign In with Supabase & Pair Fingerprint"}
                    </span>
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Quick Cohort Credentials (Click to Fill)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(PATIENT_AUTH_ACCOUNTS).map((acc) => (
                      <button
                        key={acc.patientId}
                        type="button"
                        onClick={() => {
                          setAuthUsername(acc.username);
                          setAuthPassword(acc.password);
                          setAuthError(null);
                        }}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-mono text-[#111827] transition-colors"
                      >
                        {acc.username} / {acc.password}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Mobile Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 overflow-hidden"
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
                  Clinical Workflows
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {WORKFLOW_ORDER.map((slug) => {
                    const wf = WORKFLOW_META[slug];
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => navigateToWorkflow(slug, true)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                          activeWorkflow === slug
                            ? "bg-[#111827] text-white"
                            : "bg-[#F8FAFC] text-[#111827] hover:bg-slate-100"
                        }`}
                      >
                        <span>{wf.title}</span>
                        <ArrowRight size={13} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
                  Switch Patient Cohort
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {(patients.length > 0
                    ? patients
                    : Object.values(FALLBACK_PROFILES)
                  ).map((p) => {
                    const persona = getPatientPersona(p.patient_id, p.name);
                    const isSelected = p.patient_id === selectedPid;
                    return (
                      <button
                        key={p.patient_id}
                        type="button"
                        onClick={() => navigateToPatient(p.patient_id)}
                        className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-3 transition-all ${
                          isSelected
                            ? "bg-[#111827] text-white"
                            : "bg-[#F8FAFC] text-[#111827] hover:bg-slate-100"
                        }`}
                      >
                        <PatientCohortAvatar patientId={p.patient_id} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {persona.shortName}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {persona.regimenShort}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =====================================================================
          3A. FULL-VIEWPORT LANDING HERO (FILLS INITIAL SCREEN BEFORE WORKFLOWS)
         ===================================================================== */}
      <section className="w-full bg-white min-h-[calc(100svh-112px)] flex flex-col justify-between py-8 sm:py-12 lg:py-14 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-between">
          {/* Top Eyebrow Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-slate-200/80 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3B6EA8]">
              <Sparkle size={13} weight="fill" className="text-[#3B6EA8]" />
              <span>Longitudinal Pharmacovigilance Engine</span>
            </div>
            <div className="hidden md:inline-flex items-center gap-2 text-xs text-slate-500">
              <span>Active Cohort:</span>
              <span className="font-semibold text-[#111827]">
                {getPatientPersona(selectedPid, patientProfile.name).shortName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-[#3B6EA8] font-semibold">
                {activeAlerts.length} Actionable / {suppressedAlerts.length} Suppressed
              </span>
            </div>
          </div>

          {/* Main Center Hero Grid: Enlarged Display Typography Left (7 cols) + Animated Active Patient Card Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8 lg:py-10">
            <div className="lg:col-span-7">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.4rem] xl:text-[5.1rem] font-normal tracking-[-0.035em] leading-[1.03] text-[#111827]">
                Personalised{" "}
                <span className="block">pharmacovigilance</span>
                <span className="block mt-1">
                  to restore clinical{" "}
                  <span className="text-[#8C9BAE]">strength.</span>
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg lg:text-[1.22rem] text-slate-600 leading-[1.62] max-w-[54ch]">
                Combining empirical FDA FAERS 2&times;2 disproportionality
                ratios with longitudinal patient medication timelines to detect
                hidden multi-drug synergy and stop clinical alert fatigue.
              </p>

              {/* Aligned Hero Action Buttons & Key Clinical Proof Pills */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <a
                  href="#clinical-workflows-section"
                  className="bg-[#111827] hover:bg-zinc-800 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-full transition-all inline-flex items-center gap-2 shadow-sm"
                >
                  <span>Explore Clinical Workflows</span>
                  <ArrowRight size={15} weight="bold" />
                </a>

                <button
                  type="button"
                  onClick={() => navigateToWorkflow("safety", true)}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#111827] border border-slate-200/90 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-full transition-all inline-flex items-center gap-2"
                >
                  <span>Run Safety Simulator</span>
                  <ShieldCheck size={16} weight="fill" className="text-[#3B6EA8]" />
                </button>
              </div>

              <div className="mt-7 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <div className="font-display text-xl sm:text-2xl font-semibold text-[#111827]">
                    180K+
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    FDA FAERS Reports
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl sm:text-2xl font-semibold text-[#1B7A3D]">
                    -73%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Alert Fatigue Noise
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl sm:text-2xl font-semibold text-[#3B6EA8]">
                    10-Pt
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Naranjo Causality
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Animated Active Patient Live Clinical Snapshot Card */}
            <div className="lg:col-span-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPid}
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 290, damping: 24 }}
                  className="rounded-[2rem] bg-[#F8FAFC] border border-slate-200/80 p-6 sm:p-7 shadow-diffusion relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <PatientCohortAvatar patientId={selectedPid} size="lg" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4A7BB7]">
                          LIVE PATIENT SNAPSHOT
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#111827] tracking-tight mt-0.5">
                          {
                            getPatientPersona(selectedPid, patientProfile.name)
                              .shortName
                          }
                        </h2>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {
                            getPatientPersona(selectedPid, patientProfile.name)
                              .roleTag
                          }{" "}
                          •{" "}
                          <span className="font-mono text-[11px] text-slate-700">
                            {patientProfile.patient_id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                        getPatientPersona(selectedPid, patientProfile.name)
                          .riskColor
                      }`}
                    >
                      {
                        getPatientPersona(selectedPid, patientProfile.name)
                          .riskLabel
                      }
                    </span>
                  </div>

                  {/* Active Medication Regimen Chips */}
                  <div className="mt-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
                      Concurrent Active Regimen ({activeMedications.length} Drugs)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMedications.map((m) => (
                        <span
                          key={m.drug_name}
                          className="px-3 py-1 rounded-full bg-white border border-slate-200/90 text-[#111827] text-xs font-medium shadow-2xs"
                        >
                          {m.drug_name}{" "}
                          <span className="text-slate-400 font-mono text-[11px]">
                            {m.dose}
                            {m.dose_unit}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3-Column Live Telemetry Strip */}
                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl bg-white border border-slate-200/70 p-3 text-center">
                      <div
                        className={`font-display text-2xl font-bold ${
                          critCount > 0 ? "text-[#DC2626]" : "text-[#111827]"
                        }`}
                      >
                        {activeAlerts.length}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                        Active Alerts
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200/70 p-3 text-center">
                      <div className="font-display text-2xl font-bold text-[#1B7A3D]">
                        {suppressedAlerts.length}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                        Suppressed
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200/70 p-3 text-center">
                      <div className="font-display text-2xl font-bold text-[#3B6EA8]">
                        {peakPrr.toFixed(1)}x
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                        Peak PRR
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 truncate">
                      Switch patient below or in header to compare timelines
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateToWorkflow("discovery", true)}
                      className="text-xs font-semibold text-[#111827] hover:text-[#3B6EA8] inline-flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <span>Open Timeline</span>
                      <ArrowRight size={13} weight="bold" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Bar of Initial Viewport: Clinical Benchmark Strip + Avatar Cohort Switcher Pills */}
          <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1 font-display font-bold text-[#111827]">
                <Star size={16} weight="fill" className="text-[#00B67A]" />
                Clinical Benchmark
              </span>
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="w-4 h-4 rounded-[3px] bg-[#00B67A] text-white inline-flex items-center justify-center"
                  >
                    <Star size={10} weight="fill" />
                  </span>
                ))}
              </span>
              <span className="text-slate-600 font-medium">
                <strong className="text-[#111827]">4.9</strong> •{" "}
                <strong className="text-[#111827]">16+</strong> verified FAERS
                signals • <strong className="text-[#111827]">5</strong> Indian
                patient cohorts
              </span>
            </div>

            {/* Cohort Quick Pills with Respective Patient Avatar Icons & Spring Pill Indicator */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(patients.length > 0
                ? patients
                : Object.values(FALLBACK_PROFILES)
              ).map((p) => {
                const shortName = p.name.split("(")[0].trim();
                const isSelected = p.patient_id === selectedPid;
                return (
                  <button
                    key={p.patient_id}
                    type="button"
                    onClick={() => navigateToPatient(p.patient_id)}
                    className={`relative pl-1.5 pr-3 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                      isSelected
                        ? "text-white"
                        : "bg-[#F8FAFC] text-slate-600 hover:bg-slate-200/70 border border-slate-200/80"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="heroPatientCohortPill"
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 26,
                        }}
                        className="absolute inset-0 rounded-full bg-[#111827] -z-0 shadow-xs"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <PatientCohortAvatar
                        patientId={p.patient_id}
                        size="xs"
                        showStatusBadge={false}
                      />
                      <span>{shortName}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3B. BELOW-THE-FOLD: 4 HORMN PASTEL CLINICAL WORKFLOW CARDS
         ===================================================================== */}
      <section
        id="clinical-workflows-section"
        className="w-full bg-white py-12 sm:py-16 border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4A7BB7] block mb-1.5">
                CLINICAL WORKFLOWS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-[#111827]">
                Select a clinical module to launch workspace
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Synchronised with active patient:{" "}
              <strong className="text-[#111827]">
                {getPatientPersona(selectedPid, patientProfile.name).shortName}
              </strong>
            </span>
          </div>

          {/* 4-Card HORMN Pastel Grid (Exact Reference Image 1 Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Low Testosterone -> Interaction Discovery (Soft Cerulean #EAF2FA) */}
            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigateToWorkflow("discovery", true)}
              className={`group text-left rounded-[2rem] bg-[#EAF2FA] p-6 min-h-[260px] flex flex-col justify-between relative overflow-hidden transition-shadow ${
                activeWorkflow === "discovery"
                  ? "ring-2 ring-[#3B6EA8] shadow-card"
                  : "hover:shadow-card"
              }`}
            >
              <div className="z-10">
                <div className="font-display text-base font-medium text-[#3B6EA8] tracking-tight">
                  Interaction Discovery
                </div>
                <div className="text-xs text-[#3B6EA8]/75 mt-0.5">
                  Longitudinal Timeline &amp; Naranjo
                </div>
              </div>

              <div className="my-auto flex items-center justify-center pt-3">
                <BlueVialsIllustration className="w-44 h-36 group-hover:scale-105 transition-transform duration-300" />
              </div>

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono font-semibold text-[#3B6EA8]">
                  {activeAlerts.length} Active Signals
                </span>
                <span className="w-9 h-9 rounded-full bg-white text-[#111827] shadow-sm inline-flex items-center justify-center group-hover:bg-[#111827] group-hover:text-white transition-colors">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </div>
            </motion.button>

            {/* Card 2: Weight Loss -> Prospective Safety (Soft Sand #F5F2EB) */}
            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigateToWorkflow("safety", true)}
              className={`group text-left rounded-[2rem] bg-[#F5F2EB] p-6 min-h-[260px] flex flex-col justify-between relative overflow-hidden transition-shadow ${
                activeWorkflow === "safety"
                  ? "ring-2 ring-[#6E5D4F] shadow-card"
                  : "hover:shadow-card"
              }`}
            >
              <div className="z-10">
                <div className="font-display text-base font-medium text-[#6E5D4F] tracking-tight">
                  Prospective Safety
                </div>
                <div className="text-xs text-[#6E5D4F]/75 mt-0.5">
                  Candidate Drug Simulator
                </div>
              </div>

              <div className="my-auto flex items-center justify-center pt-3">
                <SandInjectorsIllustration className="w-44 h-36 group-hover:scale-105 transition-transform duration-300" />
              </div>

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono font-semibold text-[#6E5D4F]">
                  Pre-Order Check
                </span>
                <span className="w-9 h-9 rounded-full bg-white text-[#111827] shadow-sm inline-flex items-center justify-center group-hover:bg-[#111827] group-hover:text-white transition-colors">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </div>
            </motion.button>

            {/* Card 3: Erectile Dysfunction -> Patient EHR & OCR (Soft Lavender #F0EDF8) */}
            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigateToWorkflow("ehr", true)}
              className={`group text-left rounded-[2rem] bg-[#F0EDF8] p-6 min-h-[260px] flex flex-col justify-between relative overflow-hidden transition-shadow ${
                activeWorkflow === "ehr"
                  ? "ring-2 ring-[#5E4FA2] shadow-card"
                  : "hover:shadow-card"
              }`}
            >
              <div className="z-10">
                <div className="font-display text-base font-medium text-[#5E4FA2] tracking-tight">
                  Patient EHR &amp; OCR
                </div>
                <div className="text-xs text-[#5E4FA2]/75 mt-0.5">
                  Vitals, Labs &amp; Discharge Parser
                </div>
              </div>

              <div className="my-auto flex items-center justify-center pt-3">
                <LavenderTabletsIllustration className="w-44 h-36 group-hover:scale-105 transition-transform duration-300" />
              </div>

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono font-semibold text-[#5E4FA2]">
                  PDF / Image OCR
                </span>
                <span className="w-9 h-9 rounded-full bg-white text-[#111827] shadow-sm inline-flex items-center justify-center group-hover:bg-[#111827] group-hover:text-white transition-colors">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </div>
            </motion.button>

            {/* Card 4: Men's Fertility -> FAERS Signal Explorer (Soft Mint #EAF5F0) */}
            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigateToWorkflow("faers", true)}
              className={`group text-left rounded-[2rem] bg-[#EAF5F0] p-6 min-h-[260px] flex flex-col justify-between relative overflow-hidden transition-shadow ${
                activeWorkflow === "faers"
                  ? "ring-2 ring-[#2E7D5B] shadow-card"
                  : "hover:shadow-card"
              }`}
            >
              <div className="z-10">
                <div className="font-display text-base font-medium text-[#2E7D5B] tracking-tight">
                  FAERS Signal Explorer
                </div>
                <div className="text-xs text-[#2E7D5B]/75 mt-0.5">
                  2x2 PRR &amp; Volcano Plot
                </div>
              </div>

              <div className="my-auto flex items-center justify-center pt-3">
                <MintBottleIllustration className="w-44 h-36 group-hover:scale-105 transition-transform duration-300" />
              </div>

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono font-semibold text-[#2E7D5B]">
                  Live openFDA
                </span>
                <span className="w-9 h-9 rounded-full bg-white text-[#111827] shadow-sm inline-flex items-center justify-center group-hover:bg-[#111827] group-hover:text-white transition-colors">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </div>
            </motion.button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. INTERACTIVE CLINICAL WORKSPACE (ALL 4 CORE WORKFLOWS + 404 GUARD)
         ===================================================================== */}
      <main
        id="clinical-workspace-anchor"
        className="flex-1 w-full bg-[#F8FAFC]/60 py-8 sm:py-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Segmented Workflow Bar */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-full border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
              {WORKFLOW_ORDER.map((slug) => {
                const wf = WORKFLOW_META[slug];
                const active = activeWorkflow === slug && notFoundReasons.length === 0;
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => navigateToWorkflow(slug)}
                    className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-colors flex-1 sm:flex-initial text-center ${
                      active
                        ? "text-white"
                        : "text-slate-600 hover:text-[#111827]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="activeWorkflowPill"
                        transition={{
                          type: "spring",
                          stiffness: 120,
                          damping: 20,
                        }}
                        className="absolute inset-0 rounded-full bg-[#111827] -z-0"
                      />
                    )}
                    <span className="relative z-10">{wf.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 404 Custom Route Guard */}
          {notFoundReasons.length > 0 ? (
            <div className="rounded-[2rem] bg-white border-2 border-red-200 p-8 sm:p-10 shadow-diffusion my-4">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#DC2626] mb-2">
                HTTP 404 — RESOURCE NOT FOUND
              </div>
              <div className="font-display text-5xl font-bold text-[#111827] mb-3">
                404
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#111827] mb-2">
                Clinical Route or Patient Cohort Not Found
              </h2>
              <p className="text-sm text-slate-600 max-w-xl leading-relaxed mb-6">
                {notFoundReasons.join(" ")} Please verify the URL parameters or
                return to the main clinical pharmacovigilance workspace.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNotFoundReasons([]);
                  setSelectedPid("PT_BLEED_001");
                  navigateToWorkflow("discovery");
                  loadPatientBundle("PT_BLEED_001");
                }}
                className="bg-[#111827] text-white px-6 py-3 rounded-full text-xs font-semibold inline-flex items-center gap-2 hover:bg-zinc-800"
              >
                <span>Return to Multi-Drug Interaction Discovery</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : loadingPatient ? (
            /* Skeleton Shimmer Loader (Rule 5 of design-taste-frontend) */
            <div className="space-y-6 animate-pulse">
              <div className="h-36 rounded-[2rem] bg-slate-200/70" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="h-24 rounded-3xl bg-slate-200/70" />
                <div className="h-24 rounded-3xl bg-slate-200/70" />
                <div className="h-24 rounded-3xl bg-slate-200/70" />
                <div className="h-24 rounded-3xl bg-slate-200/70" />
              </div>
              <div className="h-72 rounded-[2rem] bg-slate-200/70" />
            </div>
          ) : activeWorkflow === "discovery" ? (
            /* ===============================================================
               WORKFLOW 1: MULTI-DRUG INTERACTION DISCOVERY
               =============================================================== */
            <motion.div
              key={`discovery-${selectedPid}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="space-y-7"
            >
              {/* Patient Summary Card */}
              <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 sm:p-8 shadow-diffusion">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-3.5 mb-2">
                      <PatientCohortAvatar patientId={selectedPid} size="lg" />
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4A7BB7]">
                          ACTIVE PATIENT COHORT
                        </div>
                        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
                          {patientProfile.name}
                        </h2>
                      </div>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>
                        MRN{" "}
                        <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[#111827]">
                          {patientProfile.patient_id}
                        </code>
                      </span>
                      <span>•</span>
                      <span>{patientProfile.age} yrs</span>
                      <span>•</span>
                      <span>Sex: {patientProfile.sex}</span>
                      <span>•</span>
                      <span>{patientProfile.weight} kg</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {activeMedications.map((m) => (
                        <span
                          key={m.drug_name}
                          className="px-3 py-1 rounded-full bg-[#111827] text-white text-xs font-medium"
                        >
                          {m.drug_name} ({m.dose} {m.dose_unit})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
                      Active Conditions
                    </div>
                    <div className="space-y-1">
                      {patientProfile.conditions.map((c) => (
                        <div
                          key={c}
                          className="text-xs font-medium text-[#111827] flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4A7BB7]" />
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
                      Documented Allergies
                    </div>
                    {patientProfile.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {patientProfile.allergies.map((al) => (
                          <span
                            key={al}
                            className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold"
                          >
                            {al}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-[#1B7A3D]">
                        No Known Drug Allergies
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-[#EAF2FA] rounded-2xl p-4 text-center">
                    <div className="font-display text-3xl font-bold text-[#3B6EA8]">
                      {activeMedications.length}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#3B6EA8] mt-1">
                      Active Drugs
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 KPI Stat Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-diffusion">
                  <div className="font-display text-3xl sm:text-4xl font-semibold text-[#111827]">
                    {activeAlerts.length}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mt-1.5">
                    Actionable Alerts
                  </div>
                </div>

                <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-diffusion">
                  <div className="font-display text-3xl sm:text-4xl font-semibold text-[#1B7A3D]">
                    {suppressedAlerts.length}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mt-1.5">
                    Suppressed (Anti-Fatigue)
                  </div>
                </div>

                <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-diffusion">
                  <div
                    className={`font-display text-3xl sm:text-4xl font-semibold ${
                      critCount > 0 ? "text-[#DC2626]" : "text-[#1B7A3D]"
                    }`}
                  >
                    {critCount}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mt-1.5">
                    Critical Tier Signals
                  </div>
                </div>

                <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-diffusion">
                  <div className="font-display text-3xl sm:text-4xl font-semibold text-[#4A7BB7]">
                    {peakPrr.toFixed(1)}x
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mt-1.5">
                    Peak Reporting Ratio (PRR)
                  </div>
                </div>
              </div>

              {/* Bklit.UI Composable Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <BklitTimelineChart
                    medications={patientProfile.medications}
                    symptoms={patientProfile.symptoms}
                    patientName={patientProfile.name}
                  />
                </div>
                <div className="lg:col-span-5">
                  <BklitRingGaugeChart
                    peakPriority={peakPriority}
                    temporalDtas={peakDtas}
                    suppressionPct={suppressionPct}
                    suppressedCount={suppressedAlerts.length}
                    totalCount={activeAlerts.length + suppressedAlerts.length}
                  />
                </div>
              </div>

              {/* Prioritized Signals Triage Header */}
              <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 sm:p-8 shadow-diffusion">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4A7BB7]">
                      CLINICAL SIGNAL TRIAGE
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#111827] mt-0.5">
                      Prioritized Pharmacovigilance Signals
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-[#F8FAFC] px-3.5 py-2 rounded-full border border-slate-200">
                      <input
                        type="checkbox"
                        checked={showSuppressed}
                        onChange={(e) => setShowSuppressed(e.target.checked)}
                        className="rounded text-[#111827] focus:ring-0"
                      />
                      <span>Show Suppressed Signals</span>
                    </label>

                    <div className="inline-flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-slate-200">
                      <FunnelSimple size={14} className="text-slate-500" />
                      <select
                        aria-label="Filter Severity Tier"
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-[#111827] focus:outline-none"
                      >
                        <option value="ALL">All Tiers</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MODERATE">MODERATE</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const refreshed = await loadPatientBundle(selectedPid);
                        const count = refreshed
                          ? refreshed.totalSignals
                          : activeAlerts.length + suppressedAlerts.length;
                        const name = refreshed
                          ? refreshed.profile.name
                          : patientProfile.name;
                        setRefreshBanner(
                          `Synchronized ${count} pharmacovigilance signals for ${name}.`
                        );
                      }}
                      className="bg-[#111827] hover:bg-zinc-800 active:scale-[0.98] text-white text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1.5 transition-all"
                    >
                      <ArrowsClockwise size={14} weight="bold" />
                      <span>Refresh Signals</span>
                    </button>
                  </div>
                </div>

                {refreshBanner && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#1B7A3D] flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <CheckCircle size={16} weight="fill" />
                      {refreshBanner}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRefreshBanner(null)}
                      className="text-[#1B7A3D] hover:opacity-75"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {activeAlerts.length === 0 ? (
                  <div className="rounded-3xl bg-[#EAF5F0] border border-emerald-200/70 p-6 sm:p-8">
                    <div className="flex items-center gap-2 text-[#1B7A3D] font-display text-lg font-semibold mb-2">
                      <ShieldCheck size={22} weight="fill" />
                      <span>
                        Regimen Stable — Zero Uncontrolled Interaction Risks
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                      All background theoretical interactions for{" "}
                      <strong>{patientProfile.name}</strong> have been
                      automatically suppressed. The patient has tolerated this
                      regimen stably for over 6 months without adverse symptom
                      correlation. Toggle{" "}
                      <strong>&ldquo;Show Suppressed Signals&rdquo;</strong>{" "}
                      above to inspect muted background pairs.
                    </p>
                  </div>
                ) : filteredActiveAlerts.length === 0 ? (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-center gap-2">
                    <WarningCircle size={16} weight="fill" />
                    <span>
                      No active signals match severity tier &apos;{tierFilter}
                      &apos; for {patientProfile.name}. ({activeAlerts.length}{" "}
                      signal(s) exist in other tiers.)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredActiveAlerts.map((alert: AlertSignal, idx: number) => {
                      const isExpanded = !!expandedAlertIdx[idx];
                      return (
                        <div
                          key={`${alert.combo_str}-${alert.adverse_event}`}
                          className="rounded-3xl border border-slate-200/80 bg-[#F8FAFC]/60 p-5 sm:p-6 transition-all"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${tierBadgeStyle(
                                  alert.severity_tier
                                )}`}
                              >
                                {alert.severity_tier}
                              </span>
                              <h4 className="font-display text-lg sm:text-xl font-semibold text-[#111827] mt-2">
                                {alert.combo_str} &rarr;{" "}
                                <span className="text-[#DC2626]">
                                  {alert.adverse_event}
                                </span>
                              </h4>
                            </div>

                            <div className="text-right">
                              <div className="font-display text-3xl font-bold text-[#111827]">
                                {alert.alert_priority_score.toFixed(1)}
                              </div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Priority Score
                              </div>
                            </div>
                          </div>

                          {/* 4 Evidence Metrics */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/60">
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Reporting Ratio (PRR)
                              </div>
                              <div className="font-mono text-base font-bold text-[#111827] mt-1">
                                {alert.prr.toFixed(2)}x
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Disproportionality vs. background
                              </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Chi-Squared (x2)
                              </div>
                              <div className="font-mono text-base font-bold text-[#111827] mt-1">
                                {alert.chi_squared.toFixed(1)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Evans&apos; Threshold &ge; 4.0
                              </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                FAERS Co-Reports
                              </div>
                              <div className="font-mono text-base font-bold text-[#111827] mt-1">
                                {alert.case_count.toLocaleString()}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Signal: {alert.signal_strength}
                              </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Symptom Correlation
                              </div>
                              {alert.patient_has_matching_symptom ? (
                                <>
                                  <div className="font-mono text-sm font-bold text-[#DC2626] mt-1 truncate">
                                    {alert.matching_symptom_name}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Temporal DTAS:{" "}
                                    {alert.temporal_score.toFixed(2)}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-mono text-sm font-bold text-[#1B7A3D] mt-1">
                                    Asymptomatic
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Prospective surveillance
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                            <strong className="text-[#111827]">
                              Clinical Rationale:
                            </strong>{" "}
                            {alert.clinical_rationale}
                          </p>

                          {/* Expandable Pharmacology & Naranjo Causality */}
                          <div className="mt-4 pt-3 border-t border-slate-200/60">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAlertIdx((prev) => ({
                                  ...prev,
                                  [idx]: !prev[idx],
                                }))
                              }
                              className="w-full flex items-center justify-between text-xs font-semibold text-[#3B6EA8] hover:text-[#111827] transition-colors py-1"
                            >
                              <span>
                                Pharmacological Mechanism &amp; Naranjo ADR
                                Causality Breakdown
                              </span>
                              {isExpanded ? (
                                <CaretUp size={15} weight="bold" />
                              ) : (
                                <CaretDown size={15} weight="bold" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-4 space-y-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                      Physiological Mechanism
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                      {alert.mechanism}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                      Actionable Clinical Recommendation
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#1B7A3D] font-medium leading-relaxed">
                                      {alert.recommendation}
                                    </p>
                                  </div>
                                </div>

                                {alert.naranjo && (
                                  <div className="pt-4 border-t border-slate-100">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                      <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#4A7BB7]">
                                          NARANJO ADR PROBABILITY SCALE
                                        </div>
                                        <div className="text-sm font-semibold text-[#111827]">
                                          {alert.naranjo.probability_category}{" "}
                                          Causality ({alert.naranjo.total_score}
                                          /13 Points) — Trigger Drug:{" "}
                                          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                            {alert.naranjo.trigger_drug}
                                          </code>
                                        </div>
                                      </div>
                                      <span className="px-3 py-1 rounded-full bg-[#EAF2FA] text-[#3B6EA8] font-mono text-xs font-bold">
                                        Score: {alert.naranjo.total_score}/13
                                      </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                                            <th className="py-2 pr-2">#</th>
                                            <th className="py-2 px-2">
                                              Standard Question
                                            </th>
                                            <th className="py-2 px-2">
                                              Response
                                            </th>
                                            <th className="py-2 px-2">Score</th>
                                            <th className="py-2 pl-2">
                                              Clinical Rationale
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {alert.naranjo.questions.map((q) => (
                                            <tr key={q.id}>
                                              <td className="py-2 pr-2 font-mono text-slate-400">
                                                {q.id}
                                              </td>
                                              <td className="py-2 px-2 font-medium text-[#111827]">
                                                {q.text}
                                              </td>
                                              <td className="py-2 px-2 font-mono">
                                                {q.user_choice}
                                              </td>
                                              <td className="py-2 px-2 font-mono font-bold text-[#3B6EA8]">
                                                {q.score > 0
                                                  ? `+${q.score}`
                                                  : q.score}
                                              </td>
                                              <td className="py-2 pl-2 text-slate-500">
                                                {q.explanation}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Suppressed Background Signals */}
                {showSuppressed && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7A3D] mb-1">
                      LONGITUDINAL ALERT SUPPRESSION
                    </div>
                    <h4 className="font-display text-base font-semibold text-[#111827] mb-4">
                      Suppressed Background Interactions
                    </h4>
                    {suppressedAlerts.length > 0 ? (
                      <div className="space-y-3">
                        {suppressedAlerts.map((sAlert) => (
                          <div
                            key={`${sAlert.combo_str}-${sAlert.adverse_event}`}
                            className="p-4 rounded-2xl bg-[#EAF5F0]/60 border-l-4 border-[#1B7A3D]"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#111827]">
                              <span>
                                {sAlert.combo_str} &rarr;{" "}
                                {sAlert.adverse_event}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1B7A3D] text-[10px] font-bold uppercase">
                                SUPPRESSED
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {sAlert.suppression_reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No suppressed background signals for this patient&apos;s
                        active regimen.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeWorkflow === "safety" ? (
            /* ===============================================================
               WORKFLOW 2: PROSPECTIVE DRUG SAFETY CHECK
               =============================================================== */
            <div className="space-y-7">
              <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 sm:p-8 shadow-diffusion">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4A7BB7] mb-1">
                  PRE-PRESCRIPTION SIMULATION
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
                  Prospective Drug Addition Simulator
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Simulate prescribing a new medication against{" "}
                  <strong>{patientProfile.name}&apos;s</strong> active regimen,
                  allergy profile, and organ vulnerabilities before signing the
                  order.
                </p>

                {/* Active Regimen Strip */}
                <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Active Patient Regimen — {patientProfile.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeMedications.map((m) => (
                      <span
                        key={m.drug_name}
                        className="px-3 py-1 rounded-full bg-[#111827] text-white text-xs font-medium"
                      >
                        {m.drug_name} ({m.dose} {m.dose_unit})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Clinical Test Candidates */}
                <div className="mt-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    Quick Clinical &amp; Brand Test Candidates
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {SAFETY_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setCandidateDrug(preset.name);
                          setCandidateDose(String(preset.dose));
                          handleRunSafetyCheck(preset.name, preset.dose);
                        }}
                        className="px-3.5 py-2.5 rounded-full bg-[#F5F2EB] hover:bg-[#EAE4D7] active:scale-[0.98] text-[#111827] text-xs font-semibold transition-all text-center border border-stone-200 truncate"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate Prescription Form (Rule 6: Label above input, gap-2) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRunSafetyCheck();
                  }}
                  className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
                >
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <label
                      htmlFor="candidate-drug-input"
                      className="text-xs font-semibold text-[#111827]"
                    >
                      Brand or Generic Drug Name
                    </label>
                    <input
                      id="candidate-drug-input"
                      type="text"
                      value={candidateDrug}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCandidateDrug(val);
                        const resolved = resolveWebMedicine(val, "");
                        if (resolved && resolved.dose) {
                          setCandidateDose(resolved.dose);
                        }
                      }}
                      placeholder="e.g. Dolo 650, Brufen 400, Pan 40, Ibuprofen"
                      className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#4A7BB7]"
                    />
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-2">
                    <label
                      htmlFor="candidate-dose-input"
                      className="text-xs font-semibold text-[#111827]"
                    >
                      Dose Amount
                    </label>
                    <input
                      id="candidate-dose-input"
                      type="number"
                      step="any"
                      value={candidateDose}
                      onChange={(e) => setCandidateDose(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm font-mono text-[#111827] focus:outline-none focus:border-[#4A7BB7]"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-2">
                    <label
                      htmlFor="candidate-unit-select"
                      className="text-xs font-semibold text-[#111827]"
                    >
                      Dose Unit
                    </label>
                    <select
                      id="candidate-unit-select"
                      value={candidateUnit}
                      onChange={(e) => setCandidateUnit(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#4A7BB7]"
                    >
                      <option value="mg">mg</option>
                      <option value="mcg">mcg</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={safetyLoading}
                      className="w-full bg-[#111827] hover:bg-zinc-800 active:scale-[0.98] text-white font-semibold text-xs py-3 px-4 rounded-full transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={16} weight="bold" />
                      <span>
                        {safetyLoading ? "Checking..." : "Run Safety Check"}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Live Brand-to-Medicinal Name & Dosage Resolver Strip */}
                {(() => {
                  const resolved = resolveWebMedicine(candidateDrug, candidateDose);
                  if (!resolved) return null;
                  return (
                    <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-[#3B6EA8] bg-[#EAF2FA] px-2.5 py-1 rounded-full">
                          Resolved Medicinal Composition
                        </span>
                        <span className="text-slate-600">
                          Entered: <strong className="text-[#111827]">{resolved.entered}</strong>
                        </span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="text-slate-600">
                          Actual Medicinal Name:{" "}
                          <strong className="text-[#1B7A3D]">{resolved.medicinalName}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 hidden md:inline">{resolved.indication}</span>
                        <span className="font-mono font-bold px-2.5 py-1 rounded-full bg-[#111827] text-white text-[11px]">
                          {candidateDose || resolved.dose} {candidateUnit}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {safetyError && (
                  <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center gap-2 font-medium">
                    <WarningCircle size={18} weight="fill" />
                    <span>{safetyError}</span>
                  </div>
                )}

                {safetyResult && !safetyError && (
                  <div className="mt-7 space-y-6">
                    {/* Status Banner */}
                    <div
                      className={`p-5 rounded-3xl border-l-4 ${
                        safetyResult.safety_status === "LOW_RISK_COMPATIBLE"
                          ? "bg-[#EAF5F0] border-[#1B7A3D] text-[#111827]"
                          : safetyResult.safety_status ===
                              "CRITICAL_CONTRAINDICATION" ||
                            safetyResult.safety_status === "HIGH_RISK"
                          ? "bg-red-50/90 border-[#DC2626] text-[#111827]"
                          : "bg-[#EAF2FA] border-[#4A7BB7] text-[#111827]"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                        {safetyResult.safety_status ===
                        "LOW_RISK_COMPATIBLE" ? (
                          <CheckCircle
                            size={18}
                            weight="fill"
                            className="text-[#1B7A3D]"
                          />
                        ) : (
                          <ShieldWarning
                            size={18}
                            weight="fill"
                            className="text-[#DC2626]"
                          />
                        )}
                        <span>
                          {safetyResult.safety_status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-[#111827]">
                        {safetyResult.new_drug} —{" "}
                        <span className="text-[#1B7A3D]">
                          {resolveWebMedicine(safetyResult.new_drug, candidateDose)?.medicinalName ||
                            safetyResult.normalized_ingredient}
                        </span>{" "}
                        ({candidateDose} {candidateUnit})
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed">
                        {safetyResult.recommendation}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/70">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Allergy &amp; Cross-Reactivity
                          </div>
                          {safetyResult.allergy_warnings.length > 0 ? (
                            <ul className="space-y-1.5 text-xs font-semibold text-[#DC2626]">
                              {safetyResult.allergy_warnings.map((w) => (
                                <li key={w}>• {w}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs font-medium text-[#1B7A3D]">
                              No direct allergy or class cross-reactivity
                              detected.
                            </p>
                          )}
                        </div>

                        <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/70">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Patient Organ Vulnerabilities
                          </div>
                          {safetyResult.vulnerability_warnings.length > 0 ? (
                            <ul className="space-y-2 text-xs text-slate-700">
                              {safetyResult.vulnerability_warnings.map((v) => (
                                <li
                                  key={v}
                                  className="pl-3 border-l-2 border-amber-400"
                                >
                                  {v}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500">
                              No specific geriatric or organ-clearance flags
                              triggered.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-7 space-y-4">
                        {safetyResult.flagged_interactions.length > 0 ? (
                          <>
                            <BklitHorizontalBarChart
                              items={safetyResult.flagged_interactions.map(
                                (c) => ({
                                  label: `${c.reaction} (${c.combo})`,
                                  value: Number(c.prr),
                                  chi2: Number(c.chi2),
                                  cases: Number(c.cases),
                                  tier: c.tier,
                                })
                              )}
                              title="Emergent Combination Disproportionality (PRR)"
                              subtitle="Comparison of triggered multi-drug reporting ratios"
                            />
                            <div className="space-y-2.5">
                              {safetyResult.flagged_interactions.map((c, i) => (
                                <div
                                  key={`${c.combo}-${i}`}
                                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-[#111827]">
                                      {c.combo}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-0.5">
                                      Outcome:{" "}
                                      <strong className="text-[#DC2626]">
                                        {c.reaction}
                                      </strong>{" "}
                                      • PRR{" "}
                                      <code className="font-mono">
                                        {Number(c.prr).toFixed(1)}x
                                      </code>{" "}
                                      • Chi-Sq{" "}
                                      <code className="font-mono">
                                        {Number(c.chi2).toFixed(1)}
                                      </code>{" "}
                                      • {c.cases} cases
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${tierBadgeStyle(
                                      c.tier
                                    )}`}
                                  >
                                    {c.tier}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="p-6 rounded-3xl bg-[#EAF5F0] border border-emerald-200/70 text-xs font-medium text-[#1B7A3D]">
                            No high-disproportionality FAERS signals formed with
                            current active medications.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeWorkflow === "ehr" ? (
            /* ===============================================================
               WORKFLOW 3: PATIENT PROFILE & REPORT PARSER
               =============================================================== */
            <div className="space-y-7">
              <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 sm:p-8 shadow-diffusion">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5E4FA2]">
                      LONGITUDINAL HEALTH RECORD
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#111827]">
                      {patientProfile.name}
                    </h2>
                  </div>

                  <div className="inline-flex rounded-full bg-[#F8FAFC] p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEhrSubTab("inspect")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        ehrSubTab === "inspect"
                          ? "bg-[#111827] text-white"
                          : "text-slate-600 hover:text-[#111827]"
                      }`}
                    >
                      Active Electronic Health Record
                    </button>
                    <button
                      type="button"
                      onClick={() => setEhrSubTab("upload")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        ehrSubTab === "upload"
                          ? "bg-[#111827] text-white"
                          : "text-slate-600 hover:text-[#111827]"
                      }`}
                    >
                      Ingest Clinical Report (PDF / Image / OCR)
                    </button>
                  </div>
                </div>

                {extractSuccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-[#EAF5F0] border border-emerald-200 text-xs text-[#1B7A3D] flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {extractSuccess.message}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExtractSuccess(null)}
                      className="underline font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {ehrSubTab === "inspect" ? (
                  <div className="space-y-6">
                    {/* Vitals Callouts */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
                        <div className="font-display text-2xl font-bold text-[#111827]">
                          {patientProfile.age}
                        </div>
                        <div className="text-[11px] font-semibold uppercase text-slate-400">
                          Age (Years)
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
                        <div className="font-display text-2xl font-bold text-[#111827]">
                          {patientProfile.sex}
                        </div>
                        <div className="text-[11px] font-semibold uppercase text-slate-400">
                          Biological Sex
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
                        <div className="font-display text-2xl font-bold text-[#111827]">
                          {patientProfile.weight}
                        </div>
                        <div className="text-[11px] font-semibold uppercase text-slate-400">
                          Weight (kg)
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
                        <div className="font-display text-2xl font-bold text-[#111827]">
                          {patientProfile.medications.length}
                        </div>
                        <div className="text-[11px] font-semibold uppercase text-slate-400">
                          Total Medications
                        </div>
                      </div>
                    </div>

                    {/* Conditions & Lab Markers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/60">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          Diagnosed Clinical Conditions &amp; Allergies
                        </div>
                        <div className="space-y-2 mb-4">
                          {patientProfile.conditions.map((c) => (
                            <div
                              key={c}
                              className="text-xs font-semibold text-[#111827] py-1.5 border-b border-slate-200/60"
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Documented Drug Allergies
                        </div>
                        {patientProfile.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {patientProfile.allergies.map((a) => (
                              <span
                                key={a}
                                className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[#1B7A3D] font-medium">
                            No known drug allergies (NKDA).
                          </div>
                        )}
                      </div>

                      <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/60">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          Key Diagnostic &amp; Laboratory Markers
                        </div>
                        {patientProfile.lab_results &&
                        patientProfile.lab_results.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                                  <th className="py-2">Test</th>
                                  <th className="py-2">Value</th>
                                  <th className="py-2">Unit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60">
                                {patientProfile.lab_results.map((lab, i) => {
                                  const label =
                                    lab.test ||
                                    lab.test_name ||
                                    lab.name ||
                                    `Marker ${i + 1}`;
                                  return (
                                    <tr key={i}>
                                      <td className="py-2 font-semibold text-[#111827]">
                                        {label}
                                      </td>
                                      <td className="py-2 font-mono font-bold text-[#3B6EA8]">
                                        {String(lab.value)}
                                      </td>
                                      <td className="py-2 font-mono text-slate-500">
                                        {lab.unit || ""}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            No laboratory markers recorded.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Medication Regimen History Table */}
                    <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/60 overflow-x-auto">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Medication Regimen History
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                            <th className="py-2 pr-3">Medication</th>
                            <th className="py-2 px-3">Normalized Ingredient</th>
                            <th className="py-2 px-3">RxCUI</th>
                            <th className="py-2 px-3">Regimen</th>
                            <th className="py-2 px-3">Start Date</th>
                            <th className="py-2 pl-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60">
                          {patientProfile.medications.map((m, idx) => (
                            <tr key={`${m.drug_name}-${idx}`}>
                              <td className="py-2.5 pr-3 font-semibold text-[#111827]">
                                {m.drug_name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {m.normalized_name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#3B6EA8]">
                                {m.rxcui || "N/A"}
                              </td>
                              <td className="py-2.5 px-3">
                                {m.dose} {m.dose_unit} {m.frequency} ({m.route})
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {m.start_date || "Chronic"}
                              </td>
                              <td className="py-2.5 pl-3">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1B7A3D] text-[10px] font-bold">
                                  {m.end_date || "Active"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Adverse Reactions & Symptom Log */}
                    <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/60 overflow-x-auto">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Adverse Reactions &amp; Symptom Log
                      </div>
                      {patientProfile.symptoms.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                              <th className="py-2 pr-3">Symptom</th>
                              <th className="py-2 px-3">
                                MedDRA Preferred Term
                              </th>
                              <th className="py-2 px-3">Severity</th>
                              <th className="py-2 pl-3">Onset Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60">
                            {patientProfile.symptoms.map((s, idx) => (
                              <tr key={`${s.description}-${idx}`}>
                                <td className="py-2.5 pr-3 font-semibold text-[#DC2626]">
                                  {s.description}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">
                                  {s.meddra_term}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold">
                                  {s.severity}/10
                                </td>
                                <td className="py-2.5 pl-3 font-mono">
                                  {s.onset_date || "Acute"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-slate-500">
                          No adverse reactions or symptoms recorded for this
                          patient.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Sub-tab 2: Ingest Clinical Report (PDF / Image / OCR) */
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        Upload a discharge summary / prescription image (auto-compressed) or paste clinical chart notes.
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setClinicalNoteText(SAMPLE_DISCHARGE_NOTE)
                        }
                        className="px-4 py-2 rounded-full bg-[#F0EDF8] hover:bg-purple-100 text-[#5E4FA2] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FileText size={14} weight="bold" />
                        <span>Load Sample Clinical Discharge Summary</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="clinical-file-upload"
                        className="text-xs font-semibold text-[#111827]"
                      >
                        Upload Discharge Summary or Prescription (PDF, PNG, JPG,
                        TXT)
                      </label>
                      <input
                        id="clinical-file-upload"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={(e) =>
                          setUploadFile(e.target.files?.[0] || null)
                        }
                        className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#EAF2FA] file:text-[#3B6EA8] hover:file:bg-blue-100"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="clinical-notes-textarea"
                        className="text-xs font-semibold text-[#111827]"
                      >
                        Clinical Chart Notes for Timeline Extraction
                      </label>
                      <textarea
                        id="clinical-notes-textarea"
                        rows={6}
                        value={clinicalNoteText}
                        onChange={(e) => setClinicalNoteText(e.target.value)}
                        placeholder="Paste a clinical discharge summary or prescription order listing medications, doses, dates, and symptoms..."
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs font-mono text-[#111827] focus:outline-none focus:border-[#4A7BB7]"
                      />
                    </div>

                    {extractError && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center gap-2 font-medium">
                        <WarningCircle size={16} weight="fill" />
                        <span>{extractError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={extractLoading}
                      onClick={handleExtractTimeline}
                      className="bg-[#111827] hover:bg-zinc-800 active:scale-[0.98] text-white text-xs font-semibold px-6 py-3 rounded-full inline-flex items-center gap-2 transition-all"
                    >
                      <UploadSimple size={15} weight="bold" />
                      <span>
                        {extractLoading
                          ? "Extracting Timeline..."
                          : "Extract & Save Patient Timeline"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ===============================================================
               WORKFLOW 4: FAERS DISPROPORTIONALITY EXPLORER
               =============================================================== */
            <div className="space-y-7">
              <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 sm:p-8 shadow-diffusion">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2E7D5B] mb-1">
                  EMPIRICAL SIGNAL MINING
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
                  FAERS Disproportionality Explorer
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Query multi-drug combinations against pre-computed 2x2
                  contingency tables and live openFDA adverse event reports.
                </p>

                {/* Benchmark Combination Presets */}
                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    Benchmark Combination Presets
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {FAERS_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setFaersQuery(p.query);
                          handleQueryFaers(p.query);
                        }}
                        className="px-3.5 py-2.5 rounded-full bg-[#EAF5F0] hover:bg-emerald-100/80 active:scale-[0.98] text-[#2E7D5B] text-xs font-semibold transition-all text-center border border-emerald-200/70"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Query Controls */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleQueryFaers();
                  }}
                  className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
                >
                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <label
                      htmlFor="faers-combo-input"
                      className="text-xs font-semibold text-[#111827]"
                    >
                      Drug Combination (comma-separated)
                    </label>
                    <input
                      id="faers-combo-input"
                      type="text"
                      value={faersQuery}
                      onChange={(e) => setFaersQuery(e.target.value)}
                      placeholder="Warfarin, Aspirin, Ibuprofen"
                      className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#4A7BB7]"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center pb-2">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={liveFdaEnabled}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          setLiveFdaEnabled(nextVal);
                          handleQueryFaers(faersQuery, nextVal);
                        }}
                        className="rounded text-[#111827]"
                      />
                      <span>Query Live openFDA API</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={faersLoading}
                      className="w-full bg-[#111827] hover:bg-zinc-800 active:scale-[0.98] text-white font-semibold text-xs py-3 px-4 rounded-full transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <MagnifyingGlass size={15} weight="bold" />
                      <span>
                        {faersLoading ? "Querying..." : "Query Signals"}
                      </span>
                    </button>
                  </div>
                </form>

                {faersError && (
                  <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center gap-2 font-medium">
                    <WarningCircle size={16} weight="fill" />
                    <span>{faersError}</span>
                  </div>
                )}

                {faersResult && !faersError && (
                  <div className="mt-7 space-y-6">
                    {faersResult.signals.length > 0 ? (
                      <>
                        <div className="p-3.5 rounded-2xl bg-[#EAF5F0] border border-emerald-200 text-xs font-medium text-[#1B7A3D] flex items-center gap-2">
                          <CheckCircle size={16} weight="fill" />
                          <span>
                            Found {faersResult.signals.length} empirical FAERS
                            disproportionality signal(s) for{" "}
                            {faersResult.drugs.join(", ")}.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <BklitHorizontalBarChart
                            items={faersResult.signals.map((s) => ({
                              label: s.adverse_event.toUpperCase(),
                              value: Number(s.prr),
                              chi2: Number(s.chi_squared),
                              cases: Number(s.case_count),
                              tier: s.severity_tier,
                            }))}
                            title="Reporting Ratio Comparison (PRR)"
                            subtitle="Disproportionality bars across co-reported adverse reactions"
                          />

                          <BklitVolcanoChart
                            points={faersResult.signals.map((s) => ({
                              label: s.adverse_event.toUpperCase(),
                              prr: Number(s.prr),
                              chi2: Number(s.chi_squared),
                              cases: Number(s.case_count),
                              tier: s.severity_tier,
                            }))}
                            title="Disproportionality Volcano Plot (PRR vs x2)"
                            subtitle="Bubble matrix sized by co-reported FAERS case volume"
                          />
                        </div>

                        {/* Contingency Signal Table */}
                        <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/70 overflow-x-auto">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                            Contingency Signal Table
                          </div>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                                <th className="py-2 pr-3">Adverse Event</th>
                                <th className="py-2 px-3">Severity</th>
                                <th className="py-2 px-3">PRR</th>
                                <th className="py-2 px-3">Chi-Sq (x2)</th>
                                <th className="py-2 px-3">Cases</th>
                                <th className="py-2 pl-3">Signal Strength</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60">
                              {faersResult.signals.map((s, i) => (
                                <tr key={`${s.adverse_event}-${i}`}>
                                  <td className="py-2.5 pr-3 font-semibold text-[#111827] capitalize">
                                    {s.adverse_event}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${tierBadgeStyle(
                                        s.severity_tier
                                      )}`}
                                    >
                                      {s.severity_tier}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#3B6EA8]">
                                    {Number(s.prr).toFixed(2)}x
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {Number(s.chi_squared).toFixed(1)}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {Number(s.case_count).toLocaleString()}
                                  </td>
                                  <td className="py-2.5 pl-3 font-semibold text-slate-600">
                                    {s.signal_strength}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        No pre-computed disproportionality signals found in the
                        local FAERS benchmark database for:{" "}
                        {faersResult.drugs.join(", ")}.
                      </div>
                    )}

                    {liveFdaEnabled &&
                      (faersResult.live_fda_reactions &&
                      faersResult.live_fda_reactions.length > 0 ? (
                        <div className="p-5 rounded-3xl bg-[#EAF2FA]/60 border border-blue-200/70">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#3B6EA8] mb-3">
                            <CloudCheck size={16} weight="fill" />
                            <span>Live openFDA Co-Occurrence Reports</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {faersResult.live_fda_reactions.map((r, idx) => (
                              <div
                                key={`${r.reaction_meddra}-${idx}`}
                                className="p-3 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#111827] truncate pr-2">
                                  {r.reaction_meddra}
                                </span>
                                <span className="font-mono font-bold text-[#3B6EA8]">
                                  {r.co_occurrence_count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-[#EAF2FA]/60 border border-blue-200/70 text-xs text-[#3B6EA8] flex items-center gap-2">
                          <Info size={16} weight="fill" />
                          <span>
                            Live openFDA query completed: no additional external
                            co-occurrence records returned (or running in
                            standalone offline mode).
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================================
          5. CONNECTED 4-STAGE END-TO-END CLINICAL WORKFLOW PIPELINE ("HOW IT WORKS")
         ===================================================================== */}
      <section
        id="why-ladip-bento"
        className="w-full bg-white py-14 sm:py-20 border-t border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF2FA] text-[#3B6EA8] text-[11px] font-bold uppercase tracking-[0.14em] mb-3">
              <span>Connected End-to-End Architecture • How LADIP Works</span>
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-normal tracking-tight leading-[1.1] text-[#111827]">
              Four connected stages from raw patient record{" "}
              <span className="text-[#4A7BB7]">
                to causality-verified prescription.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Instead of disconnected static drug-pair lookups, every patient
              cohort flows sequentially through a four-stage longitudinal
              pharmacovigilance pipeline.
            </p>
          </div>

          {/* Top Connected Pipeline Overview Bar (01 -> 02 -> 03 -> 04) */}
          <div className="hidden lg:grid grid-cols-4 gap-0 mb-8 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-3 items-center">
            {[
              {
                num: "01",
                label: "EHR & OCR Ingestion",
                sub: "RxNorm Timeline Builder",
                color: "bg-[#5E4FA2]",
              },
              {
                num: "02",
                label: "FAERS 2×2 Disproportionality",
                sub: "PRR ≥ 2.0 & Chi-Sq ≥ 4.0",
                color: "bg-[#3B6EA8]",
              },
              {
                num: "03",
                label: "Temporal Fatigue Filter",
                sub: ">180d Tolerance Suppression",
                color: "bg-[#1B7A3D]",
              },
              {
                num: "04",
                label: "Naranjo & Pre-Order Check",
                sub: "10-Pt Causality & Simulation",
                color: "bg-[#111827]",
              },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div className="flex items-center gap-2.5 px-3 py-1.5">
                  <span
                    className={`w-7 h-7 rounded-full text-white font-mono text-xs font-bold inline-flex items-center justify-center shrink-0 ${step.color}`}
                  >
                    {step.num}
                  </span>
                  <div className="leading-tight">
                    <div className="text-xs font-semibold text-[#111827]">
                      {step.label}
                    </div>
                    <div className="text-[10.5px] text-slate-500">
                      {step.sub}
                    </div>
                  </div>
                </div>
                {i < 3 && (
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-[2px] w-full bg-slate-200 relative overflow-hidden rounded-full">
                      <motion.span
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.4,
                        }}
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#4A7BB7] to-transparent"
                      />
                    </div>
                    <ArrowRight
                      size={13}
                      weight="bold"
                      className="text-[#4A7BB7] shrink-0 -ml-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ROW 1: STAGE 01 ━━━(Connected Bridge)━━━▶ STAGE 02 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* STAGE 01 (5 cols) */}
            <div className="lg:col-span-5 rounded-[2rem] bg-[#F8FAFC] border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0EDF8] text-[#5E4FA2] font-mono text-[11px] font-bold">
                    <span>STAGE 01</span>
                    <span>•</span>
                    <span>INPUT &amp; OCR</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Step 1 of 4
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="max-w-xs">
                    <h3 className="font-display text-2xl sm:text-[1.65rem] font-normal tracking-tight leading-tight text-[#111827]">
                      <span className="block text-[#5E4FA2]">
                        Longitudinal EHR
                      </span>
                      <span className="block mt-0.5">
                        &amp; OCR timeline builder
                      </span>
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Parses structured EHR profiles or raw PDF/image discharge
                      summaries, normalizes drug names via NIH RxNorm, and maps
                      exact daily exposure start and end windows.
                    </p>
                  </div>
                  <div className="shrink-0 self-center">
                    <LavenderTabletsIllustration className="w-32 h-28" />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[11px] text-[#5E4FA2] font-semibold">
                  Handoff &rarr; Normalized Drug Windows
                </span>
                <button
                  type="button"
                  onClick={() => navigateToWorkflow("ehr", true)}
                  className="font-semibold text-[#111827] hover:text-[#5E4FA2] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Open EHR Parser</span>
                  <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            </div>

            {/* CONNECTOR BRIDGE: STAGE 01 ➔ STAGE 02 (2 cols on Desktop, Vertical on Mobile) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0">
              <div className="w-full flex lg:flex-col items-center justify-center gap-2 px-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B6EA8] bg-[#EAF2FA] px-2.5 py-1 rounded-full border border-blue-200/80 text-center">
                  Overlap Detection
                </span>
                <div className="hidden lg:flex items-center w-full">
                  <div className="h-[2px] flex-1 bg-[#9BC2EE] relative overflow-hidden">
                    <motion.span
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-y-0 w-1/2 bg-[#3B6EA8]"
                    />
                  </div>
                  <span className="w-7 h-7 rounded-full bg-[#3B6EA8] text-white inline-flex items-center justify-center shadow-xs shrink-0">
                    <ArrowRight size={14} weight="bold" />
                  </span>
                </div>
                <div className="lg:hidden flex flex-col items-center">
                  <div className="w-[2px] h-5 bg-[#3B6EA8]" />
                  <span className="w-6 h-6 rounded-full bg-[#3B6EA8] text-white inline-flex items-center justify-center text-xs">
                    &darr;
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 text-center hidden lg:block">
                  Concurrent drug pairs &amp; triplets
                </span>
              </div>
            </div>

            {/* STAGE 02 (5 cols) */}
            <div className="lg:col-span-5 rounded-[2rem] bg-[#F8FAFC] border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF2FA] text-[#3B6EA8] font-mono text-[11px] font-bold">
                    <span>STAGE 02</span>
                    <span>•</span>
                    <span>FAERS ENGINE</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Step 2 of 4
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="max-w-xs">
                    <h3 className="font-display text-2xl sm:text-[1.65rem] font-normal tracking-tight leading-tight text-[#111827]">
                      <span className="block text-[#4A7BB7]">
                        Empirical 2&times;2
                      </span>
                      <span className="block mt-0.5">
                        disproportionality mining
                      </span>
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Queries overlapping medications against 180K+ FDA FAERS
                      reports using 2&times;2 contingency ratios (PRR &ge; 2.0,
                      Evans&apos; &chi;&sup2; &ge; 4.0) to isolate multi-drug
                      adverse synergy.
                    </p>
                  </div>
                  <div className="shrink-0 self-center">
                    <BlueVialsIllustration className="w-36 h-28" />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[11px] text-[#3B6EA8] font-semibold">
                  Handoff &rarr; Candidate Synergy Signals
                </span>
                <button
                  type="button"
                  onClick={() => navigateToWorkflow("faers", true)}
                  className="font-semibold text-[#111827] hover:text-[#3B6EA8] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Explore FAERS</span>
                  <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* MID-PIPELINE VISUAL CONDUIT CONNECTING STAGE 02 DOWN TO STAGE 03 */}
          <div className="my-4 relative flex items-center justify-center">
            <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-r from-[#EAF2FA]/70 via-[#EAF5F0]/80 to-[#EAF2FA]/70 border border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                <span className="w-6 h-6 rounded-full bg-[#1B7A3D] text-white font-mono text-[11px] inline-flex items-center justify-center">
                  &darr;
                </span>
                <span>
                  Pipeline Transition: Candidate FAERS Signals enter Longitudinal
                  Exposure Gate
                </span>
              </div>
              <span className="font-mono text-[11px] font-semibold text-[#1B7A3D] bg-white px-3 py-1 rounded-full border border-emerald-200/80">
                Rule: Suppress if tolerated &gt;180 days without matching symptom
              </span>
            </div>
          </div>

          {/* ROW 2: STAGE 03 ━━━(Connected Bridge)━━━▶ STAGE 04 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* STAGE 03 (5 cols) */}
            <div className="lg:col-span-5 rounded-[2rem] bg-[#F8FAFC] border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5F0] text-[#1B7A3D] font-mono text-[11px] font-bold">
                    <span>STAGE 03</span>
                    <span>•</span>
                    <span>NOISE SUPPRESSION</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Step 3 of 4
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="max-w-xs">
                    <h3 className="font-display text-2xl sm:text-[1.65rem] font-normal tracking-tight leading-tight text-[#111827]">
                      <span className="block text-[#1B7A3D]">
                        Fatigue-free triage
                      </span>
                      <span className="block mt-0.5">
                        via chronic tolerance gate
                      </span>
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      If a patient tolerates a chronic regimen stably for over
                      180 days without matching symptoms, background alerts are
                      automatically suppressed (-73% alert noise).
                    </p>
                  </div>
                  <div className="shrink-0 self-center">
                    <HormnBlueKitBoxIllustration className="w-36 h-28" />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[11px] text-[#1B7A3D] font-semibold">
                  Handoff &rarr; Actionable Acute Triggers
                </span>
                <button
                  type="button"
                  onClick={() => navigateToWorkflow("discovery", true)}
                  className="font-semibold text-[#111827] hover:text-[#1B7A3D] inline-flex items-center gap-1 transition-colors"
                >
                  <span>View Triage</span>
                  <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            </div>

            {/* CONNECTOR BRIDGE: STAGE 03 ➔ STAGE 04 (2 cols on Desktop, Vertical on Mobile) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0">
              <div className="w-full flex lg:flex-col items-center justify-center gap-2 px-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1B7A3D] bg-[#EAF5F0] px-2.5 py-1 rounded-full border border-emerald-200/80 text-center">
                  Causality Scoring
                </span>
                <div className="hidden lg:flex items-center w-full">
                  <div className="h-[2px] flex-1 bg-emerald-300 relative overflow-hidden">
                    <motion.span
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.5,
                      }}
                      className="absolute inset-y-0 w-1/2 bg-[#1B7A3D]"
                    />
                  </div>
                  <span className="w-7 h-7 rounded-full bg-[#111827] text-white inline-flex items-center justify-center shadow-xs shrink-0">
                    <ArrowRight size={14} weight="bold" />
                  </span>
                </div>
                <div className="lg:hidden flex flex-col items-center">
                  <div className="w-[2px] h-5 bg-[#1B7A3D]" />
                  <span className="w-6 h-6 rounded-full bg-[#111827] text-white inline-flex items-center justify-center text-xs">
                    &darr;
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 text-center hidden lg:block">
                  Acute onset &amp; dechallenge audit
                </span>
              </div>
            </div>

            {/* STAGE 04 (5 cols) */}
            <div className="lg:col-span-5 rounded-[2rem] bg-[#F8FAFC] border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-[#111827] font-mono text-[11px] font-bold">
                    <span>STAGE 04</span>
                    <span>•</span>
                    <span>CAUSALITY &amp; DECISION</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Step 4 of 4
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="max-w-xs">
                    <h3 className="font-display text-2xl sm:text-[1.65rem] font-normal tracking-tight leading-tight text-[#111827]">
                      <span className="block text-[#4A7BB7]">
                        Naranjo causality
                      </span>
                      <span className="block mt-0.5">
                        &amp; pre-order safety check
                      </span>
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Automates 10-point Naranjo ADR probability scoring for
                      acute trigger drugs and simulates safer alternative
                      candidates before a new prescription is ordered.
                    </p>
                  </div>
                  <div className="shrink-0 self-center">
                    <ClinicianCohortAvatars />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[11px] text-[#111827] font-semibold">
                  Output &rarr; Causality-Verified Regimen
                </span>
                <button
                  type="button"
                  onClick={() => navigateToWorkflow("safety", true)}
                  className="font-semibold text-[#111827] hover:text-[#4A7BB7] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Run Simulator</span>
                  <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. VERIFIED CLINICAL FOOTER (2026 COPYRIGHT & ZERO BROKEN LINKS)
         ===================================================================== */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <a
              href="?workflow=discovery"
              onClick={(e) => {
                e.preventDefault();
                navigateToWorkflow("discovery");
              }}
              className="inline-block mb-2"
            >
              <HormnLogoMark size="sm" />
            </a>
            <p className="text-slate-500">
              &copy; 2026 LADIP — Longitudinal Adverse Drug Interaction
              Predictor. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {WORKFLOW_ORDER.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => navigateToWorkflow(slug, true)}
                className="font-semibold text-[#111827] hover:text-[#4A7BB7] transition-colors"
              >
                {WORKFLOW_META[slug].shortTitle}
              </button>
            ))}
            <a
              href="https://open.fda.gov/apis/drug/event/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#111827] hover:text-[#4A7BB7]"
            >
              FDA FAERS API
            </a>
            <a
              href="https://lhncbc.nlm.nih.gov/RxNav/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#111827] hover:text-[#4A7BB7]"
            >
              NIH RxNorm
            </a>
            <a
              href="https://www.ncbi.nlm.nih.gov/books/NBK548069/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#111827] hover:text-[#4A7BB7]"
            >
              Naranjo Scale
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
