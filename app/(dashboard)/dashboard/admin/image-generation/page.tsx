"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // still used for loadData
import { getModelInfo } from "@/lib/db/image-generation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Dealership } from "@/lib/types";
import type { ImageModelOption } from "@/lib/db/image-generation";
import { Settings, Save } from "lucide-react";

export default function ImageGenerationPage() {
  const [globalModel, setGlobalModel] = useState<ImageModelOption>("openai-gpt-image-2");
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [editingDealership, setEditingDealership] = useState<string | null>(null);
  const [editModel, setEditModel] = useState<ImageModelOption>("openai-gpt-image-2");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const supabase = createClient();

      // Load all dealerships
      const { data, error } = await supabase
        .from("dealerships")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setDealerships((data || []) as Dealership[]);

      const globalRes = await fetch("/api/admin/image-model", { method: "GET" });
      if (!globalRes.ok) {
        const globalData = await globalRes.json();
        throw new Error(globalData.error || "Failed to load global image model");
      }

      const globalData = await globalRes.json();
      setGlobalModel(globalData.globalModel || "openai-gpt-image-2");
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load image generation settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveGlobalModel() {
    try {
      setSavingGlobal(true);

      const res = await fetch("/api/admin/image-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: globalModel }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save global model");
      }

      toast.success("Global default model updated");
    } catch (err) {
      console.error("Failed to save global model:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update global model");
    } finally {
      setSavingGlobal(false);
    }
  }

  async function saveDealershipModel(dealershipId: string, model: ImageModelOption | null) {
    try {
      const res = await fetch("/api/admin/image-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealershipId, model }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update model");
      }

      // Update local state
      setDealerships(
        dealerships.map((d) =>
          d.id === dealershipId ? { ...d, image_model: model } : d
        )
      );

      setEditingDealership(null);
      if (model === null) {
        toast.success("Override cleared — using global default");
      } else {
        toast.success(`Model updated to ${model === "kie-nano-banana" ? "KIE.ai" : "OpenAI GPT-Image-2"}`);
      }
    } catch (err) {
      console.error("Failed to save model:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update dealership model");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading image generation settings...</p>
      </div>
    );
  }

  const kieInfo = getModelInfo("kie-nano-banana");
  const openaiInfo = getModelInfo("openai-gpt-image-2");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Image Generation Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure which AI model dealerships use for image generation
        </p>
      </div>

      {/* Model Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {kieInfo.displayName}
              <Badge variant="outline">Production</Badge>
            </CardTitle>
            <CardDescription>{kieInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Pricing:</p>
              <p className="font-mono text-xs">{kieInfo.pricing}</p>
            </div>
            <div>
              <p className="text-muted-foreground">API Type:</p>
              <p className="text-xs">Async (Webhook callbacks)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {openaiInfo.displayName}
              <Badge variant="outline">Production</Badge>
            </CardTitle>
            <CardDescription>{openaiInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Pricing:</p>
              <p className="font-mono text-xs">{openaiInfo.pricing}</p>
            </div>
            <div>
              <p className="text-muted-foreground">API Type:</p>
              <p className="text-xs">Async (Webhook callbacks)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Default Model */}
      <Card>
        <CardHeader>
          <CardTitle>Global Default Model</CardTitle>
          <CardDescription>
            Fallback model when dealerships don&apos;t have a specific override configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Default Model</label>
              <p className="text-xs text-muted-foreground mt-1">
                Currently: <span className="font-mono">{globalModel}</span>
              </p>
            </div>
            <select
              value={globalModel}
              onChange={(e) => setGlobalModel(e.target.value as ImageModelOption)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="kie-nano-banana">KIE.ai nano-banana-2</option>
              <option value="openai-gpt-image-2">OpenAI GPT Image 2</option>
            </select>
            <Button
              onClick={saveGlobalModel}
              disabled={savingGlobal}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-Dealership Overrides */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Dealership Model Selection</CardTitle>
          <CardDescription>
            Override the global default for specific dealerships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="py-3 px-4 font-medium">Dealership</th>
                  <th className="py-3 px-4 font-medium">Model</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dealerships.map((dealership) => (
                  <tr key={dealership.id}>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{dealership.name}</p>
                        <p className="text-xs text-muted-foreground">{dealership.id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {editingDealership === dealership.id ? (
                        <select
                          value={editModel}
                          onChange={(e) =>
                            setEditModel(e.target.value as ImageModelOption)
                          }
                          className="px-2 py-1 border border-input rounded-md bg-background text-sm"
                        >
                          <option value="kie-nano-banana">KIE.ai</option>
                          <option value="openai-gpt-image-2">OpenAI</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          {dealership.image_model ? (
                            <>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {dealership.image_model === "kie-nano-banana" ? "KIE.ai" : "OpenAI"}
                              </code>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Using global default
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={dealership.image_model ? "default" : "secondary"}
                      >
                        {dealership.image_model ? "Override" : "Global"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {editingDealership === dealership.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              saveDealershipModel(dealership.id, editModel)
                            }
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingDealership(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDealership(dealership.id);
                              setEditModel(
                                dealership.image_model || "openai-gpt-image-2"
                              );
                            }}
                          >
                            Edit
                          </Button>
                          {dealership.image_model && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveDealershipModel(dealership.id, null)}
                              title="Clear override and use global default"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
