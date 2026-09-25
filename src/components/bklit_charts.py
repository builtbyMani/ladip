"""Bklit.UI Composable Charts & Motion.dev Animation Engine for Streamlit CCv2.

Implements composable Bklit UI chart primitives (Grid, XAxis, YAxis, ChartTooltip,
Ring/Gauge, TimelineBar, HorizontalBar, and Volcano/Scatter) powered by motion.dev
spring physics and adhering to the Bella-inspired Editorial Health-Tech palette.
"""
from __future__ import annotations

from typing import Any, Callable
import streamlit as st

_BKLIT_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:host {
  --chart-1: #1A1A1A;
  --chart-2: #D4A5E5;
  --chart-3: #DC2626;
  --chart-4: #1B7A3D;
  --chart-5: #E8C840;
  --bklit-bg: #FFFFFF;
  --bklit-surface-muted: #F5F5F0;
  --bklit-border: #E5E5E0;
  --bklit-ink: #1A1A1A;
  --bklit-muted: #6B6B6B;
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--bklit-ink);
}

*, *::before, *::after {
  box-sizing: border-box;
}

.bklit-card {
  position: relative;
  width: 100%;
  max-width: 100%;
  background: var(--bklit-bg);
  border: 1px solid var(--bklit-border);
  padding: 20px 22px 18px 22px;
  overflow: hidden;
}

.bklit-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--bklit-border);
  padding-bottom: 12px;
}

.bklit-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--bklit-muted);
  margin-bottom: 4px;
}

.bklit-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--bklit-ink);
  margin: 0;
  letter-spacing: -0.015em;
}

.bklit-subtitle {
  font-size: 0.8rem;
  color: var(--bklit-muted);
  margin: 3px 0 0 0;
}

.bklit-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--bklit-ink);
}

.bklit-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.bklit-legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  display: inline-block;
}

.bklit-svg-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}

svg.bklit-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.bklit-grid-line {
  stroke: var(--bklit-border);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.bklit-axis-label {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px;
  fill: var(--bklit-muted);
  font-weight: 500;
}

.bklit-axis-label-ink {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11.5px;
  fill: var(--bklit-ink);
  font-weight: 600;
}

.bklit-mono-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  fill: var(--bklit-ink);
  font-weight: 500;
}

.bklit-bar-interactive,
.bklit-point-interactive,
.bklit-ring-interactive {
  cursor: pointer;
  transition: opacity 0.15s ease, filter 0.15s ease;
}

.bklit-anim-bar,
.bklit-anim-hbar {
  transform-box: fill-box;
  transform-origin: left center;
}

.bklit-anim-pt,
.bklit-anim-ring {
  transform-box: fill-box;
  transform-origin: center center;
}

.bklit-bar-interactive:hover,
.bklit-point-interactive:hover,
.bklit-ring-interactive:hover {
  opacity: 0.86;
}

/* Composable Bklit ChartTooltip */
.bklit-tooltip {
  position: absolute;
  pointer-events: none;
  background: #FFFFFF;
  border: 1px solid #1A1A1A;
  padding: 10px 12px;
  min-width: 180px;
  max-width: 260px;
  z-index: 30;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.bklit-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}

.bklit-tt-eyebrow {
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--bklit-muted);
  margin-bottom: 3px;
}

.bklit-tt-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--bklit-ink);
  margin-bottom: 6px;
  word-break: break-word;
}

.bklit-tt-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 0.75rem;
  padding-top: 3px;
  border-top: 1px solid var(--bklit-surface-muted);
}

.bklit-tt-key {
  color: var(--bklit-muted);
}

.bklit-tt-val {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: var(--bklit-ink);
}

/* Ring Grid Layout */
.bklit-ring-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.bklit-ring-cell {
  background: var(--bklit-surface-muted);
  border: 1px solid var(--bklit-border);
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.bklit-ring-value {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.55rem;
  font-weight: 900;
  color: var(--bklit-ink);
  line-height: 1;
}

.bklit-ring-caption {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--bklit-muted);
  margin-top: 8px;
}

