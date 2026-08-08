"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Github, Key, CheckCircle, Loader2 } from "lucide-react";
import { useProviderContext } from "@/context/ProviderContext";

export function GitHubModelsWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [token, setToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const { connectProvider, discoveredModels } = useProviderContext();

  const handleValidateToken = async () => {
    if (!token.trim()) {
      setError("Please enter a valid Personal Access Token");
      return;
    }
    setValidating(true);
    setError("");
    try {
      // Validate token with GitHub
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Invalid token or authentication failed");
      
      // Connect provider and trigger discovery
      await connectProvider("github", token);
      setStep(3); // move to model selection
    } catch (err: any) {
      setError(err.message || "A network error occurred while connecting to GitHub.");
    } finally {
      setValidating(false);
    }
  };

  const handleSave = () => {
    setOpen(false);
    setStep(1);
    setToken("");
  };

  const models = discoveredModels["github"] || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">Connect GitHub</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" /> 
            GitHub Models Setup
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                To connect GitHub Models, you need a Personal Access Token (Classic or Fine-grained) with appropriate permissions.
              </div>
              <div className="bg-muted p-3 rounded-md text-xs space-y-2">
                <p>1. Go to GitHub Settings &gt; Developer settings</p>
                <p>2. Generate a new Personal Access Token</p>
                <p>3. Copy and paste it below</p>
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                I have my token
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Personal Access Token</label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="ghp_..." 
                    className="pl-9 font-mono"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Back</Button>
                <Button className="w-full" onClick={handleValidateToken} disabled={validating}>
                  {validating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Validate & Connect
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900/50">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p className="font-semibold">Successfully Connected!</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Discovered Models</label>
                {models.length > 0 ? (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto p-2 border rounded-md bg-muted/50">
                    {models.map(m => (
                      <div key={m.id} className="flex items-center space-x-2">
                        <Checkbox id={`model-${m.id}`} defaultChecked />
                        <label htmlFor={`model-${m.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {m.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground p-3 border rounded-md text-center">
                    No models returned or discovery still running...
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleSave}>
                Save & Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
