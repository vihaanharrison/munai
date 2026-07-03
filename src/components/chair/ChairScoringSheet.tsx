import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send, Settings, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  committeeId: string;
  conferenceId: string;
  delegates: any[];
  committee: any;
  onDelegatesUpdated: () => void;
}

const ChairScoringSheet = ({ committeeId, conferenceId, delegates, committee, onDelegatesUpdated }: Props) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [aiCommand, setAiCommand] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [editingColumns, setEditingColumns] = useState(false);
  const [newColumnsText, setNewColumnsText] = useState("");

  useEffect(() => {
    const cols = committee?.scoring_columns;
    if (Array.isArray(cols) && cols.length > 0) {
      setColumns(cols);
    } else {
      setColumns(["Speaking", "Research", "POIs", "Diplomacy", "Leadership", "Content", "Overall"]);
    }
  }, [committee]);

  const approvedDelegates = delegates.filter((d) => d.approved);

  const exportExcel = () => {
    const header = ["Delegation", ...columns, "Total"];
    const rows = approvedDelegates.map((d) => [
      d.country,
      ...columns.map((c) => getScore(d, c)),
      getTotal(d),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scores");
    XLSX.writeFile(wb, `${(committee?.name || "committee").replace(/[^a-z0-9]/gi, "_")}_scores.xlsx`);
  };

  const getScore = (delegate: any, col: string): number => {
    return (delegate.marks || {})[col] || 0;
  };

  const getTotal = (delegate: any): number => {
    return columns.reduce((sum, col) => sum + getScore(delegate, col), 0);
  };

  const updateCell = async (delegateId: string, col: string, value: number) => {
    const delegate = delegates.find((d) => d.id === delegateId);
    if (!delegate) return;
    const oldValue = (delegate.marks || {})[col] || 0;
    const marks = { ...(delegate.marks || {}) };
    marks[col] = value;
    await supabase.from("delegates").update({ marks } as any).eq("id", delegateId);
    await supabase.rpc("log_audit_event", {
      p_conference_id: conferenceId, p_committee_id: committeeId,
      p_action: "mark_change_manual", p_actor_type: "chair",
      p_target_table: "delegates", p_target_id: delegateId,
      p_details: { column: col, old_value: oldValue, new_value: value, delegate_country: delegate.country },
    } as any);
    onDelegatesUpdated();
  };

  const saveColumns = async () => {
    const cols = newColumnsText.split(",").map((c) => c.trim()).filter(Boolean);
    if (cols.length === 0) { toast.error("Enter at least one column"); return; }
    if (cols.length > 12) { toast.error("Maximum 12 columns"); return; }
    await supabase.from("committees").update({ scoring_columns: cols } as any).eq("id", committeeId);
    setColumns(cols);
    setEditingColumns(false);
    toast.success("Columns updated");
  };

  const handleAiCommand = async () => {
    if (!aiCommand.trim()) return;
    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "score-command",
          content: aiCommand,
          delegations: approvedDelegates.map((d) => ({ id: d.id, name: d.name, country: d.country })),
          columns,
        }),
      });
      const result = await resp.json();
      if (result.error) { toast.error(result.error); return; }
      
      // Apply the parsed command
      if (result.delegateId && result.column && result.points !== undefined) {
        const delegate = approvedDelegates.find((d) => d.id === result.delegateId);
        if (delegate) {
          const marks = { ...(delegate.marks || {}) };
          if (result.action === "deduct") {
            marks[result.column] = Math.max(0, (marks[result.column] || 0) - Math.abs(result.points));
          } else {
            marks[result.column] = (marks[result.column] || 0) + result.points;
          }
          await supabase.from("delegates").update({ marks } as any).eq("id", delegate.id);
          await supabase.rpc("log_audit_event", {
            p_conference_id: conferenceId, p_committee_id: committeeId,
            p_action: "mark_change_ai", p_actor_type: "chair",
            p_target_table: "delegates", p_target_id: delegate.id,
            p_details: { command: aiCommand, column: result.column, points: result.points, action: result.action, delegate_country: delegate.country },
          } as any);
          onDelegatesUpdated();
          toast.success(`${result.action === "deduct" ? "Deducted" : "Added"} ${Math.abs(result.points)} ${result.column} ${result.action === "deduct" ? "from" : "to"} ${delegate.country}`);
        }
      } else if (result.message) {
        toast.info(result.message);
      }
      setAiCommand("");
    } catch {
      toast.error("AI command failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Command Bar */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display font-semibold text-foreground text-sm mb-3">AI Scoring Commands</h2>
        <p className="text-xs text-muted-foreground mb-2">
          Try: "USA +10 marks", "Add 5 points to China Speaking", "Deduct 3 from France Research"
        </p>
        <div className="flex gap-2">
          <Input
            value={aiCommand}
            onChange={(e) => setAiCommand(e.target.value)}
            placeholder="Enter scoring command..."
            className="rounded-xl flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAiCommand()}
          />
          <Button onClick={handleAiCommand} disabled={aiLoading} className="rounded-xl gradient-primary border-0">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Column Settings */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground text-sm">Scoring Spreadsheet</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={exportExcel} className="rounded-lg text-xs h-7">
              <Download className="w-3 h-3 mr-1" /> Excel
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setEditingColumns(!editingColumns); setNewColumnsText(columns.join(", ")); }} className="rounded-lg text-xs h-7">
              <Settings className="w-3 h-3 mr-1" /> Columns
            </Button>
          </div>
        </div>
        {editingColumns && (
          <div className="bg-secondary/50 rounded-xl p-3 mb-3">
            <p className="text-xs text-muted-foreground mb-1">Comma-separated column names (max 12):</p>
            <div className="flex gap-2">
              <Input value={newColumnsText} onChange={(e) => setNewColumnsText(e.target.value)} className="rounded-xl text-xs flex-1" />
              <Button size="sm" onClick={saveColumns} className="rounded-lg gradient-primary border-0 text-xs h-8">Save</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto -mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold min-w-[120px]">Delegation</TableHead>
                {columns.map((col) => (
                  <TableHead key={col} className="text-xs font-semibold text-center min-w-[70px]">{col}</TableHead>
                ))}
                <TableHead className="text-xs font-semibold text-center min-w-[60px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedDelegates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center text-sm text-muted-foreground py-4">
                    No approved delegates yet.
                  </TableCell>
                </TableRow>
              ) : (
                approvedDelegates.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs font-medium">{d.country}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} className="p-1">
                        <Input
                          type="number"
                          value={getScore(d, col)}
                          onChange={(e) => updateCell(d.id, col, parseInt(e.target.value) || 0)}
                          className="w-16 h-7 text-xs text-center rounded-lg mx-auto"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-xs font-bold text-center text-accent">{getTotal(d)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ChairScoringSheet;
