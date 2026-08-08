import { getSafeAISettings } from "./src/lib/ai/settings";
try {
    console.log("Settings:", getSafeAISettings());
}
catch (e) {
    console.error("Error:", e);
}
