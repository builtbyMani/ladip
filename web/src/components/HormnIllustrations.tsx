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
