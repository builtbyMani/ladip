"use client";

import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import { Medication, Symptom } from "@/lib/types";

const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
};

const TIER_COLORS: Record<string, string> = {
  CRITICAL: "#DC2626",
  HIGH: "#B48A00",
  MODERATE: "#4A7BB7",
  LOW: "#1B7A3D",
};

// ============================================================================
// 1. BKLIT.UI LONGITUDINAL TIMELINE CHART
// ============================================================================
export const BklitTimelineChart = memo(function BklitTimelineChart({
  medications,
  symptoms,
  patientName,
}: {
  medications: Medication[];
  symptoms: Symptom[];
  patientName: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const today = new Date("2026-09-26T00:00:00Z");
  const parseDate = (dStr: string | null, fallbackDaysAgo: number) => {
    if (!dStr) {
      return new Date(today.getTime() - fallbackDaysAgo * 86400000);
    }
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime())
      ? new Date(today.getTime() - fallbackDaysAgo * 86400000)
      : parsed;
  };

  const rows = [
    ...medications.map((m) => ({
      track: "Medication Regimen" as const,
      label: m.drug_name,
      start: parseDate(m.start_date, 180),
      end: m.end_date ? parseDate(m.end_date, 0) : today,
      startStr: m.start_date || "Chronic",
      endStr: m.end_date || "Active",
      detail: `${m.dose} ${m.dose_unit} • ${m.frequency} (${m.route})`,
      color: "#4A7BB7",
      bgTint: "#EAF2FA",
    })),
    ...symptoms.map((s) => ({
      track: "Adverse Event Onset" as const,
      label: s.description,
      start: parseDate(s.onset_date, 5),
      end: s.resolution_date ? parseDate(s.resolution_date, 0) : today,
      startStr: s.onset_date || "Acute",
      endStr: s.resolution_date || "Ongoing",
      detail: `Severity ${s.severity}/10 • MedDRA: ${s.meddra_term}`,
      color: "#DC2626",
      bgTint: "#FEF2F2",
    })),
  ];

  const minTime = Math.min(
    ...rows.map((r) => r.start.getTime()),
    today.getTime() - 90 * 86400000
  );
  const maxTime = Math.max(
    today.getTime(),
    ...rows.map((r) => Math.max(r.start.getTime(), r.end.getTime()))
  );
  const span = Math.max(maxTime - minTime, 86400000 * 7);
  const isPolypharmacy = rows.length > 8;

  return (
    <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 sm:p-7 shadow-diffusion relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">
            LONGITUDINAL CHRONOLOGY
          </div>
          <h3 className="font-display text-lg font-semibold text-[#111827] tracking-tight">
            Longitudinal Regimen &amp; Adverse Event Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exposure windows vs. symptom onset for {patientName.split("(")[0].trim()} ({medications.length} drugs, {symptoms.length} events)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4A7BB7]" />
            Medication
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            Adverse Event
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-[#F8FAFC] rounded-2xl border border-slate-200/60">
          No active medications or adverse symptom events recorded on this timeline.
        </div>
      ) : (
        <div
          className={`${
            isPolypharmacy
              ? "space-y-2.5 max-h-[380px] overflow-y-auto pr-1.5"
              : "space-y-3.5"
          }`}
        >
          {rows.map((row, idx) => {
            const safeEnd = Math.max(row.start.getTime(), row.end.getTime());
            const leftPct = Math.max(
              0,
              Math.min(92, ((row.start.getTime() - minTime) / span) * 100)
            );
            const widthPct = Math.max(
              7,
              Math.min(
                100 - leftPct,
                ((safeEnd - row.start.getTime()) / span) * 100
              )
            );
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={`${row.label}-${idx}`}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(isHovered ? null : idx)}
              >
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-semibold text-[#111827] truncate">
                      {row.label}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
                      ({row.detail})
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    {row.startStr} &rarr; {row.endStr}
                  </span>
                </div>

                <div
                  className={`w-full ${
                    isPolypharmacy ? "h-5" : "h-6"
                  } rounded-full bg-[#F8FAFC] border border-slate-200/60 relative overflow-hidden p-0.5`}
                >
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{
                      ...SPRING_TRANSITION,
                      delay: Math.min(idx * 0.04, 0.4),
                    }}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: row.color,
                      transformOrigin: "left center",
                    }}
                    className="h-full rounded-full relative flex items-center px-2.5"
                  >
                    <span className="text-[10px] font-mono font-medium text-white truncate">
                      {row.track === "Adverse Event Onset"
                        ? "ADR ONSET"
                        : row.startStr}
                    </span>
                  </motion.div>
                </div>

                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 px-3 py-2 rounded-xl bg-[#111827] text-white text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <span>
                      <strong className="text-[#89B4E4]">{row.track}:</strong>{" "}
                      {row.label} — {row.detail}
                    </span>
                    <span className="font-mono text-[11px] text-slate-300">
                      Window: {row.startStr} to {row.endStr}
                    </span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// 2. BKLIT.UI RADIAL TELEMETRY RING GAUGE CHART
// ============================================================================
export const BklitRingGaugeChart = memo(function BklitRingGaugeChart({
  peakPriority,
  temporalDtas,
  suppressionPct,
  suppressedCount,
  totalCount,
}: {
  peakPriority: number;
  temporalDtas: number;
  suppressionPct: number;
  suppressedCount: number;
  totalCount: number;
}) {
  const [activeRing, setActiveRing] = useState<number>(0);

  const rings = [
    {
      label: "Peak Alert Priority",
      display: `${peakPriority.toFixed(1)}`,
      percent: Math.min(100, Math.max(4, peakPriority)),
      color: peakPriority >= 80 ? "#DC2626" : peakPriority >= 50 ? "#B48A00" : "#1B7A3D",
      subtitle: "Composite severity score",
      radius: 74,
    },
    {
      label: "Temporal DTAS",
      display: `${Math.round(temporalDtas * 100)}%`,
      percent: Math.min(100, Math.max(4, temporalDtas * 100)),
      color: "#4A7BB7",
      subtitle: "Onset plausibility index",
      radius: 56,
    },
    {
      label: "Fatigue Suppression",
      display: `${Math.round(suppressionPct)}%`,
      percent: Math.min(100, Math.max(4, suppressionPct)),
      color: "#1B7A3D",
      subtitle: `${suppressedCount}/${totalCount} signals muted`,
      radius: 38,
    },
  ];

  const selected = rings[activeRing] || rings[0];

  return (
    <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 sm:p-7 shadow-diffusion flex flex-col justify-between">
      <div className="pb-4 mb-4 border-b border-slate-100">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">
          CLINICAL TELEMETRY
        </div>
        <h3 className="font-display text-lg font-semibold text-[#111827] tracking-tight">
          Signal &amp; Fatigue Telemetry
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Click or hover any concentric ring to inspect normalized telemetry
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
            {rings.map((r, i) => {
              const circumference = 2 * Math.PI * r.radius;
              const offset = circumference - (r.percent / 100) * circumference;
              return (
                <g
                  key={r.label}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveRing(i)}
                  onTouchStart={() => setActiveRing(i)}
                  onClick={() => setActiveRing(i)}
                >
                  <circle
                    cx="90"
                    cy="90"
                    r={r.radius}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="11"
                  />
                  <motion.circle
                    cx="90"
                    cy="90"
                    r={r.radius}
                    fill="none"
                    stroke={r.color}
                    strokeWidth={activeRing === i ? "12.5" : "10.5"}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ ...SPRING_TRANSITION, delay: i * 0.08 }}
                  />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span
              className="font-display text-xl font-bold tracking-tight"
              style={{ color: selected.color }}
            >
              {selected.display}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 max-w-[76px] leading-tight">
              {selected.label.split(" ").slice(-1)[0]}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {rings.map((r, i) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setActiveRing(i)}
              onMouseEnter={() => setActiveRing(i)}
              className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                activeRing === i
                  ? "bg-[#F8FAFC] border-slate-300 shadow-sm"
                  : "bg-white border-slate-100 hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: r.color }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#111827] truncate">
                    {r.label}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {r.subtitle}
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-[#111827] shrink-0">
                {r.display}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// 3. BKLIT.UI HORIZONTAL BAR CHART (PRR COMPARISON)
// ============================================================================
export const BklitHorizontalBarChart = memo(function BklitHorizontalBarChart({
  items,
  title,
  subtitle,
  threshold = 2.0,
}: {
  items: {
    label: string;
    value: number;
    chi2: number;
    cases: number;
    tier: string;
  }[];
  title: string;
  subtitle: string;
  threshold?: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...items.map((i) => i.value), threshold * 2, 5);
  const thresholdPct = Math.min(95, (threshold / maxVal) * 100);

  return (
    <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 shadow-diffusion relative">
      <div className="pb-4 mb-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">
            DISPROPORTIONALITY METRICS
          </div>
          <h3 className="font-display text-lg font-semibold text-[#111827] tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-slate-200 text-slate-600">
          Evans&apos; Threshold PRR &ge; {threshold.toFixed(1)}x
        </span>
      </div>

      <div className="space-y-3.5 relative">
        {items.map((item, idx) => {
          const widthPct = Math.max(6, Math.min(100, (item.value / maxVal) * 100));
          const barColor = TIER_COLORS[item.tier] || "#4A7BB7";
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={`${item.label}-${idx}`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onTouchStart={() => setHoveredIdx(idx)}
              onClick={() => setHoveredIdx(isHovered ? null : idx)}
            >
              <div className="flex items-center justify-between text-xs mb-1 gap-2">
                <span className="font-semibold text-[#111827] truncate">
                  {item.label}
                </span>
                <span className="font-mono font-semibold text-[#111827] shrink-0">
                  {item.value.toFixed(2)}x PRR
                </span>
              </div>

              <div className="w-full h-5 rounded-full bg-[#F8FAFC] border border-slate-200/60 relative overflow-hidden">
                {/* Threshold dashed marker */}
                <div
                  style={{ left: `${thresholdPct}%` }}
                  className="absolute top-0 bottom-0 w-px border-l border-dashed border-slate-400 z-10"
                  title={`PRR Threshold ${threshold}x`}
                />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ ...SPRING_TRANSITION, delay: idx * 0.05 }}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: barColor,
                    transformOrigin: "left center",
                  }}
                  className="h-full rounded-full"
                />
              </div>

              {isHovered && (
                <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-[#111827] text-white text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
                  <span>Tier: {item.tier}</span>
                  <span>PRR: {item.value.toFixed(2)}x</span>
                  <span>Chi-Sq: {item.chi2.toFixed(1)}</span>
                  <span>Cases: {item.cases.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ============================================================================
// 4. BKLIT.UI VOLCANO SCATTER MATRIX (PRR vs CHI-SQUARED)
// ============================================================================
export const BklitVolcanoChart = memo(function BklitVolcanoChart({
  points,
  title,
  subtitle,
}: {
  points: {
    label: string;
    prr: number;
    chi2: number;
    cases: number;
    tier: string;
  }[];
  title: string;
  subtitle: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);

  const maxPrr = Math.max(...points.map((p) => p.prr), 10);
  const maxChi2 = Math.max(...points.map((p) => p.chi2), 100);
  const maxCases = Math.max(...points.map((p) => p.cases), 100);

  const threshX = 52 + Math.min(1, 2.0 / (maxPrr * 1.1)) * 310;
  const threshY = 135 - Math.min(1, 4.0 / (maxChi2 * 1.1)) * 110;

  const activePt =
    selectedIdx !== null && points[selectedIdx] ? points[selectedIdx] : points[0] || null;

  return (
    <div className="rounded-[2rem] bg-white border border-slate-200/70 p-6 shadow-diffusion flex flex-col justify-between">
      <div className="pb-4 mb-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">
            SIGNAL VOLCANO MATRIX
          </div>
          <h3 className="font-display text-lg font-semibold text-[#111827] tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-[#EAF2FA] text-[#3B6EA8] font-medium">
          Bubble Size = Co-Reports
        </span>
      </div>

      <div className="relative w-full h-52 bg-[#F8FAFC] rounded-2xl border border-slate-200/60 p-4 overflow-hidden">
        <svg viewBox="0 0 400 180" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="40" y1="20" x2="380" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="40" y1="80" x2="380" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="40" y1="145" x2="380" y2="145" stroke="#CBD5E1" />
          <line x1="40" y1="10" x2="40" y2="145" stroke="#CBD5E1" />

          {/* Evans' Criteria Threshold Reference Lines (PRR >= 2.0, Chi-Sq >= 4.0) */}
          <line
            x1={threshX}
            y1="10"
            x2={threshX}
            y2="145"
            stroke="#64748B"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1={threshY}
            x2="380"
            y2={threshY}
            stroke="#64748B"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          <text x="210" y="168" textAnchor="middle" fontSize="10" fill="#64748B">
            Proportional Reporting Ratio (PRR)
          </text>
          <text
            x="14"
            y="80"
            textAnchor="middle"
            fontSize="10"
            fill="#64748B"
            transform="rotate(-90 14 80)"
          >
            Chi-Squared (x2)
          </text>

          {points.map((pt, idx) => {
            const baseCx = 52 + Math.min(1, pt.prr / (maxPrr * 1.1)) * 310;
            const baseCy = 135 - Math.min(1, pt.chi2 / (maxChi2 * 1.1)) * 110;
            // Deterministic micro-offset if multiple points share identical PRR & Chi2
            const duplicateCount = points
              .slice(0, idx)
              .filter(
                (prev) =>
                  Math.abs(prev.prr - pt.prr) < 0.05 &&
                  Math.abs(prev.chi2 - pt.chi2) < 1.0
              ).length;
            const cx = Math.min(370, baseCx + duplicateCount * 9);
            const cy = Math.max(18, baseCy - duplicateCount * 6);
            const r = 7 + Math.min(1, pt.cases / maxCases) * 11;
            const color = TIER_COLORS[pt.tier] || "#4A7BB7";
            const isSelected = selectedIdx === idx;

            return (
              <g
                key={`${pt.label}-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setSelectedIdx(idx)}
                onTouchStart={() => setSelectedIdx(idx)}
                onClick={() => setSelectedIdx(idx)}
              >
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color}
                  fillOpacity={isSelected ? 0.92 : 0.72}
                  stroke={isSelected ? "#111827" : "#FFFFFF"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING_TRANSITION, delay: idx * 0.06 }}
                  className="bklit-anim-pt"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {activePt && (
        <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-semibold text-[#111827]">{activePt.label}</div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600">
            <span>PRR: {activePt.prr.toFixed(2)}x</span>
            <span>Chi-Sq: {activePt.chi2.toFixed(1)}</span>
            <span>Cases: {activePt.cases.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
});
