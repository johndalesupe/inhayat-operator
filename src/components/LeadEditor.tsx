"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { useLeadActions } from "../hooks/useOperatorLeads";
import { errorText, formatPrice } from "../lib/format";
import { deliveryComplete, type DeliveryDraft } from "../lib/delivery";
import type { OperatorLead, UpdateOperatorLead } from "../types";
import { BottomSheet } from "./ui";
import { CustomerCallButton } from "./CustomerCallButton";
import {
  DeliveryFields,
  FormField,
  FormPanel,
  QuantityControl,
} from "./OrderFormParts";
import { ProductPortrait } from "./OrderVisuals";

export function LeadEditor({ lead }: { lead: OperatorLead }) {
  const router = useRouter();
  const { update, convert } = useLeadActions();
  const customer = useRef<HTMLFieldSetElement>(null);
  const submission = useRef(false);
  const [name, setName] = useState(lead.clientName ?? "");
  const [phone, setPhone] = useState(lead.clientPhoneNumber ?? "");
  const [quantity, setQuantity] = useState(lead.quantity);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [delivery, setDelivery] = useState<DeliveryDraft>({
    regionId: lead.delivery?.regionId ?? "",
    cityId: lead.delivery?.cityId ?? "",
    deliveryType: lead.delivery?.type ?? "",
    address: lead.delivery?.address ?? "",
  });
  const [confirming, setConfirming] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = update.isPending || convert.isPending;
  const editable = !lead.orderId && lead.status !== "archived";
  const save = async (status?: UpdateOperatorLead["status"]) => {
    setSaved(false);
    await update.mutateAsync({
      id: lead._id,
      body: {
        clientName: name.trim(),
        clientPhoneNumber: phone.trim(),
        quantity,
        notes,
        ...(status ? { status } : {}),
      },
    });
    setSaved(true);
  };
  const saveCustomer = (status?: UpdateOperatorLead["status"]) => {
    const controls = customer.current?.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("input,textarea");
    if (
      controls &&
      Array.from(controls).some((control) => !control.reportValidity())
    )
      return;
    if (submission.current) return;
    submission.current = true;
    void save(status)
      .catch(() => {})
      .finally(() => {
        submission.current = false;
      });
  };
  const confirm = async () => {
    if (submission.current || !delivery.deliveryType) return;
    submission.current = true;
    try {
      await save();
      const result = await convert.mutateAsync({
        id: lead._id,
        body: {
          regionId: delivery.regionId,
          cityId: delivery.cityId,
          deliveryType: delivery.deliveryType,
          deliveryAddress: delivery.address.trim(),
        },
      });
      setConfirming(false);
      if (result.orderId) router.push(`/process/${result.orderId}`);
    } catch {
      /* Display mutation errors without discarding entered fields. */
    } finally {
      submission.current = false;
    }
  };
  if (!editable)
    return (
      <div className="form-panel">
        <strong>
          {lead.orderId ? "Lead buyurtmaga aylantirilgan" : "Lead arxivlangan"}
        </strong>
        <Link
          className="form-back"
          href={lead.orderId ? `/process/${lead.orderId}` : "/stream"}
        >
          {lead.orderNumber ?? "Oqimga qaytish"} →
        </Link>
      </div>
    );
  const error = update.error || convert.error;
  return (
    <>
      <section className="form-panel lead-preview">
        <span className="work-kind">Lead · Oqim #{lead.streamNumericId}</span>
        <div className="form-order-product">
          <ProductPortrait
            src={lead.product.thumbnailUrl}
            name={lead.product.nameUz}
            tone="lead"
          />
          <div className="min-w-0">
            <h2>{lead.product.nameUz}</h2>
            <strong>
              {formatPrice(lead.product.discountPrice ?? lead.product.price)}{" "}
              <span>/ dona</span>
            </strong>
            <p className="form-hint">
              <Info size={15} />
              Yakuniy narx tasdiqlashda hisoblanadi
            </p>
          </div>
        </div>
      </section>
      <form
        className="editing-stack"
        onSubmit={(event) => {
          event.preventDefault();
          setConfirming(true);
        }}
      >
        <fieldset disabled={busy} className="editing-columns">
          <fieldset ref={customer} className="editing-stack">
            <FormPanel title="Mijoz ma’lumotlari" icon={UserRound}>
              <FormField label="Mijoz ismi" icon={UserRound}>
                <input
                  required
                  maxLength={160}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </FormField>
              <div className="form-phone-quantity">
                <FormField label="Telefon" icon={Phone}>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </FormField>
                <div className="form-field">
                  <span>Miqdor</span>
                  <QuantityControl value={quantity} onChange={setQuantity} />
                </div>
              </div>
              <FormField label="Izoh" icon={FileText}>
                <textarea
                  rows={2}
                  maxLength={3000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Izoh kiriting..."
                />
              </FormField>
              <div className="form-lead-actions">
                {phone ? (
                  <CustomerCallButton
                    phoneNumber={phone}
                    className="form-call"
                  />
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="form-button"
                  onClick={() => saveCustomer()}
                >
                  <Save size={18} />
                  Saqlash
                </button>
                <button
                  type="button"
                  className="form-button form-button--amber"
                  onClick={() => saveCustomer("call_back")}
                >
                  <Clock3 size={18} />
                  Keyinroq qo‘ng‘iroq
                </button>
                <button
                  type="button"
                  className="form-button form-button--danger"
                  onClick={() => setArchiving(true)}
                >
                  <Archive size={18} />
                  Arxivlash
                </button>
              </div>
              {lead.status === "call_back" && (
                <p className="form-hint">
                  Mijozga qayta qo‘ng‘iroq qilish kerak.
                </p>
              )}
            </FormPanel>
          </fieldset>
          <div className="editing-stack">
            <DeliveryFields value={delivery} onChange={setDelivery} />
            {!deliveryComplete(delivery) && (
              <p className="form-notice">
                <Info size={16} />
                Yetkazish ma’lumotlarini to‘ldiring.
              </p>
            )}
            <button
              type="submit"
              className="form-button form-button--primary"
              disabled={!deliveryComplete(delivery)}
            >
              <CheckCircle2 size={19} />
              Buyurtmani tasdiqlash
            </button>
            {error && (
              <p role="alert" className="form-error">
                {errorText(error, "Amal bajarilmadi")}
              </p>
            )}
            {saved && !error && (
              <p role="status" className="form-success">
                Ma’lumotlar saqlandi.
              </p>
            )}
          </div>
        </fieldset>
      </form>
      <BottomSheet
        open={confirming}
        onClose={() => {
          if (!busy) setConfirming(false);
        }}
        title="Buyurtmani tasdiqlaysizmi?"
        description="Mijoz bilan kelishganingizdan so‘ng tasdiqlang."
      >
        <div className="editing-stack">
          <p className="form-summary">
            {name} · {phone}
            <br />
            {lead.product.nameUz} × {quantity}
            <br />
            {delivery.address}
          </p>
          {error && (
            <p role="alert" className="form-error">
              {errorText(error, "Buyurtma yaratilmadi")}
            </p>
          )}
          <button
            type="button"
            className="form-button form-button--primary"
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? "Saqlanmoqda..." : "Ha, tasdiqlash"}
          </button>
        </div>
      </BottomSheet>
      <BottomSheet
        open={archiving}
        onClose={() => {
          if (!busy) setArchiving(false);
        }}
        title="Leadni arxivlash"
        description="Buyurtma yaratilmaydi. Lead faol ro‘yxatdan olib tashlanadi."
      >
        <div className="editing-stack">
          {update.error && (
            <p role="alert" className="form-error">
              {errorText(update.error, "Lead arxivlanmadi")}
            </p>
          )}
          <button
            type="button"
            className="form-button form-button--danger"
            disabled={busy}
            onClick={() =>
              update.mutate(
                { id: lead._id, body: { status: "archived" } },
                { onSuccess: () => router.push("/stream") },
              )
            }
          >
            Arxivlashni tasdiqlash
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
