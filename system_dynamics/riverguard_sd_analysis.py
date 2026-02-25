"""RiverGuard system dynamics analysis using PySD."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import matplotlib.pyplot as plt
import pandas as pd

try:
    import pysd
except ImportError as exc:
    raise SystemExit(
        "PySD is required. Install with: pip install pysd pandas matplotlib seaborn"
    ) from exc


# ===== Data sources =====


@dataclass(frozen=True)
class DataSources:
    """Observed data references used for calibration and reporting."""

    INDONESIA: Dict[str, float] = None
    BANDUNG: Dict[str, float] = None
    CITARUM: Dict[str, float] = None
    BENING_SAGULING: Dict[str, float] = None


DATA = DataSources(
    INDONESIA={
        "total_waste_2024": 56.6e6,
        "plastic_percentage": 0.19,
        "collection_rate": 0.39,
        "recycling_rate": 0.10,
        "population": 281.6e6,
        "source": "Ministry of Environment and Forestry SIPSN 2024",
    },
    BANDUNG={
        "population": 8.05e6,
        "daily_waste": 5000,
        "unmanaged_waste": 4000,
        "source": "Ministry of Environment 2025, Jakarta Post 2024",
    },
    CITARUM={
        "basin_population": 5e6,
        "affected_households": 100000,
        "river_length": 297,
        "source": "ADB reports, Greenpeace 2013",
    },
    BENING_SAGULING={
        "monthly_collection": 250,
        "operational_since": 2018,
        "source": "Clean Currents Coalition 2023",
    },
)


def calculate_waste_per_capita() -> float:
    """Return national implied kg/person/day from annual tonnage and population."""
    annual_waste = DATA.INDONESIA["total_waste_2024"]
    population = DATA.INDONESIA["population"]
    kg_per_person_per_day = (annual_waste * 1000 / population) / 365
    return kg_per_person_per_day


def validate_bandung_data() -> Dict[str, float]:
    """Compare top-down estimate with reported Bandung value."""
    waste_per_capita = calculate_waste_per_capita()
    population = DATA.BANDUNG["population"]
    theoretical_daily_waste = population * waste_per_capita / 1000
    actual_daily_waste = DATA.BANDUNG["daily_waste"]
    variance = abs(theoretical_daily_waste - actual_daily_waste) / actual_daily_waste

    print("=== Data validation ===")
    print(f"Theoretical from population: {theoretical_daily_waste:.0f} tons/day")
    print(f"Observed Bandung value:      {actual_daily_waste:.0f} tons/day")
    print(f"Difference: {variance * 100:.1f}%")

    return {
        "theoretical": theoretical_daily_waste,
        "actual": actual_daily_waste,
        "variance": variance,
    }


def calculate_economic_parameters() -> float:
    """Compute weighted average recycling price in IDR/ton."""
    composition = {
        "plastic": 0.20,
        "paper": 0.15,
        "metal": 0.05,
        "glass": 0.05,
    }
    prices = {
        "plastic": 4000,
        "paper": 1750,
        "metal": 11500,
        "glass": 8000,
    }
    weighted_avg_per_kg = sum(composition[k] * prices[k] for k in composition)
    weighted_avg_per_ton = weighted_avg_per_kg * 1000
    print(f"Weighted recycling price: IDR {weighted_avg_per_ton:,.0f}/ton")
    return weighted_avg_per_ton


def scenario_definitions() -> Dict[str, Dict[str, float]]:
    """Return baseline and intervention scenarios."""
    return {
        "Baseline": {
            "Intervention Switch": 0,
            "Viral Coefficient": 0,
            "Max Collection Improvement": 0,
        },
        "Conservative": {
            "Intervention Switch": 1,
            "Viral Coefficient": 0.3,
            "Max Collection Improvement": 0.15,
        },
        "Moderate": {
            "Intervention Switch": 1,
            "Viral Coefficient": 0.5,
            "Max Collection Improvement": 0.30,
        },
        "Optimistic": {
            "Intervention Switch": 1,
            "Viral Coefficient": 0.8,
            "Max Collection Improvement": 0.45,
        },
    }


def run_model(model_file: Path, scenarios: Dict[str, Dict[str, float]] | None = None) -> Dict[str, pd.DataFrame]:
    """Run all scenarios and return output time series."""
    if scenarios is None:
        scenarios = scenario_definitions()

    model = pysd.read_vensim(str(model_file))
    columns = [
        "App Users",
        "Participating Households",
        "Waste Recycling Rate",
        "Recycled Waste Cumulative",
        "Waste to River Rate",
        "River Pollution Level",
        "Community Income from Recycling",
        "Net Monthly Profit",
        "Environmental Awareness Level",
        "CO2 Reduction",
    ]

    results: Dict[str, pd.DataFrame] = {}
    for name, params in scenarios.items():
        print(f"Running scenario: {name}")
        results[name] = model.run(params=params, return_columns=columns)

    return results


def _save_line_chart(
    results: Dict[str, pd.DataFrame],
    metric: str,
    title: str,
    ylabel: str,
    output_path: Path,
    transform=None,
) -> None:
    colors = {
        "Baseline": "#616161",
        "Conservative": "#f9a825",
        "Moderate": "#2e7d32",
        "Optimistic": "#1565c0",
    }

    plt.figure(figsize=(10, 6))
    for scenario, data in results.items():
        series = data[metric]
        if transform:
            series = transform(series, data)
        plt.plot(data.index, series, label=scenario, color=colors.get(scenario, "#000000"), linewidth=2)

    plt.title(title)
    plt.xlabel("Month")
    plt.ylabel(ylabel)
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()


def plot_results(results: Dict[str, pd.DataFrame], output_dir: Path) -> None:
    """Create core charts and a combined dashboard."""
    output_dir.mkdir(parents=True, exist_ok=True)

    _save_line_chart(
        results,
        "App Users",
        "RiverGuard User Adoption (5 years)",
        "Users (people)",
        output_dir / "user_adoption.png",
    )
    _save_line_chart(
        results,
        "Recycled Waste Cumulative",
        "Cumulative Recycled Waste",
        "Tons",
        output_dir / "recycling_impact.png",
    )
    _save_line_chart(
        results,
        "River Pollution Level",
        "Citarum Pollution Reduction",
        "Reduction (%)",
        output_dir / "pollution_reduction.png",
        transform=lambda s, d: (1 - s / d["River Pollution Level"].iloc[0]) * 100,
    )
    _save_line_chart(
        results,
        "Community Income from Recycling",
        "Community Income from Recycling",
        "USD",
        output_dir / "economic_impact.png",
        transform=lambda s, _: s / 15800,
    )
    _save_line_chart(
        results,
        "Environmental Awareness Level",
        "Environmental Awareness",
        "Awareness (%)",
        output_dir / "awareness_growth.png",
        transform=lambda s, _: s * 100,
    )
    _save_line_chart(
        results,
        "CO2 Reduction",
        "CO2 Emission Reduction",
        "Tons CO2",
        output_dir / "co2_reduction.png",
    )

    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle("RiverGuard Impact Dashboard (60 months)", fontsize=16)
    metrics = [
        ("App Users", "User Adoption", "people"),
        ("Waste Recycling Rate", "Monthly Recycling", "tons/month"),
        ("River Pollution Level", "River Pollution", "units"),
        ("Community Income from Recycling", "Community Income", "IDR"),
        ("Environmental Awareness Level", "Awareness", "fraction"),
        ("CO2 Reduction", "CO2 Reduction", "tons"),
    ]
    colors = {
        "Baseline": "#616161",
        "Conservative": "#f9a825",
        "Moderate": "#2e7d32",
        "Optimistic": "#1565c0",
    }

    for i, (metric, title, unit) in enumerate(metrics):
        ax = axes[i // 3, i % 3]
        for scenario, data in results.items():
            ax.plot(data.index, data[metric], label=scenario, color=colors.get(scenario, "#000000"), linewidth=1.5)
        ax.set_title(title)
        ax.set_xlabel("Months")
        ax.set_ylabel(unit)
        ax.grid(alpha=0.3)
        ax.legend(fontsize=8)

    plt.tight_layout()
    plt.savefig(output_dir / "dashboard.png", dpi=300)
    plt.close()


def _format_summary_table(results: Dict[str, pd.DataFrame]) -> str:
    lines: List[str] = []
    lines.append("| Scenario | App users | Adoption | Cum. recycled (tons) | Pollution reduction | Community income (USD) | CO2 reduction (tons) |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|")

    for name, data in results.items():
        final = data.iloc[-1]
        adoption = final["App Users"] / DATA.BANDUNG["population"] * 100
        pollution_reduction = (1 - final["River Pollution Level"] / data["River Pollution Level"].iloc[0]) * 100
        income_usd = final["Community Income from Recycling"] / 15800
        lines.append(
            "| "
            + " | ".join(
                [
                    name,
                    f"{final['App Users']:,.0f}",
                    f"{adoption:.1f}%",
                    f"{final['Recycled Waste Cumulative']:,.0f}",
                    f"{pollution_reduction:.1f}%",
                    f"{income_usd:,.0f}",
                    f"{final['CO2 Reduction']:,.0f}",
                ]
            )
            + " |"
        )

    return "\n".join(lines)


def _cld_mermaid() -> str:
    return """```mermaid
graph LR
  A[App Users] --> B[Word of Mouth]
  B --> C[Adoption Rate]
  C --> A

  D[Recycling] --> E[Income]
  E --> F[Participation Motivation]
  F --> G[Participating Households]
  G --> D

  A --> H[Capacity Strain]
  H --> I[Service Quality]
  I --> C

  J[Waste to River] --> K[River Pollution]
  K --> L[Awareness]
  L --> M[Collection Rate]
  M --> J
```"""


def _sfd_mermaid() -> str:
    return """```mermaid
graph TD
  U[(App Users)]
  RW[(Recycled Waste Cumulative)]
  RP[(River Pollution Level)]
  CI[(Community Income)]
  AW[(Awareness)]
  UW[(Uncollected Waste Stock)]

  UA[User Adoption Rate] --> U
  U --> UC[User Churn Rate]

  WR[Waste Recycling Rate] --> RW

  RD[River Degradation Rate] --> RP
  RP --> RC[River Cleanup Rate]

  IG[Income Generation Rate] --> CI
  CI --> IW[Income Withdrawal Rate]

  AI[Awareness Increase] --> AW
  AW --> AD[Awareness Decay]

  WTR[Waste to River Rate] --> UW
  UW --> IR[Informal Recovery Rate]
```"""


def generate_report(results: Dict[str, pd.DataFrame], output_file: Path) -> None:
    """Write markdown report with scenario outputs and model diagrams."""
    validation = validate_bandung_data()
    weighted_price = calculate_economic_parameters()

    baseline_final = results["Baseline"].iloc[-1]
    moderate_final = results["Moderate"].iloc[-1]
    extra_recycling = (
        results["Moderate"]["Recycled Waste Cumulative"].iloc[-1]
        - results["Baseline"]["Recycled Waste Cumulative"].iloc[-1]
    )
    extra_pollution = (
        (1 - moderate_final["River Pollution Level"] / results["Moderate"]["River Pollution Level"].iloc[0])
        - (1 - baseline_final["River Pollution Level"] / results["Baseline"]["River Pollution Level"].iloc[0])
    ) * 100

    bening_5y = DATA.BENING_SAGULING["monthly_collection"] * 60
    riverguard_5y = results["Moderate"]["Recycled Waste Cumulative"].iloc[-1]

    content = f"""# RiverGuard インパクト分析レポート

