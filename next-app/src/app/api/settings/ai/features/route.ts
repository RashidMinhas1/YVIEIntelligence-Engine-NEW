import { NextResponse } from "next/server";
import { getSafeAISettings, getAISettings, saveAISettings } from "@/lib/ai/settings";
import { featureRegistry } from "@/lib/ai/profiles";

// Structured App Modules & Features mapping based on user's actual app navigation
const APP_MODULES = [
  {
    moduleId: "wizard",
    moduleName: "Wizard",
    features: [
      { key: "title-analyzer", name: "Title Analyzer" },
      { key: "generate-title", name: "Generate Title" },
      { key: "analyze-script", name: "Analyze Script" },
      { key: "generate-script", name: "Generate Script" }
    ]
  },
  {
    moduleId: "dashboard",
    moduleName: "Dashboard",
    features: [
      { key: "dashboard-translation", name: "Translation" },
      { key: "dashboard-summary", name: "Dashboard Summary" }
    ]
  },
  {
    moduleId: "builder",
    moduleName: "Builder",
    features: [
      { key: "builder-assistant", name: "Builder Assistant" }
    ]
  },
  {
    moduleId: "studio",
    moduleName: "Creator Studio",
    features: [
      { key: "studio-production", name: "Production" },
      { key: "studio-storyboard", name: "Storyboard" },
      { key: "studio-script-editor", name: "Script Editor" },
      { key: "studio-thumbnail", name: "Thumbnail" }
    ]
  },
  {
    moduleId: "script-prompt-generator",
    moduleName: "Script Prompt Generator",
    features: [
      { key: "prompt-generator", name: "Generate Prompt" }
    ]
  },
  {
    moduleId: "intelligence",
    moduleName: "Intelligence",
    features: [
      { key: "intelligence-analyzer", name: "Intelligence Analyzer" }
    ]
  }
];

export async function GET() {
  const settings = getSafeAISettings();
  const dynamicFeatures = featureRegistry.getAllFeatures();
  
  // Track mapped keys so we can dump the rest into an "Uncategorized" module
  const mappedKeys = new Set<string>();
  
  const modulesWithOverrides = APP_MODULES.map(mod => {
    // Check if the module itself has an override (using its moduleId)
    const moduleOverride = settings.features?.[mod.moduleId] || null;
    mappedKeys.add(mod.moduleId);

    const featuresWithOverrides = mod.features.map(f => {
      mappedKeys.add(f.key);
      return {
        key: f.key,
        name: f.name,
        override: settings.features?.[f.key] || null
      };
    });

    return {
      moduleId: mod.moduleId,
      moduleName: mod.moduleName,
      moduleOverride: moduleOverride,
      features: featuresWithOverrides
    };
  });

  // Find any dynamically registered features that aren't in the explicit list
  const uncategorizedKeys = dynamicFeatures.filter(k => !mappedKeys.has(k));
  if (uncategorizedKeys.length > 0) {
    modulesWithOverrides.push({
      moduleId: "uncategorized",
      moduleName: "Other Discovered Features",
      moduleOverride: settings.features?.["uncategorized"] || null,
      features: uncategorizedKeys.map(key => ({
        key,
        name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        override: settings.features?.[key] || null
      }))
    });
  }

  return NextResponse.json({ 
    success: true, 
    modules: modulesWithOverrides,
    globalDefaultProvider: settings.activeProvider 
  });
}

export async function POST(req: Request) {
  try {
    const { featureKey, provider, model } = await req.json();
    if (!featureKey) {
      return NextResponse.json({ success: false, error: "featureKey (or moduleId) is required" }, { status: 400 });
    }

    const settings = getAISettings();
    if (!settings.features) settings.features = {};

    if (!provider) {
      // Clear override
      delete settings.features[featureKey];
    } else {
      // Set override
      settings.features[featureKey] = { provider, model };
    }

    saveAISettings(settings);

    return NextResponse.json({ success: true, featureKey, override: settings.features[featureKey] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
