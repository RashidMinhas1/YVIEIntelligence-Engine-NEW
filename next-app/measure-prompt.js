import fs from 'fs';

const globalStoryPlannerPrompt = `######################################################################
PART 3.1 — NARRATION ANALYSIS ENGINE v1.0
... (snip, I will just measure the file itself)
`;

// Actually, let's just read the global-story-planner.ts file and calculate its length.
const content = fs.readFileSync('./src/lib/intelligence/storyboard/planners/global-story-planner.ts', 'utf-8');
const promptStart = content.indexOf('const prompt = `');
const promptEnd = content.indexOf('`;\n\n    const rawResponse');

const promptText = content.substring(promptStart + 16, promptEnd);

const charCount = promptText.length;
const wordCount = promptText.split(/\s+/).length;
const estimatedTokens = Math.ceil(charCount / 4);

console.log('--- GLOBAL STORY PLANNER PROMPT STATS ---');
console.log('Total Characters:', charCount);
console.log('Total Words:', wordCount);
console.log('Estimated Tokens:', estimatedTokens);

// Scene generator
const sceneGenContent = fs.readFileSync('./src/lib/intelligence/storyboard/generators/scene-generator.ts', 'utf-8');
const scenePromptStart = sceneGenContent.indexOf('const prompt = `');
const scenePromptEnd = sceneGenContent.indexOf('`;\n\n    const rawResponse');
const scenePromptText = sceneGenContent.substring(scenePromptStart + 16, scenePromptEnd);

const sceneCharCount = scenePromptText.length;
const sceneWordCount = scenePromptText.split(/\s+/).length;
const sceneEstimatedTokens = Math.ceil(sceneCharCount / 4);

console.log('\n--- SCENE GENERATOR PROMPT STATS ---');
console.log('Total Characters:', sceneCharCount);
console.log('Total Words:', sceneWordCount);
console.log('Estimated Tokens:', sceneEstimatedTokens);

fs.writeFileSync('FINAL_PROMPT_DUMP.txt', promptText);
