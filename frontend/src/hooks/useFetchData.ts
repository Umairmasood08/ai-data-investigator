import { useEffect } from "react";
import { useGraphStore } from "../store/useGraphStore";

export function useFetchDashboard() {
  const { fetchAll, loading, error, summary, flaggedEntities, auditReports } =
    useGraphStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    loading,
    error,
    summary,
    flaggedEntities,
    auditReports,
    refetch: fetchAll,
  };
}

export function useFetchFlaggedCases() {
  const { fetchFlaggedEntities, loading, error, flaggedEntities } =
    useGraphStore();

  useEffect(() => {
    fetchFlaggedEntities();
  }, [fetchFlaggedEntities]);

  return {
    loading,
    error,
    flaggedEntities,
    refetch: fetchFlaggedEntities,
  };
}

export function useFetchAuditReports(limit = 10) {
  const { fetchAuditReports, loading, error, auditReports } = useGraphStore();

  useEffect(() => {
    fetchAuditReports(limit);
  }, [fetchAuditReports, limit]);

  return {
    loading,
    error,
    auditReports,
    refetch: () => fetchAuditReports(limit),
  };
}
