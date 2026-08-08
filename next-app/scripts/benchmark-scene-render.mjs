import { chromium } from '@playwright/test';
import fs from 'fs';

async function runBenchmark() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  const sceneCounts = [10, 50, 100];

  for (const count of sceneCounts) {
    console.log(`Benchmarking ${count} scenes...`);
    
    await page.goto('http://localhost:3001/studio');
    
    // Create new project
    await page.locator('button', { hasText: /New Project/i }).click();
    await page.fill('input[name=title]', `Benchmark ${count}`);
    await page.locator('button', { hasText: /Create/i }).click();
    
    await page.locator('text=Storyline').click();

    // Generate scenes
    const script = Array.from({ length: count }, (_, i) => `Scene ${i + 1}\nTitle: Bench ${i + 1}\nContent: Content for bench ${i + 1}`).join('\n---\n');
    await page.fill('textarea[name=script]', script);
    
    const startTime = Date.now();
    await page.locator('button', { hasText: /Generate Storyline/i }).click();
    
    // Wait for scenes to render (either scene-card appears and count matches, or wait for network idle)
    await page.waitForSelector('.scene-card', { timeout: 120000 });
    // Wait for the total count to appear, but due to virtualization, only a subset may be rendered in the DOM!
    // We should wait until the scene list state settles. We can just wait for a short fixed time after generation
    // since React will render the virtual list very quickly.
    await page.waitForTimeout(2000);

    const renderTime = Date.now() - startTime;

    // Get DOM node count
    const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);

    // Get memory usage if possible (JS heap size)
    const metrics = await page.evaluate(() => {
      return window.performance.memory?.usedJSHeapSize || 0;
    });

    results.push({
      scenes: count,
      mode: count > 20 ? 'Virtualized' : 'Standard',
      renderTimeMs: renderTime,
      domNodes: domNodes,
      memoryUsageMB: Math.round(metrics / (1024 * 1024))
    });
  }

  await browser.close();

  fs.writeFileSync('PHASE_5_2_BENCHMARK_RESULTS.json', JSON.stringify(results, null, 2));
  console.log('Benchmark complete. Results saved to PHASE_5_2_BENCHMARK_RESULTS.json');
}

runBenchmark().catch(console.error);
