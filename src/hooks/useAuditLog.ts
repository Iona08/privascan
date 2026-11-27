import { useState, useCallback } from 'react';
import type { AuditLogEntry, AuditEventType, RedactionMode, CategoryStatistics } from '../types/pii';

let auditIdCounter = 0;

function generateAuditId(): string {
  auditIdCounter += 1;
  return `audit-${Date.now()}-${auditIdCounter}`;
}

export interface UseAuditLogResult {
  entries: AuditLogEntry[];
  addEntry: (params: {
    source: string;
    eventType: AuditEventType;
    redactionMode: RedactionMode;
    totalEntities: number;
    byCategory: CategoryStatistics;
  }) => void;
  clearLog: () => void;
}

export function useAuditLog(): UseAuditLogResult {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);

  const addEntry = useCallback(
    (params: {
      source: string;
      eventType: AuditEventType;
      redactionMode: RedactionMode;
      totalEntities: number;
      byCategory: CategoryStatistics;
    }) => {
      const entry: AuditLogEntry = {
        id: generateAuditId(),
        timestamp: new Date().toISOString(),
        source: params.source,
        eventType: params.eventType,
        redactionMode: params.redactionMode,
        totalEntities: params.totalEntities,
        byCategory: params.byCategory,
      };
      setEntries((prev) => [entry, ...prev].slice(0, 100)); // Keep last 100
    },
    [],
  );

  const clearLog = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addEntry, clearLog };
}
