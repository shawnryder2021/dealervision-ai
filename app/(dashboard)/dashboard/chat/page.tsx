"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Wand2,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  ImageIcon,
  Download,
  RefreshCw,
  Pencil,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EditImageDialog } from "@/components/create/EditImageDialog";
import { TextOverlayEditor } from "@/components/create/TextOverlayEditor";
import { useAppStore } from "@/lib/store";
import { isDemoMode } from "@/lib/demo-data";
import { getAspectRatioForChannel, getResolutionForChannel } from "@/lib/prompt-templates";
import { toast } from "sonner";
import type { GeneratedAsset } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** Extract a prompt from the assistant's message — tries multiple formats */
function extractPrompt(content: string): string | null {
  // 1. ```prompt ... ``` code block (preferred)
  const promptBlock = content.match(/```prompt\n?([\s\S]+?)```/);
  if (promptBlock) return promptBlock[1].trim();

  // 2. Generic code block
  const codeBlock = content.match(/```\n?([\s\S]+?)```/);
  if (codeBlock) return codeBlock[1].trim();

  // 3. **Prompt:** "..." or **Prompt:** ... (markdown bold with quotes)
  const boldPromptQuoted = content.match(/\*\*Prompt:?\*\*\s*"([\s\S]+?)"/);
  if (boldPromptQuoted) return boldPromptQuoted[1].trim();

  // 4. **Prompt:** followed by text until a double newline or end
  const boldPrompt = content.match(/\*\*Prompt:?\*\*\s*([\s\S]+?)(?:\n\n|\n\*\*|$)/);
  if (boldPrompt) return boldPrompt[1].trim().replace(/^["']|["']$/g, "");

  // 5. Prompt: at line start
  const promptLine = content.match(/^Prompt:\s*"?([\s\S]+?)"?\s*$/im);
  if (promptLine) return promptLine[1].trim();

  return null;
}

export default function ChatPage() {
  const { dealership, addAsset, updateAsset } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, generatedAsset]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setGeneratingPrompt(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Chat request failed");
      }

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.content };
      setMessages((prev) => [...prev, assistantMsg]);

      const extracted = extractPrompt(data.content);
      if (extracted) {
        setGeneratingPrompt(extracted);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleGenerateImage(prompt: string) {
    if (!dealership) {
      toast.error("Dealership not found");
      return;
    }

    setIsGeneratingImage(true);
    setGeneratedAsset(null);

    const channel = "instagram-post";
    const aspectRatio = getAspectRatioForChannel(channel);
    const resolution = getResolutionForChannel(channel);

    try {
      const endpoint = isDemoMode() ? "/api/demo-generate" : "/api/generate";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isDemoMode()
            ? { prompt, aspect_ratio: aspectRatio, resolution }
            : {
                content_type: "custom",
                channel,
                custom_prompt: prompt,
                style: "photorealistic",
              }
        ),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      const taskId = isDemoMode() ? result.taskId : result.kie_task_id;

      const asset: GeneratedAsset = isDemoMode()
        ? {
            id: `chat-${Date.now()}`,
            dealership_id: dealership.id,
            created_by: null,
            vehicle_id: null,
            content_type: "custom",
            channel,
            prompt,
            image_url: null,
            storage_path: null,
            aspect_ratio: aspectRatio,
            resolution,
            kie_task_id: taskId,
            status: "processing",
            metadata: {},
            is_favorite: false,
            campaign: "AI Chat",
            created_at: new Date().toISOString(),
          }
        : result;

      setGeneratedAsset(asset);
      addAsset(asset);

      // Add a generating message to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⏳ Generating your image now..." },
      ]);

      pollForImage(asset, taskId || result.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
      setIsGeneratingImage(false);
    }
  }

  async function pollForImage(asset: GeneratedAsset, id: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const url = isDemoMode() ? `/api/demo-generate?taskId=${id}` : `/api/generate/${id}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed" && (data.output?.image_url || data.output?.url || data.image_url)) {
          const imageUrl = data.output?.image_url || data.output?.url || data.image_url;
          const updated = { ...asset, status: "completed" as const, image_url: imageUrl };
          setGeneratedAsset(updated);
          updateAsset(asset.id, updated);
          setIsGeneratingImage(false);

          // Replace the "generating" message with success
          setMessages((prev) => {
            const copy = [...prev];
            const genIdx = copy.findIndex((m) => m.content.includes("Generating your image"));
            if (genIdx >= 0) {
              copy[genIdx] = {
                role: "assistant",
                content: `Your image is ready! You can download it or ask me to refine the prompt for another variation.\n\n[generated-image:${imageUrl}]`,
              };
            }
            return copy;
          });

          toast.success("Image generated!");
          return;
        }

        if (data.status === "failed") {
          setGeneratedAsset({ ...asset, status: "failed" });
          setIsGeneratingImage(false);
          setMessages((prev) => {
            const copy = [...prev];
            const genIdx = copy.findIndex((m) => m.content.includes("Generating your image"));
            if (genIdx >= 0) {
              copy[genIdx] = {
                role: "assistant",
                content: "Image generation failed. Try refining the prompt or asking me for a different approach.",
              };
            }
            return copy;
          });
          toast.error("Generation failed. Try again.");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setIsGeneratingImage(false);
          toast.error("Generation timed out.");
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 3000);
  }

  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function resetChat() {
    setMessages([]);
    setInput("");
    setGeneratingPrompt(null);
    setGeneratedAsset(null);
    setIsGeneratingImage(false);
  }

  const SUGGESTIONS = [
    "Create a social media post for a 2025 Ford F-150 in Velocity Blue",
    "Help me make a billboard ad for our summer sales event with 0% APR",
    "Generate a luxury feel ad for a black Mercedes-Benz S-Class",
    "Design an Instagram story for a certified pre-owned vehicle promotion",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            AI Marketing Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Chat to craft and generate marketing visuals
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={resetChat}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            New Chat
          </Button>
        )}
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Chat Column */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mb-4">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="font-heading text-xl font-semibold mb-2">
                  Your AI Marketing Partner
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-8">
                  Describe the vehicle, campaign, or visual you have in mind. I&apos;ll help you craft the perfect prompt and generate it right here.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-left text-xs p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${
                    msg.role === "assistant"
                      ? "gradient-primary"
                      : "bg-muted border border-border"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`relative group max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border/50 rounded-tl-sm"
                  }`}
                >
                  <MessageContent
                    content={msg.content}
                    onGenerate={
                      msg.role === "assistant" && !isGeneratingImage
                        ? handleGenerateImage
                        : undefined
                    }
                    isGenerating={isGeneratingImage}
                    onEdit={msg.role === "assistant" ? (url) => {
                      setEditImageUrl(url);
                      setEditDialogOpen(true);
                    } : undefined}
                    onAddText={msg.role === "assistant" ? (url) => {
                      setEditImageUrl(url);
                      setTextEditorOpen(true);
                    } : undefined}
                  />

                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyToClipboard(msg.content, i)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                    >
                      {copiedIndex === i ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 mt-4">
            <div className="relative flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the marketing visual you want to create..."
                rows={2}
                className="resize-none pr-12 min-h-[60px] max-h-[140px]"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="gradient-primary text-white shrink-0 h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">
              Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>

        {/* Right Panel — Generate from Prompt */}
        <div className="w-72 shrink-0 space-y-4 hidden lg:block">
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Generate Image</p>
              </div>

              {generatingPrompt ? (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-2.5 font-mono max-h-40 overflow-y-auto">
                    {generatingPrompt}
                  </p>
                  <Button
                    className="w-full gradient-primary text-white"
                    size="sm"
                    onClick={() => handleGenerateImage(generatingPrompt)}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {isGeneratingImage ? "Generating..." : "Generate Image"}
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Chat with the AI to craft your prompt. When ready, a Generate button will appear here and in the chat.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Image Preview */}
          {(isGeneratingImage || generatedAsset) && (
            <Card className="glass overflow-hidden">
              <CardContent className="p-0">
                {generatedAsset?.status === "completed" && generatedAsset.image_url ? (
                  <>
                    <img
                      src={generatedAsset.image_url}
                      alt="Generated marketing visual"
                      className="w-full h-auto"
                    />
                    <div className="p-3 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => window.open(generatedAsset.image_url!, "_blank")}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => generatingPrompt && handleGenerateImage(generatingPrompt)}
                          disabled={isGeneratingImage}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setEditImageUrl(generatedAsset.image_url!);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          AI Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setEditImageUrl(generatedAsset.image_url!);
                            setTextEditorOpen(true);
                          }}
                        >
                          <Type className="h-3 w-3 mr-1" />
                          Add Text
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                    <p className="text-xs">Generating visual...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          {messages.length === 0 && (
            <Card className="glass">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Mention the vehicle year, make, and model</li>
                  <li>• Specify the color for best results</li>
                  <li>• Describe the mood (luxury, sporty, family)</li>
                  <li>• Include the target platform (Instagram, billboard)</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Image Dialog */}
      {editImageUrl && (
        <EditImageDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          imageUrl={editImageUrl}
          aspectRatio={generatedAsset?.aspect_ratio || "1:1"}
          onEditComplete={(newUrl) => {
            if (generatedAsset) {
              const updated = { ...generatedAsset, image_url: newUrl };
              setGeneratedAsset(updated);
              updateAsset(generatedAsset.id, updated);
            }
            // Update the image in chat messages
            setMessages((prev) =>
              prev.map((m) =>
                m.content.includes("[generated-image:")
                  ? { ...m, content: m.content.replace(/\[generated-image:.*?\]/, `[generated-image:${newUrl}]`) }
                  : m
              )
            );
            setEditImageUrl(newUrl);
            toast.success("Image updated with edits!");
          }}
        />
      )}

      {/* Text Overlay Editor */}
      {editImageUrl && (
        <TextOverlayEditor
          open={textEditorOpen}
          onOpenChange={setTextEditorOpen}
          imageUrl={editImageUrl}
          onSave={(dataUrl) => {
            if (generatedAsset) {
              const updated = { ...generatedAsset, image_url: dataUrl };
              setGeneratedAsset(updated);
              updateAsset(generatedAsset.id, updated);
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.content.includes("[generated-image:")
                  ? { ...m, content: m.content.replace(/\[generated-image:.*?\]/, `[generated-image:${dataUrl}]`) }
                  : m
              )
            );
            setEditImageUrl(dataUrl);
            toast.success("Text overlay applied!");
          }}
        />
      )}
    </div>
  );
}

/** Renders message content with prompt blocks, inline images, and Generate buttons */
function MessageContent({
  content,
  onGenerate,
  isGenerating,
  onEdit,
  onAddText,
}: {
  content: string;
  onGenerate?: (prompt: string) => void;
  isGenerating?: boolean;
  onEdit?: (imageUrl: string) => void;
  onAddText?: (imageUrl: string) => void;
}) {
  // Check for inline generated image tag: [generated-image:URL]
  const imageMatch = content.match(/\[generated-image:(.*?)\]/);
  const textWithoutImage = content.replace(/\[generated-image:.*?\]/, "").trim();

  // Split on code blocks
  const parts = textWithoutImage.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const isPromptBlock = part.startsWith("```prompt");
          const code = part
            .replace(/^```(?:prompt)?\n?/, "")
            .replace(/```$/, "")
            .trim();

          return (
            <div key={i}>
              {isPromptBlock && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                  Generated Prompt
                </p>
              )}
              <pre className="bg-muted/70 rounded-lg p-2.5 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                {code}
              </pre>
              {/* Inline Generate button for prompt blocks */}
              {isPromptBlock && onGenerate && (
                <Button
                  size="sm"
                  className="mt-2 gradient-primary text-white"
                  onClick={() => onGenerate(code)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {isGenerating ? "Generating..." : "Generate This Image"}
                </Button>
              )}
            </div>
          );
        }

        if (!part.trim()) return null;

        // Render markdown-like bold and line breaks
        return (
          <span key={i} className="whitespace-pre-wrap">
            {renderMarkdown(part)}
          </span>
        );
      })}

      {/* Non-prompt-block generate button — if a prompt was detected via bold format */}
      {!parts.some((p) => p.startsWith("```prompt")) && onGenerate && !imageMatch && (() => {
        const extracted = extractBoldPrompt(textWithoutImage);
        if (!extracted) return null;
        return (
          <Button
            size="sm"
            className="mt-1 gradient-primary text-white"
            onClick={() => onGenerate(extracted)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isGenerating ? "Generating..." : "Generate This Image"}
          </Button>
        );
      })()}

      {/* Inline image display */}
      {imageMatch && (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <img
            src={imageMatch[1]}
            alt="Generated visual"
            className="w-full h-auto"
          />
          <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30">
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex-1"
              onClick={() => window.open(imageMatch[1], "_blank")}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs flex-1"
                onClick={() => onEdit(imageMatch[1])}
              >
                <Pencil className="h-3 w-3 mr-1" />
                AI Edit
              </Button>
            )}
            {onAddText && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs flex-1"
                onClick={() => onAddText(imageMatch[1])}
              >
                <Type className="h-3 w-3 mr-1" />
                Add Text
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Extract a prompt from **Prompt:** style formatting */
function extractBoldPrompt(content: string): string | null {
  const boldQuoted = content.match(/\*\*Prompt:?\*\*\s*"([\s\S]+?)"/);
  if (boldQuoted) return boldQuoted[1].trim();
  const bold = content.match(/\*\*Prompt:?\*\*\s*([\s\S]+?)(?:\n\n|\n\*\*|$)/);
  if (bold) return bold[1].trim().replace(/^["']|["']$/g, "");
  return null;
}

/** Simple markdown renderer for bold text */
function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
