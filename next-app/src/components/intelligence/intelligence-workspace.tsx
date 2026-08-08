"use client";

import { useState } from "react";
import { Terminal, Send, RefreshCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveProviderBadge } from "../ActiveProviderBadge";
import { toast } from "sonner";

export function IntelligenceWorkspace() {
  const [content, setContent] = useState<string>("> AI Intelligence Workspace initialized.\n> Ready for input...");
  const [input, setInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    const userMessage = `\n> USER: ${input}\n`;
    setContent(prev => prev + userMessage);
    setInput("");

    try {
      const res = await fetch("/api/intelligence/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleType: "workspace",
          originalText: input,
          scriptContext: content,
          specificInstruction: "Act as an interactive AI intelligence assistant. Reply concisely."
        })
      });

      if (!res.ok) throw new Error("Failed to process request");
      const data = await res.json();
      
      // Simulate streaming or immediate response
      setContent(prev => prev + `> AI: ${data.variant?.optimizedText || "Processing complete. (Replace with actual stream)"}\n`);
    } catch (err: any) {
      setContent(prev => prev + `> ERROR: ${err.message}\n`);
    }
    
    setIsProcessing(false);
  };

  const handleClear = () => {
    setContent("> AI Intelligence Workspace initialized.\n> Ready for input...");
  };

  const handleSave = () => {
    navigator.clipboard.writeText(content);
    toast.success("Workspace content copied to clipboard");
  };

  return (
    <div className="flex flex-col h-[600px] border border-border rounded-xl overflow-hidden bg-background shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">AI Intelligence Workspace</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono ml-1 mr-4">Intelligence Workspace</span>
          <div className="pt-1">
            <ActiveProviderBadge featureKey="workspace" moduleName="Intelligence Workspace" />
          </div>
          <Button variant="ghost" size="icon" onClick={handleClear} title="Clear Terminal">
            <RefreshCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSave} title="Copy Content">
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-black p-4 flex flex-col group relative">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Editable Terminal</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full bg-transparent text-green-400 font-mono text-sm leading-relaxed resize-none outline-none custom-scrollbar"
          spellCheck={false}
        />
      </div>

      <div className="p-3 border-t border-border bg-muted/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask the AI, generate content, or type instructions..."
          className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          disabled={isProcessing}
        />
        <Button onClick={handleSend} disabled={isProcessing || !input.trim()}>
          <Send className="w-4 h-4 mr-2" />
          {isProcessing ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
