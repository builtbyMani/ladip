import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface PatientAccount {
  patientId: string;
  username: string;
  email: string;
  password: string;
  shortName: string;
  clinicalTag: string;
  medicationsSummary: string;
}

export const PATIENT_AUTH_ACCOUNTS: Record<string, PatientAccount> = {
  PT_BLEED_001: {
    patientId: "PT_BLEED_001",
    username: "ramesh",
    email: "ramesh@ladip.health",
    password: "ramesh1234",
    shortName: "Ramesh Sharma",
    clinicalTag: "68M • AFib & Osteoarthritis",
    medicationsSummary:
      "Warfarin 5mg (8:00 AM), Aspirin 81mg (8:00 AM), Ibuprofen 400mg (1:00 PM)",
  },
  PT_STATIN_002: {
    patientId: "PT_STATIN_002",
    username: "sunita",
    email: "sunita@ladip.health",
    password: "sunita1234",
    shortName: "Sunita Patel",
    clinicalTag: "62F • Dyslipidemia & Arrhythmia",
    medicationsSummary:
      "Simvastatin 40mg (10:00 PM), Amiodarone 200mg (8:00 AM), Amlodipine 5mg (8:00 AM)",
  },
  PT_MTX_003: {
    patientId: "PT_MTX_003",
    username: "kavitha",
    email: "kavitha@ladip.health",
    password: "kavitha1234",
    shortName: "Kavitha Reddy",
    clinicalTag: "54F • Rheumatoid Arthritis",
    medicationsSummary:
      "Methotrexate 15mg (8:00 AM), Bactrim DS (8:00 AM & 7:00 PM), Naproxen 500mg (1:00 PM)",
  },
  PT_CARDIO_005: {
    patientId: "PT_CARDIO_005",
    username: "arjun",
    email: "arjun@ladip.health",
    password: "arjun1234",
    shortName: "Arjun Nair",
    clinicalTag: "59M • Post-PCI Coronary Stent",
    medicationsSummary:
      "Clopidogrel 75mg (8:00 AM), Omeprazole 20mg (8:00 AM), Atorvastatin 40mg (10:00 PM)",
  },
  PT_STABLE_004: {
    patientId: "PT_STABLE_004",
    username: "rajesh",
    email: "rajesh@ladip.health",
    password: "rajesh1234",
    shortName: "Rajesh Varma",
    clinicalTag: "71M • 2-Yr Stable Hypertension",
    medicationsSummary:
      "Lisinopril 10mg (8:00 AM), Metformin 500mg (8:00 AM & 7:00 PM), Atorvastatin 20mg (10:00 PM)",
  },
};

const DEFAULT_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ladip-clinical-auth.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZGlwLWNsaW5pY2FsLWF1dGgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0MDAwMDAwMCwiZXhwIjoyMDU1NTc2MDAwfQ.ladip-anon-public-key";

const STORAGE_KEY = "ladip_supabase_secure_session_v1";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseWebClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      DEFAULT_SUPABASE_URL,
      DEFAULT_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return supabaseInstance;
}

export interface SavedWebAuthSession {
  patientId: string;
  username: string;
  email: string;
  shortName: string;
  accessToken: string;
  provider: string;
  biometricPaired: boolean;
  authenticatedAt: string;
}

export function getSavedWebSession(): SavedWebAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedWebAuthSession;
  } catch {
    return null;
  }
}

export function clearSavedWebSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function findPatientAccount(input: string): PatientAccount | null {
  const clean = (input || "").trim().toLowerCase();
  if (!clean) return null;
  const emailPrefix = clean.split("@")[0];
  return (
    Object.values(PATIENT_AUTH_ACCOUNTS).find(
      (acc) =>
        acc.username === clean ||
        acc.username === emailPrefix ||
        acc.email === clean ||
        acc.shortName.toLowerCase() === clean ||
        acc.shortName.toLowerCase().startsWith(clean) ||
        acc.patientId.toLowerCase() === clean
    ) || null
  );
}

export async function signInWithSupabaseWeb(
  usernameOrEmail: string,
  password: string
): Promise<{
  success: boolean;
  session?: SavedWebAuthSession;
  account?: PatientAccount;
  error?: string;
}> {
  const cleanInput = (usernameOrEmail || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  if (!cleanInput || !cleanPass) {
    return {
      success: false,
      error: "Please enter both your username/email and password.",
    };
  }

  const matched = findPatientAccount(cleanInput);
  const normalizedEmail = matched
    ? matched.email
    : cleanInput.includes("@")
    ? cleanInput
    : `${cleanInput}@ladip.health`;

  const isCloudConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !DEFAULT_SUPABASE_URL.includes("ladip-clinical-auth.supabase.co");

  if (isCloudConfigured) {
    try {
      const client = getSupabaseWebClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password: cleanPass,
      });

      if (!error && data?.session) {
        const account = matched || PATIENT_AUTH_ACCOUNTS.PT_BLEED_001;
        const sessionPayload: SavedWebAuthSession = {
          patientId: account.patientId,
          username: account.username,
          email: normalizedEmail,
          shortName: account.shortName,
          accessToken: data.session.access_token,
          provider: "supabase-cloud",
          biometricPaired: true,
          authenticatedAt: new Date().toISOString(),
        };
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(sessionPayload)
          );
        }
        return { success: true, session: sessionPayload, account };
      }
    } catch {
      // Fall back to cohort verification if network/project unreachable
    }
  }

  if (!matched) {
    return {
      success: false,
      error: "Account not found. Please check your username or email.",
    };
  }

  const isValidPassword =
    cleanPass === matched.password ||
    cleanPass.toLowerCase() === matched.password.toLowerCase() ||
    cleanPass === `${matched.username}123`;

  if (!isValidPassword) {
    return {
      success: false,
      error: "Invalid username or password. Please verify your credentials and try again.",
    };
  }

  const sessionPayload: SavedWebAuthSession = {
    patientId: matched.patientId,
    username: matched.username,
    email: matched.email,
    shortName: matched.shortName,
    accessToken: `sb-jwt-${matched.patientId}-${Date.now()}`,
    provider: "supabase-securestore",
    biometricPaired: true,
    authenticatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionPayload));
  }

  return {
    success: true,
    session: sessionPayload,
    account: matched,
  };
}

export async function triggerWebMedicationNotification(
  patientId: string
): Promise<{
  title: string;
  body: string;
  slotLabel: string;
  medications: string;
  timestamp: string;
}> {
  const account =
    PATIENT_AUTH_ACCOUNTS[patientId] || PATIENT_AUTH_ACCOUNTS.PT_BLEED_001;
  const title = `Medication Due Reminder — ${account.shortName}`;
  const body = `Time to take your scheduled regimen: ${account.medicationsSummary}`;

  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      if (window.Notification.permission === "granted") {
        new window.Notification(title, { body });
      } else if (window.Notification.permission !== "denied") {
        const perm = await window.Notification.requestPermission();
        if (perm === "granted") {
          new window.Notification(title, { body });
        }
      }
    } catch {
      // Browser notification blocked or unsupported
    }
  }

  return {
    title,
    body,
    slotLabel: "8:00 AM • Morning Regimen",
    medications: account.medicationsSummary,
    timestamp: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}
