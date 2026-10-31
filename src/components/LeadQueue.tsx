"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Headset, Loader2, Package } from "lucide-react";
import { useLeadActions } from "../hooks/useOperatorLeads";
import { errorText, formatPrice } from "../lib/format";
import type { OperatorLead } from "../types";
import { GlassPanel, PrimaryButton } from "./ui";
import { CustomerCallButton } from "./CustomerCallButton";

export function LeadQueue({
  leads,
  owned = false,
  search = "",
  newest = false,
}: {
  leads: OperatorLead[];
  owned?: boolean;
  search?: string;
  newest?: boolean;
}) {
  const { accept } = useLeadActions();
  const router = useRouter();
  const query = search.trim().toLocaleLowerCase();
  const visible = leads
    .filter((lead) =>
      [
        lead._id,
        lead.streamNumericId,
        lead.product.nameUz,
        lead.clientName,
        lead.clientPhoneNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
    )
    .sort(
      (a, b) =>
        (newest ? -1 : 1) * (Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    );
  if (!leads.length) return null;
  return (
    <section
      className="space-y-3"
      aria-label={owned ? "Mening leadlarim" : "Yangi leadlar"}
    >
      <h2 className="section-title">
        {owned ? "Mening leadlarim" : "Yangi leadlar"}{" "}
        <span className="soft-badge">{visible.length}</span>
      </h2>
      {accept.error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
        >
          {errorText(accept.error, "Lead qabul qilinmadi")}
        </p>
      )}
      {!visible.length && (
        <p className="text-xs text-slate-500">Qidiruvga mos lead topilmadi.</p>
      )}
      <div className="grid gap-2.5">
        {visible.map((lead) => (
          <GlassPanel key={lead._id} className="p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="soft-badge bg-violet-50 text-violet-700">
                Lead · #{lead.streamNumericId}
              </span>
              <time
                className="text-[10px] text-slate-400"
                dateTime={lead.createdAt}
              >
                {new Date(lead.createdAt).toLocaleString("uz-UZ", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            <div className="my-3 flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                {lead.product.thumbnailUrl ? (
                  <Image
                    src={lead.product.thumbnailUrl}
                    alt=""
                    fill
                    sizes="44px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <Package size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold">{lead.product.nameUz}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {lead.quantity} dona ·{" "}
                  {formatPrice(
                    (lead.product.discountPrice ?? lead.product.price) *
                      lead.quantity,
                  )}
                </p>
              </div>
            </div>
            {owned ? (
              <>
                <p className="text-xs font-semibold">{lead.clientName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {lead.clientPhoneNumber}
                </p>
                {lead.status === "call_back" && (
                  <p className="mt-2 text-xs text-amber-700">
                    Qayta qo&apos;ng&apos;iroq qilish
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  {lead.clientPhoneNumber && (
                    <CustomerCallButton
                      phoneNumber={lead.clientPhoneNumber}
                      compact
                    />
                  )}
                  <Link
                    href={`/leads/${lead._id}`}
                    className="min-h-10 py-3 text-xs font-semibold text-blue-700"
                  >
                    Davom ettirish →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-[11px] text-slate-500">
                  Qabul qilgach mijoz bilan bog&apos;laning va yetkazishni
                  aniqlang.
                </p>
                <PrimaryButton
                  type="button"
                  className="h-10 w-full text-xs"
                  disabled={accept.isPending}
                  onClick={() =>
                    accept.mutate(lead._id, {
                      onSuccess: () => router.push(`/leads/${lead._id}`),
                    })
                  }
                >
                  {accept.isPending && accept.variables === lead._id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Headset size={14} />
                  )}{" "}
                  Qabul qilish
                </PrimaryButton>
              </>
            )}
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
