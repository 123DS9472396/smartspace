"""
Research Paper: Complete Formula Reference — SmartSpace Warehouse Platform
==========================================================================
Every formula shown here is 100% extracted from the actual project source code.
Source files: ml-algorithms.ts, advanced-ml-algorithms.ts, advanced-llm-service.ts,
             smartBookingService.ts, aiService.ts, PricingRecommendationModal.tsx,
             documentAnalysisService.ts, freeLLMService.ts

This script generates:
  Fig 1 — Smart Booking Pipeline: User Click → 4-Stage LLM Formula Flow
  Fig 2 — ML Recommendation Formulas: All 5 Algorithms Step-by-Step
  Fig 3 — LLM Recommendation Scoring Formula Breakdown
  Fig 4 — Pricing Engine Formula (What Runs When Owner Lists Property)
  Fig 5 — Document Verification Scoring Formula
  Fig 6 — Ensemble Aggregation & Final Score Calibration
  Fig 7 — Complete Formula Map: Every User Action → Backend Formula

  Table 1 — Master Formula Reference Table
  Table 2 — Temperature & Token Config Per Feature
  Table 3 — LLM Fallback Chain Per Service
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
import os

# ─── Global Style ───
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Arial', 'DejaVu Sans'],
    'font.size': 10,
    'axes.titlesize': 13,
    'axes.titleweight': 'bold',
    'figure.facecolor': 'white',
    'savefig.dpi': 300,
    'savefig.bbox': 'tight'
})

COLORS = {
    'llm': '#2563EB',
    'ml': '#059669',
    'user': '#7C3AED',
    'formula': '#DC2626',
    'result': '#D97706',
    'bg_light': '#F8FAFC',
    'bg_card': '#EFF6FF',
    'accent': '#0EA5E9',
    'dark': '#1E293B',
    'gray': '#64748B'
}

output_dir = 'formula_outputs'
os.makedirs(output_dir, exist_ok=True)

def save_fig(fig, name):
    fig.savefig(f'{output_dir}/{name}.png', dpi=300, bbox_inches='tight', facecolor='white')
    fig.savefig(f'{output_dir}/{name}.pdf', bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print(f'  ✅ Saved {name}.png + .pdf')

# ═══════════════════════════════════════════════════════════════════════
# FIG 1 — SMART BOOKING PIPELINE: User Click → 4-Stage LLM Formulas
# ═══════════════════════════════════════════════════════════════════════
def fig1_smart_booking_pipeline():
    fig, ax = plt.subplots(figsize=(18, 14))
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 14)
    ax.axis('off')
    fig.patch.set_facecolor('white')

    # Title
    ax.text(9, 13.5, 'Smart Booking: Complete Formula Pipeline',
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['dark'])
    ax.text(9, 13.05, 'Source: smartBookingService.ts — What happens when user clicks "Smart Booking"',
            ha='center', va='center', fontsize=10, color=COLORS['gray'], style='italic')

    # USER ACTION BOX
    bbox = FancyBboxPatch((0.5, 11.8), 5.5, 1.0, boxstyle="round,pad=0.15",
                          facecolor=COLORS['user'], edgecolor='white', alpha=0.9)
    ax.add_patch(bbox)
    ax.text(3.25, 12.45, 'USER ACTION', ha='center', va='center',
            fontsize=12, fontweight='bold', color='white')
    ax.text(3.25, 12.05, 'Enters: space, location, budget, goods type',
            ha='center', va='center', fontsize=9, color='#E8DAEF')

    # Arrow down
    ax.annotate('', xy=(3.25, 11.7), xytext=(3.25, 11.8),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))

    # STAGE 1: Natural Language Parser
    stages = [
        {
            'y': 10.0, 'title': 'STAGE 1: Natural Language Parser',
            'model': 'Meta Llama 3.3 70B (via Groq)',
            'config': 'temp = 0.1  |  max_tokens = 500',
            'formula': 'Input: "I need 400 sqft in Thane with low budget"',
            'output': 'Output JSON: {space: 400, location: "Thane", budget: 40,\n                       type: null, goods: null, urgency: "medium"}',
            'color': COLORS['llm']
        },
        {
            'y': 7.5, 'title': 'STAGE 2: Goods → Type Inference',
            'model': 'Meta Llama 3.3 70B (via Groq)',
            'config': 'temp = 0.1  |  max_tokens = 150',
            'formula': 'HEURISTIC FIRST: regex match → Cold Storage, Pharma, etc.',
            'output': 'IF heuristic fails → LLM maps goods to WAREHOUSE_TYPES[]\nOutput: {preferredType: "Cold Storage"}',
            'color': COLORS['llm']
        },
        {
            'y': 5.0, 'title': 'STAGE 3: Booking Analysis + Optimization',
            'model': 'Meta Llama 3.3 70B (via Groq)',
            'config': 'temp = 0.3  |  max_tokens = 800',
            'formula': 'BLOCK GENERATION PER WAREHOUSE:\n  blockSize = min(400, max(100, availableArea / 20))\n  numBlocks = max(1, min(15, floor(availableArea / blockSize)))',
            'output': 'MATCH SCORE: base=70 + (area≥req → +15)\n  + (price≤budget → +10) + (verified → +5)\nLLM picks bestOptionId from top 5 options',
            'color': '#0369A1'
        },
        {
            'y': 2.5, 'title': 'STAGE 4: Block Selection (Grid Optimizer)',
            'model': 'Meta Llama 3.3 70B (via Groq)',
            'config': 'temp = 0.1  |  max_tokens = 300',
            'formula': 'CRITERIA: 1) Meet/exceed required space\n  2) Minimize total cost  3) Prefer contiguous blocks\n  4) Minimize number of blocks selected',
            'output': 'Fallback (if LLM fails): Greedy sort by\n  price ASC → blockNumber ASC → select until area ≥ req',
            'color': COLORS['llm']
        }
    ]

    for s in stages:
        # Main box
        bbox = FancyBboxPatch((0.3, s['y'] - 0.3), 17.4, 2.2, boxstyle="round,pad=0.15",
                              facecolor='#F0F9FF', edgecolor=s['color'], linewidth=2)
        ax.add_patch(bbox)

        # Stage title
        ax.text(0.7, s['y'] + 1.6, s['title'],
                fontsize=11, fontweight='bold', color=s['color'])

        # Model badge
        ax.text(14.5, s['y'] + 1.6, s['model'],
                fontsize=8, color='white', ha='right',
                bbox=dict(boxstyle='round,pad=0.3', facecolor=s['color'], alpha=0.85))

        # Config
        ax.text(15.5, s['y'] + 1.6, s['config'],
                fontsize=7.5, color=COLORS['gray'], ha='left')

        # Formula
        ax.text(0.7, s['y'] + 0.85, s['formula'],
                fontsize=8.5, fontfamily='monospace', color=COLORS['dark'])

        # Output
        ax.text(0.7, s['y'] + 0.05, s['output'],
                fontsize=8.5, fontfamily='monospace', color=COLORS['formula'])

    # Arrows between stages
    for i in range(3):
        y_top = stages[i]['y'] - 0.3
        y_bot = stages[i+1]['y'] + 1.9
        ax.annotate('', xy=(9, y_bot + 0.1), xytext=(9, y_top),
                    arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=1.5))

    # FINAL RESULT
    bbox = FancyBboxPatch((4, 0.1), 10, 0.9, boxstyle="round,pad=0.15",
                          facecolor=COLORS['result'], edgecolor='white', alpha=0.9)
    ax.add_patch(bbox)
    ax.text(9, 0.55, 'RESULT: BookingAnalysis { options[], bestOption, llmSummary, marketInsights }',
            ha='center', va='center', fontsize=9.5, fontweight='bold', color='white')

    save_fig(fig, 'Fig1_Smart_Booking_Pipeline_Formulas')

# ═══════════════════════════════════════════════════════════════════════
# FIG 2 — ML RECOMMENDATION: All 5 Algorithm Formulas
# ═══════════════════════════════════════════════════════════════════════
def fig2_ml_algorithm_formulas():
    fig, axes = plt.subplots(3, 2, figsize=(18, 20))
    fig.suptitle('ML Recommendation: All 5 Algorithm Formulas (100% From Source Code)',
                 fontsize=16, fontweight='bold', y=0.98, color=COLORS['dark'])
    fig.text(0.5, 0.96, 'Source: shared/ml-algorithms.ts (1563 lines)',
             ha='center', fontsize=10, color=COLORS['gray'], style='italic')

    algo_data = [
        {
            'title': 'Algorithm 1: K-Nearest Neighbors (K=8)',
            'formulas': [
                ('Feature Weights (8-dim vector):', '', '#1E40AF'),
                ('  w = {location: 6.0, price: 2.5, area: 2.0,', '', '#333'),
                ('       type: 1.5, rating: 1.0, amenities: 0.8,', '', '#333'),
                ('       verification: 1.0, availability: 1.0}', '', '#333'),
                ('', '', '#333'),
                ('Weighted Euclidean Distance:', '', '#1E40AF'),
                ('  d² = Σ wᵢ · (xᵢ − idealᵢ)²', '', COLORS['formula']),
                ('  distance = √(d²) / √(Σ wᵢ)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Similarity Score:', '', '#1E40AF'),
                ('  score = 1 − normalized_distance', '', COLORS['formula']),
                ('  Return top K=8 nearest warehouses', '', COLORS['gray']),
            ]
        },
        {
            'title': 'Algorithm 2: Random Forest (50 Trees)',
            'formulas': [
                ('Bootstrap Aggregation (Bagging):', '', '#1E40AF'),
                ('  sampleSize = floor(N × 0.80)', '', COLORS['formula']),
                ('  For each tree t = 1..50:', '', '#333'),
                ('    sample = random_with_replacement(N, 0.8)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Feature Bagging:', '', '#1E40AF'),
                ('  numFeatures = floor(√(total_features))', '', COLORS['formula']),
                ('  selected = random_subset(features, numFeatures)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Voting Mechanism:', '', '#1E40AF'),
                ('  For top-K in each tree:', '', '#333'),
                ('    vote_weight = K − rank', '', COLORS['formula']),
                ('  Final: sort by total votes', '', COLORS['gray']),
            ]
        },
        {
            'title': 'Algorithm 3: Gradient Boosting (10 iter, η=0.1)',
            'formulas': [
                ('Initial Prediction:', '', '#1E40AF'),
                ('  F₀(x) = 0.5  (uniform for all warehouses)', '', COLORS['formula']),
                ('', '', '#333'),
                ('True Label (per warehouse):', '', '#1E40AF'),
                ('  y = 0.4×location + 0.3×area +', '', COLORS['formula']),
                ('      0.2×(1−price_ratio) + 0.1×(rating/5)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Iterative Update (m = 1..10):', '', '#1E40AF'),
                ('  residual = y − Fₘ₋₁(x)', '', COLORS['formula']),
                ('  h(x) = 0.4L + 0.25A + 0.2P + 0.1R + 0.05V', '', COLORS['formula']),
                ('  Fₘ(x) = Fₘ₋₁(x) + η × h(x) × sign(r)', '', COLORS['formula']),
                ('  where η = 0.1 (learning rate)', '', COLORS['gray']),
            ]
        },
        {
            'title': 'Algorithm 4: Neural Network (10→10→4→1)',
            'formulas': [
                ('Input Layer (10 neurons):', '', '#1E40AF'),
                ('  [locMatch, priceNorm, areaNorm, availRatio,', '', COLORS['formula']),
                ('   ratingNorm, verified, amenity, typeMatch,', '', COLORS['formula']),
                ('   reviewCount, priceCompetitive]', '', COLORS['formula']),
                ('', '', '#333'),
                ('Hidden Layer 1: Leaky ReLU activation', '', '#1E40AF'),
                ('  h₁ᵢ = LeakyReLU(xᵢ × wᵢ − 0.5, α=0.01)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Hidden Layer 2 (Cross-feature, 4 neurons):', '', '#1E40AF'),
                ('  h₂₁ = LeakyReLU(h₁[loc] × h₁[area] × 1.5)', '', COLORS['formula']),
                ('  h₂₂ = LeakyReLU(h₁[price] × h₁[rating] × 1.2)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Output: σ(0.35·h₂₁ + 0.25·h₂₂ + 0.15·h₂₃ + 0.25·h₂₄)', '', COLORS['formula']),
            ]
        },
        {
            'title': 'Algorithm 5: Hybrid Stacking (KNN + RF Meta-Learner)',
            'formulas': [
                ('Step 1: License Filter', '', '#1E40AF'),
                ('  Exclude expired licenses (daysRemaining ≤ 0)', '', COLORS['formula']),
                ('  Expiring score = 0.3 + 0.7×(days/90)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Step 2: Run Base Learners', '', '#1E40AF'),
                ('  knnResults = KNN(warehouses, prefs, K=8)', '', COLORS['formula']),
                ('  rfResults  = RF(warehouses, prefs, T=50)', '', COLORS['formula']),
                ('', '', '#333'),
                ('Step 3: Meta-Learning Fusion', '', '#1E40AF'),
                ('  metaScore = Σ (featureᵢ × weightᵢ) / Σ weightᵢ', '', COLORS['formula']),
                ('  location_weight = 5.0 (if specified, else 0.5)', '', COLORS['formula']),
                ('  price_weight = 2.0  |  area_weight = 1.5', '', COLORS['gray']),
                ('', '', '#333'),
                ('Step 4: Calibration', '', '#1E40AF'),
                ('  final = 0.50 + (score − 0.5) × 0.96', '', COLORS['formula']),
                ('  Clamp to [0.45, 0.98]', '', COLORS['gray']),
            ]
        },
    ]

    for idx, algo in enumerate(algo_data):
        row, col = divmod(idx, 2)
        ax = axes[row][col]
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        ax.axis('off')
        ax.set_facecolor('#FAFAFA')

        # Title bar
        bbox = FancyBboxPatch((0.1, 8.8), 9.8, 1.0, boxstyle="round,pad=0.1",
                              facecolor=COLORS['ml'], edgecolor='white')
        ax.add_patch(bbox)
        ax.text(5, 9.3, algo['title'], ha='center', va='center',
                fontsize=11, fontweight='bold', color='white')

        # Formulas
        y = 8.3
        for text, _, color in algo['formulas']:
            if text:
                ax.text(0.4, y, text, fontsize=8.5, fontfamily='monospace',
                        color=color, va='center')
            y -= 0.55

    # Last subplot: empty → use for summary
    ax = axes[2][1]
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')
    ax.set_facecolor('#F0FDF4')

    bbox = FancyBboxPatch((0.1, 8.8), 9.8, 1.0, boxstyle="round,pad=0.1",
                          facecolor=COLORS['result'], edgecolor='white')
    ax.add_patch(bbox)
    ax.text(5, 9.3, '5-Algorithm Ensemble Aggregation', ha='center', va='center',
            fontsize=11, fontweight='bold', color='white')

    ensemble_text = [
        ('DYNAMIC WEIGHTS (from advancedEnsembleRecommend):', '', '#1E40AF'),
        ('  w_knn = 0.25  |  w_rf = 0.25  |  w_gb = 0.20', '', COLORS['formula']),
        ('  w_nn  = 0.15  |  w_stacking = 0.15', '', COLORS['formula']),
        ('', '', ''),
        ('ENSEMBLE SCORE:', '', '#1E40AF'),
        ('  E = 0.25×KNN + 0.25×RF + 0.20×GB', '', COLORS['formula']),
        ('      + 0.15×NN + 0.15×Stacking', '', COLORS['formula']),
        ('', '', ''),
        ('FINAL SCORE (scaled to 50-100% range):', '', '#1E40AF'),
        ('  Final = 0.5 + (E × 0.5)', '', COLORS['formula']),
        ('', '', ''),
        ('CONFIDENCE:', '', '#1E40AF'),
        ('  C = 1 − min(σ(scores), 0.3) / 0.3', '', COLORS['formula']),
        ('  σ = standard deviation of 5 algo scores', '', COLORS['gray']),
    ]

    y = 8.3
    for text, _, color in ensemble_text:
        if text:
            ax.text(0.4, y, text, fontsize=8.5, fontfamily='monospace',
                    color=color, va='center')
        y -= 0.55

    fig.subplots_adjust(hspace=0.25, wspace=0.15)
    save_fig(fig, 'Fig2_ML_Algorithm_Formulas')

# ═══════════════════════════════════════════════════════════════════════
# FIG 3 — LLM RECOMMENDATION SCORING FORMULA
# ═══════════════════════════════════════════════════════════════════════
def fig3_llm_scoring_formula():
    fig, ax = plt.subplots(figsize=(16, 12))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(8, 11.5, 'LLM Recommendation: Composite Scoring Formula',
            ha='center', fontsize=16, fontweight='bold', color=COLORS['dark'])
    ax.text(8, 11.1, 'Source: shared/advanced-llm-service.ts — Prompt-embedded scoring criteria',
            ha='center', fontsize=10, color=COLORS['gray'], style='italic')

    # Main formula box
    bbox = FancyBboxPatch((1, 9.2), 14, 1.5, boxstyle="round,pad=0.2",
                          facecolor='#EFF6FF', edgecolor=COLORS['llm'], linewidth=3)
    ax.add_patch(bbox)
    ax.text(8, 10.2, 'S = 0.30 × Location + 0.25 × Price + 0.25 × Size + 0.20 × Quality',
            ha='center', fontsize=14, fontweight='bold', fontfamily='monospace', color=COLORS['formula'])
    ax.text(8, 9.6, 'Model: llama-3.3-70b-versatile  |  temp = 0.3  |  max_tokens = 4096  |  format: json_object',
            ha='center', fontsize=9, color=COLORS['gray'])

    # 4 component boxes
    components = [
        {
            'x': 0.5, 'title': 'LOCATION (30%)',
            'rules': [
                'Exact district = 1.0',
                'Same region    = 0.7',
                'Different      = 0.3',
            ],
            'color': '#1E40AF'
        },
        {
            'x': 4.3, 'title': 'PRICE (25%)',
            'rules': [
                'Within budget       = 1.0',
                'Within 10% over     = 0.8',
                'Within 20% over     = 0.6',
                'More than 20% over  = 0.3',
            ],
            'color': '#047857'
        },
        {
            'x': 8.1, 'title': 'SIZE (25%)',
            'rules': [
                'Meets minimum   = 1.0',
                'Within 10%      = 0.8',
                'Below required  = 0.5',
            ],
            'color': '#B45309'
        },
        {
            'x': 11.9, 'title': 'QUALITY (20%)',
            'rules': [
                'Rating ≥ 4.5     = 1.0',
                'Rating ≥ 4.0     = 0.8',
                'Rating ≥ 3.5     = 0.6',
                'Verified bonus   = +0.1',
            ],
            'color': '#7C2D12'
        }
    ]

    for comp in components:
        bbox = FancyBboxPatch((comp['x'], 5.5), 3.5, 3.2, boxstyle="round,pad=0.15",
                              facecolor='#FAFAFA', edgecolor=comp['color'], linewidth=2)
        ax.add_patch(bbox)
        ax.text(comp['x'] + 1.75, 8.35, comp['title'],
                ha='center', fontsize=10, fontweight='bold', color=comp['color'])

        y = 7.8
        for rule in comp['rules']:
            ax.text(comp['x'] + 0.3, y, rule,
                    fontsize=8.5, fontfamily='monospace', color=COLORS['dark'])
            y -= 0.5

    # Fallback chain
    ax.text(8, 4.8, 'LLM FALLBACK CHAIN (advanced-llm-service.ts)', ha='center',
            fontsize=12, fontweight='bold', color=COLORS['dark'])

    chain_boxes = [
        ('Groq\nLlama 3.3 70B', COLORS['llm'], 1.5),
        ('OpenRouter\nClaude 3 Haiku', '#7C3AED', 5.5),
        ('Gemini\n1.5 Flash', '#D97706', 9.5),
        ('Local ML\nFallback', COLORS['ml'], 13.0),
    ]

    for label, color, x in chain_boxes:
        bbox = FancyBboxPatch((x, 3.3), 2.8, 1.2, boxstyle="round,pad=0.15",
                              facecolor=color, edgecolor='white', alpha=0.85)
        ax.add_patch(bbox)
        ax.text(x + 1.4, 3.9, label, ha='center', va='center',
                fontsize=9, fontweight='bold', color='white')

    # Arrows between chain
    for i in range(3):
        x_start = chain_boxes[i][2] + 2.8
        x_end = chain_boxes[i+1][2]
        ax.annotate('', xy=(x_end, 3.9), xytext=(x_start, 3.9),
                    arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=1.5))
        ax.text((x_start + x_end) / 2, 4.15, 'fails →', ha='center', fontsize=7, color=COLORS['gray'])

    # Bottom: aiService.ts fallback
    ax.text(8, 2.5, 'CLIENT-SIDE FALLBACK CHAIN (aiService.ts)', ha='center',
            fontsize=12, fontweight='bold', color=COLORS['dark'])

    client_chain = [
        ('Groq\nLlama 3.3 70B', COLORS['llm'], 0.8),
        ('OpenRouter\nClaude 3.5 Sonnet', '#7C3AED', 4.5),
        ('Cloudflare\nLlama 3.1 8B', '#DC2626', 8.3),
        ('Gemini\nPro', '#D97706', 12.0),
    ]

    for label, color, x in client_chain:
        bbox = FancyBboxPatch((x, 1.0), 3.0, 1.2, boxstyle="round,pad=0.15",
                              facecolor=color, edgecolor='white', alpha=0.8)
        ax.add_patch(bbox)
        ax.text(x + 1.5, 1.6, label, ha='center', va='center',
                fontsize=8.5, fontweight='bold', color='white')

    for i in range(3):
        xs = client_chain[i][2] + 3.0
        xe = client_chain[i+1][2]
        ax.annotate('', xy=(xe, 1.6), xytext=(xs, 1.6),
                    arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=1.5))

    save_fig(fig, 'Fig3_LLM_Scoring_Formula')

# ═══════════════════════════════════════════════════════════════════════
# FIG 4 — PRICING ENGINE FORMULA
# ═══════════════════════════════════════════════════════════════════════
def fig4_pricing_formula():
    fig, ax = plt.subplots(figsize=(16, 10))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(8, 9.5, 'Pricing Engine: What Runs When Owner Clicks "Get AI Price"',
            ha='center', fontsize=15, fontweight='bold', color=COLORS['dark'])
    ax.text(8, 9.1, 'Source: PricingRecommendationModal.tsx',
            ha='center', fontsize=10, color=COLORS['gray'], style='italic')

    # Main formula
    bbox = FancyBboxPatch((1.5, 7.3), 13, 1.5, boxstyle="round,pad=0.2",
                          facecolor='#FEF3C7', edgecolor=COLORS['result'], linewidth=3)
    ax.add_patch(bbox)
    ax.text(8, 8.25, 'BaseRate = avg(nearby_prices) × TypeBoost × AmenityBoost × SizeBoost',
            ha='center', fontsize=13, fontweight='bold', fontfamily='monospace', color=COLORS['formula'])
    ax.text(8, 7.65, 'Recommended = max(10, BaseRate)   |   Min = Recommended × 0.9   |   Max = Recommended × 1.1',
            ha='center', fontsize=9.5, fontfamily='monospace', color=COLORS['dark'])

    # Step-by-step
    steps = [
        ('(1) Fetch Nearby Data', 'SELECT price_per_sqft, occupancy FROM warehouses\n  WHERE city ILIKE \'%{city}%\' LIMIT 200\n  avgPrice = Σ(prices) / count   (filter > 0)'),
        ('(2) Demand Score', 'avgOccupancy = Σ(occupancy) / count\n  IF avgOccupancy > 1: avgOccupancy /= 100\n  demandScore = clamp(round(avgOccupancy × 10), 1, 10)'),
        ('(3) Boost Factors', 'TypeBoost:    cold/pharma/temp → 1.12,  else → 1.0\nAmenityBoost: ≥6 amenities → 1.08,  else → 1.03\nSizeBoost:    ≥50K sqft → 0.95,  ≥20K → 0.98\n              ≤5K → 1.05,  else → 1.0'),
        ('(4) Confidence', 'IF analyzedCount > 25: confidence = 0.82\n  ELSE: confidence = 0.65'),
        ('(5) LLM Insight', 'Model: Llama 3.3 70B (via Groq)\n  temp = 0.3  |  max_tokens = 200\n  System: "business-friendly pricing insights"')
    ]

    y = 6.8
    for title, formula in steps:
        bbox = FancyBboxPatch((0.5, y - 1.0), 15, 1.15, boxstyle="round,pad=0.1",
                              facecolor='#FFFBEB', edgecolor='#F59E0B', linewidth=1)
        ax.add_patch(bbox)
        ax.text(0.8, y - 0.15, title, fontsize=10, fontweight='bold', color=COLORS['result'])
        ax.text(3.5, y - 0.15, formula, fontsize=8, fontfamily='monospace', color=COLORS['dark'],
                va='top')
        y -= 1.4

    save_fig(fig, 'Fig4_Pricing_Engine_Formula')

# ═══════════════════════════════════════════════════════════════════════
# FIG 5 — DOCUMENT VERIFICATION SCORING
# ═══════════════════════════════════════════════════════════════════════
def fig5_document_verification():
    fig, ax = plt.subplots(figsize=(16, 10))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(8, 9.5, 'Document Verification: Scoring Formula',
            ha='center', fontsize=15, fontweight='bold', color=COLORS['dark'])
    ax.text(8, 9.1, 'Source: documentAnalysisService.ts + freeLLMService.ts',
            ha='center', fontsize=10, color=COLORS['gray'], style='italic')

    # Main formula
    bbox = FancyBboxPatch((1, 7.8), 14, 1.0, boxstyle="round,pad=0.15",
                          facecolor='#F0FDF4', edgecolor=COLORS['ml'], linewidth=3)
    ax.add_patch(bbox)
    ax.text(8, 8.3, 'Total Score = GST(25) + PAN(25) + Phone(15) + Documents(20) + Completeness(15)',
            ha='center', fontsize=12, fontweight='bold', fontfamily='monospace', color=COLORS['formula'])

    # Component breakdown
    components = [
        ('GST Format (25 pts)', 'Regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/\nValid format → 25 pts  |  Invalid → 0 pts', 0.5, 7.0),
        ('PAN Format (25 pts)', 'Regex: /^[A-Z]{5}[0-9]{4}[A-Z]$/\nValid format → 25 pts  |  Invalid → 0 pts', 0.5, 6.0),
        ('Phone Verify (15 pts)', 'Regex: /^[6-9][0-9]{9}$/  (Indian mobile)\n10-digit starting with 6-9 → 15 pts', 0.5, 5.0),
        ('Document Check (20 pts)', 'ML Pipeline: TF.js MobileNet (image classification)\n  + Tesseract.js OCR (text extraction)\nDocument present & readable → 20 pts', 0.5, 3.8),
        ('Completeness (15 pts)', 'All required fields filled → 15 pts\nPartial → proportional score', 0.5, 2.8),
    ]

    for title, desc, x, y in components:
        bbox = FancyBboxPatch((x, y - 0.3), 7.5, 0.9, boxstyle="round,pad=0.1",
                              facecolor='#F8FAFC', edgecolor=COLORS['ml'], linewidth=1)
        ax.add_patch(bbox)
        ax.text(x + 0.3, y + 0.35, title, fontsize=9.5, fontweight='bold', color=COLORS['ml'])
        ax.text(x + 0.3, y - 0.05, desc, fontsize=7.5, fontfamily='monospace', color=COLORS['dark'])

    # Thresholds
    bbox = FancyBboxPatch((8.5, 2.5), 7, 4.7, boxstyle="round,pad=0.2",
                          facecolor='#FEF2F2', edgecolor=COLORS['formula'], linewidth=2)
    ax.add_patch(bbox)
    ax.text(12, 6.85, 'DECISION THRESHOLDS', ha='center',
            fontsize=11, fontweight='bold', color=COLORS['formula'])

    thresholds = [
        ('>= 80 pts', 'APPROVE', '#059669', '-> Auto-approved, listing goes live'),
        ('>= 60 pts', 'REVIEW', '#D97706', '-> Manual review by admin required'),
        ('>= 40 pts', 'CAUTION', '#EA580C', '-> Additional documents requested'),
        ('< 40 pts', 'REJECT', '#DC2626', '-> Application rejected'),
    ]

    y = 6.2
    for score, status, color, desc in thresholds:
        ax.text(9.0, y, score, fontsize=10, fontweight='bold', fontfamily='monospace', color=color)
        ax.text(10.5, y, status, fontsize=10, fontweight='bold', color=color)
        ax.text(12.5, y, desc, fontsize=8, color=COLORS['dark'])
        y -= 0.85

    # LLM Enhancement
    ax.text(12, 3.2, 'LLM Enhancement (freeLLMService.ts):', fontsize=9,
            fontweight='bold', color=COLORS['llm'])
    ax.text(12, 2.8, 'Fallback: OpenRouter (Llama 3.2 3B)\n→ Cloudflare (Llama 3.3 70B)\n→ Groq → HuggingFace (Mistral 7B)',
            ha='center', fontsize=8, fontfamily='monospace', color=COLORS['dark'])

    save_fig(fig, 'Fig5_Document_Verification_Formula')

# ═══════════════════════════════════════════════════════════════════════
# FIG 6 — ENSEMBLE CALIBRATION & ADVANCED ML
# ═══════════════════════════════════════════════════════════════════════
def fig6_ensemble_calibration():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(18, 9))

    # LEFT: Ensemble from advanced-ml-algorithms.ts
    ax1.set_xlim(0, 10)
    ax1.set_ylim(0, 10)
    ax1.axis('off')
    ax1.set_facecolor('#FAFAFA')

    ax1.text(5, 9.5, 'Advanced 5-Algo Ensemble', ha='center',
             fontsize=13, fontweight='bold', color=COLORS['dark'])
    ax1.text(5, 9.1, 'Source: advanced-ml-algorithms.ts', ha='center',
             fontsize=9, color=COLORS['gray'], style='italic')

    algos_adv = [
        ('KNN (0.25)', 'Gaussian kernel: exp(−d²/2σ²)\nσ = 0.8, d = euclidean(x, ideal)'),
        ('Content-Based (0.25)', 'TF-IDF style: location(0.35) + price(0.25)\n  + area(0.20) + type(0.10) + quality(0.10)'),
        ('Collaborative (0.20)', 'popularity(0.4) + verified(0.15)\n  + demand(0.25) + priceCompetitive(0.20)'),
        ('Neural Net (0.15)', 'H1: σ(x₁×1.5 + x₂×0.8 − 0.5)\nH2: σ(h₁×1.2 + h₂×0.8 + h₃×0.6 − 0.5)\nOut: σ(h₂₁×1.3 + h₂₂×1.1 − 0.8)'),
        ('Bayesian (0.15)', 'posterior = (prior × likelihood) /\n  (prior×like + (1−prior)×(1−like) + 0.01)')
    ]

    y = 8.4
    for title, formula in algos_adv:
        bbox = FancyBboxPatch((0.2, y - 0.7), 9.6, 1.15, boxstyle="round,pad=0.1",
                              facecolor='#EFF6FF', edgecolor=COLORS['llm'], linewidth=1)
        ax1.add_patch(bbox)
        ax1.text(0.5, y + 0.15, title, fontsize=9, fontweight='bold', color=COLORS['llm'])
        ax1.text(3.5, y + 0.05, formula, fontsize=7.5, fontfamily='monospace', color=COLORS['dark'],
                 va='top')
        y -= 1.55

    # Final formula
    ax1.text(5, 1.1, 'E = 0.25×KNN + 0.25×CB + 0.20×CF + 0.15×NN + 0.15×Bay',
             ha='center', fontsize=9, fontweight='bold', fontfamily='monospace', color=COLORS['formula'])
    ax1.text(5, 0.65, 'Final = 0.5 + (E × 0.5)     →  Range: [0.50, 1.00]',
             ha='center', fontsize=9, fontfamily='monospace', color=COLORS['ml'])

    # RIGHT: Score Calibration from ml-algorithms.ts
    ax2.set_xlim(0, 10)
    ax2.set_ylim(0, 10)
    ax2.axis('off')
    ax2.set_facecolor('#FAFAFA')

    ax2.text(5, 9.5, 'Score Calibration Pipeline', ha='center',
             fontsize=13, fontweight='bold', color=COLORS['dark'])
    ax2.text(5, 9.1, 'Source: ml-algorithms.ts (advancedEnsembleRecommend)', ha='center',
             fontsize=9, color=COLORS['gray'], style='italic')

    calibration_steps = [
        ('Step 1: Raw Ensemble Score', 'raw = Σ(algoᵢ × weightᵢ)\nwhere weights adapt to user preferences'),
        ('Step 2: Hard Constraint Bonus', 'IF location match:   bonus += 0.15\nIF area ≥ minimum:   bonus += 0.10\nIF price ≤ budget:   bonus += 0.05'),
        ('Step 3: Score Calibration', 'IF boosted ≥ 0.7:\n  cal = 0.85 + (boosted − 0.7) × 0.47\nIF boosted ≥ 0.5:\n  cal = 0.70 + (boosted − 0.5) × 0.75\nELSE:\n  cal = 0.50 + boosted × 0.40'),
        ('Step 4: Final Clamp', 'finalScore = clamp(calibrated, 0.50, 0.99)'),
        ('Step 5: Confidence Metric', 'variance = Σ(sᵢ − mean)² / 5\nconfidence = max(0.5, 1 − √variance × 2)')
    ]

    y = 8.3
    for title, formula in calibration_steps:
        bbox = FancyBboxPatch((0.2, y - 0.8), 9.6, 1.3, boxstyle="round,pad=0.1",
                              facecolor='#F0FDF4', edgecolor=COLORS['ml'], linewidth=1)
        ax2.add_patch(bbox)
        ax2.text(0.5, y + 0.15, title, fontsize=9.5, fontweight='bold', color=COLORS['ml'])
        ax2.text(0.5, y - 0.25, formula, fontsize=8, fontfamily='monospace', color=COLORS['dark'],
                 va='top')
        y -= 1.6

    fig.suptitle('Ensemble Aggregation & Final Score Calibration',
                 fontsize=16, fontweight='bold', y=1.0, color=COLORS['dark'])
    fig.subplots_adjust(wspace=0.15)
    save_fig(fig, 'Fig6_Ensemble_Calibration')

# ═══════════════════════════════════════════════════════════════════════
# FIG 7 — COMPLETE FORMULA MAP: Every User Action → Formula
# ═══════════════════════════════════════════════════════════════════════
def fig7_complete_formula_map():
    fig, ax = plt.subplots(figsize=(20, 16))
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 16)
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(10, 15.5, 'Complete Formula Map: Every User Action → Backend Formula',
            ha='center', fontsize=17, fontweight='bold', color=COLORS['dark'])
    ax.text(10, 15.0, '100% extracted from SmartSpace source code — No theoretical formulas',
            ha='center', fontsize=10, color=COLORS['gray'], style='italic')

    actions = [
        {
            'action': '[ML] User Clicks "Get Recommendations"',
            'backend': 'ML 5-Algorithm Ensemble',
            'formulas': [
                'KNN: d = √(Σ wᵢ(xᵢ−idealᵢ)²) / √(Σwᵢ) ; score = 1−d',
                'RF: 50 trees, 80% bootstrap, √n features, vote_weight = K−rank',
                'GB: Fₘ = Fₘ₋₁ + 0.1 × h(x) × sign(residual), 10 iterations',
                'NN: σ(0.35·h₂₁ + 0.25·h₂₂ + 0.15·h₂₃ + 0.25·h₂₄)',
                'Stacking: metaScore = Σ(featureᵢ × weightᵢ) / Σwᵢ',
                'Ensemble: E = 0.25·KNN + 0.25·RF + 0.20·GB + 0.15·NN + 0.15·Stack',
            ],
            'color': COLORS['ml'], 'y': 12.8
        },
        {
            'action': '[LLM] User Switches to "LLM Mode"',
            'backend': 'Llama 3.3 70B (Groq API)',
            'formulas': [
                'S = 0.30×Location + 0.25×Price + 0.25×Size + 0.20×Quality',
                'Location: exact=1.0, same_region=0.7, different=0.3',
                'Quality: rating≥4.5→1.0, ≥4.0→0.8, verified→+0.1',
                'temp=0.3, max_tokens=4096, json_object format',
            ],
            'color': COLORS['llm'], 'y': 10.3
        },
        {
            'action': '[BOOKING] User Clicks "Smart Booking"',
            'backend': '4-Stage LLM Pipeline',
            'formulas': [
                'Stage 1: NL Parser → extract JSON (temp=0.1, 500 tokens)',
                'Stage 2: Goods→Type heuristic OR LLM (temp=0.1, 150 tokens)',
                'Stage 3: Block gen: size=min(400,max(100,area/20)), n=min(15,area/size)',
                'Stage 4: Block select: minimize cost, prefer contiguous (temp=0.1, 300)',
            ],
            'color': '#0369A1', 'y': 8.1
        },
        {
            'action': '[PRICE] Owner Clicks "Get AI Price"',
            'backend': 'Pricing Engine + LLM Insight',
            'formulas': [
                'BaseRate = avg(nearby_prices) × TypeBoost × AmenityBoost × SizeBoost',
                'TypeBoost: cold/pharma→1.12 | AmenityBoost: ≥6→1.08, else→1.03',
                'SizeBoost: ≥50K→0.95, ≤5K→1.05 | Confidence: >25→0.82, else→0.65',
                'LLM insight: temp=0.3, max_tokens=200 (Llama 3.3 70B)',
            ],
            'color': COLORS['result'], 'y': 5.9
        },
        {
            'action': '[VERIFY] Owner Submits Documents',
            'backend': 'ML (MobileNet+OCR) + Score',
            'formulas': [
                'Score = GST_regex(25) + PAN_regex(25) + Phone_regex(15)',
                '      + ML_doc_check(20) + Completeness(15)',
                '≥80→APPROVE | ≥60→REVIEW | ≥40→CAUTION | <40→REJECT',
                'LLM enhance: OpenRouter(3.2 3B)→Cloudflare(70B)→Groq→HF',
            ],
            'color': '#9333EA', 'y': 3.7
        },
        {
            'action': '[CHAT] User Sends Chat Message',
            'backend': 'Chatbot + Smart Routing',
            'formulas': [
                'IF booking keywords detected → route to smartBookingService',
                'ELSE → aiService.getAIResponse(temp=0.7, max_tokens=800)',
                'System: "SmartSpace AI Assistant, Maharashtra warehouse expert"',
                'Fallback: Groq→OpenRouter→Cloudflare→Gemini',
            ],
            'color': '#0891B2', 'y': 1.5
        },
    ]

    for act in actions:
        y = act['y']
        # User action box
        bbox = FancyBboxPatch((0.3, y - 0.1), 5.5, 1.8, boxstyle="round,pad=0.15",
                              facecolor=act['color'], edgecolor='white', alpha=0.9)
        ax.add_patch(bbox)
        ax.text(3.05, y + 1.3, act['action'], ha='center', va='center',
                fontsize=10, fontweight='bold', color='white')
        ax.text(3.05, y + 0.7, act['backend'], ha='center', va='center',
                fontsize=8.5, color='#E2E8F0')

        # Arrow
        ax.annotate('', xy=(6.0, y + 0.85), xytext=(5.8, y + 0.85),
                    arrowprops=dict(arrowstyle='->', color=act['color'], lw=2))

        # Formula box
        bbox = FancyBboxPatch((6.2, y - 0.1), 13.3, 1.8, boxstyle="round,pad=0.15",
                              facecolor='#FAFAFA', edgecolor=act['color'], linewidth=1.5)
        ax.add_patch(bbox)

        fy = y + 1.35
        for f in act['formulas']:
            ax.text(6.5, fy, f, fontsize=7.8, fontfamily='monospace', color=COLORS['dark'])
            fy -= 0.38

    save_fig(fig, 'Fig7_Complete_Formula_Map')

# ═══════════════════════════════════════════════════════════════════════
# TABLE 1 — MASTER FORMULA REFERENCE TABLE
# ═══════════════════════════════════════════════════════════════════════
def table1_master_formulas():
    fig, ax = plt.subplots(figsize=(20, 14))
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(0.5, 0.98, 'Table 1: Master Formula Reference — All Formulas Used in SmartSpace',
            transform=ax.transAxes, ha='center', fontsize=15, fontweight='bold', color=COLORS['dark'])

    headers = ['Feature', 'Formula / Expression', 'Source File', 'Type']
    data = [
        ['KNN Distance', 'd = √(Σ wᵢ(xᵢ−idealᵢ)²) / √(Σwᵢ)', 'ml-algorithms.ts', 'ML'],
        ['KNN Similarity', 'score = 1 − normalized_distance', 'ml-algorithms.ts', 'ML'],
        ['RF Bootstrap', 'sample = random(N, replace=True, size=0.8N)', 'ml-algorithms.ts', 'ML'],
        ['RF Feature Bag', 'numFeatures = floor(√(total_features))', 'ml-algorithms.ts', 'ML'],
        ['RF Voting', 'vote_weight = K − rank (top K per tree)', 'ml-algorithms.ts', 'ML'],
        ['GB Update Rule', 'Fₘ = Fₘ₋₁ + η×h(x)×sign(residual), η=0.1', 'ml-algorithms.ts', 'ML'],
        ['GB True Label', 'y = 0.4L + 0.3A + 0.2(1−p/P) + 0.1(r/5)', 'ml-algorithms.ts', 'ML'],
        ['NN Activation', 'LeakyReLU(x, α=0.01) = x>0 ? x : 0.01x', 'ml-algorithms.ts', 'ML'],
        ['NN Output', 'σ(0.35h₁ + 0.25h₂ + 0.15h₃ + 0.25h₄)', 'ml-algorithms.ts', 'ML'],
        ['Hybrid Meta', 'metaScore = Σ(fᵢ×wᵢ)/Σwᵢ; loc_w=5.0', 'ml-algorithms.ts', 'ML'],
        ['Ensemble (5-algo)', 'E=0.25KNN+0.25RF+0.20GB+0.15NN+0.15Stack', 'ml-algorithms.ts', 'ML'],
        ['Final ML Score', 'Final = 0.5 + (E × 0.5); range [0.50,1.0]', 'adv-ml-algorithms.ts', 'ML'],
        ['ML Confidence', 'C = 1 − min(σ(scores), 0.3) / 0.3', 'adv-ml-algorithms.ts', 'ML'],
        ['LLM Composite', 'S=0.30L+0.25P+0.25S+0.20Q', 'adv-llm-service.ts', 'LLM'],
        ['LLM Location', 'exact=1.0, same_region=0.7, different=0.3', 'adv-llm-service.ts', 'LLM'],
        ['LLM Quality', '≥4.5→1.0, ≥4.0→0.8, ≥3.5→0.6, verified+0.1', 'adv-llm-service.ts', 'LLM'],
        ['Pricing Base', 'avg(nearby) × TypeBoost × AmenBoost × SizeBoost', 'PricingModal.tsx', 'Pricing'],
        ['Demand Score', 'clamp(round(avgOccupancy × 10), 1, 10)', 'PricingModal.tsx', 'Pricing'],
        ['Block Gen Size', 'size = min(400, max(100, area/20))', 'smartBookingService.ts', 'Booking'],
        ['Block Gen Count', 'n = max(1, min(15, floor(area/size)))', 'smartBookingService.ts', 'Booking'],
        ['Match Score', 'base=70 + area(+15) + price(+10) + verified(+5)', 'smartBookingService.ts', 'Booking'],
        ['Doc Verify', 'GST(25)+PAN(25)+Phone(15)+Doc(20)+Complete(15)', 'docAnalysisService.ts', 'Verify'],
        ['License Health', '0.3 + 0.7×(daysRemaining/90) if expiring', 'ml-algorithms.ts', 'Filter'],
        ['Calibration', 'IF≥0.7: 0.85+(s−0.7)×0.47; Clamp [0.50,0.99]', 'ml-algorithms.ts', 'Calib.'],
        ['Bayesian Score', 'post = (prior×like)/(prior×like+(1−p)(1−l)+0.01)', 'adv-ml-algorithms.ts', 'ML'],
        ['Gaussian Kernel', 'K(d) = exp(−d²/(2σ²)), σ=0.8', 'adv-ml-algorithms.ts', 'ML'],
    ]

    table = ax.table(cellText=data, colLabels=headers, loc='center',
                     cellLoc='left', colWidths=[0.15, 0.42, 0.22, 0.08])
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1, 1.4)

    # Style header
    for j in range(len(headers)):
        cell = table[0, j]
        cell.set_facecolor(COLORS['dark'])
        cell.set_text_props(color='white', fontweight='bold', fontsize=9)

    # Color rows by type
    type_colors = {'ML': '#ECFDF5', 'LLM': '#EFF6FF', 'Pricing': '#FFFBEB',
                   'Booking': '#F0F9FF', 'Verify': '#FDF2F8', 'Filter': '#F5F3FF',
                   'Calib.': '#FFF7ED'}
    for i, row in enumerate(data):
        color = type_colors.get(row[3], '#FFFFFF')
        for j in range(len(headers)):
            table[i + 1, j].set_facecolor(color)
            if j == 1:
                table[i + 1, j].set_text_props(fontfamily='monospace', fontsize=7.5)

    save_fig(fig, 'Table1_Master_Formula_Reference')

# ═══════════════════════════════════════════════════════════════════════
# TABLE 2 — TEMPERATURE & TOKEN CONFIG
# ═══════════════════════════════════════════════════════════════════════
def table2_temperature_config():
    fig, ax = plt.subplots(figsize=(18, 10))
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(0.5, 0.97, 'Table 2: Temperature & Token Configuration Per Feature',
            transform=ax.transAxes, ha='center', fontsize=15, fontweight='bold', color=COLORS['dark'])
    ax.text(0.5, 0.94, 'Every LLM call with exact parameters from source code',
            transform=ax.transAxes, ha='center', fontsize=10, color=COLORS['gray'], style='italic')

    headers = ['Feature / Service', 'Temperature', 'Max Tokens', 'Model', 'System Prompt Summary', 'Source File']
    data = [
        ['LLM Recommendation', '0.3', '4096', 'Llama 3.3 70B', 'Expert warehouse recommendation AI', 'advanced-llm-service.ts'],
        ['Smart Booking: NL Parse', '0.1', '500', 'Llama 3.3 70B', 'Booking request parser', 'smartBookingService.ts'],
        ['Smart Booking: Type Infer', '0.1', '150', 'Llama 3.3 70B', 'Map goods → warehouse type', 'smartBookingService.ts'],
        ['Smart Booking: Analysis', '0.3', '800', 'Llama 3.3 70B', 'Warehouse booking optimization expert', 'smartBookingService.ts'],
        ['Smart Booking: Block Select', '0.1', '300', 'Llama 3.3 70B', 'Warehouse space optimization expert', 'smartBookingService.ts'],
        ['Pricing Insight', '0.3', '200', 'Llama 3.3 70B', 'Business-friendly pricing insights', 'PricingModal.tsx'],
        ['Description Generation', '0.4', '250', 'Llama 3.3 70B', 'Professional real estate listing writer', 'ListProperty.tsx'],
        ['Dashboard Insights', '0.3', '220', 'Llama 3.3 70B', 'Business advisor for warehouse owners', 'Dashboard.tsx'],
        ['Chatbot Response', '0.7', '800', 'Llama 3.3 70B', 'SmartSpace AI Assistant, Maharashtra', 'aiService.ts'],
        ['AI Recommendations', '0.3', '2000', 'Llama 3.3 70B', 'Warehouse recommendation expert', 'aiService.ts'],
        ['Recommendation Explain', '0.3', '500', 'Llama 3.2 3B*', 'Explain ML scores for user', 'freeLLMService.ts'],
        ['Doc Verification LLM', '0.2', '300', 'Llama 3.2 3B*', 'Document analysis enhancer', 'freeLLMService.ts'],
    ]

    table = ax.table(cellText=data, colLabels=headers, loc='center',
                     cellLoc='left', colWidths=[0.18, 0.08, 0.08, 0.12, 0.30, 0.16])
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1, 1.55)

    for j in range(len(headers)):
        cell = table[0, j]
        cell.set_facecolor(COLORS['llm'])
        cell.set_text_props(color='white', fontweight='bold', fontsize=9)

    for i in range(len(data)):
        bg = '#EFF6FF' if i % 2 == 0 else '#FFFFFF'
        for j in range(len(headers)):
            table[i + 1, j].set_facecolor(bg)
            if j in [1, 2]:
                table[i + 1, j].set_text_props(fontfamily='monospace', fontweight='bold')

    ax.text(0.5, 0.03, '* Llama 3.2 3B / Mistral 7B used via free-tier endpoints (OpenRouter → Cloudflare → HuggingFace)',
            transform=ax.transAxes, ha='center', fontsize=8, color=COLORS['gray'], style='italic')

    save_fig(fig, 'Table2_Temperature_Token_Config')

# ═══════════════════════════════════════════════════════════════════════
# TABLE 3 — LLM FALLBACK CHAINS
# ═══════════════════════════════════════════════════════════════════════
def table3_fallback_chains():
    fig, ax = plt.subplots(figsize=(18, 8))
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(0.5, 0.97, 'Table 3: LLM Provider Fallback Chains Per Service',
            transform=ax.transAxes, ha='center', fontsize=15, fontweight='bold', color=COLORS['dark'])

    headers = ['Service File', 'Provider 1 (Primary)', 'Provider 2', 'Provider 3', 'Provider 4', 'Final Fallback']
    data = [
        ['advanced-llm-service.ts', 'Groq (Llama 3.3 70B)', 'OpenRouter (Claude 3 Haiku)', 'Gemini 1.5 Flash', '—', 'Local ML Scoring'],
        ['aiService.ts (client)', 'Groq (Llama 3.3 70B)', 'OpenRouter (Claude 3.5 Sonnet)', 'Cloudflare (Llama 3.1 8B)', 'Gemini Pro', 'Fallback text response'],
        ['freeLLMService.ts', 'OpenRouter (Llama 3.2 3B)', 'Cloudflare (Llama 3.3 70B)', 'Groq (Llama 3.3 70B)', 'HuggingFace (Mistral 7B)', 'Static response'],
        ['smartBookingService.ts', 'Uses aiService.ts chain', '(Groq → OpenRouter)', '(→ Cloudflare)', '(→ Gemini)', 'Greedy algorithm fallback'],
        ['PricingModal.tsx', 'Uses aiService.ts chain', '(Groq → OpenRouter)', '(→ Cloudflare)', '(→ Gemini)', 'No insight, formula only'],
    ]

    table = ax.table(cellText=data, colLabels=headers, loc='center',
                     cellLoc='left', colWidths=[0.17, 0.17, 0.18, 0.16, 0.16, 0.16])
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1, 1.8)

    colors = [COLORS['llm'], '#059669', '#7C3AED', '#D97706', '#DC2626', '#64748B']
    for j in range(len(headers)):
        cell = table[0, j]
        cell.set_facecolor(COLORS['dark'])
        cell.set_text_props(color='white', fontweight='bold', fontsize=8.5)

    for i in range(len(data)):
        bg = '#F8FAFC' if i % 2 == 0 else '#FFFFFF'
        for j in range(len(headers)):
            table[i + 1, j].set_facecolor(bg)

    save_fig(fig, 'Table3_LLM_Fallback_Chains')


# ═══════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print('=' * 70)
    print('Research Paper: Complete Formula Reference — SmartSpace')
    print('  Every formula is 100% from the actual project source code')
    print('=' * 70)
    print()

    print('📊 Generating Fig 1: Smart Booking Pipeline Formulas...')
    fig1_smart_booking_pipeline()

    print('📊 Generating Fig 2: ML Algorithm Formulas (5 algorithms)...')
    fig2_ml_algorithm_formulas()

    print('📊 Generating Fig 3: LLM Scoring Formula + Fallback Chains...')
    fig3_llm_scoring_formula()

    print('📊 Generating Fig 4: Pricing Engine Formula...')
    fig4_pricing_formula()

    print('📊 Generating Fig 5: Document Verification Scoring...')
    fig5_document_verification()

    print('📊 Generating Fig 6: Ensemble Calibration Pipeline...')
    fig6_ensemble_calibration()

    print('📊 Generating Fig 7: Complete Formula Map (All Actions)...')
    fig7_complete_formula_map()

    print()
    print('📋 Generating Table 1: Master Formula Reference...')
    table1_master_formulas()

    print('📋 Generating Table 2: Temperature & Token Config...')
    table2_temperature_config()

    print('📋 Generating Table 3: LLM Fallback Chains...')
    table3_fallback_chains()

    print()
    print('=' * 70)
    total_files = 20  # 7 figs × 2 (png+pdf) + 3 tables × 2 (png+pdf)
    print(f'✅ ALL DONE — {total_files} files generated in {output_dir}/')
    print('  7 Figures (PNG + PDF) + 3 Tables (PNG + PDF)')
    print()
    print('  Fig 1: Smart Booking 4-Stage Pipeline Formulas')
    print('  Fig 2: ML 5-Algorithm Formula Breakdown')
    print('  Fig 3: LLM Composite Scoring + Fallback Chains')
    print('  Fig 4: Pricing Engine (Owner Lists Property)')
    print('  Fig 5: Document Verification Score (100 pts)')
    print('  Fig 6: Ensemble Calibration Pipeline')
    print('  Fig 7: Complete Formula Map (Every User Action)')
    print('  Table 1: Master Formula Reference (26 formulas)')
    print('  Table 2: Temperature & Token Config (12 LLM calls)')
    print('  Table 3: LLM Fallback Chains (5 services)')
    print('=' * 70)
