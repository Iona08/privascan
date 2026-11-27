import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PIIDetection,
  DetectionOptions,
  CategoryFilterMap,
  InputSourceType,
} from '../types/pii';
import { DEFAULT_ENABLED_CATEGORIES } from '../types/pii';
import { detectPII } from '../utils/detection/detectionEngine';

export interface UsePIIDetectionResult {
  detections: PIIDetection[];
  isDetecting: boolean;
  options: DetectionOptions;
  setEnabledCategories: (categories: CategoryFilterMap) => void;
  setIncludeUnvalidated: (include: boolean) => void;
  runDetection: (text: string, sourceType: InputSourceType) => void;
  clearDetections: () => void;
}

const DEBOUNCE_MS = 350;

export function usePIIDetection(): UsePIIDetectionResult {
  const [detections, setDetections] = useState<PIIDetection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [options, setOptions] = useState<DetectionOptions>({
    enabledCategories: { ...DEFAULT_ENABLED_CATEGORIES },
    includeUnvalidatedFormatMatches: true,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDetection = useCallback(
    (text: string, _sourceType: InputSourceType) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!text.trim()) {
        setDetections([]);
        setIsDetecting(false);
        return;
      }

      setIsDetecting(true);
      debounceRef.current = setTimeout(() => {
        const found = detectPII(text, options);
        setDetections(found);
        setIsDetecting(false);
      }, DEBOUNCE_MS);
    },
    [options],
  );

  const clearDetections = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setDetections([]);
    setIsDetecting(false);
  }, []);

  const setEnabledCategories = useCallback((categories: CategoryFilterMap) => {
    setOptions((prev) => ({ ...prev, enabledCategories: categories }));
  }, []);

  const setIncludeUnvalidated = useCallback((include: boolean) => {
    setOptions((prev) => ({ ...prev, includeUnvalidatedFormatMatches: include }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    detections,
    isDetecting,
    options,
    setEnabledCategories,
    setIncludeUnvalidated,
    runDetection,
    clearDetections,
  };
}
