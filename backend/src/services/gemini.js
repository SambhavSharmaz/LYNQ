const axios = require('axios');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'models/gemini-1.5-flash';

function buildUrl(method) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  return `${API_BASE}/${MODEL}:${method}?key=${key}`;
}

function toContentFromMessages(messages = []) {
  // messages: [{ role: 'user'|'model'|'system', text: string }]
  const parts = messages.map(m => ({ text: `${m.role || 'user'}: ${m.text}` }));
  return [{ role: 'user', parts }];
}

async function smartReplies(messages = []) {
  const prompt = [
    { role: 'user', parts: [{ text: 'Given the conversation, suggest 3 short, safe and friendly replies (5-12 words). Return as a JSON array of strings only.' }] },
    ...toContentFromMessages(messages)
  ];
  const { data } = await axios.post(buildUrl('generateContent'), { contents: prompt });
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  try { return JSON.parse(txt); } catch { return [txt].filter(Boolean); }
}

async function summarize(messages = []) {
  const contents = [
    { role: 'user', parts: [{ text: 'Summarize the conversation in 2-3 concise bullet points.' }] },
    ...toContentFromMessages(messages)
  ];
  const { data } = await axios.post(buildUrl('generateContent'), { contents });
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function moderate(text = '') {
  // Simple moderation heuristic via instruction
  const contents = [
    { role: 'user', parts: [{ text: `Classify the following text for safety. Reply JSON: {"allowed": boolean, "categories": string[]}\nText: ${text}` }] }
  ];
  const { data } = await axios.post(buildUrl('generateContent'), { contents });
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"allowed":true,"categories":[] }';
  try { return JSON.parse(txt); } catch { return { allowed: true, categories: [] }; }
}

module.exports = { smartReplies, summarize, moderate };
