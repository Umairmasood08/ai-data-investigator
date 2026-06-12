import { create } from "zustand";
import { apiService,type Summary,type FlaggedEntity,type AuditReport } from "../services/api";

type State = {
  // Graph & Selection
  selectedNode: any;
  setSelectedNode: (node: any) => void;

  // Dashboard Data
  summary: Summary | null;
  flaggedEntities: FlaggedEntity[];
  auditReports: AuditReport[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchSummary: () => Promise<void>;
  fetchFlaggedEntities: () => Promise<void>;
  fetchAuditReports: (limit?: number) => Promise<void>;
  fetchAll: () => Promise<void>;
};

export const useGraphStore = create<State>((set) => ({
  // Initial state
  selectedNode: null,
  summary: null,
  flaggedEntities: [],
  auditReports: [],
  loading: false,
  error: null,

  // Actions
  setSelectedNode: (node) => set({ selectedNode: node }),

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await apiService.getSummary();
      set({ summary });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error("Failed to fetch summary:", error);
    } finally {
      set({ loading: false });
    }
  },

  fetchFlaggedEntities: async () => {
    set({ loading: true, error: null });
    try {
      const flaggedEntities = await apiService.getFlagged();
      set({ flaggedEntities });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error("Failed to fetch flagged entities:", error);
    } finally {
      set({ loading: false });
    }
  },

  fetchAuditReports: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const data = await apiService.getAuditReports(limit);
      set({ auditReports: data.all_reports });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error("Failed to fetch audit reports:", error);
    } finally {
      set({ loading: false });
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [summary, flaggedEntities, auditData] = await Promise.all([
        apiService.getSummary(),
        apiService.getFlagged(),
        apiService.getAuditReports(10),
      ]);
      set({
        summary,
        flaggedEntities,
        auditReports: auditData.all_reports,
      });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error("Failed to fetch data:", error);
    } finally {
      set({ loading: false });
    }
  },
}));