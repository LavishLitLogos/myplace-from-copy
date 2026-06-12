import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className={`relative w-full ${sizeClass} bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
