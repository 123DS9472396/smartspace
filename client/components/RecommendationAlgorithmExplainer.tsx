import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bot, Brain, Code, RefreshCw, Sparkles, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Component that explains the ML recommendation algorithms used
 */
export default function RecommendationAlgorithmExplainer() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="btn-professional-outline">
          <Brain className="h-4 w-4 mr-2 text-blue-400" />
          <span className="text-gradient-blue">How recommendations work</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl glass-card shadow-professional-xl border-blue-900/20">
        <DialogHeader className="gradient-dark-purple rounded-t-lg p-4">
          <DialogTitle className="flex items-center">
            <Bot className="h-5 w-5 text-blue-400 mr-2 pulse-subtle" />
            <span className="text-gradient-cosmic text-xl">Smart Warehouse Recommendation Algorithms</span>
            <Badge variant="outline" className="ml-3 border-purple-500 bg-professional-navy text-blue-300">
              <Sparkles className="h-3 w-3 mr-1 text-blue-300 animate-pulse-soft" /> AI Powered
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-slate-300 mt-2">
            Our multi-tiered ML approach for finding the best warehouses for your needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gemini AI */}
          <div className="glass-card p-4 border-purple-500/30 glow-purple">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-glow shadow-purple-500/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gradient-purple mb-2">Gemini AI Analysis</h3>
                <p className="text-slate-300 mb-2">
                  Utilizes Google's Gemini AI to analyze warehouse data using natural language reasoning. 
                  This approach evaluates warehouses holistically, considering subtle relationships between:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 ml-2 mb-2">
                  <li>Location suitability for your business type</li>
                  <li>Price-to-value ratio analysis across similar warehouses</li>
                  <li>Amenity completeness based on your stated and inferred needs</li>
                  <li>Space utilization optimization to avoid over/under-provisioning</li>
                  <li>Long-term value assessment considering occupancy trends</li>
                </ul>
                <p className="text-sm text-purple-400 italic border-l-2 border-purple-500/30 pl-2">
                  "Gemini provides detailed reasoning explanations for each recommendation, focusing on why a specific warehouse matches your needs."
                </p>
              </div>
            </div>
          </div>

          {/* Random Forest */}
          <div className="glass-card p-4 border-emerald-500/30 glow-emerald">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center shadow-glow shadow-emerald-500/30">
                  <Network className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gradient-emerald mb-2">Random Forest Algorithm</h3>
                <p className="text-slate-300 mb-2">
                  A robust machine learning algorithm that creates multiple "decision trees" to find the best warehouse matches:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 ml-2 mb-2">
                  <li>Operates on multiple sample sets of warehouses with different feature weights</li>
                  <li>Makes decisions based on district match, price range, area requirements, and amenities</li>
                  <li>Aggregates votes across trees for high-confidence recommendations</li>
                  <li>Reduces overfitting by considering diverse feature combinations</li>
                </ul>
                <div className="text-sm text-emerald-300 bg-professional-navy/50 p-2 rounded border border-emerald-900/20 font-mono">
                  score += warehouse.total_area &gt;= preferences.minAreaSqft ? 1 : 0;
                </div>
              </div>
            </div>
          </div>

          {/* K-Nearest Neighbors */}
          <div className="glass-card p-4 border-blue-500/30 glow-blue">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-cyan-700 rounded-full flex items-center justify-center shadow-glow shadow-blue-500/30">
                  <Code className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gradient-blue mb-2">K-Nearest Neighbors (KNN)</h3>
                <p className="text-slate-300 mb-2">
                  Finds warehouses that are most "similar" to your ideal preferences by calculating distance in a multi-dimensional feature space:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 ml-2 mb-2">
                  <li>Assigns different weights to different features (30% location, 25% price, 20% area, etc.)</li>
                  <li>Calculates similarity scores based on how close warehouses match your preferences</li>
                  <li>Performs well when preference boundaries are less strict</li>
                  <li>Returns the K most similar warehouses to your ideal requirements</li>
                </ul>
                <div className="text-sm text-blue-300 bg-professional-navy/50 p-2 rounded border border-blue-900/20 font-mono">
                  const districtScore = exactMatch ? 1 : partialMatch ? 0.6 : 0;
                </div>
              </div>
            </div>
          </div>

          {/* Hybrid Approach */}
          <div className="glass-card p-4 border-amber-500/30 glow-gold">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <div className="h-10 w-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center shadow-glow shadow-amber-500/30">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gradient-gold mb-2">Hybrid Ensemble Approach</h3>
                <p className="text-slate-300 mb-2">
                  Combines the strengths of multiple algorithms for more robust recommendations:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 ml-2 mb-2">
                  <li>Merges results from KNN (60% weight) and Random Forest (40% weight)</li>
                  <li>Uses ranking-based fusion to overcome limitations of individual algorithms</li>
                  <li>Generates tailored reasoning for each recommended warehouse</li>
                  <li>Falls back gracefully to alternative algorithms if any approach fails</li>
                </ul>
                <p className="text-sm text-amber-400 border-l-2 border-amber-500/30 pl-2">
                  Our system tries each algorithm in sequence (Gemini → Hybrid → KNN → Basic) for maximum reliability.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-glow my-2"></div>

        <DialogFooter className="sm:justify-start">
          <div className="flex items-center text-sm text-slate-400">
            <Bot className="h-4 w-4 mr-2 text-slate-500" />
            All algorithms process data locally for fast and privacy-preserving recommendations.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
