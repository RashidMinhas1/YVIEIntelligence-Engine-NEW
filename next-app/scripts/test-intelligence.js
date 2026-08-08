import { IntelligenceEngine } from "../src/lib/intelligence/engine";
import fs from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
const TEST_CASES = [
    {
        name: "True Crime - Misleading Title & Weak Transitions",
        title: "The Genius Who Stole The Moon (And Got Away With It)",
        script: `Have you ever wondered how someone could steal a celestial body? It sounds impossible. But in 1998, one man tried. 

Let's talk about my sponsor, SquareSpace. Making a website is super easy.

Anyway, John was a normal guy who worked at a car dealership. He decided he was going to steal a 1995 Honda Civic from the lot. The security cameras were broken so he just drove off.

To bake a chocolate cake, you need flour, sugar, and cocoa powder. Combine them in a bowl. John ate the cake after stealing the car. And that's how he became a legend.`
    },
    {
        name: "Documentary - Missing Pacing & Incomplete Loops",
        title: "How The Universe Will Actually End",
        script: `The universe started 13.8 billion years ago with the Big Bang. Everything expanded outward from a single point of infinite density.

Eventually, all the stars will burn out and the universe will experience Heat Death. Everything will be cold and dark forever. Thanks for watching.`
    },
    {
        name: "Finance - Very Short & Overpromising",
        title: "How To Become A Millionaire in 10 Days Guaranteed",
        script: `Do you want to be rich? It's really simple.

Just buy my online course for $997. Inside, I will teach you the mindset secrets of billionaires.

Work hard and don't give up. See you at the top!`
    },
    {
        name: "GOLD STANDARD - Excellent Script",
        title: "I Survived 50 Hours In Antarctica",
        script: `The wind is howling at 80 miles per hour. The temperature is negative 40 degrees. And I am completely alone in the deadliest place on Earth. If my heater breaks, I have less than 12 minutes to live before my blood freezes solid. 

You might be wondering how I ended up here. 

Two weeks ago, I met a man who claimed he had discovered a secret bunker buried under the Antarctic ice shelf since 1954. He gave me coordinates and a key. Today, I'm going to find out if he was telling the truth, or if I'm going to freeze to death chasing a ghost.`
    },
    {
        name: "GOLD STANDARD - Average Script",
        title: "I Went To Antarctica",
        script: `Hey guys, today we are going to Antarctica. It's really cold here. 

I packed a lot of warm clothes because the weather app said it would be below zero. The plane ride was super long and boring, but we finally made it. 

We walked around for a bit and saw some penguins. They were really cute. I hope you guys enjoyed this vlog, remember to like and subscribe for more travel content.`
    },
    {
        name: "GOLD STANDARD - Poor Script",
        title: "Cold",
        script: `It's cold. I don't like it. Subscribe.`
    }
];
const PROVIDER_FALLBACK_ORDER = ["openrouter", "gemini", "openai"];
async function runTests() {
    console.log("Starting Script Evaluation Test Suite (TEST MODE)...");
    const startTime = Date.now();
    const engine = new IntelligenceEngine();
    const resultsDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(resultsDir))
        fs.mkdirSync(resultsDir);
    const reportData = {
        passed: 0,
        failed: 0,
        tests: [],
        executionTime: 0,
        tokenMode: "COMPACT_TEST_MODE",
    };
    for (const testCase of TEST_CASES) {
        console.log(`\n▶ Running: ${testCase.name}`);
        let success = false;
        let providerUsed = "none";
        let finalError = "";
        let aiReport = null;
        for (const provider of PROVIDER_FALLBACK_ORDER) {
            try {
                console.log(`  Trying provider: ${provider}...`);
                aiReport = await engine.analyzeScript(testCase.script, testCase.title, {
                    testMode: true,
                    maxTokens: 1500,
                    providerOverride: provider
                });
                success = true;
                providerUsed = provider;
                console.log(`  ✅ Passed via ${provider}`);
                break; // Stop falling back
            }
            catch (err) {
                console.log(`  ⚠️ Failed via ${provider}: ${err.message}`);
                finalError = err.message;
                // Continue to next provider
            }
        }
        if (success) {
            reportData.passed++;
            reportData.tests.push({ name: testCase.name, status: "PASS", provider: providerUsed, report: aiReport });
            const fileName = testCase.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".json";
            fs.writeFileSync(path.join(resultsDir, fileName), JSON.stringify(aiReport, null, 2));
        }
        else {
            reportData.failed++;
            reportData.tests.push({ name: testCase.name, status: "FAIL", error: finalError });
        }
    }
    reportData.executionTime = (Date.now() - startTime) / 1000;
    console.log("\n=============================");
    console.log("TEST SUITE COMPLETED");
    console.log(`Passed: ${reportData.passed}`);
    console.log(`Failed: ${reportData.failed}`);
    console.log(`Time: ${reportData.executionTime}s`);
    console.log("=============================\n");
    fs.writeFileSync(path.join(resultsDir, "final_validation_report.json"), JSON.stringify(reportData, null, 2));
}
runTests().catch(console.error);
