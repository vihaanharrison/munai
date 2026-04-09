import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

type AIType = "speech-analysis" | "resolution-draft" | "score-suggestion" | "general";

const AIAssistant = () => {
  const [type, setType] = useState<AIType>("general");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type, content: input }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        setResponse(`Error: ${err.error || "Something went wrong"}`);
        setLoading(false);
        return;
      }

      if (!resp.body) {
        setResponse("No response received.");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setResponse(result);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch {
      setResponse("Failed to connect to AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent" /> AI Assistant
      </h2>

      <div className="space-y-3">
        <Select value={type} onValueChange={(v) => setType(v as AIType)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General MUN Help</SelectItem>
            <SelectItem value="speech-analysis">Analyze Speech</SelectItem>
            <SelectItem value="resolution-draft">Draft Resolution</SelectItem>
            <SelectItem value="score-suggestion">Suggest Scores</SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            type === "speech-analysis"
              ? "Paste the delegate's speech text..."
              : type === "resolution-draft"
              ? "Enter the topic and key points..."
              : type === "score-suggestion"
              ? "Describe the delegate's performance..."
              : "Ask anything about MUN..."
          }
          className="rounded-xl min-h-[100px]"
        />

        <Button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="w-full rounded-xl gradient-primary border-0 font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Thinking..." : "Ask AI"}
        </Button>

        {response && (
          <div className="bg-secondary/50 rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap">
            {response}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
