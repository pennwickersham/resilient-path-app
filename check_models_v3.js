import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyDnkEpMTk99fKjXCMvGtpFTcKaGL_JwEUc';
const ai = new GoogleGenAI({ apiKey });

async function main() {
  try {
    console.log("Fetching models...");
    const result = await ai.models.list();
    console.log("Result type:", typeof result);
    console.log("Result keys:", Object.keys(result));
    
    const models = result.models || result;
    if (Array.isArray(models)) {
        console.log("Available models:");
        models.forEach(m => console.log(`- ${m.name}`));
    } else {
        console.log("Models is not an array. Inspecting first key if possible.");
        console.log(JSON.stringify(result, null, 2).substring(0, 500));
    }
  } catch (err) {
    console.error("Failed to list models:", err.message);
  }
}

main();
