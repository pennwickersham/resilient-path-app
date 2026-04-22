import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyDnkEpMTk99fKjXCMvGtpFTcKaGL_JwEUc';
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
