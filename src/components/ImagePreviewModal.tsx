'use client';

import { X, ExternalLink } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  title: string;
  onClose: () => void;
}

export default function ImagePreviewModal({ imageUrl, title, onClose }: ImagePreviewModalProps) {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-950 border-b border-white/10 text-white">
          <h4 className="font-semibold text-xs sm:text-sm truncate pr-4 text-slate-200">{title}</h4>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar imagen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2 sm:p-4 flex items-center justify-center max-h-[80vh] overflow-hidden bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg sm:rounded-xl select-none"
          />
        </div>
      </div>
    </div>
  );
}

