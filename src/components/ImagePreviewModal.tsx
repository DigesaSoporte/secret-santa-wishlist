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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-white/10 text-white">
          <h4 className="font-semibold text-sm truncate pr-4 text-slate-200">{title}</h4>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-hidden bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

