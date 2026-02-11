import { useState } from "react";
import { Bot, Sparkles, Send } from "lucide-react";
import { cn } from "../../lib/utils";

type Tone = "professional" | "casual" | "friendly" | "brief";

interface Props {
  loading: boolean;
  onGenerate: (payload: {
    tone: Tone;
    instructions?: string;
  }) => Promise<string>;
  onSend: (reply: string) => void;
}

export function AIReplyAssistant({
  loading,
  onGenerate,
  onSend,
}: Props) {
  const [tone, setTone] = useState<Tone>("professional");
  const [instructions, setInstructions] = useState("");
  const [reply, setReply] = useState<string | null>(null);

  async function handleGenerate() {
    const text = await onGenerate({
      tone,
      instructions,
    });

    setReply(text);
  }

  return (
    <div className="border rounded-lg bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        AI Reply Assistant
      </div>

      {/* Tone */}
      <div>
        <p className="text-sm font-medium mb-2">Tone</p>

        <div className="grid grid-cols-2 gap-2">
          {(["professional", "casual", "friendly", "brief"] as Tone[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={cn(
                  "text-xs px-3 py-2 rounded-md capitalize transition-colors",
                  tone === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {t}
              </button>
            )
          )}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <p className="text-sm font-medium mb-2">Custom Instructions</p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Optional hints for the AI..."
          className="w-full text-xs p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Generate */}
      <button
        disabled={loading}
        onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
      >
        <Bot className="w-4 h-4" />
        {loading ? "Generating..." : "Generate Reply"}
      </button>

      {/* Reply */}
      {reply && (
        <>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={8}
            className="w-full text-sm p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            onClick={() => onSend(reply)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
            Send Reply
          </button>
        </>
      )}
    </div>
  );
}
