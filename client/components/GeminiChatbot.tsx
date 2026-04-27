/**
 * SmartSpace Seeker Chatbot
 * ─ Only visible to authenticated SEEKERS
 * ─ Fetches live warehouse data from Supabase for accurate context
 * ─ Uses Groq (llama-3.3-70b) → OpenRouter → Gemini LLM chain
 * ─ Premium dark glassmorphism UI
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2, RefreshCw, Warehouse, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface LiveWarehouseContext {
  totalCount: number;
  cityBreakdown: Record<string, { count: number; avgPrice: number; minPrice: number; maxPrice: number }>;
  priceRange: { min: number; max: number; avg: number };
  topWarehouses: Array<{ name: string; city: string; district: string; price: number; area: number; type: string }>;
  availableTypes: string[];
  fetchedAt: Date;
}

// ─── API Keys from env ────────────────────────────────────────────────────────

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── LLM Callers ─────────────────────────────────────────────────────────────

async function callGroq(messages: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  if (!GROQ_KEY) throw new Error('Groq key not set');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.65,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq error ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(messages: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  if (!OPENROUTER_KEY) throw new Error('OpenRouter key not set');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'SmartSpace Warehouse',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.65,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(messages: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('Gemini key not set');
  // Build combined context
  const allContent = [systemPrompt, ...messages.map(m => `${m.role}: ${m.content}`)].join('\n\n');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: allContent }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function getLLMResponse(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<{ text: string; provider: string }> {
  const providers = [
    { name: 'Groq (Llama 3.3)', fn: () => callGroq(messages, systemPrompt), enabled: !!GROQ_KEY },
    { name: 'OpenRouter (Llama 3.3)', fn: () => callOpenRouter(messages, systemPrompt), enabled: !!OPENROUTER_KEY },
    { name: 'Gemini 1.5 Flash', fn: () => callGemini(messages, systemPrompt), enabled: !!GEMINI_KEY },
  ];

  for (const p of providers) {
    if (!p.enabled) continue;
    try {
      console.log(`🤖 Trying ${p.name}...`);
      const text = await p.fn();
      console.log(`✅ ${p.name} responded`);
      return { text, provider: p.name };
    } catch (e) {
      console.warn(`⚠️ ${p.name} failed:`, e);
    }
  }

  return {
    text: 'I\'m having trouble connecting to the AI service right now. Please try again in a moment. In the meantime, you can browse warehouses directly from the **Find Warehouses** page.',
    provider: 'fallback',
  };
}

// ─── Live DB Fetcher ──────────────────────────────────────────────────────────

async function fetchLiveWarehouseContext(): Promise<LiveWarehouseContext> {
  console.log('📊 Fetching live warehouse data from Supabase...');

  const { data, error } = await supabase
    .from('warehouses')
    .select('name, city, district, price_per_sqft, total_area, warehouse_type, status, rating')
    .eq('status', 'active')
    .order('rating', { ascending: false })
    .limit(500);

  if (error || !data || data.length === 0) {
    console.warn('⚠️ Could not fetch warehouses:', error?.message);
    return {
      totalCount: 0,
      cityBreakdown: {},
      priceRange: { min: 0, max: 0, avg: 0 },
      topWarehouses: [],
      availableTypes: [],
      fetchedAt: new Date(),
    };
  }

  // City breakdown
  const cityBreakdown: LiveWarehouseContext['cityBreakdown'] = {};
  for (const w of data) {
    const city = (w.city || 'Unknown').trim();
    if (!cityBreakdown[city]) cityBreakdown[city] = { count: 0, avgPrice: 0, minPrice: Infinity, maxPrice: 0 };
    const p = Number(w.price_per_sqft) || 0;
    cityBreakdown[city].count++;
    cityBreakdown[city].avgPrice = (cityBreakdown[city].avgPrice * (cityBreakdown[city].count - 1) + p) / cityBreakdown[city].count;
    if (p > 0) cityBreakdown[city].minPrice = Math.min(cityBreakdown[city].minPrice, p);
    cityBreakdown[city].maxPrice = Math.max(cityBreakdown[city].maxPrice, p);
  }
  // Fix Infinity
  for (const city of Object.keys(cityBreakdown)) {
    if (cityBreakdown[city].minPrice === Infinity) cityBreakdown[city].minPrice = 0;
    cityBreakdown[city].avgPrice = Math.round(cityBreakdown[city].avgPrice);
  }

  const prices = data.map(w => Number(w.price_per_sqft)).filter(p => p > 0);
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  };

  const types = [...new Set(data.map(w => w.warehouse_type).filter(Boolean))];

  const topWarehouses = data.slice(0, 15).map(w => ({
    name: w.name,
    city: w.city || 'Unknown',
    district: w.district || 'Unknown',
    price: Number(w.price_per_sqft) || 0,
    area: Number(w.total_area) || 0,
    type: w.warehouse_type || 'General',
  }));

  console.log(`✅ Fetched context: ${data.length} warehouses, ${Object.keys(cityBreakdown).length} cities`);

  return {
    totalCount: data.length,
    cityBreakdown,
    priceRange,
    topWarehouses,
    availableTypes: types,
    fetchedAt: new Date(),
  };
}

function buildSystemPrompt(ctx: LiveWarehouseContext, seekerName: string): string {
  const cityLines = Object.entries(ctx.cityBreakdown)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([city, d]) => `  • ${city}: ${d.count} warehouses | ₹${d.minPrice}–₹${d.maxPrice}/sqft (avg ₹${d.avgPrice})`)
    .join('\n');

  const topWarehouseLines = ctx.topWarehouses
    .slice(0, 8)
    .map(w => `  • "${w.name}" in ${w.city} — ₹${w.price}/sqft, ${w.area.toLocaleString()} sqft, ${w.type}`)
    .join('\n');

  return `You are the SmartSpace AI Assistant — an expert warehouse advisor for seekers in Maharashtra, India.
You speak directly to ${seekerName || 'the seeker'}.

═══════════════════════════════════════════
LIVE DATABASE SNAPSHOT (as of ${ctx.fetchedAt.toLocaleTimeString()})
═══════════════════════════════════════════
Total Available Warehouses: ${ctx.totalCount}
Price Range: ₹${ctx.priceRange.min}–₹${ctx.priceRange.max}/sqft | Average: ₹${ctx.priceRange.avg}/sqft

CITY-WISE BREAKDOWN:
${cityLines || '  No city data available'}

TOP RATED WAREHOUSES RIGHT NOW:
${topWarehouseLines || '  No warehouse data available'}

WAREHOUSE TYPES AVAILABLE:
${ctx.availableTypes.slice(0, 12).join(', ') || 'General Storage, Godown, Cold Storage'}
═══════════════════════════════════════════

YOUR ROLE:
1. Help seekers find warehouses using REAL data above
2. Give accurate price quotes from the live data
3. Recommend specific cities/districts based on budget & needs
4. Help understand the SmartSpace platform features
5. Answer questions about booking, comparing, and contacting owners

RULES:
- NEVER make up warehouse names or prices — use only what's in the live data above
- If asked about a city not in the data, say it honestly  
- Be direct, helpful, and concise
- Use markdown formatting (bold, bullet points) for clarity
- Always suggest the next action (Filter by city, Use ML Recommendations, etc.)
- Encourage seekers to use the platform features: Warehouses page, ML Recommendations, Compare, Smart Booking`;
}

// ─── Quick Suggestions ────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  '🔍 Which city has the most warehouses?',
  '💰 What are the cheapest warehouses available?',
  '❄️ Do you have cold storage options?',
  '📍 Show me warehouses in Pune',
  '📦 I need 50,000 sqft of space',
  '🏭 Compare Mumbai vs Pune warehouses',
];

// ─── Markdown-like renderer ───────────────────────────────────────────────────

function renderMessage(content: string) {
  return content.split('\n').map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i} className="block">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-semibold text-blue-300">{part}</strong> : part
        )}
      </span>
    );
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GeminiChatbot() {
  const { profile } = useAuth();

  // STRICT seeker-only gate
  if (!profile || profile.user_type !== 'seeker') return null;

  return <SeekerChatbot seekerName={profile.name || 'Seeker'} />;
}

function SeekerChatbot({ seekerName }: { seekerName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [warehouseCtx, setWarehouseCtx] = useState<LiveWarehouseContext | null>(null);
  const [isLoadingCtx, setIsLoadingCtx] = useState(false);
  const [provider, setProvider] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatHistory = useRef<Array<{ role: string; content: string }>>([]);

  // Unique localStorage key per user
  const storageKey = `smartspace_chat_${seekerName || 'default'}`;

  // Load chat from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.messages)) {
          setMessages(parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
          chatHistory.current = parsed.chatHistory || [];
          setProvider(parsed.provider || '');
          setUnreadCount(parsed.unreadCount || 0);
        }
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Persist chat to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        messages,
        chatHistory: chatHistory.current,
        provider,
        unreadCount,
      }));
    } catch (e) {}
  }, [messages, provider, unreadCount]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Load context + greeting when opening first time
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    setIsLoadingCtx(true);
    fetchLiveWarehouseContext().then(ctx => {
      setWarehouseCtx(ctx);
      setIsLoadingCtx(false);
      const greeting: Message = {
        id: 'welcome',
        role: 'assistant',
        content: ctx.totalCount > 0
          ? `Hey ${seekerName}! 👋 I'm your SmartSpace AI assistant.\n\nI have **live data on ${ctx.totalCount} available warehouses** across ${Object.keys(ctx.cityBreakdown).length} cities, with prices from **₹${ctx.priceRange.min}–₹${ctx.priceRange.max}/sqft**.\n\nHow can I help you find the perfect warehouse today?`
          : `Hey ${seekerName}! 👋 I'm your SmartSpace AI assistant — here to help you find the perfect warehouse in Maharashtra.\n\nWhat are you looking for today?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }).catch(() => {
      setIsLoadingCtx(false);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hey ${seekerName}! 👋 I'm your SmartSpace AI assistant.\n\nAsk me anything about warehouses — locations, pricing, features, or how to use the platform!`,
        timestamp: new Date(),
      }]);
    });
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const thinkingMsg: Message = {
      id: `t-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setIsThinking(true);

    // Add to chat history for multi-turn context
    chatHistory.current.push({ role: 'user', content: text.trim() });

    try {
      // Always fetch the latest warehouse context before every LLM call
      setIsLoadingCtx(true);
      const latestCtx = await fetchLiveWarehouseContext();
      setWarehouseCtx(latestCtx);
      setIsLoadingCtx(false);

      const sysPrompt = buildSystemPrompt(latestCtx, seekerName);

      const { text: responseText, provider: usedProvider } = await getLLMResponse(
        chatHistory.current.slice(-10), // Last 10 messages for context
        sysPrompt
      );

      chatHistory.current.push({ role: 'assistant', content: responseText });
      setProvider(usedProvider);

      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.isStreaming) {
          last.content = responseText;
          last.isStreaming = false;
        }
        return updated;
      });

      // If chat is closed, increment unread
      if (!isOpen) setUnreadCount(c => c + 1);

    } catch (e) {
      console.error('Chat error:', e);
      setIsLoadingCtx(false);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.isStreaming) {
          last.content = 'Sorry, I encountered an error. Please try again.';
          last.isStreaming = false;
        }
        return updated;
      });
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, seekerName, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    chatHistory.current = [];
    setMessages([]);
    setProvider('');
    setUnreadCount(0);
    // Remove from localStorage
    try { localStorage.removeItem(storageKey); } catch (e) {}
    // Re-trigger greeting
    if (warehouseCtx) {
      const greeting: Message = {
        id: `g-${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared! How can I help you find a warehouse today, ${seekerName}?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  };

  // ─── Closed FAB ──────────────────────────────────────────────────────────────

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            id="chatbot-fab"
            onClick={handleOpen}
            className="group relative w-14 h-14 rounded-full flex items-center justify-center chatbot-fab-btn"
            aria-label="Open AI Assistant"
          >
            <Bot className="w-6 h-6 text-white" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-30 chatbot-fab-pulse" />
          </button>
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
          {/* Tooltip */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none chatbot-fab-tooltip">
            <span className="text-sm text-white font-medium">AI Warehouse Assistant</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat Window ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-50" id="chatbot-window">
      <div
        className={`flex flex-col overflow-hidden transition-all duration-300 ease-out chatbot-window${isMinimized ? ' minimized' : ''}`}
        data-chatbot-size={isMinimized ? 'minimized' : 'normal'}
      >
        {/* ── Header ── */}
        <div
          className={`flex items-center justify-between px-4 py-3 flex-shrink-0 chatbot-header${isMinimized ? ' minimized' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center chatbot-header-avatar-bg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">SmartSpace AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <p className="text-blue-200 text-xs">
                  {isLoadingCtx ? 'Loading live data...' : provider ? `via ${provider}` : 'Seeker Assistant • Online'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Clear chat">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title={isMinimized ? 'Expand' : 'Minimize'}>
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* ── Live data badge ── */}
            {warehouseCtx && warehouseCtx.totalCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 chatbot-live-badge">
                <Warehouse className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-emerald-300">
                  Live: <strong>{warehouseCtx.totalCount}</strong> warehouses · ₹{warehouseCtx.priceRange.min}–₹{warehouseCtx.priceRange.max}/sqft · Updated {warehouseCtx.fetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chatbot-scrollbar">

              {/* Loading context state */}
              {isLoadingCtx && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full bg-blue-400 chatbot-bounce chatbot-bounce-${i}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">Loading live warehouse data...</p>
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 chatbot-assistant-avatar-bg">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[82%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'chatbot-user-msg' : 'chatbot-assistant-msg'}`}
                    >
                      {msg.isStreaming ? (
                        <div className="flex items-center gap-1.5 py-1">
                          {[0, 1, 2].map(i => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full bg-blue-400 chatbot-bounce chatbot-bounce-${i}`} />
                          ))}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{renderMessage(msg.content)}</div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-700">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* Quick suggestions — only at start */}
              {messages.length <= 1 && !isLoadingCtx && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 chatbot-quick-suggestion"
                        aria-label={`Quick suggestion: ${s}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform links */}
              {messages.length <= 1 && !isLoadingCtx && (
                <div className="rounded-xl p-3 space-y-2 chatbot-platform-links">
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Quick Actions
                  </p>
                  {[
                    { label: 'Find Warehouses', href: '/warehouses' },
                    { label: 'ML Recommendations', href: '/ml-recommendations' },
                    { label: 'My Bookings', href: '/seeker-hub' },
                  ].map((link, i) => (
                    <a key={i} href={link.href}
                      className="flex items-center justify-between group hover:text-blue-300 transition-colors chatbot-platform-link">
                      <span className="text-xs">{link.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div className="px-4 pb-4 pt-2 flex-shrink-0 chatbot-input-bar">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  id="chatbot-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about warehouses, pricing, locations..."
                  disabled={isThinking}
                  className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none transition-all duration-200 chatbot-input"
                  aria-label="Chatbot input"
                />
                <button
                  id="chatbot-send"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isThinking}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 chatbot-send-btn${!input.trim() || isThinking ? ' disabled' : ''}`}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-600 mt-2">
                Powered by Groq · OpenRouter · Gemini — Live DB data
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
