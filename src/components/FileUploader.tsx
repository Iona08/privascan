import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, File } from 'lucide-react';
import type { InputSourceType } from '../types/pii';

interface FileUploaderProps {
  onFileLoaded: (text: string, fileName: string, sourceType: InputSourceType) => void;
  onError: (message: string) => void;
  currentSource: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getSourceType(fileName: string): InputSourceType {
  return fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'txt';
}

export function FileUploader({ onFileLoaded, onError, currentSource }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndLoad = useCallback(
    (file: File) => {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.txt') && !ext.endsWith('.csv')) {
        onError(`Unsupported file type "${file.name}". Only .txt and .csv files are accepted.`);
        return;
      }
      if (file.size === 0) {
        onError(`File "${file.name}" is empty.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        onError(
          `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          onError(`Could not read file "${file.name}".`);
          return;
        }
        onFileLoaded(text, file.name, getSourceType(file.name));
      };
      reader.onerror = () => {
        onError(`Failed to read file "${file.name}". The file may be corrupted.`);
      };
      reader.readAsText(file, 'utf-8');
    },
    [onFileLoaded, onError],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      if (files.length > 1) {
        onError('Please upload one file at a time.');
        return;
      }
      validateAndLoad(files[0]!);
    },
    [validateAndLoad, onError],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndLoad(file);
      e.target.value = '';
    },
    [validateAndLoad],
  );

  return (
    <div
      role="region"
      aria-label="File upload area"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer select-none ${
        isDragging
          ? 'border-cyan-400 bg-cyan-900/20'
          : 'border-slate-700/60 hover:border-slate-600 bg-slate-800/20'
      }`}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv"
        className="sr-only"
        aria-label="Choose a .txt or .csv file"
        onChange={handleFileInput}
        tabIndex={-1}
      />
      <div className="flex flex-col items-center gap-2">
        <Upload
          className={`w-7 h-7 ${isDragging ? 'text-cyan-400' : 'text-slate-500'} transition-colors`}
          aria-hidden="true"
        />
        <div className="text-sm text-slate-300 font-medium">
          {isDragging ? 'Drop file here' : 'Drag & drop or click to browse'}
        </div>
        <div className="text-xs text-slate-500">Accepts .txt and .csv · Max 10 MB</div>
        {currentSource && currentSource !== 'Pasted text' && (
          <div className="inline-flex items-center gap-1.5 mt-1 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-xs text-slate-300">
            {currentSource.endsWith('.csv') ? (
              <FileText className="w-3 h-3 text-cyan-400" aria-hidden="true" />
            ) : (
              <File className="w-3 h-3 text-slate-400" aria-hidden="true" />
            )}
            {currentSource}
          </div>
        )}
      </div>
    </div>
  );
}
