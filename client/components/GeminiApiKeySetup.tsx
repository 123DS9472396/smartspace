import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, CheckCircle2, XCircle } from "lucide-react";

/**
 * Component to show AI service status and guide users on configuration
 */
export default function GeminiApiKeySetup() {
  const { profile } = useAuth();
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const cloudflareKey = import.meta.env.VITE_CLOUDFLARE_AI_TOKEN;

  const hasAnyKey = openRouterKey || groqKey || geminiKey || cloudflareKey;

  // Only show the AI banner for non-seeker users
  if (hasAnyKey && profile?.user_type !== 'seeker') {
    // Show success message with configured providers
    return (
      <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <div className="flex gap-2 items-center">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">AI Services Configured ✅</AlertTitle>
        </div>
        <AlertDescription className="mt-2 text-green-700 dark:text-green-300">
          <p className="mb-2">Your AI-powered features are active using:</p>
          <ul className="list-disc list-inside space-y-1 mb-2">
            {openRouterKey && <li><strong>OpenRouter</strong> - Claude 3.5 Sonnet (Best quality)</li>}
            {groqKey && <li><strong>Groq</strong> - Llama 3.3 70B (Fastest)</li>}
            {geminiKey && <li><strong>Gemini</strong> - Pro model</li>}
            {cloudflareKey && <li><strong>Cloudflare</strong> - Workers AI</li>}
          </ul>
          <p className="text-sm text-green-600 dark:text-green-400">
            Using multiple providers for maximum reliability and performance.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Do not show the setup instructions banner to users.
  // If keys are configured, a success alert is already shown above.
  // Returning null keeps the UI clean when keys are not detected at runtime.
  return null;
}
