"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";

/**
 * HORMN-inspired capsule mark + wide-tracked geometric wordmark.
 * Replicates the exact `[ (H) ] H O R M N` pill emblem from the reference images.
 */
export function HormnLogoMark({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const pillClasses =
    size === "sm"
      ? "w-8 h-5"
      : size === "lg"
      ? "w-11 h-7"
      : "w-9 h-6";
  const textClasses =
    size === "sm"
      ? "text-sm tracking-[0.22em]"
      : size === "lg"
      ? "text-xl tracking-[0.26em]"
      : "text-base tracking-[0.24em]";

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className={`${pillClasses} rounded-full bg-[#111827] inline-flex items-center justify-center shadow-sm shrink-0`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 36 24"
          className="w-4/5 h-4/5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left & Right capsule arcs + H-bridge cutout matching HORMN mark */}
          <path
            d="M11 4C7.134 4 4 7.134 4 11V13C4 16.866 7.134 20 11 20H12.5V14.2C12.5 13.1 13.4 12.2 14.5 12.2H21.5C22.6 12.2 23.5 13.1 23.5 14.2V20H25C28.866 20 32 16.866 32 13V11C32 7.134 28.866 4 25 4H23.5V9.8C23.5 10.9 22.6 11.8 21.5 11.8H14.5C13.4 11.8 12.5 10.9 12.5 9.8V4H11Z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
      <span
        className={`font-display font-bold uppercase text-[#111827] leading-none ${textClasses}`}
      >
        LADIP
      </span>
    </span>
  );
}

/**
 * Card 1 Illustration: Dual frosted clinical glass vials with cerulean serum ("Low Testosterone" / "Effective prescription treatments" reference)
 */
export function BlueVialsIllustration({ className = "w-44 h-36" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vialGlass1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="50%" stopColor="#DCEBFA" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#A9C9EC" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="vialLiquidBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9BC2EE" />
          <stop offset="100%" stopColor="#5D92D1" />
        </linearGradient>
        <linearGradient id="vialCapBlue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6D9FD8" />
          <stop offset="50%" stopColor="#A7C9F2" />
          <stop offset="100%" stopColor="#4A7BB7" />
        </linearGradient>
      </defs>

      {/* Secondary Rear Vial (Right, slightly smaller & tilted) */}
      <g transform="translate(118, 32) rotate(7)">
        <rect x="12" y="0" width="44" height="14" rx="4" fill="url(#vialCapBlue)" />
        <rect x="18" y="14" width="32" height="8" fill="#C5DCF5" />
        <rect
          x="6"
          y="22"
          width="56"
          height="102"
          rx="12"
          fill="url(#vialGlass1)"
          stroke="#98BEE8"
          strokeWidth="1.5"
        />
        <rect x="9" y="48" width="50" height="72" rx="9" fill="url(#vialLiquidBlue)" />
        <rect x="9" y="64" width="50" height="28" fill="#DCEBFA" fillOpacity="0.88" />
        <circle cx="34" cy="56" r="6" fill="#FFFFFF" fillOpacity="0.85" />
        <text
          x="34"
          y="82"
          textAnchor="middle"
          fill="#2B5486"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="1.6"
          fontFamily="Outfit, sans-serif"
        >
          LADIP
        </text>
      </g>

      {/* Primary Foreground Vial (Left, larger & tilted -10deg) */}
      <g transform="translate(18, 22) rotate(-10)">
        <rect x="14" y="0" width="56" height="18" rx="5" fill="url(#vialCapBlue)" />
        <rect x="22" y="18" width="40" height="10" fill="#BFD9F5" />
        <rect
          x="6"
          y="28"
          width="72"
          height="128"
          rx="15"
          fill="url(#vialGlass1)"
          stroke="#8BB5E5"
          strokeWidth="1.5"
        />
        <rect x="10" y="60" width="64" height="90" rx="11" fill="url(#vialLiquidBlue)" />
        {/* Frosted Label Band */}
        <rect x="10" y="82" width="64" height="36" fill="#E8F2FC" fillOpacity="0.92" />
        {/* Emblem */}
        <rect x="34" y="68" width="16" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.9" />
        <text
          x="42"
          y="104"
          textAnchor="middle"
          fill="#244B7A"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="Outfit, sans-serif"
        >
          LADIP
        </text>
        {/* Specular highlight */}
        <rect x="15" y="34" width="6" height="112" rx="3" fill="#FFFFFF" fillOpacity="0.45" />
      </g>
    </svg>
  );
}

/**
 * Card 2 Illustration: Dual warm-sand clinical autoinjector pens ("Weight Loss" reference card)
 */
export function SandInjectorsIllustration({ className = "w-44 h-36" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="penCapBronze" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5C4938" />
          <stop offset="50%" stopColor="#9E8772" />
          <stop offset="100%" stopColor="#4A3A2C" />
        </linearGradient>
        <linearGradient id="penBodyCream" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EFECE6" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DCD5C9" />
        </linearGradient>
      </defs>

      {/* Left Autoinjector Pen (angled -32deg) */}
      <g transform="translate(26, 36) rotate(-30)">
        <path
          d="M10 18C10 8 15 0 22 0C29 0 34 8 34 18V62H10V18Z"
          fill="url(#penCapBronze)"
        />
        <rect x="18" y="20" width="8" height="26" rx="4" fill="#2A2018" />
        <rect x="9" y="62" width="26" height="92" rx="5" fill="url(#penBodyCream)" stroke="#C8BFAEE0" />
        <rect x="9" y="132" width="26" height="16" fill="url(#penCapBronze)" />
        <text
          x="22"
          y="108"
          textAnchor="middle"
          fill="#2D241E"
          fontSize="7.5"
          fontWeight="700"
          letterSpacing="1.5"
          transform="rotate(90 22 108)"
          fontFamily="Outfit, sans-serif"
        >
          LADIP
        </text>
      </g>

      {/* Right Autoinjector Pen (angled -12deg) */}
      <g transform="translate(124, 14) rotate(-12)">
        <path
          d="M10 18C10 8 15 0 22 0C29 0 34 8 34 18V60H10V18Z"
          fill="url(#penCapBronze)"
        />
        <rect x="18" y="18" width="8" height="24" rx="4" fill="#2A2018" />
        <rect x="9" y="60" width="26" height="92" rx="5" fill="url(#penBodyCream)" stroke="#C8BFAE" />
        <rect x="9" y="128" width="26" height="18" fill="url(#penCapBronze)" />
        <text
          x="22"
          y="102"
          textAnchor="middle"
          fill="#2D241E"
          fontSize="7.5"
          fontWeight="700"
          letterSpacing="1.5"
          transform="rotate(90 22 102)"
          fontFamily="Outfit, sans-serif"
        >
          LADIP
        </text>
      </g>
    </svg>
  );
}

/**
 * Card 3 Illustration: Three embossed 3D lavender clinical tablets ("Erectile Dysfunction" reference card)
 */
export function LavenderTabletsIllustration({ className = "w-44 h-36" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="tabletGrad1" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#D6CEF2" />
          <stop offset="55%" stopColor="#9F93CA" />
          <stop offset="100%" stopColor="#6D609B" />
        </radialGradient>
        <radialGradient id="tabletGrad2" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#C8BEEA" />
          <stop offset="60%" stopColor="#8E81BA" />
          <stop offset="100%" stopColor="#5C5087" />
        </radialGradient>
      </defs>

      {/* Top Right Tablet */}
      <g transform="translate(128, 8)">
        <circle cx="38" cy="38" r="34" fill="url(#tabletGrad2)" />
        <path
          d="M28 26V50M48 26V50M28 38H48"
          stroke="#53467C"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* Center Prominent Tablet */}
      <g transform="translate(76, 48)">
        <circle cx="42" cy="42" r="38" fill="url(#tabletGrad1)" />
        <circle cx="42" cy="42" r="36.5" stroke="#E5DFF8" strokeOpacity="0.5" strokeWidth="1.5" />
        {/* Debossed H-capsule stamp */}
        <path
          d="M31 28V56M53 28V56M31 42H53"
          stroke="#5A4E84"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* Bottom Right Angled Tablet */}
      <g transform="translate(122, 108) rotate(-14)">
        <ellipse cx="42" cy="26" rx="38" ry="22" fill="#5D5188" />
        <ellipse cx="42" cy="20" rx="38" ry="22" fill="url(#tabletGrad1)" />
        <path
          d="M30 14L36 26M48 14L54 26M33 20H51"
          stroke="#5A4E84"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>

      {/* Bottom Center Partial Tablet */}
      <g transform="translate(64, 126)">
        <circle cx="34" cy="34" r="30" fill="url(#tabletGrad2)" />
        <path
          d="M25 24V44M43 24V44M25 34H43"
          stroke="#4F4377"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Card 4 Illustration: Clinical mint container & green-capped glass vial ("Men's Fertility" reference card)
 */
export function MintBottleIllustration({ className = "w-44 h-36" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mintCanister" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4EDE0" />
          <stop offset="55%" stopColor="#AEDBC4" />
          <stop offset="100%" stopColor="#84C3A3" />
        </linearGradient>
        <linearGradient id="mintCap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#58B383" />
          <stop offset="50%" stopColor="#8ED9B1" />
          <stop offset="100%" stopColor="#3B8F63" />
        </linearGradient>
      </defs>

      {/* Large Mint Canister (Right/Back, tilted -8deg) */}
      <g transform="translate(86, 8) rotate(-8)">
        <rect x="6" y="0" width="96" height="36" rx="12" fill="url(#mintCanister)" />
        <rect x="6" y="34" width="96" height="128" rx="16" fill="url(#mintCanister)" />
        <line x1="6" y1="36" x2="102" y2="36" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" />
        <rect x="44" y="68" width="20" height="12" rx="6" fill="#FFFFFF" fillOpacity="0.7" />
        <text
          x="54"
          y="102"
          textAnchor="middle"
          fill="#FFFFFF"
          fillOpacity="0.85"
          fontSize="13"
          fontWeight="700"
          letterSpacing="3"
          fontFamily="Outfit, sans-serif"
        >
          LADIP
        </text>
      </g>

      {/* Foreground Glass Vial with Mint Cap (Left/Front, tilted -12deg) */}
      <g transform="translate(36, 56) rotate(-12)">
        <rect x="12" y="0" width="44" height="15" rx="4" fill="url(#mintCap)" />
        <rect x="18" y="15" width="32" height="7" fill="#D5ECE0" />
        <rect
          x="6"
          y="22"
          width="56"
          height="96"
          rx="12"
          fill="#FFFFFF"
          fillOpacity="0.95"
          stroke="#B9DEC9"
          strokeWidth="1.5"
        />
        <rect x="24" y="54" width="20" height="12" rx="6" fill="#111827" />
        <text
          x="34"
          y="82"
          textAnchor="middle"
          fill="#111827"
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="1.8"
          fontFamily="Outfit, sans-serif"
        >
          LADIP
        </text>
      </g>
    </svg>
  );
}

/**
 * Reference Image 2 Bento Top-Right: 3D Isometric Clinical Blue Kit Box ("Pharmacy delivery Australia wide")
 */
export function HormnBlueKitBoxIllustration({ className = "w-44 h-36" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 170"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="boxFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#89B4E4" />
          <stop offset="100%" stopColor="#5B8CC4" />
        </linearGradient>
        <linearGradient id="boxBottom" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2F5482" />
          <stop offset="100%" stopColor="#436FA4" />
        </linearGradient>
      </defs>
      {/* Drop Shadow */}
      <ellipse cx="115" cy="148" rx="68" ry="10" fill="#111827" fillOpacity="0.08" />
      {/* 3D Isometric Box */}
      <g transform="translate(24, 14) rotate(-9)">
        {/* Front Top Face */}
        <polygon points="10,18 142,6 152,96 20,108" fill="url(#boxFront)" />
        {/* Bottom Depth Face */}
        <polygon points="20,108 152,96 142,122 12,134" fill="url(#boxBottom)" />
        {/* Right Depth Face */}
        <polygon points="142,6 156,22 142,122 152,96" fill="#3B6496" />
        {/* Center Capsule Logo & LADIP text */}
        <rect x="68" y="38" width="24" height="14" rx="7" fill="#DCEBFA" fillOpacity="0.9" />
        <path d="M76 42V48M84 42V48M76 45H84" stroke="#4A7BB7" strokeWidth="2.2" strokeLinecap="round" />
        <text
          x="82"
          y="70"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="11"
          fontWeight="700"
          letterSpacing="3"
          fontFamily="Outfit, sans-serif"
        >
          LADIP
        </text>
      </g>
    </svg>
  );
}

/**
 * Reference Image 2 Bento Bottom-Left: 3 Circular Specialist/Doctor Avatars with Green Active Badge
 */
export const ClinicianCohortAvatars = memo(function ClinicianCohortAvatars() {
  return (
    <div className="flex items-center gap-3 select-none" aria-hidden="true">
      {/* Left Specialist Avatar */}
      <div className="w-12 h-12 rounded-full bg-[#DCEBFA] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <circle cx="24" cy="24" r="24" fill="#DCEBFA" />
          <circle cx="24" cy="18" r="7.5" fill="#4A7BB7" />
          <path d="M10 44C10 35 16 30 24 30C32 30 38 35 38 44" fill="#2B5486" />
        </svg>
      </div>
      {/* Center Lead Clinical Pharmacologist Avatar (Larger + Perpetual Breathing Green Verified Dot) */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-[#BFD9F5] border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <circle cx="32" cy="32" r="32" fill="#BFD9F5" />
            <circle cx="32" cy="23" r="10" fill="#3B6EA8" />
            <path d="M12 58C12 45 20 39 32 39C44 39 52 45 52 58" fill="#FFFFFF" />
            <path d="M26 39L32 52L38 39" fill="#4A7BB7" />
          </svg>
        </div>
        <motion.span
          animate={{ scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#00B67A] border-2 border-white"
        />
      </div>
      {/* Right Specialist Avatar */}
      <div className="w-12 h-12 rounded-full bg-[#DCEBFA] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <circle cx="24" cy="24" r="24" fill="#DCEBFA" />
          <circle cx="24" cy="18" r="7.5" fill="#5B8CC4" />
          <path d="M10 44C10 35 16 30 24 30C32 30 38 35 38 44" fill="#3B6EA8" />
        </svg>
      </div>
    </div>
  );
});

/**
 * Reference Image 2 Bento Bottom-Right: Clinical Handheld Telemetry Illustration ("100% telehealth based")
 */
export const TelehealthDeviceIllustration = memo(function TelehealthDeviceIllustration({
  className = "w-48 h-36",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 220 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Angled sleek clinical handheld device centered cleanly inside viewBox */}
      <g transform="translate(52, 24) rotate(-20)">
        <rect
          x="0"
          y="0"
          width="78"
          height="128"
          rx="14"
          fill="#111827"
          stroke="#4A7BB7"
          strokeWidth="2"
        />
        <rect x="4" y="5" width="70" height="118" rx="11" fill="#F8FAFC" />
        {/* Mini UI inside screen */}
        <rect x="11" y="14" width="32" height="7" rx="3.5" fill="#4A7BB7" />
        <rect x="11" y="27" width="56" height="22" rx="5" fill="#EAF2FA" />
        <rect x="11" y="54" width="56" height="22" rx="5" fill="#EAF5F0" />
        <rect x="11" y="81" width="56" height="22" rx="5" fill="#F0EDF8" />
        <circle cx="58" cy="17.5" r="3.5" fill="#00B67A" />
      </g>
      {/* Stylised touch indicator ring matching Reference Image 2 interaction */}
      <motion.circle
        cx="118"
        cy="68"
        r="10"
        stroke="#4A7BB7"
        strokeWidth="2"
        fill="#4A7BB7"
        fillOpacity="0.15"
        animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
});

export interface PatientPersonaMeta {
  id: string;
  shortName: string;
  roleTag: string;
  regimenShort: string;
  riskLabel: string;
  riskColor: string;
  ringColor: string;
  bgSoft: string;
  accentHex: string;
}

export const PATIENT_PERSONA_META: Record<string, PatientPersonaMeta> = {
  PT_BLEED_001: {
    id: "PT_BLEED_001",
    shortName: "Ramesh Sharma",
    roleTag: "68M • AFib & Osteoarthritis",
    regimenShort: "Warfarin + Aspirin + Ibuprofen",
    riskLabel: "Critical Bleed Synergy",
    riskColor: "bg-red-50 text-[#DC2626] border-red-200",
    ringColor: "ring-[#3B6EA8]",
    bgSoft: "bg-[#EAF2FA]",
    accentHex: "#3B6EA8",
  },
  PT_STATIN_002: {
    id: "PT_STATIN_002",
    shortName: "Sunita Patel",
    roleTag: "62F • Dyslipidemia & Arrhythmia",
    regimenShort: "Simvastatin + Amlodipine + Amiodarone",
    riskLabel: "CYP3A4 Myopathy Risk",
    riskColor: "bg-amber-50 text-[#B45309] border-amber-200",
    ringColor: "ring-[#8C6239]",
    bgSoft: "bg-[#F5F2EB]",
    accentHex: "#8C6239",
  },
  PT_MTX_003: {
    id: "PT_MTX_003",
    shortName: "Kavitha Reddy",
    roleTag: "54F • Rheumatoid Arthritis",
    regimenShort: "Methotrexate + Bactrim + Naproxen",
    riskLabel: "Renal Clearance Block",
    riskColor: "bg-purple-50 text-[#5E4FA2] border-purple-200",
    ringColor: "ring-[#5E4FA2]",
    bgSoft: "bg-[#F0EDF8]",
    accentHex: "#5E4FA2",
  },
  PT_CARDIO_005: {
    id: "PT_CARDIO_005",
    shortName: "Arjun Nair",
    roleTag: "59M • Post-PCI Coronary Stent",
    regimenShort: "Clopidogrel + Omeprazole + Atorvastatin",
    riskLabel: "CYP2C19 Inhibition",
    riskColor: "bg-rose-50 text-[#BE123C] border-rose-200",
    ringColor: "ring-[#BE123C]",
    bgSoft: "bg-[#FFF1F2]",
    accentHex: "#BE123C",
  },
  PT_STABLE_004: {
    id: "PT_STABLE_004",
    shortName: "Rajesh Varma",
    roleTag: "71M • 2-Yr Stable Hypertension",
    regimenShort: "Lisinopril + Metformin + Atorvastatin",
    riskLabel: "100% Noise Suppressed",
    riskColor: "bg-emerald-50 text-[#1B7A3D] border-emerald-200",
    ringColor: "ring-[#1B7A3D]",
    bgSoft: "bg-[#EAF5F0]",
    accentHex: "#1B7A3D",
  },
};

export function getPatientPersona(patientId: string, fallbackName?: string): PatientPersonaMeta {
  if (PATIENT_PERSONA_META[patientId]) {
    return PATIENT_PERSONA_META[patientId];
  }
  const cleanName = (fallbackName || patientId).split("(")[0].trim();
  return {
    id: patientId,
    shortName: cleanName,
    roleTag: "Custom Parsed EHR Cohort",
    regimenShort: "OCR Reconstructed Regimen",
    riskLabel: "Live Timeline Active",
    riskColor: "bg-blue-50 text-[#3B6EA8] border-blue-200",
    ringColor: "ring-[#3B6EA8]",
    bgSoft: "bg-[#EAF2FA]",
    accentHex: "#3B6EA8",
  };
}

/**
 * Bespoke Illustrated SVG Avatar for each Indian patient cohort profile
 */
export const PatientCohortAvatar = memo(function PatientCohortAvatar({
  patientId,
  size = "md",
  showStatusBadge = true,
}: {
  patientId: string;
  size?: "xs" | "sm" | "md" | "lg";
  showStatusBadge?: boolean;
}) {
  const sizeClasses =
    size === "xs"
      ? "w-6 h-6"
      : size === "sm"
      ? "w-8 h-8"
      : size === "lg"
      ? "w-14 h-14"
      : "w-10 h-10";

  const badgeDotSize =
    size === "xs"
      ? "w-2 h-2"
      : size === "sm"
      ? "w-2.5 h-2.5"
      : size === "lg"
      ? "w-4 h-4"
      : "w-3 h-3";

  const badgeColor =
    patientId === "PT_STABLE_004"
      ? "bg-[#00B67A]"
      : patientId === "PT_STATIN_002"
      ? "bg-amber-500"
      : patientId === "PT_MTX_003"
      ? "bg-[#5E4FA2]"
      : "bg-[#DC2626]";

  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClasses}`}>
      {patientId === "PT_BLEED_001" ? (
        /* Ramesh Sharma: 68M Senior Gentleman with Silver Hair, Glasses & Navy Collar */
        <svg viewBox="0 0 64 64" className="w-full h-full rounded-full shadow-xs" fill="none">
          <circle cx="32" cy="32" r="32" fill="#DCEBFA" />
          <path d="M12 58C12 45 20 39 32 39C44 39 52 45 52 58" fill="#1E3A8A" />
          <path d="M26 39L32 49L38 39" fill="#FFFFFF" />
          <circle cx="32" cy="24" r="11.5" fill="#D9A17C" />
          {/* Silver hair */}
          <path d="M20 22C20 14 25 11 32 11C39 11 44 14 44 22C42 17 38 15 32 15C26 15 22 17 20 22Z" fill="#E2E8F0" />
          {/* Glasses */}
          <rect x="23.5" y="21.5" width="7" height="5" rx="1.5" stroke="#1E293B" strokeWidth="1.5" fill="#FFFFFF" fillOpacity="0.35" />
          <rect x="33.5" y="21.5" width="7" height="5" rx="1.5" stroke="#1E293B" strokeWidth="1.5" fill="#FFFFFF" fillOpacity="0.35" />
          <line x1="30.5" y1="24" x2="33.5" y2="24" stroke="#1E293B" strokeWidth="1.5" />
          {/* Gentle mustache & smile */}
          <path d="M28 30.5C30 29.5 34 29.5 36 30.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : patientId === "PT_STATIN_002" ? (
        /* Sunita Patel: 62F Indian Woman with Dark Bun, Bindi & Warm Amber Saree Drape */
        <svg viewBox="0 0 64 64" className="w-full h-full rounded-full shadow-xs" fill="none">
          <circle cx="32" cy="32" r="32" fill="#F5EBE1" />
          <circle cx="32" cy="12" r="6" fill="#1E293B" />
          <path d="M12 58C12 45 20 39 32 39C44 39 52 45 52 58" fill="#9A6B3B" />
          <path d="M18 43L38 58H14L18 43Z" fill="#D97706" fillOpacity="0.45" />
          <circle cx="32" cy="25" r="11" fill="#DCA682" />
          {/* Hair parted */}
          <path d="M21 24C21 15 26 12 32 12C38 12 43 15 43 24C40 18 36 16.5 32 16.5C28 16.5 24 18 21 24Z" fill="#1E293B" />
          {/* Bindi */}
          <circle cx="32" cy="20.5" r="1.4" fill="#DC2626" />
          {/* Eyes & warm smile */}
          <circle cx="28" cy="24.5" r="1.2" fill="#1E293B" />
          <circle cx="36" cy="24.5" r="1.2" fill="#1E293B" />
          <path d="M29 29.5C30.5 31 33.5 31 35 29.5" stroke="#7C2D12" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ) : patientId === "PT_MTX_003" ? (
        /* Kavitha Reddy: 54F Woman with Wavy Hair, Round Glasses & Lavender Attire */
        <svg viewBox="0 0 64 64" className="w-full h-full rounded-full shadow-xs" fill="none">
          <circle cx="32" cy="32" r="32" fill="#EDE9FE" />
          <path d="M18 25C16 32 17 40 22 43H42C47 40 48 32 46 25" fill="#1E1B4B" />
          <path d="M12 58C12 45 20 39 32 39C44 39 52 45 52 58" fill="#5E4FA2" />
          <circle cx="32" cy="25" r="11" fill="#C98E6B" />
          <path d="M21 24C21 15 25.5 12 32 12C38.5 12 43 15 43 24C39 18.5 35 17 32 17C29 17 25 18.5 21 24Z" fill="#1E1B4B" />
          <circle cx="32" cy="20.5" r="1.2" fill="#5E4FA2" />
          <circle cx="27.5" cy="24.5" r="3.2" stroke="#312E81" strokeWidth="1.3" fill="#FFFFFF" fillOpacity="0.25" />
          <circle cx="36.5" cy="24.5" r="3.2" stroke="#312E81" strokeWidth="1.3" fill="#FFFFFF" fillOpacity="0.25" />
          <line x1="30.7" y1="24.5" x2="33.3" y2="24.5" stroke="#312E81" strokeWidth="1.3" />
          <path d="M29.5 30C31 31.2 33 31.2 34.5 30" stroke="#4C1D95" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ) : patientId === "PT_CARDIO_005" ? (
        /* Arjun Nair: 59M Man with Neat Beard & Charcoal Collar */
        <svg viewBox="0 0 64 64" className="w-full h-full rounded-full shadow-xs" fill="none">
          <circle cx="32" cy="32" r="32" fill="#FFE4E6" />
          <path d="M12 58C12 45 20 39 32 39C44 39 52 45 52 58" fill="#1F2937" />
          <path d="M27 39L32 50L37 39" fill="#BE123C" />
          <circle cx="32" cy="24" r="11.5" fill="#C48764" />
          {/* Dark hair */}
          <path d="M20.5 22C20.5 14 25.5 11 32 11C38.5 11 43.5 14 43.5 22C41 17 37 15.5 32 15.5C27 15.5 23 17 20.5 22Z" fill="#111827" />
          {/* Eyes */}
          <circle cx="28" cy="23.5" r="1.3" fill="#111827" />
          <circle cx="36" cy="23.5" r="1.3" fill="#111827" />
          {/* Neat beard */}
          <path d="M22.5 27.5C23.5 33.5 27.5 36 32 36C36.5 36 40.5 33.5 41.5 27.5C39 30 35.5 31 32 31C28.5 31 25 30 22.5 27.5Z" fill="#1F2937" fillOpacity="0.88" />
        </svg>
      ) : (
        /* Rajesh Varma (PT_STABLE_004) or Default: 71M Smiling Senior in Forest Green */
        <svg viewBox="0 0 64 64" className="w-full h-full rounded-full shadow-xs" fill="none">
          <circle cx="32" cy="32" r="32" fill="#D1FAE5" />
          <path d="M12 58C12 45 20 39 32 39C44 39 52 45 52 58" fill="#1B7A3D" />
          <circle cx="32" cy="24" r="11.5" fill="#D59B76" />
          <path d="M20.5 21.5C21 14 26 11.5 32 11.5C38 11.5 43 14 43.5 21.5C41 17 36.5 15.5 32 15.5C27.5 15.5 23 17 20.5 21.5Z" fill="#F1F5F9" />
          <circle cx="28" cy="23.5" r="1.3" fill="#0F172A" />
          <circle cx="36" cy="23.5" r="1.3" fill="#0F172A" />
          <path d="M28.5 29C30.2 31.2 33.8 31.2 35.5 29" stroke="#064E3B" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
      {showStatusBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white ${badgeDotSize} ${badgeColor}`}
        />
      )}
    </span>
  );
});