.bklit-ring-sub {
  font-size: 0.76rem;
  color: var(--bklit-muted);
  margin-top: 4px;
}

@media (max-width: 680px) {
  .bklit-card {
    padding: 14px 12px;
  }
  .bklit-ring-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .bklit-title {
    font-size: 1.04rem;
  }
}
"""

_BKLIT_JS = """
let motionModulePromise = null;

function loadMotionDev() {
  if (!motionModulePromise) {
    motionModulePromise = import("https://cdn.jsdelivr.net/npm/motion@12/+esm")
      .catch(() => null);
  }
  return motionModulePromise;
}

function springAnimate(elements, keyframes, options = {}) {
  const nodeList = Array.isArray(elements)
    ? elements
    : Array.from(elements || []);
  if (!nodeList.length) return;

  loadMotionDev().then((mod) => {
    if (mod && typeof mod.animate === "function") {
      try {
        const delayFn =
          options.stagger && typeof mod.stagger === "function"
            ? mod.stagger(options.stagger)
            : options.delay || 0;
        mod.animate(nodeList, keyframes, {
          type: "spring",
          stiffness: options.stiffness || 120,
          damping: options.damping || 18,
          delay: delayFn,
        });
        return;
      } catch (_) {
        // Fallback to WAAPI below
      }
    }
    nodeList.forEach((el, idx) => {
      if (!el || typeof el.animate !== "function") return;
      const delayMs = ((options.delay || 0) + idx * (options.stagger || 0.05)) * 1000;
      const frames = [];
      const keys = Object.keys(keyframes);
      if (keys.length > 0) {
        const firstArr = Array.isArray(keyframes[keys[0]]) ? keyframes[keys[0]] : [keyframes[keys[0]]];
        for (let i = 0; i < firstArr.length; i++) {
          const frame = {};
          keys.forEach((k) => {
            const arr = Array.isArray(keyframes[k]) ? keyframes[k] : [keyframes[k]];
            frame[k] = arr[Math.min(i, arr.length - 1)];
          });
          frames.push(frame);
        }
      }
      el.animate(frames, {
        duration: 520,
        delay: delayMs,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      });
    });
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attachTooltip(container, tooltipEl) {
  const targets = container.querySelectorAll("[data-tt-title]");
  const populateTooltip = (el) => {
    const eyebrow = el.getAttribute("data-tt-eyebrow") || "BKLIT.UI SIGNAL";
    const title = el.getAttribute("data-tt-title") || "";
    const rowsRaw = el.getAttribute("data-tt-rows") || "[]";
    let rows = [];
    try {
      rows = JSON.parse(rowsRaw);
    } catch (_) {
      rows = [];
    }
    const rowsHtml = rows
      .map(
        (r) =>
          `<div class="bklit-tt-row"><span class="bklit-tt-key">${escapeHtml(
            r.k
          )}</span><span class="bklit-tt-val">${escapeHtml(r.v)}</span></div>`
      )
      .join("");
    tooltipEl.innerHTML = `
      <div class="bklit-tt-eyebrow">${escapeHtml(eyebrow)}</div>
      <div class="bklit-tt-title">${escapeHtml(title)}</div>
      ${rowsHtml}
    `;
    tooltipEl.classList.add("visible");
  };

  const positionTooltip = (clientX, clientY) => {
    const rect = container.getBoundingClientRect();
    let left = clientX - rect.left + 14;
    let top = clientY - rect.top - 12;
    if (left + 230 > rect.width) {
      left = Math.max(8, rect.width - 230);
    }
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  };

  targets.forEach((el) => {
    el.addEventListener("mouseenter", (ev) => {
      populateTooltip(el);
      positionTooltip(ev.clientX, ev.clientY);
    });

    el.addEventListener("mousemove", (ev) => {
      positionTooltip(ev.clientX, ev.clientY);
    });

    el.addEventListener("mouseleave", () => {
      tooltipEl.classList.remove("visible");
    });

    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      populateTooltip(el);
      positionTooltip(ev.clientX || 24, ev.clientY || 24);
    });

    el.addEventListener(
      "touchstart",
      (ev) => {
        const touch = ev.touches && ev.touches[0];
        populateTooltip(el);
        if (touch) {
          positionTooltip(touch.clientX, touch.clientY);
        }
      },
      { passive: true }
    );
  });

  container.addEventListener("click", () => {
    tooltipEl.classList.remove("visible");
  });
}

function renderTimeline(root, data) {
  const rows = Array.isArray(data.rows) ? data.rows : [];
  if (!rows.length) {
    root.innerHTML = `<div class="bklit-card"><div class="bklit-subtitle">No timeline intervals recorded.</div></div>`;
    return;
  }

  const times = [];
  rows.forEach((r) => {
    const s = Date.parse(r.start);
    const e = Date.parse(r.end);
    if (!Number.isNaN(s)) times.push(s);
    if (!Number.isNaN(e)) times.push(e);
  });
  const minT = Math.min(...times);
  const maxT = Math.max(...times, minT + 86400000);
  const span = Math.max(maxT - minT, 86400000);

  const width = 860;
  const leftPad = 175;
  const rightPad = 28;
  const topPad = 18;
  const rowH = 38;
  const barH = 18;
  const plotW = width - leftPad - rightPad;
  const height = topPad + rows.length * rowH + 34;

  // Date ticks (5 ticks)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const t = minT + span * p;
    const d = new Date(t);
    const label = d.toISOString().slice(0, 10);
    const x = leftPad + p * plotW;
    return { x, label };
  });

  const gridSvg = ticks
    .map(
      (tk) => `
      <line class="bklit-grid-line" x1="${tk.x}" y1="${topPad - 4}" x2="${tk.x}" y2="${height - 26}" />
      <text class="bklit-axis-label" x="${tk.x}" y="${height - 8}" text-anchor="middle">${escapeHtml(tk.label)}</text>
    `
    )
    .join("");

  const barsSvg = rows
    .map((r, i) => {
      const s = Date.parse(r.start) || minT;
      const e = Date.parse(r.end) || maxT;
      const x1 = leftPad + Math.max(0, Math.min(1, (s - minT) / span)) * plotW;
      const x2 = leftPad + Math.max(0, Math.min(1, (e - minT) / span)) * plotW;
      const w = Math.max(10, x2 - x1);
      const y = topPad + i * rowH;
      const isAdverse = String(r.track || "").toLowerCase().includes("adverse");
      const fill = isAdverse ? "#DC2626" : "#D4A5E5";
      const stroke = isAdverse ? "#DC2626" : "#1A1A1A";
      const days = Math.max(1, Math.round((e - s) / 86400000));
      const ttRows = JSON.stringify([
        { k: "Window", v: `${r.start} → ${r.end}` },
        { k: "Duration", v: `${days} days` },
        { k: "Clinical Detail", v: r.detail || "Active" },
      ]);
      const shortItem =
        String(r.item || "").length > 22
          ? String(r.item).slice(0, 20) + "…"
          : String(r.item || "");

      return `
        <g class="bklit-row-group">
          <text class="bklit-axis-label-ink" x="${leftPad - 12}" y="${y + barH / 2 + 4}" text-anchor="end">${escapeHtml(shortItem)}</text>
          <rect
            class="bklit-bar-interactive bklit-anim-bar"
            x="${x1}"
            y="${y}"
            width="${w}"
            height="${barH}"
            rx="9"
            fill="${fill}"
            stroke="${stroke}"
            stroke-width="1"
            data-tt-eyebrow="${escapeHtml(r.track || "TIMELINE TRACK")}"
            data-tt-title="${escapeHtml(r.item || "")}"
            data-tt-rows="${escapeHtml(ttRows)}"
          />
          <text class="bklit-mono-label" x="${Math.min(x1 + w + 6, width - 65)}" y="${y + barH / 2 + 3.5}">${days}d</text>
        </g>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="bklit-card">
      <div class="bklit-header">
        <div>
          <div class="bklit-eyebrow">${escapeHtml(data.eyebrow || "BKLIT.UI CHRONOLOGY ENGINE • MOTION.DEV")}</div>
          <h4 class="bklit-title">${escapeHtml(data.title || "Medication Overlap & Adverse Event Timeline")}</h4>
          ${data.subtitle ? `<p class="bklit-subtitle">${escapeHtml(data.subtitle)}</p>` : ""}
        </div>
        <div class="bklit-legend">
          <span class="bklit-legend-item"><span class="bklit-legend-swatch" style="background:#D4A5E5;border:1px solid #1A1A1A;"></span>Medication Regimen</span>
          <span class="bklit-legend-item"><span class="bklit-legend-swatch" style="background:#DC2626;"></span>Adverse Event Onset</span>
        </div>
      </div>
      <div class="bklit-svg-wrap">
        <svg class="bklit-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <g class="bklit-grid">${gridSvg}</g>
          <g class="bklit-series">${barsSvg}</g>
        </svg>
        <div class="bklit-tooltip"></div>
      </div>
    </div>
  `;

  const wrap = root.querySelector(".bklit-svg-wrap");
  const tt = root.querySelector(".bklit-tooltip");
  if (wrap && tt) attachTooltip(wrap, tt);
  springAnimate(
    root.querySelectorAll(".bklit-anim-bar"),
    { opacity: [0, 1], transform: ["scaleX(0.25)", "scaleX(1)"] },
    { stagger: 0.06, stiffness: 130, damping: 18 }
  );
}

function renderRingGauge(root, data) {
  const metrics = Array.isArray(data.metrics) ? data.metrics : [];
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const cellsHtml = metrics
    .map((m) => {
      const pct = Math.max(0, Math.min(100, Number(m.percent || 0)));
      const offset = circumference - (pct / 100) * circumference;
      const color = m.color || "#1A1A1A";
      const ttRows = JSON.stringify([
        { k: "Metric", v: String(m.display || `${pct}%`) },
        { k: "Normalized", v: `${pct.toFixed(1)}%` },
        { k: "Status", v: String(m.subtitle || "") },
      ]);
      return `
        <div
          class="bklit-ring-cell bklit-ring-interactive"
          data-tt-eyebrow="BKLIT.UI RING METRIC"
          data-tt-title="${escapeHtml(m.label || "")}"
          data-tt-rows="${escapeHtml(ttRows)}"
        >
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="${radius}" fill="none" stroke="#E5E5E0" stroke-width="7" />
            <circle
              class="bklit-anim-ring"
              cx="48"
              cy="48"
              r="${radius}"
              fill="none"
              stroke="${escapeHtml(color)}"
              stroke-width="7"
              stroke-linecap="round"
              stroke-dasharray="${circumference.toFixed(2)}"
              stroke-dashoffset="${offset.toFixed(2)}"
              transform="rotate(-90 48 48)"
            />
            <text x="48" y="53" text-anchor="middle" class="bklit-ring-value" style="font-size:17px;font-weight:800;fill:#1A1A1A;">${escapeHtml(m.display || "")}</text>
          </svg>
          <div class="bklit-ring-caption">${escapeHtml(m.label || "")}</div>
          <div class="bklit-ring-sub">${escapeHtml(m.subtitle || "")}</div>
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="bklit-card">
      <div class="bklit-header">
        <div>
          <div class="bklit-eyebrow">${escapeHtml(data.eyebrow || "BKLIT.UI RADIAL TELEMETRY • MOTION.DEV")}</div>
          <h4 class="bklit-title">${escapeHtml(data.title || "Longitudinal Signal & Suppression Telemetry")}</h4>
          ${data.subtitle ? `<p class="bklit-subtitle">${escapeHtml(data.subtitle)}</p>` : ""}
        </div>
      </div>
      <div class="bklit-svg-wrap">
        <div class="bklit-ring-grid">${cellsHtml}</div>
        <div class="bklit-tooltip"></div>
      </div>
    </div>
  `;

  const wrap = root.querySelector(".bklit-svg-wrap");
  const tt = root.querySelector(".bklit-tooltip");
  if (wrap && tt) attachTooltip(wrap, tt);
  springAnimate(
    root.querySelectorAll(".bklit-ring-cell"),
    { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] },
    { stagger: 0.08, stiffness: 125, damping: 18 }
  );
}

function renderHorizontalBar(root, data) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) {
    root.innerHTML = `<div class="bklit-card"><div class="bklit-subtitle">No signal bars to display.</div></div>`;
    return;
  }

  const maxVal = Math.max(...items.map((d) => Number(d.value || 0)), Number(data.threshold || 2.0) * 1.25, 1);
  const width = 520;
  const leftPad = 175;
  const rightPad = 46;
  const topPad = 16;
  const rowH = 36;
  const barH = 18;
  const plotW = width - leftPad - rightPad;
  const height = topPad + items.length * rowH + 34;

  const tierColors = {
    CRITICAL: "#DC2626",
    HIGH: "#E8C840",
    MODERATE: "#D4A5E5",
    LOW: "#1B7A3D",
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    x: leftPad + p * plotW,
    val: (p * maxVal).toFixed(1),
  }));

  const gridSvg = ticks
    .map(
      (tk) => `
      <line class="bklit-grid-line" x1="${tk.x}" y1="${topPad - 4}" x2="${tk.x}" y2="${height - 26}" />
      <text class="bklit-axis-label" x="${tk.x}" y="${height - 8}" text-anchor="middle">${tk.val}x</text>
    `
    )
    .join("");

  const thresh = Number(data.threshold || 2.0);
  const threshX = leftPad + Math.min(1, thresh / maxVal) * plotW;
  const threshSvg =
    thresh > 0
      ? `
      <line x1="${threshX}" y1="${topPad - 6}" x2="${threshX}" y2="${height - 26}" stroke="#1A1A1A" stroke-width="1.2" stroke-dasharray="4 3" />
      <text class="bklit-mono-label" x="${threshX + 4}" y="${topPad + 4}">Evans ≥ ${thresh.toFixed(1)}x</text>
    `
      : "";

  const barsSvg = items
    .map((item, i) => {
      const val = Number(item.value || 0);
      const w = Math.max(8, (val / maxVal) * plotW);
      const y = topPad + i * rowH;
      const tier = String(item.tier || "MODERATE").toUpperCase();
      const fill = tierColors[tier] || "#D4A5E5";
      const label = String(item.label || "");
      const shortLabel = label.length > 23 ? label.slice(0, 21) + "…" : label;
      const ttRows = JSON.stringify([
        { k: "Reporting Ratio (PRR)", v: `${val.toFixed(2)}x` },
        { k: "Chi-Squared (χ²)", v: String(item.chi2 ?? "—") },
        { k: "FAERS Co-Reports", v: String(item.cases ?? "—") },
        { k: "Severity Tier", v: tier },
      ]);

      return `
        <g>
          <text class="bklit-axis-label-ink" x="${leftPad - 10}" y="${y + barH / 2 + 4}" text-anchor="end">${escapeHtml(shortLabel)}</text>
          <rect
            class="bklit-bar-interactive bklit-anim-hbar"
            x="${leftPad}"
            y="${y}"
            width="${w}"
            height="${barH}"
            rx="9"
            fill="${fill}"
            stroke="#1A1A1A"
            stroke-width="1"
            data-tt-eyebrow="BKLIT.UI PRR BAR"
            data-tt-title="${escapeHtml(label)}"
            data-tt-rows="${escapeHtml(ttRows)}"
          />
          <text class="bklit-mono-label" x="${leftPad + w + 6}" y="${y + barH / 2 + 4}">${val.toFixed(2)}x</text>
        </g>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="bklit-card">
      <div class="bklit-header">
        <div>
          <div class="bklit-eyebrow">${escapeHtml(data.eyebrow || "BKLIT.UI BAR COMPARISON • MOTION.DEV")}</div>
          <h4 class="bklit-title">${escapeHtml(data.title || "Proportional Reporting Ratio (PRR)")}</h4>
          ${data.subtitle ? `<p class="bklit-subtitle">${escapeHtml(data.subtitle)}</p>` : ""}
        </div>
      </div>
      <div class="bklit-svg-wrap">
        <svg class="bklit-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <g class="bklit-grid">${gridSvg}</g>
          ${threshSvg}
          <g class="bklit-series">${barsSvg}</g>
        </svg>
        <div class="bklit-tooltip"></div>
      </div>
    </div>
  `;

  const wrap = root.querySelector(".bklit-svg-wrap");
  const tt = root.querySelector(".bklit-tooltip");
  if (wrap && tt) attachTooltip(wrap, tt);
  springAnimate(
    root.querySelectorAll(".bklit-anim-hbar"),
    { opacity: [0, 1], transform: ["scaleX(0.15)", "scaleX(1)"] },
    { stagger: 0.06, stiffness: 125, damping: 18 }
  );
}

function renderVolcano(root, data) {
  const points = Array.isArray(data.points) ? data.points : [];
  if (!points.length) {
    root.innerHTML = `<div class="bklit-card"><div class="bklit-subtitle">No volcano plot points available.</div></div>`;
    return;
  }

  const width = 520;
  const height = 300;
  const leftPad = 52;
  const rightPad = 24;
  const topPad = 20;
  const bottomPad = 36;
  const plotW = width - leftPad - rightPad;
  const plotH = height - topPad - bottomPad;

  const maxX = Math.max(...points.map((p) => Number(p.prr || 0)), 5) * 1.15;
  const maxY = Math.max(...points.map((p) => Number(p.chi2 || 0)), 20) * 1.15;
  const maxCases = Math.max(...points.map((p) => Number(p.cases || 1)), 10);

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    x: leftPad + p * plotW,
    val: (p * maxX).toFixed(1),
  }));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: topPad + (1 - p) * plotH,
    val: (p * maxY).toFixed(0),
  }));

  const gridSvg =
    xTicks
      .map(
        (tk) => `
      <line class="bklit-grid-line" x1="${tk.x}" y1="${topPad}" x2="${tk.x}" y2="${topPad + plotH}" />
      <text class="bklit-axis-label" x="${tk.x}" y="${height - 10}" text-anchor="middle">${tk.val}x</text>
    `
      )
      .join("") +
    yTicks
      .map(
        (tk) => `
      <line class="bklit-grid-line" x1="${leftPad}" y1="${tk.y}" x2="${leftPad + plotW}" y2="${tk.y}" />
      <text class="bklit-axis-label" x="${leftPad - 8}" y="${tk.y + 4}" text-anchor="end">${tk.val}</text>
    `
      )
      .join("");

  const xThresh = leftPad + Math.min(1, Number(data.x_threshold || 2.0) / maxX) * plotW;
  const yThresh = topPad + (1 - Math.min(1, Number(data.y_threshold || 4.0) / maxY)) * plotH;

  const tierColors = {
    CRITICAL: "#DC2626",
    HIGH: "#E8C840",
    MODERATE: "#D4A5E5",
    LOW: "#1B7A3D",
  };

  const ptsSvg = points
    .map((pt) => {
      const prr = Number(pt.prr || 0);
      const chi2 = Number(pt.chi2 || 0);
      const cases = Number(pt.cases || 1);
      const cx = leftPad + (prr / maxX) * plotW;
      const cy = topPad + (1 - chi2 / maxY) * plotH;
      const r = 6 + Math.sqrt(cases / maxCases) * 12;
      const tier = String(pt.tier || "MODERATE").toUpperCase();
      const fill = tierColors[tier] || "#D4A5E5";
      const ttRows = JSON.stringify([
        { k: "PRR", v: `${prr.toFixed(2)}x` },
        { k: "Chi-Squared (χ²)", v: chi2.toFixed(1) },
        { k: "FAERS Cases", v: cases.toLocaleString() },
        { k: "Severity Tier", v: tier },
      ]);
      return `
        <circle
          class="bklit-point-interactive bklit-anim-pt"
          cx="${cx.toFixed(1)}"
          cy="${cy.toFixed(1)}"
          r="${r.toFixed(1)}"
          fill="${fill}"
          fill-opacity="0.82"
          stroke="#1A1A1A"
          stroke-width="1.2"
          data-tt-eyebrow="BKLIT.UI VOLCANO SIGNAL"
          data-tt-title="${escapeHtml(pt.label || "")}"
          data-tt-rows="${escapeHtml(ttRows)}"
        />
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="bklit-card">
      <div class="bklit-header">
        <div>
          <div class="bklit-eyebrow">${escapeHtml(data.eyebrow || "BKLIT.UI VOLCANO MATRIX • MOTION.DEV")}</div>
          <h4 class="bklit-title">${escapeHtml(data.title || "Disproportionality Volcano Plot (PRR vs χ²)")}</h4>
          ${data.subtitle ? `<p class="bklit-subtitle">${escapeHtml(data.subtitle)}</p>` : ""}
        </div>
        <div class="bklit-legend">
          <span class="bklit-legend-item"><span class="bklit-legend-swatch" style="background:#DC2626;"></span>Critical</span>
          <span class="bklit-legend-item"><span class="bklit-legend-swatch" style="background:#E8C840;"></span>High</span>
          <span class="bklit-legend-item"><span class="bklit-legend-swatch" style="background:#D4A5E5;"></span>Moderate</span>
        </div>
      </div>
      <div class="bklit-svg-wrap">
        <svg class="bklit-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <g class="bklit-grid">${gridSvg}</g>
          <line x1="${xThresh}" y1="${topPad}" x2="${xThresh}" y2="${topPad + plotH}" stroke="#6B6B6B" stroke-dasharray="4 4" stroke-width="1" />
          <line x1="${leftPad}" y1="${yThresh}" x2="${leftPad + plotW}" y2="${yThresh}" stroke="#6B6B6B" stroke-dasharray="4 4" stroke-width="1" />
          <text class="bklit-mono-label" x="${xThresh + 4}" y="${topPad + 12}">PRR ≥ 2.0</text>
          <g class="bklit-series">${ptsSvg}</g>
        </svg>
        <div class="bklit-tooltip"></div>
      </div>
    </div>
  `;

  const wrap = root.querySelector(".bklit-svg-wrap");
  const tt = root.querySelector(".bklit-tooltip");
  if (wrap && tt) attachTooltip(wrap, tt);
  springAnimate(
    root.querySelectorAll(".bklit-anim-pt"),
    { opacity: [0, 1], transform: ["scale(0.3)", "scale(1)"] },
    { stagger: 0.05, stiffness: 140, damping: 16 }
  );
}

export default function (component) {
  const { data, parentElement } = component;
  const root = parentElement.querySelector("#bklit-root");
  if (!root || !data) return;

  const variant = data.variant || "bar";
  if (variant === "timeline") {
    renderTimeline(root, data);
  } else if (variant === "ring") {
    renderRingGauge(root, data);
  } else if (variant === "volcano") {
    renderVolcano(root, data);
  } else {
    renderHorizontalBar(root, data);
  }

  return () => {
    root.innerHTML = "";
  };
}
"""

_BKLIT_CHART_COMPONENT = st.components.v2.component(
    "ladip_bklit_ui_chart",
    html='<div id="bklit-root"></div>',
    css=_BKLIT_CSS,
    js=_BKLIT_JS,
)


def _mount_bklit_component(**kwargs: Any):
    """Mount the CCv2 chart component, re-registering if a fresh Runtime cleared the registry."""
    global _BKLIT_CHART_COMPONENT
    try:
        return _BKLIT_CHART_COMPONENT(**kwargs)
    except st.errors.StreamlitAPIException:
        _BKLIT_CHART_COMPONENT = st.components.v2.component(
            "ladip_bklit_ui_chart",
            html='<div id="bklit-root"></div>',
            css=_BKLIT_CSS,
            js=_BKLIT_JS,
        )
        return _BKLIT_CHART_COMPONENT(**kwargs)


def bklit_timeline_chart(
    rows: list[dict[str, Any]],
    *,
    title: str = "Medication Overlap & Adverse Event Timeline",
    subtitle: str = "Hover any Bklit interval bar to inspect dosage, duration, and temporal overlap.",
    eyebrow: str = "BKLIT.UI CHRONOLOGY ENGINE • MOTION.DEV",
    key: str | None = None,
    on_select_change: Callable[[], None] | None = None,
):
    """Render a composable Bklit UI longitudinal regimen & adverse event timeline chart."""
    normalized_rows = [
        {
            "track": r.get("Track") or r.get("track") or "Medication Regimen",
            "item": r.get("Item") or r.get("item") or "",
            "start": r.get("Start") or r.get("start") or "",
            "end": r.get("End") or r.get("end") or "",
            "detail": r.get("Detail") or r.get("detail") or "",
        }
        for r in rows
    ]
    return _mount_bklit_component(
        data={
            "variant": "timeline",
            "title": title,
            "subtitle": subtitle,
            "eyebrow": eyebrow,
            "rows": normalized_rows,
        },
        key=key,
        on_select_change=on_select_change or (lambda: None),
    )


def bklit_ring_gauge_chart(
    metrics: list[dict[str, Any]],
    *,
    title: str = "Clinical Signal & Fatigue Suppression Telemetry",
    subtitle: str = "Composable Bklit UI radial gauges animated with motion.dev spring physics.",
    eyebrow: str = "BKLIT.UI RADIAL TELEMETRY • MOTION.DEV",
    key: str | None = None,
):
    """Render a composable Bklit UI multi-ring radial gauge telemetry card."""
    return _mount_bklit_component(
        data={
            "variant": "ring",
            "title": title,
            "subtitle": subtitle,
            "eyebrow": eyebrow,
            "metrics": metrics,
        },
        key=key,
    )


def bklit_bar_chart(
    items: list[dict[str, Any]],
    *,
    threshold: float = 2.0,
    title: str = "Proportional Reporting Ratio (PRR) Comparison",
    subtitle: str = "Empirical FAERS disproportionality relative to Evans' 2.0x signal threshold.",
    eyebrow: str = "BKLIT.UI BAR COMPARISON • MOTION.DEV",
    key: str | None = None,
):
    """Render a composable Bklit UI horizontal bar chart with threshold line."""
    return _mount_bklit_component(
        data={
            "variant": "bar",
            "title": title,
            "subtitle": subtitle,
            "eyebrow": eyebrow,
            "threshold": threshold,
            "items": items,
        },
        key=key,
    )


def bklit_volcano_chart(
    points: list[dict[str, Any]],
    *,
    x_threshold: float = 2.0,
    y_threshold: float = 4.0,
    title: str = "Disproportionality Volcano Matrix (PRR vs χ²)",
    subtitle: str = "Bubble area scaled by FAERS co-report volume; dashed lines mark Evans' criteria.",
    eyebrow: str = "BKLIT.UI VOLCANO MATRIX • MOTION.DEV",
    key: str | None = None,
):
    """Render a composable Bklit UI volcano scatter chart."""
    return _mount_bklit_component(
        data={
            "variant": "volcano",
            "title": title,
            "subtitle": subtitle,
            "eyebrow": eyebrow,
            "x_threshold": x_threshold,
            "y_threshold": y_threshold,
            "points": points,
        },
        key=key,
    )
