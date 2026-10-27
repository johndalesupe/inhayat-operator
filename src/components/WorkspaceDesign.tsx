import {
  Headset,
  PackageCheck,
  PhoneCall,
  Radio,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="brand-symbol">
        <Headset size={21} strokeWidth={1.8} />
      </span>
      {!compact && (
        <div>
          <p className="text-[19px] font-extrabold leading-5 tracking-[-.8px]">
            inhayat<span className="text-indigo-600">.</span>
          </p>
          <p className="brand-caption mt-1 font-bold uppercase text-slate-400">
            Operator workspace
          </p>
        </div>
      )}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1 text-[25px] font-bold leading-tight tracking-[-1px] sm:text-[29px]">
          {title}
        </h1>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "indigo",
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone?: "indigo" | "amber" | "mint";
  detail?: string;
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span className="metric-icon">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-xl font-bold leading-tight tracking-[-.6px] tabular-nums sm:text-2xl">
          {value}
        </p>
        {detail && <p className="mt-1 text-[10px] text-slate-500">{detail}</p>}
      </div>
    </div>
  );
}

/** Decorative workflow illustration; its stages mirror the actual operator journey. */
export function WorkflowGraphic() {
  return (
    <div className="workflow-art" aria-hidden="true">
      <div className="workflow-orbit orbit-one" />
      <div className="workflow-orbit orbit-two" />
      <span className="workflow-node node-radio">
        <Radio size={21} />
      </span>
      <span className="workflow-node node-call">
        <PhoneCall size={25} strokeWidth={1.7} />
      </span>
      <span className="workflow-node node-check">
        <PackageCheck size={22} />
      </span>
      <span className="workflow-spark spark-one" />
      <span className="workflow-spark spark-two" />
    </div>
  );
}
