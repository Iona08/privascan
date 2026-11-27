import { useState, useCallback, useRef, useMemo } from 'react';
import type {
  PIIDetection,
  RedactionSettings,
  RedactionResult,
  RedactionMode,
  PIICategory,
} from '../types/pii';
import { DEFAULT_CATEGORY_LABELS } from '../types/pii';
import { applyRedaction } from '../utils/redaction/redactionEngine';
import { createPseudonymSession, type PseudonymSession } from '../utils/redaction/pseudonymizer';

export interface UseRedactionResult {
  settings: RedactionSettings;
  redactionResult: RedactionResult | null;
  session: PseudonymSession;
  setMode: (mode: RedactionMode) => void;
  setFullMaskLabel: (label: string) => void;
  setUseCategoryLabels: (use: boolean) => void;
  setCategoryLabel: (category: PIICategory, label: string) => void;
  applyToText: (text: string, detections: PIIDetection[]) => RedactionResult;
  resetSession: () => void;
}

const DEFAULT_SETTINGS: RedactionSettings = {
  mode: 'full',
  fullMaskLabel: '[REDACTED]',
  useCategoryLabels: false,
  categoryLabels: { ...DEFAULT_CATEGORY_LABELS },
};

export function useRedaction(): UseRedactionResult {
  const [settings, setSettings] = useState<RedactionSettings>({ ...DEFAULT_SETTINGS });
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);
  const sessionRef = useRef<PseudonymSession>(createPseudonymSession());

  const setMode = useCallback((mode: RedactionMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  }, []);

  const setFullMaskLabel = useCallback((label: string) => {
    setSettings((prev) => ({ ...prev, fullMaskLabel: label }));
  }, []);

  const setUseCategoryLabels = useCallback((use: boolean) => {
    setSettings((prev) => ({ ...prev, useCategoryLabels: use }));
  }, []);

  const setCategoryLabel = useCallback((category: PIICategory, label: string) => {
    setSettings((prev) => ({
      ...prev,
      categoryLabels: { ...prev.categoryLabels, [category]: label },
    }));
  }, []);

  const applyToText = useCallback(
    (text: string, detections: PIIDetection[]): RedactionResult => {
      const result = applyRedaction(text, detections, settings, sessionRef.current);
      setRedactionResult(result);
      return result;
    },
    [settings],
  );

  const resetSession = useCallback(() => {
    sessionRef.current.reset();
    setRedactionResult(null);
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const session = useMemo(() => sessionRef.current, []);

  return {
    settings,
    redactionResult,
    session,
    setMode,
    setFullMaskLabel,
    setUseCategoryLabels,
    setCategoryLabel,
    applyToText,
    resetSession,
  };
}
