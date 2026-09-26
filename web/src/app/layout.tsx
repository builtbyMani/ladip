import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multi-Drug Interaction Discovery | LADIP — Temporal Pharmacovigilance",
  description:
    "Detect hidden multi-drug adverse interactions using FDA FAERS 2x2 disproportionality ratios, Naranjo causality scoring, and longitudinal alert fatigue suppression.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.png",
  },
  openGraph: {
    title: "LADIP — Temporal Pharmacovigilance & Clinical Decision Support",
    description:
      "Personalised pharmacovigilance combining FDA FAERS 2x2 disproportionality ratios with longitudinal patient medication timelines.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] bg-white text-[#111827] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
