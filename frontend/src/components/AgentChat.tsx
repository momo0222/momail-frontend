import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Send, Bot, User } from "lucide-react";
import type { Email } from "../types";
import { agentApi } from "../api/agent";

interface Message {
    role: "user" | "agent";
    content: string;
    emails? : Email[];
    timestamp: Date;
}

export function AgentChat(){
    const [messages, setMessages] = useState<Message[]>([{
        role: "agent",
        content:
            `Hi! I can help you find and manage emails.\n\n` +
            `Try asking things like:\n` +
            `• "Find emails from John"\n` +
            `• "Show me urgent emails from today"\n` +
            `• "What did Sarah send me last week?"`,
        timestamp: new Date(),
    }]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },  [messages]);

    async function sendMessage(){
        if(!input.trim() || loading) return;

        const userMessage: Message = {
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev)=>[...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const data = await agentApi.sendAgentMessage(input);

            const agentMessage: Message = {
                role: "agent",
                content: data.reply,
                emails: data.emails,
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, agentMessage]);
        } catch(error){
            console.log("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                role: "agent",
                content:
                    "Sorry, I had trouble processing that request. Please try again.",
                timestamp: new Date(),
                },
            ]);
        } finally{
            setLoading(false);
        }
    }
    
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
        }
    }


  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : ""
            }`}
          >
            {message.role === "agent" && (
              <Avatar>
                <Bot className="w-5 h-5 text-primary-foreground" />
              </Avatar>
            )}

            <div
              className={`flex flex-col gap-2 max-w-[70%] ${
                message.role === "user" ? "items-end" : ""
              }`}
            >
              <Card
                className={`p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                </p>
              </Card>

              {/* Emails */}
              {message.emails?.length && (
                <div className="space-y-2 w-full">
                  {message.emails.map((email) => (
                    <Card key={email.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">
                            {email.from_address}
                          </p>
                          <p className="font-medium text-sm truncate">
                            {email.subject}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {email.snippet}
                          </p>
                        </div>

                        {email.classification && (
                          <Badge variant="secondary" className="text-xs">
                            {email.classification}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {message.role === "user" && (
              <Avatar secondary>
                <User className="w-5 h-5" />
              </Avatar>
            )}
          </div>
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to find emails..."
            disabled={loading}
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


function Avatar({
  children,
  secondary,
}: {
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        secondary ? "bg-secondary" : "bg-primary text-primary-foreground"
      }`}
    >
      {children}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar>
        <Bot className="w-5 h-5 text-primary-foreground" />
      </Avatar>

      <Card className="p-3">
        <div className="flex gap-1">
          <Dot delay={0} />
          <Dot delay={0.1} />
          <Dot delay={0.2} />
        </div>
      </Card>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <div
      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}