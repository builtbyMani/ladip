/**
 * LADIP Indian & Global Medicine Brand-to-Medicinal Name & Dosage Resolver
 * Resolves brand/trade names (e.g., "Dolo 650", "Brufen 400", "Combiflam", "Pan 40")
 * and scanned medicine strip text into standardized Medicinal (Generic) Names + Dosages (mg).
 */

export const MEDICINE_DICTIONARY = [
  {
    keywords: ['dolo', 'dolo 650', 'dolo-650', 'dolo650', 'dolo 500'],
    brandLabel: 'Dolo 650',
    medicinalName: 'Paracetamol (Acetaminophen)',
    normalizedIngredient: 'acetaminophen',
    defaultDoseMg: '650',
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'Fever, Headache & Mild-to-Moderate Body Pain',
  },
  {
    keywords: ['crocin', 'crocin 650', 'crocin advance', 'crocin pain relief'],
    brandLabel: 'Crocin 650',
    medicinalName: 'Paracetamol (Acetaminophen)',
    normalizedIngredient: 'acetaminophen',
    defaultDoseMg: '650',
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'Fever, Headache & Mild-to-Moderate Pain',
  },
  {
    keywords: ['calpol', 'calpol 650', 'calpol 500', 'pacimol'],
    brandLabel: 'Calpol 650',
    medicinalName: 'Paracetamol (Acetaminophen)',
    normalizedIngredient: 'acetaminophen',
    defaultDoseMg: '650',
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'Fever & Mild-to-Moderate Pain Relief',
  },
  {
    keywords: ['paracetamol', 'acetaminophen', 'tylenol', 'pcm'],
    brandLabel: 'Paracetamol',
    medicinalName: 'Paracetamol (Acetaminophen)',
    normalizedIngredient: 'acetaminophen',
    defaultDoseMg: '650',
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'Fever & Mild-to-Moderate Pain Relief',
  },
  {
    keywords: ['brufen', 'brufen 400', 'brufen 600', 'advil', 'motrin', 'ibuprofen'],
    brandLabel: 'Brufen 400 (Ibuprofen)',
    medicinalName: 'Ibuprofen',
    normalizedIngredient: 'ibuprofen',
    defaultDoseMg: '400',
    therapeuticClass: 'NSAID (Non-Steroidal Anti-Inflammatory Drug)',
    indication: 'Inflammatory Pain, Joint Pain, Dental Pain & Fever',
  },
  {
    keywords: ['combiflam', 'imol', 'iflam'],
    brandLabel: 'Combiflam',
    medicinalName: 'Ibuprofen (400 mg) + Paracetamol (325 mg)',
    normalizedIngredient: 'ibuprofen',
    defaultDoseMg: '400',
    therapeuticClass: 'Combined NSAID + Analgesic',
    indication: 'Acute Musculoskeletal Pain, Inflammation & Fever',
  },
  {
    keywords: ['voveran', 'diclofenac', 'reactin', 'dynapar'],
    brandLabel: 'Voveran (Diclofenac)',
    medicinalName: 'Diclofenac Sodium (NSAID)',
    normalizedIngredient: 'ibuprofen',
    defaultDoseMg: '50',
    therapeuticClass: 'NSAID Anti-Inflammatory',
    indication: 'Arthritis, Backache & Acute Joint Inflammation',
  },
  {
    keywords: ['zerodol', 'aceclofenac', 'hifenac'],
    brandLabel: 'Zerodol (Aceclofenac)',
    medicinalName: 'Aceclofenac (NSAID)',
    normalizedIngredient: 'ibuprofen',
    defaultDoseMg: '100',
    therapeuticClass: 'NSAID Anti-Inflammatory',
    indication: 'Osteoarthritis, Rheumatoid & Musculoskeletal Pain',
  },
  {
    keywords: ['meftal', 'meftal spas', 'mefenamic'],
    brandLabel: 'Meftal 500',
    medicinalName: 'Mefenamic Acid (NSAID)',
    normalizedIngredient: 'ibuprofen',
    defaultDoseMg: '500',
    therapeuticClass: 'NSAID Antispasmodic & Analgesic',
    indication: 'Abdominal Cramps, Spasmodic Pain & Fever',
  },
  {
    keywords: ['naprosyn', 'naproxen', 'aleve', 'xenobid'],
    brandLabel: 'Naprosyn 500',
    medicinalName: 'Naproxen Sodium',
    normalizedIngredient: 'naproxen',
    defaultDoseMg: '500',
    therapeuticClass: 'NSAID Anti-Inflammatory',
    indication: 'Rheumatoid Arthritis, Gout & Migraine Pain',
  },
  {
    keywords: ['ecosprin', 'ecosprin 75', 'ecosprin 150', 'disprin', 'aspirin', 'bayer'],
    brandLabel: 'Ecosprin 75 (Aspirin)',
    medicinalName: 'Aspirin (Acetylsalicylic Acid)',
    normalizedIngredient: 'aspirin',
    defaultDoseMg: '75',
    therapeuticClass: 'Salicylate Antiplatelet & Analgesic',
    indication: 'Cardiovascular Blood Thinner & Clot Prevention',
  },
  {
    keywords: ['clopitab', 'clopilet', 'plavix', 'clopidogrel', 'deplatt'],
    brandLabel: 'Clopitab 75',
    medicinalName: 'Clopidogrel Bisulfate',
    normalizedIngredient: 'clopidogrel',
    defaultDoseMg: '75',
    therapeuticClass: 'P2Y12 Antiplatelet Inhibitor',
    indication: 'Post-Stent Coronary Protection & Stroke Prevention',
  },
  {
    keywords: ['pan', 'pan 40', 'pan-40', 'pantocid', 'pantop', 'pantoprazole'],
    brandLabel: 'Pan 40',
    medicinalName: 'Pantoprazole Sodium',
    normalizedIngredient: 'pantoprazole',
    defaultDoseMg: '40',
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    indication: 'Gastric Acidity, GERD & Ulcer Prophylaxis',
  },
  {
    keywords: ['omez', 'omez 20', 'prilosec', 'omeprazole'],
    brandLabel: 'Omez 20',
    medicinalName: 'Omeprazole',
    normalizedIngredient: 'omeprazole',
    defaultDoseMg: '20',
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    indication: 'Acid Reflux, Heartburn & Peptic Ulcer Disease',
  },
  {
    keywords: ['cordarone', 'amiodarone', 'pacerone', 'eudorone'],
    brandLabel: 'Cordarone 200',
    medicinalName: 'Amiodarone Hydrochloride',
    normalizedIngredient: 'amiodarone',
    defaultDoseMg: '200',
    therapeuticClass: 'Class III Antiarrhythmic',
    indication: 'Ventricular & Supraventricular Cardiac Arrhythmias',
  },
  {
    keywords: ['bactrim', 'bactrim ds', 'septran', 'septra', 'trimethoprim', 'cotrimoxazole', 'co-trimoxazole'],
    brandLabel: 'Bactrim DS / Septran DS',
    medicinalName: 'Trimethoprim (160 mg) + Sulfamethoxazole (800 mg)',
    normalizedIngredient: 'trimethoprim-sulfamethoxazole',
    defaultDoseMg: '800',
    therapeuticClass: 'Sulfonamide Combination Antibiotic',
    indication: 'Urinary Tract & Respiratory Bacterial Infections',
  },
  {
    keywords: ['folitrax', 'trexall', 'methotrexate', 'biotrexate'],
    brandLabel: 'Folitrax 15',
    medicinalName: 'Methotrexate Sodium',
    normalizedIngredient: 'methotrexate',
    defaultDoseMg: '15',
    therapeuticClass: 'Antimetabolite DMARD',
    indication: 'Rheumatoid Arthritis & Autoimmune Conditions',
  },
  {
    keywords: ['warf', 'coumadin', 'warfarin', 'acitrom'],
    brandLabel: 'Warf 5 (Warfarin)',
    medicinalName: 'Warfarin Sodium',
    normalizedIngredient: 'warfarin',
    defaultDoseMg: '5',
    therapeuticClass: 'Vitamin K Antagonist Anticoagulant',
    indication: 'Atrial Fibrillation & Venous Thromboembolism Prevention',
  },
  {
    keywords: ['zocor', 'simvotin', 'simvastatin'],
    brandLabel: 'Zocor 40 (Simvastatin)',
    medicinalName: 'Simvastatin',
    normalizedIngredient: 'simvastatin',
    defaultDoseMg: '40',
    therapeuticClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    indication: 'Hypercholesterolemia & Cardiovascular Risk Reduction',
  },
  {
    keywords: ['atorva', 'lipitor', 'tonact', 'atorvastatin'],
    brandLabel: 'Atorva 20 (Atorvastatin)',
    medicinalName: 'Atorvastatin Calcium',
    normalizedIngredient: 'atorvastatin',
    defaultDoseMg: '20',
    therapeuticClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    indication: 'Dyslipidemia & Coronary Artery Disease',
  },
  {
    keywords: ['stamlo', 'amlong', 'norvasc', 'amlodipine'],
    brandLabel: 'Stamlo 5 (Amlodipine)',
    medicinalName: 'Amlodipine Besylate',
    normalizedIngredient: 'amlodipine',
    defaultDoseMg: '5',
    therapeuticClass: 'Calcium Channel Blocker',
    indication: 'Essential Hypertension & Chronic Stable Angina',
  },
  {
    keywords: ['glycomet', 'glucophage', 'metformin', 'okamet'],
    brandLabel: 'Glycomet 500',
    medicinalName: 'Metformin Hydrochloride',
    normalizedIngredient: 'metformin',
    defaultDoseMg: '500',
    therapeuticClass: 'Biguanide Oral Antidiabetic',
    indication: 'Type 2 Diabetes Mellitus Glycemic Control',
  },
  {
    keywords: ['augmentin', 'moxikind', 'amoxicillin', 'amoxyclav'],
    brandLabel: 'Augmentin 625',
    medicinalName: 'Amoxicillin (500 mg) + Clavulanic Acid (125 mg)',
    normalizedIngredient: 'amoxicillin',
    defaultDoseMg: '625',
    therapeuticClass: 'Beta-Lactam Penicillin Antibiotic',
    indication: 'Bacterial Sinus, Respiratory & Skin Infections',
  },
  {
    keywords: ['azithral', 'azee', 'azithromycin'],
    brandLabel: 'Azithral 500',
    medicinalName: 'Azithromycin Dihydrate',
    normalizedIngredient: 'azithromycin',
    defaultDoseMg: '500',
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'Upper & Lower Respiratory Tract Infections',
  },
];

