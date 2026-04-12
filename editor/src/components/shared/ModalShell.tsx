import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalShellProps {
  labelledBy?: string;
  ariaLabel?: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  backdropClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  panelStyle?: CSSProperties;
}

export function ModalShell({
  labelledBy,
  ariaLabel,
  onClose,
  children,
  panelClassName,
  backdropClassName,
  initialFocusRef,
  panelStyle,
}: ModalShellProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusInitialElement = () => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && panelRef.current?.contains(activeElement)) {
        return;
      }

      const preferredTarget = initialFocusRef?.current;
      if (preferredTarget) {
        preferredTarget.focus();
        return;
      }

      const focusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      focusable?.focus();
    };

    focusInitialElement();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      lastFocusedElementRef.current?.focus?.();
    };
  }, [initialFocusRef]);

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabel ? undefined : labelledBy}
      aria-label={ariaLabel}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCloseRef.current();
        }
      }}
      className={`fixed inset-0 flex items-center justify-center bg-[rgba(3,8,18,0.72)] p-6 backdrop-blur-md ${backdropClassName ?? ''}`}
      style={{ zIndex: 'var(--tf-z-modal)' }}
    >
      <div
        ref={panelRef}
        className={panelClassName}
        style={panelStyle}
      >
        {children}
      </div>
    </div>
  );
}