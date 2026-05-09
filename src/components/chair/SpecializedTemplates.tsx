import { Button } from "@/components/ui/button";
import { Gavel, Newspaper, Sparkles } from "lucide-react";

export type SpecializedPreset = "icj" | "ipc" | "none";

export const PRESETS: Record<Exclude<SpecializedPreset, "none">, {
  label: string;
  description: string;
  icon: any;
  scoring_columns: string[];
  custom_tabs: { id: string; label: string; fields: { key: string; label: string; type: "text" | "textarea" | "select"; options?: string[] }[] }[];
}> = {
  icj: {
    label: "ICJ — Courtroom",
    description: "Roles: Judges, Advocates, Registrar. Verdict entry tab + memorial scoring.",
    icon: Gavel,
    scoring_columns: ["Memorial", "Oral Pleadings", "Cross-Examination", "Citation Quality", "Decorum", "Verdict Reasoning", "Overall"],
    custom_tabs: [
      {
        id: "verdicts", label: "Verdicts",
        fields: [
          { key: "case_no", label: "Case No.", type: "text" },
          { key: "ruling", label: "Ruling", type: "select", options: ["For Applicant", "For Respondent", "Split"] },
          { key: "reasoning", label: "Reasoning", type: "textarea" },
        ],
      },
      {
        id: "memorials", label: "Memorials",
        fields: [
          { key: "party", label: "Party", type: "select", options: ["Applicant", "Respondent"] },
          { key: "summary", label: "Summary", type: "textarea" },
        ],
      },
    ],
  },
  ipc: {
    label: "IPC — International Press Corps",
    description: "Press release composer + photo caption tab + bias scoring.",
    icon: Newspaper,
    scoring_columns: ["Reporting Accuracy", "Headline Craft", "Bias Awareness", "Visual Storytelling", "Deadline", "Engagement", "Overall"],
    custom_tabs: [
      {
        id: "press", label: "Press Releases",
        fields: [
          { key: "headline", label: "Headline", type: "text" },
          { key: "outlet", label: "Outlet", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
        ],
      },
      {
        id: "captions", label: "Photo Captions",
        fields: [
          { key: "image_subject", label: "Image Subject", type: "text" },
          { key: "caption", label: "Caption", type: "textarea" },
        ],
      },
    ],
  },
};

interface Props {
  value: SpecializedPreset;
  onChange: (v: SpecializedPreset) => void;
}

const SpecializedTemplates = ({ value, onChange }: Props) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Tile active={value === "none"} onClick={() => onChange("none")} icon={Sparkles} label="None" />
        <Tile active={value === "icj"} onClick={() => onChange("icj")} icon={Gavel} label="ICJ" />
        <Tile active={value === "ipc"} onClick={() => onChange("ipc")} icon={Newspaper} label="IPC" />
      </div>
      {value !== "none" && (
        <p className="text-[11px] text-muted-foreground">{PRESETS[value].description}</p>
      )}
    </div>
  );
};

const Tile = ({ active, onClick, icon: Icon, label }: any) => (
  <button type="button" onClick={onClick}
    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary"}`}>
    <Icon className="w-4 h-4" />
    <span className="text-xs font-medium">{label}</span>
  </button>
);

export default SpecializedTemplates;
