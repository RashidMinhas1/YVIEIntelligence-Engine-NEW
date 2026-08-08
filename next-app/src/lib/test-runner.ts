import { eventBus } from './events/eventBus';
import { CryptoService } from './crypto/cryptoService';
import { PersistenceFactory } from './providers/persistence/factory';
import { providerRegistry } from './providers/registry';
import { modelDiscoveryService } from './providers/modelDiscovery';
import { healthMonitor } from './providers/healthMonitor';
import { importEngine } from './providers/importEngine';
import { routerEngine } from './router/routerEngine';
import { failoverWrapper } from './providers/failover';
import { requestHistory } from './providers/requestHistory';
import { backupService } from './backup/backupService';
import { diagnosticsService } from './providers/diagnostics';
import { PROVIDER_TEMPLATES, createProfileFromTemplate } from './providers/templates';

async function runFullQA() {
  console.log('====================================================');
  console.log('   FULL PRODUCTION READINESS QA TEST SUITE V2');
  console.log('====================================================\n');

  const testResults: { name: string; passed: boolean; details?: string }[] = [];

  // --- Phase 1: Event Bus Verification ---
  try {
    let captured = false;
    const sub = eventBus.subscribe('provider:added', () => { captured = true; });
    eventBus.publishSync('provider:added', {
      providerId: 'test_p',
      name: 'Test',
      category: 'custom',
      timestamp: Date.now()
    });
    sub.unsubscribe();
    testResults.push({ name: '1. Event Bus Pub/Sub & Unsubscribe', passed: captured });
  } catch (err: any) {
    testResults.push({ name: '1. Event Bus Pub/Sub & Unsubscribe', passed: false, details: err.message });
  }

  // --- Phase 2: Crypto Security Verification ---
  try {
    const rawKey = 'sk-proj-super-secret-key-12345';
    const encrypted = CryptoService.encrypt(rawKey);
    const decrypted = CryptoService.decrypt(encrypted);
    const masked = CryptoService.maskKey(rawKey);
    const passed = decrypted === rawKey && encrypted.encrypted !== rawKey && masked.startsWith('sk-p') && masked.endsWith('2345');
    testResults.push({ name: '2. Multi-Key AES-256-GCM Encryption & Masking', passed, details: `Masked: ${masked}` });
  } catch (err: any) {
    testResults.push({ name: '2. Multi-Key AES-256-GCM Encryption & Masking', passed: false, details: err.message });
  }

  // --- Phase 3: Persistence Layer Verification ---
  try {
    const engine = await PersistenceFactory.getInitializedEngine();
    await engine.set('qa_test_key', { ok: true });
    const val = await engine.get<{ ok: boolean }>('qa_test_key');
    await engine.delete('qa_test_key');
    testResults.push({ name: '3. Abstract Persistence Layer (Factory & Dev/Prod engines)', passed: val?.ok === true });
  } catch (err: any) {
    testResults.push({ name: '3. Abstract Persistence Layer (Factory & Dev/Prod engines)', passed: false, details: err.message });
  }

  // --- Phase 4: Provider Registry & API Keys ---
  try {
    await providerRegistry.init();
    const providers = await providerRegistry.getAllProviders();
    const addKeyResult = await providerRegistry.addApiKey('openai', 'QA Key 1', 'sk-test-key-999', 1);
    const activeKey = await providerRegistry.getActiveKeyForProvider('openai');
    const passed = providers.length >= 5 && addKeyResult !== null && activeKey?.plainTextKey === 'sk-test-key-999';
    testResults.push({ name: '4. Provider Registry & Multi-Key Priority Rotation', passed });
  } catch (err: any) {
    testResults.push({ name: '4. Provider Registry & Multi-Key Priority Rotation', passed: false, details: err.message });
  }

  // --- Phase 5: Import Engine Verification ---
  try {
    const sampleSpec = {
      id: 'qa-custom-provider',
      name: 'QA Custom Provider',
      category: 'community',
      apiBaseUrl: 'https://api.qa-custom.ai/v1',
      defaultModel: 'qa-model-v1',
    };
    const importRes = await importEngine.importProvider({ type: 'local_json', data: sampleSpec });
    const importedProvider = await providerRegistry.getProvider('qa-custom-provider');
    const passed = importRes.success && importedProvider?.profile.name === 'QA Custom Provider';
    testResults.push({ name: '5. Provider Import Engine (JSON Spec Validation & Registration)', passed });
  } catch (err: any) {
    testResults.push({ name: '5. Provider Import Engine (JSON Spec Validation & Registration)', passed: false, details: err.message });
  }

  // --- Phase 6: Router Engine Strategies ---
  try {
    routerEngine.setStrategy('priority');
    const routePriority = await routerEngine.selectRoute();
    routerEngine.setStrategy('round_robin');
    const routeRR = await routerEngine.selectRoute();
    routerEngine.setStrategy('fastest');
    const routeFast = await routerEngine.selectRoute();
    routerEngine.setStrategy('priority'); // reset
    const passed = routePriority !== null && routeRR !== null && routeFast !== null;
    testResults.push({ name: '6. Pluggable Router Engine (Priority, Round-Robin, Fastest)', passed });
  } catch (err: any) {
    testResults.push({ name: '6. Pluggable Router Engine (Priority, Round-Robin, Fastest)', passed: false, details: err.message });
  }

  // --- Phase 7: Failover & Resilience Wrapper ---
  try {
    const res = await failoverWrapper.executeWithResilience({
      prompt: 'Production Readiness Verification Prompt',
    });
    const passed = !!res.text && res.tokensUsed.total > 0 && typeof res.latencyMs === 'number';
    testResults.push({ name: '7. Resilient Failover Wrapper Sequence Execution', passed });
  } catch (err: any) {
    testResults.push({ name: '7. Resilient Failover Wrapper Sequence Execution', passed: false, details: err.message });
  }

  // --- Phase 8: Request History & Retention ---
  try {
    await requestHistory.init();
    await requestHistory.updateConfig({ mode: 'last_100', retentionDays: 30 });
    const logs = await requestHistory.getLogs();
    const passed = Array.isArray(logs);
    testResults.push({ name: '8. Configurable Request History & Retention Modes', passed });
  } catch (err: any) {
    testResults.push({ name: '8. Configurable Request History & Retention Modes', passed: false, details: err.message });
  }

  // --- Phase 9: Event-Driven Backup & Restore ---
  try {
    const backup = await backupService.createBackup('qa_test');
    const restoreSuccess = await backupService.restoreFromBackup(backup);
    const passed = backup.version === '2.0.0' && Array.isArray(backup.providerConfigs) && restoreSuccess;
    testResults.push({ name: '9. Event-Driven Backup Creation & Full Restore Engine', passed });
  } catch (err: any) {
    testResults.push({ name: '9. Event-Driven Backup Creation & Full Restore Engine', passed: false, details: err.message });
  }

  // --- Phase 10: Provider Diagnostics & Analytics ---
  try {
    const diag = await diagnosticsService.getDiagnosticsForProvider('openai');
    const passed = typeof diag.totalRequests === 'number' && typeof diag.successRate === 'number' && typeof diag.latencyMs === 'number';
    testResults.push({ name: '10. Real-Time Provider Diagnostics & Analytics Aggregation', passed });
  } catch (err: any) {
    testResults.push({ name: '10. Real-Time Provider Diagnostics & Analytics Aggregation', passed: false, details: err.message });
  }

  // --- Phase 11: Templates Library ---
  try {
    const tmpl = PROVIDER_TEMPLATES.find((t) => t.templateId === 'groq')!;
    const profile = createProfileFromTemplate(tmpl);
    const passed = profile.id.startsWith('groq_') && profile.apiBaseUrl === 'https://api.groq.com/openai/v1';
    testResults.push({ name: '11. Provider Templates Generation (1-Click Schema Creation)', passed });
  } catch (err: any) {
    testResults.push({ name: '11. Provider Templates Generation (1-Click Schema Creation)', passed: false, details: err.message });
  }

  console.log('----------------------------------------------------');
  let passCount = 0;
  for (const r of testResults) {
    const mark = r.passed ? '✓ [PASS]' : '✗ [FAIL]';
    console.log(`${mark} ${r.name} ${r.details ? `(${r.details})` : ''}`);
    if (r.passed) passCount++;
  }
  console.log('----------------------------------------------------');
  console.log(`TOTAL SCORE: ${passCount} / ${testResults.length} Tests Passed (${Math.round((passCount / testResults.length) * 100)}%)\n`);
}

runFullQA().catch((e) => console.error(e));
