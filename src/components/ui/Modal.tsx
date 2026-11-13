import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: number | string;
  footer?: ReactNode;
  closable?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 520,
  footer,
  closable = true,
}: ModalProps) {
  const { t } = useTranslation('common');
  const boxRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !boxRef.current || !backRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(backRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 }).fromTo(
      boxRef.current,
      { opacity: 0, y: 24, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'back.out(1.6)' },
      '<',
    );
    return () => {
      tl.kill();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={backRef}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-[3px] p-3"
      onClick={closable ? onClose : undefined}
    >
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className="panel flex max-h-[92%] w-full flex-col overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
        style={{ maxWidth: width, borderColor: 'rgba(212,175,55,0.45)' }}
      >
        {(title || closable) && (
          <div className="flex items-center justify-between border-b border-gold/25 bg-black/30 px-4 py-2.5">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-gold">{title}</h2>
            {closable && (
              <button
                onClick={onClose}
                aria-label={t('close')}
                className="btn-press flex h-7 w-7 items-center justify-center rounded-md border border-gold/40 text-gold hover:bg-gold/15"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="border-t border-gold/20 bg-black/30 px-4 py-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
