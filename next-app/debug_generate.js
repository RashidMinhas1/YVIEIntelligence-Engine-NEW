import { StoryboardPipeline } from '@/lib/intelligence/storyboard';
async function run() {
    const script = `
Scene 1: A bustling city street at sunrise. People rush to work.
Scene 2: A quiet forest trail with morning mist. A lone hiker walks.
Scene 3: A hectic kitchen in a restaurant. Chefs scramble during dinner service.
Scene 4: A serene beach at sunset. Waves gently lap the shore.
Scene 5: A dark underground lab. Scientists examine glowing vials.
`;
    const theme = 'Documentary';
    const result = await StoryboardPipeline.execute(script, theme, true);
    console.log('=== Final Result ===');
    console.log(JSON.stringify(result, null, 2));
}
run().catch(console.error);
