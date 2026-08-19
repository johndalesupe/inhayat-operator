import {
  ArrowDownRight,
  ArrowUpRight,
  History,
  RotateCcw,
} from "lucide-react";
import { formatPrice } from "../lib/format";
import type { MarketerCommissionLog } from "../types";
import { GlassPanel } from "./ui";

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  callback_later: "Qayta qo'ng'iroq",
  confirmed: "Tasdiqlangan",
  assigned: "Kuryerga biriktirilgan",
  in_delivery: "Yetkazilmoqda",
  returning: "Qaytarilmoqda",
  returned: "Qaytarildi",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

const sourceLabels: Record<string, string> = {
  admin: "Administrator",
  operator: "Operator",
  courier: "Kuryer",
  client: "Mijoz",
  system: "Tizim",
  system_reconciliation: "Tizim tekshiruvi",
  client_deletion: "Mijoz o'chirilishi",
};

function statusLabel(value: string | null) {
  if (!value) return null;
  return statusLabels[value] ?? value;
}

function sourceLabel(value: string | null) {
  if (!value) return null;
  return sourceLabels[value] ?? value.replaceAll("_", " ");
}

function eventPresentation(log: MarketerCommissionLog) {
  if (log.reasonCode === "restored") {
    return {
      title: "Bonus qayta tiklandi",
      icon: <RotateCcw className="h-4 w-4" />,
      iconClass: "border-blue-100 bg-blue-50 text-blue-700",
      amountClass: "text-blue-700",
    };
  }

  if (log.direction === "debit" || log.reasonCode === "reversed") {
    return {
      title: "Bonus balansdan yechildi",
      icon: <ArrowDownRight className="h-4 w-4" />,
      iconClass: "border-rose-100 bg-rose-50 text-rose-700",
      amountClass: "text-rose-700",
    };
  }

  return {
    title: "Bonus balansga hisoblandi",
    icon: <ArrowUpRight className="h-4 w-4" />,
    iconClass: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amountClass: "text-emerald-700",
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRate(basisPoints: number) {
  return `${(basisPoints / 100).toLocaleString("uz-UZ", {
    maximumFractionDigits: 2,
  })}%`;
}

export function MarketerCommissionAudit({
  logs,
}: {
  logs: MarketerCommissionLog[];
}) {
  if (!logs.length) return null;

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-blue-50 px-4 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
          <History className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-950">
            Marketer bonusi jurnali
          </h2>
          <p className="mt-0.5 text-xs font-medium leading-5 text-neutral-500">
            Bonus faqat yetkazilgan buyurtma uchun beriladi. Holat o&apos;zgarsa,
            sabab va balans harakati shu yerda saqlanadi.
          </p>
        </div>
      </div>

      <div className="divide-y divide-blue-50">
        {logs.map((log) => {
          const presentation = eventPresentation(log);
          const fromStatus = statusLabel(log.fromStatus);
          const toStatus = statusLabel(log.toStatus);
          const source = sourceLabel(log.transitionSource);
          const reason =
            log.reasonUz ??
            log.note ??
            "Bonus harakati bo'yicha qo'shimcha sabab kiritilmagan.";

          return (
            <article key={log._id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${presentation.iconClass}`}
                >
                  {presentation.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-950">
                        {presentation.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-neutral-400">
                        {formatDateTime(log.createdAt)}
                        {source ? ` · ${source}` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${presentation.amountClass}`}
                    >
                      {log.direction === "debit" ? "−" : "+"}
                      {formatPrice(log.amount)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">
                    {reason}
                  </p>

                  {(fromStatus || toStatus) && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-neutral-600">
                      {fromStatus && (
                        <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1">
                          {fromStatus}
                        </span>
                      )}
                      {fromStatus && toStatus && (
                        <span className="text-neutral-400">→</span>
                      )}
                      {toStatus && (
                        <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">
                          {toStatus}
                        </span>
                      )}
                    </div>
                  )}

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="font-medium text-neutral-400">Asos</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-700">
                        {formatPrice(log.eligibleSubtotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-400">Foiz</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-700">
                        {formatRate(log.commissionRateBps)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-400">Balans</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-700">
                        {formatPrice(log.balanceAfter)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-400">Hisob davri</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-700">
                        #{log.settlementCycle}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </GlassPanel>
  );
}
