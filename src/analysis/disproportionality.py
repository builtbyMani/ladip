"""Pharmacovigilance disproportionality statistics engine.
Implements PRR, ROR, Chi-squared, Information Component (IC), and Evans' criteria.
"""
from dataclasses import dataclass
from itertools import combinations
import math
from typing import Dict, List, Optional, Tuple, Any
from scipy import stats

from src.config import MIN_CASE_COUNT, MIN_CHI2_THRESHOLD, MIN_PRR_THRESHOLD


@dataclass
class ContingencyTableResult:
    a: int  # Drug Combo present, Reaction present
    b: int  # Drug Combo present, Reaction absent
    c: int  # Drug Combo absent, Reaction present
    d: int  # Drug Combo absent, Reaction absent
    n: int  # Total reports
    prr: float
    prr_ci_lower: float
    prr_ci_upper: float
    ror: float
    ror_ci_lower: float
    ror_ci_upper: float
    chi_squared: float
    p_value: float
    ic: float  # Information Component
    ic_lower: float
    evans_signal: bool
    signal_strength: str  # STRONG, MODERATE, WEAK, NONE


class DisproportionalityEngine:
    """Calculates quantitative pharmacovigilance safety signals."""

    @staticmethod
    def compute_stats(a: int, b: int, c: int, d: int) -> ContingencyTableResult:
        """Compute PRR, ROR, Chi-square with Yates' correction, and Bayesian Information Component."""
        n = a + b + c + d
        if n == 0 or (a + b) == 0 or (c + d) == 0:
            return ContingencyTableResult(
                a=a, b=b, c=c, d=d, n=n,
                prr=0.0, prr_ci_lower=0.0, prr_ci_upper=0.0,
                ror=0.0, ror_ci_lower=0.0, ror_ci_upper=0.0,
                chi_squared=0.0, p_value=1.0, ic=0.0, ic_lower=0.0,
                evans_signal=False, signal_strength="NONE",
            )

        # Proportional Reporting Ratio (PRR)
        # PRR = [a / (a + b)] / [c / (c + d)]
        risk_exposed = a / (a + b)
        risk_unexposed = c / (c + d) if (c + d) > 0 else 1e-6

        if risk_unexposed == 0 or a == 0:
            prr = 0.0
            prr_ci_lower = 0.0
            prr_ci_upper = 0.0
        else:
            prr = risk_exposed / risk_unexposed
            # SE(ln(PRR)) = sqrt( 1/a - 1/(a+b) + 1/c - 1/(c+d) )
            # To avoid division by zero or negative variances under small counts:
            var_terms = 0.0
            if a > 0:
                var_terms += (1.0 / a) - (1.0 / (a + b))
            if c > 0:
                var_terms += (1.0 / c) - (1.0 / (c + d))
            se_prr = math.sqrt(max(var_terms, 1e-9))
            prr_ci_lower = max(0.0, math.exp(math.log(max(prr, 1e-6)) - 1.96 * se_prr))
            prr_ci_upper = math.exp(math.log(max(prr, 1e-6)) + 1.96 * se_prr)

        # Reporting Odds Ratio (ROR)
        # ROR = (a * d) / (b * c)
        if b * c == 0 or a == 0 or d == 0:
            # Haldane-Anscombe 0.5 correction for zero cell counts
            a_c, b_c, c_c, d_c = a + 0.5, b + 0.5, c + 0.5, d + 0.5
            ror = (a_c * d_c) / (b_c * c_c)
            se_ror = math.sqrt(1 / a_c + 1 / b_c + 1 / c_c + 1 / d_c)
        else:
            ror = (a * d) / (b * c)
            se_ror = math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)

        ror_ci_lower = max(0.0, math.exp(math.log(max(ror, 1e-6)) - 1.96 * se_ror))
        ror_ci_upper = math.exp(math.log(max(ror, 1e-6)) + 1.96 * se_ror)

        # Chi-Squared with Yates' correction
        # chi2 = N * (|ad - bc| - N/2)^2 / [(a+b)(c+d)(a+c)(b+d)]
        denom = float((a + b) * (c + d) * (a + c) * (b + d))
        if denom > 0:
            numerator = n * (max(0.0, abs(a * d - b * c) - (n / 2.0)) ** 2)
            chi2 = numerator / denom
            p_val = float(stats.chi2.sf(chi2, df=1))
        else:
            chi2 = 0.0
            p_val = 1.0

        # Information Component (Bayesian BCPNN)
        # Expected value E = (a+b)*(a+c)/N
        # IC = log2(a / E)
        expected = float((a + b) * (a + c)) / n if n > 0 else 1.0
        if expected > 0 and a > 0:
            # Dirichlet smoothed IC to prevent log(0)
            a_smooth = a + 1.0
            e_smooth = (a + b + 2.0) * (a + c + 2.0) / (n + 4.0)
            ic = math.log2(a_smooth / e_smooth)
            # Variance estimate for IC: Var(IC) ~= 1/(ln(2)^2) * (1/a - 1/n)
            var_ic = (1.0 / (math.log(2) ** 2)) * (1.0 / max(a, 1) + 1.0 / max(expected, 1))
            ic_lower = ic - 1.96 * math.sqrt(var_ic)
        else:
            ic = 0.0
            ic_lower = 0.0

        # Evans' SRS Criteria: PRR >= 2.0, Chi2 >= 4.0, a >= 3
        evans_signal = bool(
            prr >= MIN_PRR_THRESHOLD
            and chi2 >= MIN_CHI2_THRESHOLD
            and a >= MIN_CASE_COUNT
        )

        # Classify signal strength
        if evans_signal and prr >= 5.0 and chi2 >= 15.0:
            strength = "STRONG"
        elif evans_signal and prr >= 2.0 and chi2 >= 4.0:
            strength = "MODERATE"
        elif prr >= 1.5 and a >= 2:
            strength = "WEAK"
        else:
            strength = "NONE"

        return ContingencyTableResult(
            a=a, b=b, c=c, d=d, n=n,
            prr=round(prr, 2),
            prr_ci_lower=round(prr_ci_lower, 2),
            prr_ci_upper=round(prr_ci_upper, 2),
            ror=round(ror, 2),
            ror_ci_lower=round(ror_ci_lower, 2),
            ror_ci_upper=round(ror_ci_upper, 2),
            chi_squared=round(chi2, 2),
            p_value=float(f"{p_val:.4e}"),
            ic=round(ic, 2),
            ic_lower=round(ic_lower, 2),
            evans_signal=evans_signal,
            signal_strength=strength,
        )

    @classmethod
    def evaluate_synergy(
        cls,
        combo_stats: ContingencyTableResult,
        subcombo_stats_list: List[ContingencyTableResult],
    ) -> Dict[str, Any]:
        """Determine if a multi-drug combination produces synergistic disproportionality
        beyond the maximum pairwise or sub-combination PRR.
        """
        if not subcombo_stats_list:
            return {"is_synergistic": False, "synergy_ratio": 1.0, "max_sub_prr": 0.0}

        max_sub_prr = max([sub.prr for sub in subcombo_stats_list])
        synergy_ratio = combo_stats.prr / max(max_sub_prr, 1.0)

        # Flag as synergistic if combo PRR is notably greater than max sub-combo PRR and meets signal criteria
        is_synergistic = bool(
            combo_stats.evans_signal
            and synergy_ratio >= 1.4
            and combo_stats.prr >= 2.5
        )

        return {
            "is_synergistic": is_synergistic,
            "synergy_ratio": round(synergy_ratio, 2),
            "max_sub_prr": round(max_sub_prr, 2),
            "combo_prr": combo_stats.prr,
        }