/**
 * Preset Medicine Strip Scans for 1-tap camera simulation & OCR demonstration
 */
export const SCANNER_MEDICINE_PRESETS = [
  {
    id: 'SCAN_DOLO_650',
    stripLabel: 'DOLO-650 Strip',
    brandInput: 'Dolo 650',
    medicinalName: 'Paracetamol IP',
    doseMg: '650',
    manufacturer: 'Micro Labs Ltd.',
    ocrSnippet: 'Rx Paracetamol Tablets IP 650 mg — DOLO-650 — Each uncoated tablet contains Paracetamol IP 650 mg',
  },
  {
    id: 'SCAN_BRUFEN_400',
    stripLabel: 'Brufen 400 Strip',
    brandInput: 'Brufen 400',
    medicinalName: 'Ibuprofen IP',
    doseMg: '400',
    manufacturer: 'Abbott India',
    ocrSnippet: 'Rx Ibuprofen Tablets IP 400 mg — BRUFEN 400 — Non-Steroidal Anti-Inflammatory Analgesic',
  },
  {
    id: 'SCAN_COMBIFLAM',
    stripLabel: 'Combiflam Strip',
    brandInput: 'Combiflam',
    medicinalName: 'Ibuprofen + Paracetamol',
    doseMg: '400',
    manufacturer: 'Sanofi India',
    ocrSnippet: 'COMBIFLAM Tablets — Ibuprofen IP 400 mg + Paracetamol IP 325 mg',
  },
  {
    id: 'SCAN_CORDARONE',
    stripLabel: 'Cordarone 200 Strip',
    brandInput: 'Cordarone 200',
    medicinalName: 'Amiodarone HCl IP',
    doseMg: '200',
    manufacturer: 'Sanofi India',
    ocrSnippet: 'Rx Amiodarone Hydrochloride Tablets IP 200 mg — CORDARONE',
  },
  {
    id: 'SCAN_BACTRIM_DS',
    stripLabel: 'Bactrim DS Strip',
    brandInput: 'Bactrim DS',
    medicinalName: 'Trimethoprim + Sulfamethoxazole',
    doseMg: '800',
    manufacturer: 'Abbott Healthcare',
    ocrSnippet: 'Rx Co-trimoxazole Tablets IP — BACTRIM DS — Sulfamethoxazole 800 mg + Trimethoprim 160 mg',
  },
  {
    id: 'SCAN_PAN_40',
    stripLabel: 'Pan-40 Strip',
    brandInput: 'Pan 40',
    medicinalName: 'Pantoprazole Sodium IP',
    doseMg: '40',
    manufacturer: 'Alkem Laboratories',
    ocrSnippet: 'Rx Pantoprazole Gastro-resistant Tablets IP 40 mg — PAN-40',
  },
];

