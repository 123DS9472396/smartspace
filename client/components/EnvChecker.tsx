import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, Check, X, Info, AlertTriangle, Database, Network, Bot
} from "lucide-react";
import { supabase } from '../services/supabaseClient';

export default function EnvChecker() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<{
    supabase: boolean;
    api: boolean;
    supabaseError?: string;
    apiError?: string;
    supabaseUrl?: string;
    envVars?: Record<string, string>;
  }>({
    supabase: false,
    api: false
  });

  const runDiagnostics = async () => {
    setChecking(true);
    const diagnosticResults = {
      supabase: false,
      api: false,
      supabaseError: '',
      apiError: '',
      supabaseUrl: '',
      envVars: {}
    };

    // Check environment variables
    try {
      // Get all VITE_ env vars (these are safe to expose)
      const envVars: Record<string, string> = {};
      Object.keys(import.meta.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          envVars[key] = import.meta.env[key];
        }
      });
      diagnosticResults.envVars = envVars;
    } catch (error) {
      console.error('Error checking env vars:', error);
    }

    // Check Supabase connection
    try {
      // Just use the URL from env or hardcoded value
      try {
        diagnosticResults.supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'Using fallback URL';
      } catch {
        diagnosticResults.supabaseUrl = 'Using fallback URL';
      }
      const { data, error } = await supabase.from('warehouses').select('id').limit(1);

      if (error) {
        throw error;
      }

      diagnosticResults.supabase = true;
    } catch (error: any) {
      diagnosticResults.supabaseError = error.message || 'Unknown error connecting to Supabase';
      console.error('Supabase connection error:', error);
    }

    // Check API endpoint
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: { preferVerified: true },
          limit: 1
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      diagnosticResults.api = Array.isArray(data?.items);
    } catch (error: any) {
      diagnosticResults.apiError = error.message || 'Unknown error connecting to API';
      console.error('API connection error:', error);
    }

    setResults(diagnosticResults);
    setChecking(false);
  };

  return (
    <div className="glass-dark rounded-xl border border-slate-700/50">
      <div className="p-4 pb-2">
        <h3 className="text-lg font-semibold flex items-center text-slate-200">
          <Network className="h-5 w-5 mr-2 text-blue-400" />
          System Diagnostics
        </h3>
      </div>
      <div className="p-4 pt-2">
        <div className="space-y-4">
          {!checking && !results.supabase && !results.api ? (
            <Button
              onClick={runDiagnostics}
              className="w-full btn-glass-primary"
            >
              <Info className="h-4 w-4 mr-2" />
              Run Connection Diagnostics
            </Button>
          ) : checking ? (
            <div className="flex items-center justify-center p-4 text-slate-300">
              <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-400" />
              <span>Running diagnostics...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-3 bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 mr-2 text-blue-400" />
                      <span className="font-medium text-slate-200">Supabase Connection</span>
                    </div>
                    {results.supabase ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  {results.supabaseUrl && (
                    <div className="text-xs text-slate-400 mb-1">
                      URL: {results.supabaseUrl}
                    </div>
                  )}
                  {results.supabaseError && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded mt-1 border border-red-500/20">
                      {results.supabaseError}
                    </div>
                  )}
                </div>

                <div className="rounded-lg p-3 bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Bot className="h-4 w-4 mr-2 text-purple-400" />
                      <span className="font-medium text-slate-200">API Connection</span>
                    </div>
                    {results.api ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  {results.apiError && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded mt-1 border border-red-500/20">
                      {results.apiError}
                    </div>
                  )}
                </div>
              </div>

              {/* Environment Variables */}
              {results.envVars && Object.keys(results.envVars).length > 0 && (
                <div className="rounded-lg p-3 bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <Info className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="font-medium text-slate-200">Environment Variables</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono bg-slate-900/50 p-2 rounded border border-slate-700/30">
                    {Object.entries(results.envVars).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-400">{key}:</span>
                        <span className="text-slate-200">{
                          // Mask sensitive values
                          key.includes('KEY') || key.includes('SECRET')
                            ? value.substring(0, 8) + '...'
                            : value
                        }</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <Button
                  onClick={runDiagnostics}
                  className="btn-glass"
                  size="sm"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Run Again
                </Button>

                {(!results.supabase || !results.api) && (
                  <div className="flex items-center text-amber-400 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>Issues detected. Check console for more details.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
