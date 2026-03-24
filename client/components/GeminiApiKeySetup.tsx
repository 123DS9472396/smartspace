import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, CheckCircle2, XCircle } from "lucide-react";

/**
 * Component to show AI service status and guide users on configuration
 */
export default function GeminiApiKeySetup() {
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const cloudflareKey = import.meta.env.VITE_CLOUDFLARE_AI_TOKEN;

  const hasAnyKey = openRouterKey || groqKey || geminiKey || cloudflareKey;

  if (hasAnyKey) {
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

  // Show setup instructions if no keys configured
  return (
    <Alert className="mb-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
      <div className="flex gap-2 items-center">
        <Info className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">AI Integration Not Configured</AlertTitle>
      </div>
      <AlertDescription className="mt-2 text-amber-700 dark:text-amber-300">
        <p className="mb-3">
          You're currently seeing simulated recommendations. For real AI-powered features, configure at least one API key:
        </p>
        
        <div className="space-y-3 mb-3">
          <div className="border border-amber-200 dark:border-amber-700 rounded p-2 bg-white/50 dark:bg-black/20">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">🏆 Recommended: OpenRouter</h4>
            <p className="text-sm mb-2">Access to Claude 3.5 Sonnet, GPT-4, and 100+ models</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-amber-300 dark:border-amber-600" 
              onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Get OpenRouter Key
            </Button>
          </div>

          <div className="border border-amber-200 dark:border-amber-700 rounded p-2 bg-white/50 dark:bg-black/20">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">⚡ Fastest: Groq</h4>
            <p className="text-sm mb-2">Lightning-fast Llama 3.3 70B responses</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-amber-300 dark:border-amber-600" 
              onClick={() => window.open('https://console.groq.com/keys', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Get Groq Key
            </Button>
          </div>

          <div className="border border-amber-200 dark:border-amber-700 rounded p-2 bg-white/50 dark:bg-black/20">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">🤖 Google Gemini</h4>
            <p className="text-sm mb-2">Gemini Pro model</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-amber-300 dark:border-amber-600" 
              onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Get Gemini Key
            </Button>
          </div>
        </div>

        <div className="bg-amber-100 dark:bg-amber-900/30 rounded p-3 text-sm">
          <p className="font-semibold mb-2">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Get an API key from any provider above</li>
            <li>Add to <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">.env</code> file:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code>VITE_OPENROUTER_API_KEY=your_key</code></li>
                <li><code>VITE_GROQ_API_KEY=your_key</code></li>
                <li><code>VITE_GEMINI_API_KEY=your_key</code></li>
              </ul>
            </li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}
