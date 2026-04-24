
import { GoogleGenAI } from "@google/generative-ai";

async function testModel(modelName) {
    const apiKey = "YOUR_API_KEY_HERE"; // I'll replace this mentally or use the real one if I have it
    const genAI = new GoogleGenAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        console.log(`SUCCESS: ${modelName}`);
        return true;
    } catch (e) {
        console.log(`FAILURE: ${modelName} - ${e.message}`);
        return false;
    }
}

async function run() {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-2.5-flash"
    ];
    for (const m of models) {
        await testModel(m);
    }
}
run();