## 1. モデル概要
- モデル: `riverguard_model.mdl` (PySDで実行)
- 期間: 60ヶ月（5年）
- シナリオ: Baseline / Conservative / Moderate / Optimistic
- Baselineは `Intervention Switch = 0` でRiverGuard効果なし

## 2. データ整合性チェック
- 理論値（人口ベース）: {validation['theoretical']:.0f} tons/day
- 実測値（バンドン）: {validation['actual']:.0f} tons/day
- 差異: {validation['variance'] * 100:.1f}%
- 加重平均リサイクル単価: IDR {weighted_price:,.0f}/ton

## 3. シナリオ比較（60ヶ月時点）
{_format_summary_table(results)}

## 4. 主要インサイト
- 追加リサイクル量（Moderate vs Baseline, 5年累積）: {extra_recycling:,.0f} tons
- 汚染削減の追加改善（Moderate vs Baseline）: {extra_pollution:.1f} points
- Bening Saguling 5年実績換算: {bening_5y:,.0f} tons
- RiverGuard Moderate 5年予測: {riverguard_5y:,.0f} tons
- スケール比: {riverguard_5y / bening_5y:.1f}x

## 5. 因果ループ図（CLD）
{_cld_mermaid()}

## 6. ストック・フロー図（SFD）
{_sfd_mermaid()}

## 7. 出力ファイル
- `outputs/user_adoption.png`
- `outputs/recycling_impact.png`
- `outputs/pollution_reduction.png`
- `outputs/economic_impact.png`
- `outputs/awareness_growth.png`
- `outputs/co2_reduction.png`
- `outputs/dashboard.png`

Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

    output_file.write_text(content, encoding="utf-8")
    print(f"Report generated: {output_file}")


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    model_file = base_dir / "riverguard_model.mdl"
    output_dir = base_dir / "outputs"
    report_file = base_dir / "impact_report.md"

    if not model_file.exists():
        raise SystemExit(f"Model file not found: {model_file}")

    print("[1/4] Running data checks")
    validate_bandung_data()
    calculate_economic_parameters()

    print("[2/4] Running simulation")
    results = run_model(model_file)

    print("[3/4] Rendering charts")
    plot_results(results, output_dir)

    print("[4/4] Writing report")
    generate_report(results, report_file)

    print("Completed. Outputs generated in:")
    print(f"- {output_dir}")
    print(f"- {report_file}")


if __name__ == "__main__":
    main()
