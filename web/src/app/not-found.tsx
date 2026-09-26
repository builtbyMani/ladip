import React from "react";
import Link from "next/link";
import { HormnLogoMark } from "@/components/HormnIllustrations";

export const metadata = {
  title: "404 Page Not Found | LADIP — Temporal Pharmacovigilance",
  description:
    "The requested clinical workflow or patient cohort record could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-white text-[#111827] flex flex-col justify-between max-w-4xl mx-auto px-6 py-12">
      <header>
        <Link href="/" title="Return to LADIP Clinical Workspace">
          <HormnLogoMark size="md" />
        </Link>
      </header>

      <main className="my-12 rounded-[2.5rem] bg-[#F8FAFC] border border-slate-200/80 p-8 sm:p-12 shadow-diffusion">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#DC2626] mb-2">
          HTTP 404 — RESOURCE NOT FOUND
        </div>
        <div className="font-display text-6xl sm:text-7xl font-bold text-[#111827] tracking-tight mb-4">
          404
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#111827] mb-3">
          Clinical Route or Endpoint Not Found
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed mb-8">
          The clinical workflow, patient MRN, or pharmacovigilance endpoint you
          requested does not exist. Return to the main LADIP workspace to
          inspect patient cohorts or query FAERS signals.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="bg-[#111827] hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Return to Clinical Workspace
          </Link>
          <Link
            href="/?workflow=faers"
            className="bg-white hover:bg-slate-50 text-[#111827] border border-slate-200 text-xs sm:text-sm font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Open FAERS Explorer
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <span>
          &copy; 2026 LADIP — Longitudinal Adverse Drug Interaction Predictor.
        </span>
        <div className="flex items-center gap-5 font-semibold text-[#111827]">
          <Link href="/">Interaction Discovery</Link>
          <Link href="/?workflow=safety">Safety Check</Link>
          <Link href="/?workflow=ehr">Patient EHR</Link>
        </div>
      </footer>
    </div>
  );
}
