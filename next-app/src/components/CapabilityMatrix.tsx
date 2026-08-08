"use client";

import React from 'react';
import { useProviderContext } from '@/context/ProviderContext';
import { Check, X, Shield, Eye, Wrench, Code, Radio, Brain, Image, Mic } from 'lucide-react';
import { InfoPanel } from './settings/info-panel';

export function CapabilityMatrix() {
  const { providers } = useProviderContext();

  const capabilities = [
    { key: 'chat', label: 'Chat', icon: Shield },
    { key: 'vision', label: 'Vision', icon: Eye },
    { key: 'toolCalling', label: 'Tools', icon: Wrench },
    { key: 'jsonMode', label: 'JSON', icon: Code },
    { key: 'streaming', label: 'Stream', icon: Radio },
    { key: 'reasoning', label: 'Reasoning', icon: Brain },
    { key: 'imageGeneration', label: 'Image', icon: Image },
    { key: 'audio', label: 'Audio', icon: Mic },
  ];

  return (
    <div className="space-y-4">
      <InfoPanel 
        title="AI Capability Matrix"
        purpose="This matrix acts as an intelligent router map. It helps you visualize exactly which of your configured APIs are capable of handling specific advanced tasks like Vision (Image analysis), Tool Calling (Executing functions), JSON mode, or Audio inputs."
        example="If you are writing a script that needs to analyze a YouTube thumbnail image, check this matrix to see which of your active providers have the 'Vision' capability (e.g., GPT-4o or Gemini). You can then specifically target that provider in the Playground!"
        nextStep="history"
      />
      <div className="bg-card p-4 border rounded-lg shadow-sm">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-slate-100 dark:bg-slate-900 border-b">
          <tr>
            <th className="p-3 font-semibold">Provider</th>
            <th className="p-3 font-semibold">Category</th>
            {capabilities.map((cap) => (
              <th key={cap.key} className="p-3 font-semibold text-center">
                <div className="flex items-center justify-center gap-1">
                  <cap.icon className="w-3 h-3 text-muted-foreground" />
                  <span>{cap.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {providers.map((p) => {
            const caps = p.profile?.capabilities || {};
            return (
              <tr key={p.profile?.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="p-3 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {p.profile?.name}
                </td>
                <td className="p-3 text-muted-foreground capitalize">{p.profile?.category}</td>
                {capabilities.map((cap) => {
                  const supported = !!caps[cap.key];
                  return (
                    <td key={cap.key} className="p-3 text-center">
                      {supported ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
