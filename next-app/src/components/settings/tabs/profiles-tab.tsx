"use client";

import { useState, useEffect } from "react";
import { InfoPanel } from "../info-panel";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ProfilesTab() {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    defaultProvider: "openai",
    budget: 10
  });

  const fetchProfiles = async () => {
    setIsLoading(true);
    const res = await fetch("/api/settings/ai/profiles");
    const data = await res.json();
    if (data.success) setProfiles(data.profiles);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this profile?")) return;
    await fetch(`/api/settings/ai/profiles?id=${id}`, { method: "DELETE" });
    fetchProfiles();
  };

  const handleOpenWizard = () => {
    setFormData({
      id: `profile-${Date.now()}`,
      name: "",
      defaultProvider: "openai",
      budget: 10
    });
    setIsWizardOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!formData.name) {
      alert("Profile name is required");
      return;
    }
    const profile = { name: formData.name, defaultProvider: formData.defaultProvider, budget: formData.budget };
    await fetch("/api/settings/ai/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: formData.id, profile })
    });
    setIsWizardOpen(false);
    fetchProfiles();
  };

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Workflow Profiles"
        purpose="Change AI behavior for the entire application with one click."
        example="Budget Mode uses DeepSeek, Fast Mode uses Groq."
        nextStep="Project Profiles"
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Profiles</h2>
        <Button onClick={handleOpenWizard}><Plus className="w-4 h-4 mr-2" /> Create Profile</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div>Loading profiles...</div>
        ) : Object.keys(profiles).length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground border rounded-xl bg-muted/10">No profiles found. Create one to begin.</div>
        ) : (
          Object.entries(profiles).map(([id, config]) => (
            <div key={id} className="border rounded-lg p-4 bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-primary">{config.name}</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Active</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Provider: {config.defaultProvider}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Budget Limit: {config.budget === 0 ? "Unlimited" : `$${config.budget}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  setFormData({ id, name: config.name, defaultProvider: config.defaultProvider, budget: config.budget });
                  setIsWizardOpen(true);
                }}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Workflow Profile</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Profile Name</Label>
              <Input placeholder="e.g. Creative Mode" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Default Provider</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.defaultProvider}
                onChange={e => setFormData({...formData, defaultProvider: e.target.value})}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Budget Limit ($)</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="accent-primary"
                    checked={formData.budget === 0} 
                    onChange={e => setFormData({...formData, budget: e.target.checked ? 0 : 10})} 
                  />
                  Unlimited
                </label>
              </div>
              <Input 
                type="number" 
                value={formData.budget || ""} 
                disabled={formData.budget === 0}
                placeholder={formData.budget === 0 ? "Unlimited" : "Enter amount"}
                onChange={e => setFormData({...formData, budget: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsWizardOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
