import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, X, Award } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  scoringEntry: any;
  delegateName: string;
  speechText: string;
  onSubmitted: (score: number) => void;
}

const ScoreSpeechModal = ({ open, onClose, scoringEntry, delegateName, speechText, onSubmitted }: Props) => {
  const [feedback, setFeedback] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string } | null>(null);
  const [finalScore, setFinalScore] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  if (!open || !scoringEntry) return null;

  const runAi = async () => {
    if (!feedback.trim()) { toast.error("Add chair feedback first"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-speech", {
        body: { speech_text: speechText || "(no speech text submitted)", country: delegateName, agenda: feedback },
      });
      if (error) { toast.error(error.message || "AI scoring failed"); return; }
      const aiScore10 = Math.max(0, Math.min(10, parseInt((data as any)?.score) || 0));
      const aiFeedback = (data as any)?.ai_feedback || "";
      const combined = Math.min(20, aiScore10 + Math.round(Math.min(10, feedback.length / 30)));
      setAiResult({ score: combined, feedback: aiFeedback });
      setFinalScore(combined);
    } catch (e: any) {
      toast.error(e?.message || "AI scoring failed");
    } finally { setAiLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await supabase.from("speakers_list").update({
        chair_feedback: feedback, ai_score: finalScore, speech_text: speechText,
      } as any).eq("id", scoringEntry.id);
      onSubmitted(finalScore);
      toast.success(`Score saved: ${finalScore}/20`);
      handleClose();
    } finally { setSaving(false); }
  };

  const handleClose = () => {
    setFeedback(""); setAiResult(null); setFinalScore(10); onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl p-0 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-primary/15 to-accent/15 px-6 py-4 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-display font-bold text-foreground text-base">Score GSL Speech</h2>
              <p className="text-xs text-muted-foreground">{delegateName}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {speechText && (
            <div className="bg-secondary/40 rounded-xl p-3 max-h-32 overflow-y-auto">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Speech text</p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{speechText}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-foreground mb-1.5">Chair Feedback</p>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="Comment on content, diplomacy, delivery..."
              className="rounded-xl min-h-[80px] text-sm" />
          </div>

          {!aiResult ? (
            <Button onClick={runAi} disabled={aiLoading || !feedback.trim()} className="w-full rounded-xl gradient-primary border-0">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate AI Score
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs uppercase font-semibold text-muted-foreground">AI Suggested</span>
                  <span className="font-display text-3xl font-bold text-primary">{aiResult.score}<span className="text-sm text-muted-foreground">/20</span></span>
                </div>
                <p className="text-xs text-foreground/80 italic">{aiResult.feedback}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground">Final Score (override if needed)</p>
                  <span className="text-lg font-bold text-accent">{finalScore}/20</span>
                </div>
                <Slider value={[finalScore]} onValueChange={(v) => setFinalScore(v[0])} min={0} max={20} step={1} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex gap-2">
          <Button variant="ghost" onClick={handleClose} className="rounded-xl flex-1">Cancel</Button>
          <Button onClick={save} disabled={!aiResult || saving} className="rounded-xl gradient-primary border-0 flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Save Score
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScoreSpeechModal;
