"""Unit tests for pharmacovigilance disproportionality statistics engine."""
import math
import pytest
from src.analysis.disproportionality import DisproportionalityEngine, ContingencyTableResult


def test_hand_calculated_contingency_table():
    # Given 2x2 table:
    # a = 10 (combo + reaction)
    # b = 90 (combo - reaction) -> a+b = 100
    # c = 50 (non-combo + reaction)
    # d = 9850 (non-combo - reaction) -> c+d = 9900
    # Risk exposed = 10 / 100 = 0.1
    # Risk unexposed = 50 / 9900 ~= 0.0050505
    # Expected PRR = 0.1 / 0.0050505 = 19.80
    # Expected ROR = (10 * 9850) / (90 * 50) = 98500 / 4500 = 21.888... ~= 21.89
    res = DisproportionalityEngine.compute_stats(a=10, b=90, c=50, d=9850)

    assert abs(res.prr - 19.80) < 0.1
    assert abs(res.ror - 21.89) < 0.1
    assert res.chi_squared > 4.0
    assert res.evans_signal is True
    assert res.signal_strength == "STRONG"
    assert res.p_value < 0.001


def test_evans_criteria_rejection_low_prr():
    # a=10, b=990 (risk exposed = 0.01)
    # c=100, d=9900 (risk unexposed = 0.01)
    # PRR = 1.0 (No signal)
    res = DisproportionalityEngine.compute_stats(a=10, b=990, c=100, d=9900)

    assert res.prr <= 1.05
    assert res.evans_signal is False
    assert res.signal_strength == "NONE"


def test_evans_criteria_rejection_low_case_count():
    # PRR is high, but a = 2 (less than minimum 3 cases required by Evans)
    res = DisproportionalityEngine.compute_stats(a=2, b=10, c=5, d=5000)

    assert res.prr > 2.0
    assert res.evans_signal is False


def test_multi_drug_synergy():
    # Multi-drug combination has PRR = 8.7
    combo = ContingencyTableResult(
        a=50, b=200, c=1000, d=100000, n=101250,
        prr=8.7, prr_ci_lower=6.5, prr_ci_upper=11.2,
        ror=9.2, ror_ci_lower=7.1, ror_ci_upper=12.0,
        chi_squared=45.2, p_value=1e-9, ic=2.1, ic_lower=1.7,
        evans_signal=True, signal_strength="STRONG"
    )

    # Subcombos have PRR 1.2, 1.1, 1.3
    sub1 = ContingencyTableResult(
        a=10, b=200, c=1000, d=100000, n=101210,
        prr=1.2, prr_ci_lower=0.8, prr_ci_upper=1.8,
        ror=1.3, ror_ci_lower=0.9, ror_ci_upper=1.9,
        chi_squared=1.2, p_value=0.27, ic=0.1, ic_lower=-0.2,
        evans_signal=False, signal_strength="NONE"
    )
    sub2 = ContingencyTableResult(
        a=15, b=250, c=1000, d=100000, n=101265,
        prr=1.3, prr_ci_lower=0.9, prr_ci_upper=1.9,
        ror=1.4, ror_ci_lower=0.9, ror_ci_upper=2.0,
        chi_squared=1.8, p_value=0.18, ic=0.2, ic_lower=-0.1,
        evans_signal=False, signal_strength="NONE"
    )

    synergy_res = DisproportionalityEngine.evaluate_synergy(combo, [sub1, sub2])

    assert synergy_res["is_synergistic"] is True
    assert synergy_res["synergy_ratio"] >= 6.0
    assert synergy_res["max_sub_prr"] == 1.3
