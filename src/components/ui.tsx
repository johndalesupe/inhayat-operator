"use client";

import { Loader2, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`surface ${className}`}>{children}</section>;
}

export function ActionButton({
  children,
  isLoading,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || isLoading}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl secondary-button px-3.5 text-xs font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={props.disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl primary-button px-3.5 text-xs font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <GlassPanel className="px-5 py-9 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-neutral-950">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-5 text-neutral-500">
        {description}
      </p>
    </GlassPanel>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export const inputClass =
  "h-11 w-full rounded-xl border-0 bg-[#f5f4fa] px-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

export const textareaClass =
  "w-full rounded-xl border-0 bg-[#f5f4fa] px-3 py-2.5 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(frame);
      previousFocus?.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end bg-slate-950/35 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[min(88dvh,760px)] w-full overflow-hidden rounded-t-[24px] bg-white outline-none sm:max-w-md sm:rounded-[22px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-3 bg-[#faf9fd] px-4 py-3.5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[15px] font-extrabold text-slate-950"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(min(88dvh,760px)-76px)] overflow-y-auto px-4 pb-[calc(1rem+var(--tg-safe-bottom))] pt-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
