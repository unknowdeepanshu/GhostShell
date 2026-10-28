export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Analysis {
  explanation: string;
  risk: RiskLevel;
  riskReason: string;
  ghost: string;
  findings: string[];
  source: "local-model" | "deterministic";
}

export interface JournalEntry {
  id: string;
  command: string;
  analysis: Analysis;
  createdAt: string;
}
