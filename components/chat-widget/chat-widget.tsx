'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Wand2,
  Download,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
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

  // 3. **Prompt:** "..." (markdown bold with quotes)
  const boldPromptQuoted = content.match(/\*\*Prompt:?\*\*\s*"([\s\S]+?)"/);
  if (boldPromptQuoted) return boldPromptQuoted[1].trim();

  // 4. **Prompt:** followed by text until a double newline or end
  const boldPrompt = content.match(/\*\*Prompt:?\*\*\s*([\s\S]+?)(?:\n\n|\n\*\*|$)/);
  if (boldPrompt) return boldPrompt[1].trim().replace(/^["']|["']$/g, '');

  return null;
}

/** Simple markdown renderer for bold text */
function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! 👋 I'm your AI marketing assistant. Tell me about a vehicle or campaign you want to promote and I'll help you craft and generate a marketing visual right here. Try something like:\n\n• \"Create a social post for a 2025 Ford F-150 in Velocity Blue\"\n• \"Generate a luxury ad for a black Mercedes S-Class\"\n• \"Design a summer sales event billboard with 0% APR\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isGeneratingImage]);

  const sendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;

      const userMsg: Message = { role: 'user', content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput('');
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updatedMessages }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Chat request failed');
        }

        const data = await res.json();
        const assistantMsg: Message = { role: 'assistant', content: data.content };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Chat failed';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, isLoading]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleGenerateImage(prompt: string) {
    setIsGeneratingImage(true);

    try {
      // Use demo-generate which doesn't require auth (public-facing)
      const res = await fetch('/api/demo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspect_ratio: '1:1',
          resolution: '1K',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }

      const result = await res.json();
      const taskId = result.taskId;

      // Add generating status message
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⏳ Generating your image now... (this takes ~30 seconds)' },
      ]);

      pollForImage(taskId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast.error(message);
      setIsGeneratingImage(false);
    }
  }

  async function pollForImage(taskId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/demo-generate?taskId=${taskId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (
          data.status === 'completed' &&
          (data.output?.image_url || data.output?.url || data.image_url)
        ) {
          const imageUrl = data.output?.image_url || data.output?.url || data.image_url;
          setIsGeneratingImage(false);

          // Replace generating message with success
          setMessages((prev) => {
            const copy = [...prev];
            const genIdx = copy.findIndex((m) => m.content.includes('Generating your image'));
            if (genIdx >= 0) {
              copy[genIdx] = {
                role: 'assistant',
                content: `Here's your image! You can download it or ask me to refine it for a different look.\n\n[generated-image:${imageUrl}]`,
              };
            }
            return copy;
          });

          toast.success('Image generated!');
          return;
        }

        if (data.status === 'failed') {
          setIsGeneratingImage(false);
          setMessages((prev) => {
            const copy = [...prev];
            const genIdx = copy.findIndex((m) => m.content.includes('Generating your image'));
            if (genIdx >= 0) {
              copy[genIdx] = {
                role: 'assistant',
                content:
                  'Image generation failed. Try refining the prompt or asking me for a different approach.',
              };
            }
            return copy;
          });
          toast.error('Generation failed. Try again.');
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setIsGeneratingImage(false);
          toast.error('Generation timed out.');
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 3000);
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-14 w-14 rounded-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-in fade-in slide-in-from-bottom-2"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-32px)] h-[640px] max-h-[calc(100vh-48px)] flex flex-col rounded-2xl bg-background border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Marketing Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  Chat & create marketing visuals
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full ${
                    msg.role === 'assistant'
                      ? 'gradient-primary'
                      : 'bg-muted border border-border'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'bg-muted/60 text-foreground rounded-tl-sm'
                  }`}
                >
                  <MessageContent
                    content={msg.content}
                    onGenerate={
                      msg.role === 'assistant' && !isGeneratingImage
                        ? handleGenerateImage
                        : undefined
                    }
                    isGenerating={isGeneratingImage}
                  />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full gradient-primary">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-muted/20 rounded-b-2xl">
            <form onSubmit={sendMessage} className="flex gap-2 items-end">
              <Textarea
                placeholder="Describe the visual you want..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={1}
                className="flex-1 text-sm resize-none min-h-[40px] max-h-[100px]"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="gradient-primary text-white h-10 w-10 p-0 shrink-0"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              AI-powered marketing visuals · Press Enter to send
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/** Renders message content with prompt blocks, inline images, and Generate buttons */
function MessageContent({
  content,
  onGenerate,
  isGenerating,
}: {
  content: string;
  onGenerate?: (prompt: string) => void;
  isGenerating?: boolean;
}) {
  // Check for inline generated image — supports multiple formats:
  // 1. [generated-image:URL] (our custom format)
  // 2. ![alt](URL) markdown image syntax (returned by GPT-5.2 image gen)
  // 3. Raw image URL (https://...png|jpg|webp|jpeg)
  let imageUrl: string | null = null;
  let textWithoutImage = content;

  const customMatch = content.match(/\[generated-image:(.*?)\]/);
  if (customMatch) {
    imageUrl = customMatch[1];
    textWithoutImage = content.replace(/\[generated-image:.*?\]/, '').trim();
  } else {
    const markdownMatch = content.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
    if (markdownMatch) {
      imageUrl = markdownMatch[1];
      textWithoutImage = content.replace(/!\[[^\]]*\]\(https?:\/\/[^\s)]+\)/, '').trim();
    } else {
      const rawMatch = content.match(/(https?:\/\/[^\s)]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s)]*)?)/i);
      if (rawMatch) {
        imageUrl = rawMatch[1];
        textWithoutImage = content.replace(rawMatch[1], '').trim();
      }
    }
  }

  // Split on code blocks
  const parts = textWithoutImage.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const isPromptBlock = part.startsWith('```prompt');
          const code = part
            .replace(/^```(?:prompt)?\n?/, '')
            .replace(/```$/, '')
            .trim();

          return (
            <div key={i}>
              {isPromptBlock && (
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                  Generated Prompt
                </p>
              )}
              <pre className="bg-background/70 rounded-lg p-2 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto border border-border/40">
                {code}
              </pre>
              {isPromptBlock && onGenerate && (
                <Button
                  size="sm"
                  className="mt-1.5 gradient-primary text-white w-full text-xs h-8"
                  onClick={() => onGenerate(code)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  ) : (
                    <Wand2 className="h-3 w-3 mr-1.5" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate This Image'}
                </Button>
              )}
            </div>
          );
        }

        if (!part.trim()) return null;

        return (
          <span key={i} className="whitespace-pre-wrap text-sm">
            {renderMarkdown(part)}
          </span>
        );
      })}

      {/* Non-prompt-block generate button — if a prompt was detected via bold format */}
      {!parts.some((p) => p.startsWith('```prompt')) &&
        onGenerate &&
        !imageUrl &&
        (() => {
          const extracted = extractPrompt(textWithoutImage);
          if (!extracted) return null;
          return (
            <Button
              size="sm"
              className="mt-1 gradient-primary text-white w-full text-xs h-8"
              onClick={() => onGenerate(extracted)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
              ) : (
                <Wand2 className="h-3 w-3 mr-1.5" />
              )}
              {isGenerating ? 'Generating...' : 'Generate This Image'}
            </Button>
          );
        })()}

      {/* Inline image display */}
      {imageUrl && (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Generated marketing visual"
            className="w-full h-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex gap-1.5 p-2 bg-muted/30">
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex-1 h-7"
              onClick={() => window.open(imageUrl, '_blank')}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex-1 h-7"
              onClick={() => window.open('/signup', '_self')}
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Sign up for more
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
