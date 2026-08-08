"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { PROVIDER_TEMPLATES, createProfileFromTemplate } from '@/lib/providers/templates';

export default function TemplatesPage() {
  const handleUseTemplate = async (template: any) => {
    const profile = createProfileFromTemplate(template);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Provider ${template.name} created successfully!`);
      }
    } catch (err) {
      console.error('Failed to create provider from template', err);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/settings/providers">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Provider Templates Library
          </h1>
          <p className="text-xs text-muted-foreground">
            Instantly create new provider integrations with pre-configured schemas and model lists.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDER_TEMPLATES.map((tmpl) => (
          <Card key={tmpl.templateId} className="border shadow-sm hover:border-blue-500/50 transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">{tmpl.name}</CardTitle>
                <Badge variant="outline" className="capitalize text-[10px]">
                  {tmpl.category}
                </Badge>
              </div>
              <CardDescription className="text-xs">{tmpl.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-1 text-xs">
              <div className="text-[10px] text-muted-foreground font-mono truncate bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                Base URL: {tmpl.apiBaseUrl}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-[10px] text-muted-foreground">
                  {tmpl.defaultModels.length} Default Models
                </div>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleUseTemplate(tmpl)}>
                  <Plus className="w-3 h-3" /> Create Provider
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
