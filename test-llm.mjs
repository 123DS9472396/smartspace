/**
 * LLM API Test Script
 * Tests if the configured LLM providers are working
 */

import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const getVar = (key) => {
  const match = envContent.match(new RegExp(key + '=(.*)'));
  return match ? match[1].trim() : null;
};

const GROQ_KEY = getVar('VITE_GROQ_API_KEY');
const OPENROUTER_KEY = getVar('VITE_OPENROUTER_API_KEY');
const GEMINI_KEY = getVar('VITE_GEMINI_API_KEY');

console.log('=== LLM API Test ===\n');
console.log('Groq Key:', GROQ_KEY ? GROQ_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('OpenRouter Key:', OPENROUTER_KEY ? OPENROUTER_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('Gemini Key:', GEMINI_KEY ? GEMINI_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('\n');

// Test Groq API
async function testGroq() {
  if (!GROQ_KEY) {
    console.log('⏭️ Skipping Groq test - no key');
    return false;
  }
  try {
    console.log('🔄 Testing Groq (Llama 3.3 70B)...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10,
        temperature: 0.1
      })
    });
    const data = await response.json();
    if (data.choices) {
      console.log('✅ Groq API Working! Response:', data.choices[0].message.content);
      return true;
    } else {
      console.log('❌ Groq API Error:', data.error?.message || JSON.stringify(data));
      return false;
    }
  } catch (e) {
    console.log('❌ Groq API Error:', e.message);
    return false;
  }
}

// Test OpenRouter API
async function testOpenRouter() {
  if (!OPENROUTER_KEY) {
    console.log('⏭️ Skipping OpenRouter test - no key');
    return false;
  }
  try {
    console.log('🔄 Testing OpenRouter (Claude 3 Haiku)...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://smartspace.app',
        'X-Title': 'SmartSpace Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10
      })
    });
    const data = await response.json();
    if (data.choices) {
      console.log('✅ OpenRouter API Working! Response:', data.choices[0].message.content);
      return true;
    } else {
      console.log('❌ OpenRouter API Error:', data.error?.message || JSON.stringify(data));
      return false;
    }
  } catch (e) {
    console.log('❌ OpenRouter API Error:', e.message);
    return false;
  }
}

// Test Gemini API
async function testGemini() {
  if (!GEMINI_KEY) {
    console.log('⏭️ Skipping Gemini test - no key');
    return false;
  }
  try {
    console.log('🔄 Testing Gemini (1.5 Flash)...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello in one word' }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      })
    });
    const data = await response.json();
    if (data.candidates) {
      console.log('✅ Gemini API Working! Response:', data.candidates[0].content.parts[0].text);
      return true;
    } else {
      console.log('❌ Gemini API Error:', data.error?.message || JSON.stringify(data));
      return false;
    }
  } catch (e) {
    console.log('❌ Gemini API Error:', e.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== Testing LLM Providers ===\n');
  
  const results = {
    groq: await testGroq(),
    openrouter: await testOpenRouter(),
    gemini: await testGemini()
  };
  
  console.log('\n=== Results ===');
  const working = Object.values(results).filter(Boolean).length;
  console.log(`Working APIs: ${working}/3`);
  
  if (working === 0) {
    console.log('\n⚠️ No LLM APIs are working!');
    console.log('The app will use LOCAL ML algorithms instead (still works but no AI chat).');
    console.log('\nTo fix, get free API keys from:');
    console.log('- Groq (Fastest): https://console.groq.com/keys');
    console.log('- OpenRouter: https://openrouter.ai/keys');
    console.log('- Gemini: https://aistudio.google.com/app/apikey');
  } else {
    console.log(`\n✅ LLM integration is working! Using ${working} provider(s).`);
  }
}

runTests();
