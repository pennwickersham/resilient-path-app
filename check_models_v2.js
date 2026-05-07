import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('Set GEMINI_API_KEY env var first.'); process.exit(1); }
const ai = new GoogleGenAI({ apiKey });

async function main() {
  try {
    console.log("Listing available models...");
    const models = await ai.models.list();
    models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName || 'No display name'})`);
    });
  } catch (err) {
    console.error("Failed to list models:", err.message);
  }
}

main();
