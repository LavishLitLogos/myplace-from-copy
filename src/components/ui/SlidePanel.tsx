import { ReactNode, useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  direction?: 'right' | 'up';
  showBack?: boolean;
  /** When true, content area is flex-col overflow-hidden instead of overflow-y-auto.
   *  Required for rooms like Chat that manage their own internal scroll. */
  fullHeight?: boolean;
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  children,
  direction = 'right',
  showBack = false,
  fullHeight = false,
}: SlidePanelProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  const translateClass =
    direction === 'right'
      ? animate ? 'translate-x-0' : 'translate-x-full'
      : animate ? 'translate-y-0' : 'translate-y-full';

  return (
    <div className="absolute inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute ${direction === 'right' ? 'inset-y-0 right-0 w-full' : 'inset-x-0 bottom-0'} bg-zinc-950 transform transition-transform duration-300 ease-out ${translateClass} flex flex-col`}
        style={{ maxHeight: direction === 'up' ? '95dvh' : undefined }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          >
            {showBack ? <ArrowLeft size={18} className="text-white" /> : <X size={18} className="text-white" />}
          </button>
          {title && (
            <h2 className="text-white font-bold text-lg flex-1 truncate">{title}</h2>
          )}
        </div>

        {/* Content */}
        <div
          className={
            fullHeight
              ? 'flex-1 flex flex-col overflow-hidden'
              : 'flex-1 overflow-y-auto overscroll-contain'
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
