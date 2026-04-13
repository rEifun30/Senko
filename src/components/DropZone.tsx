import { useState, useCallback, DragEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, AlertTriangle, Check, X } from 'lucide-react';

type DropState = 'idle' | 'dragover' | 'valid' | 'error';

interface DropZoneProps {
  onFile: (text: string, fileName: string) => void;
  onError: (msg: string) => void;
  children?: ReactNode;
  label?: string;
  sublabel?: string;
  className?: string;
  minHeight?: string;
}

export default function DropZone({ onFile, onError, children, label, sublabel, className = '', minHeight = 'min-h-[120px]' }: DropZoneProps) {
  const [dropState, setDropState] = useState<DropState>('idle');
  const [dragCounter, setDragCounter] = useState(0);

  const isCsv = (file: File) =>
    file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(c => c + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDropState('dragover');
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(c => {
      const next = c - 1;
      if (next === 0) setDropState('idle');
      return next;
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropState === 'idle') setDropState('dragover');
  }, [dropState]);

  const processFile = useCallback((file: File) => {
    if (!isCsv(file)) {
      setDropState('error');
      onError('Please upload a valid CSV file.');
      setTimeout(() => setDropState('idle'), 2000);
      return;
    }

    if (file.size === 0) {
      setDropState('error');
      onError('This file contains no usable flashcards.');
      setTimeout(() => setDropState('idle'), 2000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        // Remove UTF-8 BOM if present
        const cleanText = text.replace(/^\uFEFF/, '');
        setDropState('valid');
        onFile(cleanText, file.name);
        setTimeout(() => setDropState('idle'), 1500);
      }
    };
    reader.onerror = () => {
      setDropState('error');
      onError('Failed to read file. Please try again.');
      setTimeout(() => setDropState('idle'), 2000);
    };
    // Read as UTF-8 text — supports all languages
    reader.readAsText(file, 'UTF-8');
  }, [onFile, onError]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setDropState('idle');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const borderColor = dropState === 'dragover' ? 'border-accent-blue'
    : dropState === 'valid' ? 'border-pass'
    : dropState === 'error' ? 'border-fail'
    : 'border-white/10';

  const glowClass = dropState === 'dragover' ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
    : dropState === 'valid' ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
    : dropState === 'error' ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
    : '';

  const iconColor = dropState === 'dragover' ? 'text-accent-blue'
    : dropState === 'valid' ? 'text-pass'
    : dropState === 'error' ? 'text-fail'
    : 'text-gray-500';

  const Icon = dropState === 'valid' ? Check : dropState === 'error' ? AlertTriangle : FileUp;

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${borderColor} ${glowClass} ${minHeight} flex flex-col items-center justify-center p-4 cursor-pointer ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence mode="wait">
        {dropState === 'dragover' ? (
          <motion.div
            key="dragover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <Icon size={24} className={`mx-auto mb-2 ${iconColor}`} />
            <p className="text-sm font-medium text-white">Drop CSV file here</p>
            <p className="text-xs text-gray-400 mt-1">Supports all languages (UTF-8)</p>
          </motion.div>
        ) : dropState === 'valid' ? (
          <motion.div
            key="valid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <Icon size={24} className={`mx-auto mb-2 ${iconColor}`} />
            <p className="text-sm font-medium text-pass">File accepted</p>
          </motion.div>
        ) : dropState === 'error' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <Icon size={24} className={`mx-auto mb-2 ${iconColor}`} />
            <p className="text-sm font-medium text-fail">Invalid file</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <Icon size={24} className={`mx-auto mb-2 ${iconColor}`} />
            <p className="text-sm text-gray-300">{label || 'Drag & drop CSV file here'}</p>
            <p className="text-xs text-gray-500 mt-1">{sublabel || 'or click to browse'}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