/**
 * Extract numeric dosage from free text (e.g. "DOLO 650", "Paracetamol 650g", "Brufen 400 mg")
 */
export function extractDosageFromText(text) {
  if (!text) return '';
  const match = String(text).match(/\b(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|ml)?\b/i);
  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 5000) {
      return String(val);
    }
  }
  return '';
}

/**
 * Resolve any brand/trade or generic input string into its actual medicinal name,
 * active normalized ingredient, standard or extracted dosage, and therapeutic indication.
 */
export function resolveMedicineInput(rawInput, explicitDose = '') {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  const extractedDose = extractDosageFromText(trimmed);
  // Clean numbers and units for keyword lookup
  const cleanedAlpha = lower
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablets?|tabs?|caps?)?\b/gi, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let matchedEntry = null;

  for (const entry of MEDICINE_DICTIONARY) {
    for (const kw of entry.keywords) {
      if (
        lower === kw ||
        cleanedAlpha === kw ||
        cleanedAlpha.includes(kw) ||
        lower.includes(kw)
      ) {
        matchedEntry = entry;
        break;
      }
    }
    if (matchedEntry) break;
  }

  const resolvedDose =
    (explicitDose && String(explicitDose).trim()) ||
    extractedDose ||
    (matchedEntry ? matchedEntry.defaultDoseMg : '');

  if (matchedEntry) {
    return {
      isRecognized: true,
      enteredText: trimmed,
      brandLabel: matchedEntry.brandLabel,
      medicinalName: matchedEntry.medicinalName,
      normalizedIngredient: matchedEntry.normalizedIngredient,
      dosageMg: resolvedDose,
      dosageDisplay: resolvedDose ? `${resolvedDose} mg` : 'Standard Oral Dose',
      therapeuticClass: matchedEntry.therapeuticClass,
      indication: matchedEntry.indication,
    };
  }

  // Fallback for unrecognized custom generic/brand names
  const fallbackTitle = cleanedAlpha
    ? cleanedAlpha.charAt(0).toUpperCase() + cleanedAlpha.slice(1)
    : trimmed;

  return {
    isRecognized: false,
    enteredText: trimmed,
    brandLabel: trimmed,
    medicinalName: `${fallbackTitle} (Active Ingredient)`,
    normalizedIngredient: cleanedAlpha || lower,
    dosageMg: resolvedDose || '500',
    dosageDisplay: resolvedDose ? `${resolvedDose} mg` : 'Oral Dose',
    therapeuticClass: 'Active Pharmaceutical Ingredient',
    indication: 'Clinical Pharmacovigilance Evaluation',
  };
}
