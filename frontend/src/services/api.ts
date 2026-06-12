// API service for frontend-backend communication
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Summary {
  total_persons: number;
  flagged: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface FlaggedEntity {
  cnic: string;
  full_name: string;
  city: string;
  lifestyle_index: number;
  ml_anomaly_score: number;
  tax_deviation_score: number;
  flagged: number;
  audit_trail?: string;
}

export interface AuditReport {
  cnic: string;
  name: string;
  tax_deviation_score: number;
  ai_audit_report: string;
}

export interface AllAuditReports {
  total_flagged_in_danger_zone: number;
  total_reports_generated: number;
  all_reports: AuditReport[];
}

export const apiService = {
  // Get dashboard summary stats
  async getSummary(): Promise<Summary> {
    const response = await fetch(`${API_URL}/summary`);
    if (!response.ok) throw new Error("Failed to fetch summary");
    return response.json();
  },

  // Get all flagged entities
  async getFlagged(): Promise<FlaggedEntity[]> {
    const response = await fetch(`${API_URL}/flagged`);
    if (!response.ok) throw new Error("Failed to fetch flagged entities");
    return response.json();
  },

  // Get all scores
  async getAllScores(): Promise<FlaggedEntity[]> {
    const response = await fetch(`${API_URL}/scores`);
    if (!response.ok) throw new Error("Failed to fetch scores");
    return response.json();
  },

  // Get AI audit reports for all flagged profiles
  async getAuditReports(limit: number = 10): Promise<AllAuditReports> {
    const response = await fetch(`${API_URL}/audit/ai/all-profiles?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch audit reports");
    return response.json();
  },
};
