import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
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
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-950 transition hover:border-cyan-200 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
    <GlassPanel className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-neutral-500">
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
  "h-11 w-full rounded-xl border border-blue-100 bg-white/85 px-3 text-sm font-medium text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white";

export const textareaClass =
  "w-full rounded-xl border border-blue-100 bg-white/85 px-3 py-2 text-sm font-medium text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white";
