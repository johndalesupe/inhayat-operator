"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Clock3,
  Headset,
  Loader2,
  LockKeyhole,
  PhoneIncoming,
} from "lucide-react";
import { useLeadActions } from "../hooks/useOperatorLeads";
import { errorText, formatPrice } from "../lib/format";
import type { OperatorLead } from "../types";
import { ProductPortrait } from "./OrderVisuals";
import { CustomerCallButton } from "./CustomerCallButton";

export function LeadCard({
  lead,
  owned = false,
  disabled = false,
  accepting = false,
  onAccept,
}: {
  lead: OperatorLead;
  owned?: boolean;
  disabled?: boolean;
  accepting?: boolean;
  onAccept?: () => void;
}) {
  return (
    <article
      className="work-card work-card--lead"
      aria-label={`Lead #${lead.streamNumericId}: ${lead.product.nameUz}`}
    >
      <header className="work-card-header">
        <span className="work-kind work-kind--lead">
          <PhoneIncoming size={13} />
          {lead.source === "web_form" ? "Tezkor forma" : "Lead"}
        </span>
        <span className="work-reference">#{lead.streamNumericId}</span>
        <time dateTime={lead.createdAt} className="work-time">
          {new Date(lead.createdAt).toLocaleString("uz-UZ", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </header>
      <div className="work-product">
        <ProductPortrait
          src={lead.product.thumbnailUrl}
          name={lead.product.nameUz}
          quantity={lead.quantity}
          tone="lead"
        />
        <div className="min-w-0">
          <h3 className="work-product-title">{lead.product.nameUz}</h3>
          <p className="work-product-meta">{lead.quantity} dona</p>
          <p className="work-price">
            {formatPrice(
              (lead.product.discountPrice ?? lead.product.price) *
                lead.quantity,
            )}
          </p>
        </div>
      </div>
      {owned ? (
        <div className="work-customer">
          <p className="font-semibold">{lead.clientName || "Mijoz"}</p>
          {lead.status === "call_back" && (
            <span className="work-callback">
              <Clock3 size={12} />
              Qayta qo&apos;ng&apos;iroq
            </span>
          )}
        </div>
      ) : (
        <p className="work-private">
          <LockKeyhole size={12} />
          Mijoz ma&apos;lumotlari qabul qilgach ochiladi
        </p>
      )}
      <footer className="work-card-footer">
        {owned ? (
          <>
            {lead.clientPhoneNumber && (
              <CustomerCallButton
                phoneNumber={lead.clientPhoneNumber}
                compact
              />
            )}
            <Link className="work-action" href={`/leads/${lead._id}`}>
              Davom ettirish <ArrowUpRight size={15} />
            </Link>
          </>
        ) : (
          <>
            <span className="work-next">
              {lead.status === "call_back"
                ? "Qayta bog'lanish"
                : "Mijoz bilan bog'lanish"}
            </span>
            <button
              className="work-action work-action--primary"
              disabled={disabled}
              onClick={onAccept}
              aria-label={`Lead #${lead.streamNumericId} qabul qilish`}
              type="button"
            >
              {accepting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Headset size={15} />
              )}
              Qabul qilish
            </button>
          </>
        )}
      </footer>
    </article>
  );
}

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
        lead.product.nameRu,
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
      <h2 className="queue-section-title">
        {owned ? "Mening leadlarim" : "Yangi leadlar"}
        <span>{visible.length}</span>
      </h2>
      {accept.error && (
        <p role="alert" className="queue-error">
          {errorText(accept.error, "Lead qabul qilinmadi")}
        </p>
      )}
      {!visible.length && (
        <p className="text-sm text-slate-500">Qidiruvga mos lead topilmadi.</p>
      )}
      <div className="work-grid">
        {visible.map((lead) => (
          <LeadCard
            key={lead._id}
            lead={lead}
            owned={owned}
            disabled={accept.isPending}
            accepting={accept.isPending && accept.variables === lead._id}
            onAccept={() =>
              accept.mutate(lead._id, {
                onSuccess: () => router.push(`/leads/${lead._id}`),
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
