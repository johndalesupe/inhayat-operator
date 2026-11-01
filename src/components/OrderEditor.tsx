"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Package,
  Phone,
  Save,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  useCancelOperatorOrder,
  useConfirmOperatorOrder,
  useUpdateOperatorOrder,
} from "../hooks/useOperatorOrders";
import { customerName, errorText, formatPrice } from "../lib/format";
import { deliveryComplete, type DeliveryDraft } from "../lib/delivery";
import type { OperatorOrder } from "../types";
import { BottomSheet } from "./ui";
import { CustomerCallButton } from "./CustomerCallButton";
import {
  DeliveryFields,
  FormField,
  FormPanel,
  QuantityControl,
} from "./OrderFormParts";
import { ProductPortrait } from "./OrderVisuals";

export function CancelOrderButton({
  order,
  disabled = false,
}: {
  order: OperatorOrder;
  disabled?: boolean;
}) {
  const cancel = useCancelOperatorOrder();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!["pending", "confirmed"].includes(order.status)) return null;
  return (
    <>
      <button
        type="button"
        className="form-button form-button--danger"
        disabled={disabled || cancel.isPending}
        onClick={() => setOpen(true)}
      >
        <XCircle size={18} />
        Buyurtmani bekor qilish
      </button>
      <BottomSheet
        open={open}
        onClose={() => {
          if (!cancel.isPending) setOpen(false);
        }}
        title="Buyurtmani bekor qilasizmi?"
        description={`${order.orderNumber}: mahsulotlar zaxiraga qaytariladi va hisob-kitoblar yangilanadi.`}
      >
        <form
          className="editing-stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (cancel.isPending) return;
            cancel.mutate(
              { id: order._id, cancelReason: reason.trim() || undefined },
              { onSuccess: () => setOpen(false) },
            );
          }}
        >
          <FormField label="Bekor qilish sababi" icon={FileText}>
            <textarea
              maxLength={500}
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Mijoz bilan kelishilgan sabab..."
              disabled={cancel.isPending}
            />
          </FormField>
          {cancel.error && (
            <p role="alert" className="form-error">
              {errorText(cancel.error, "Buyurtma bekor qilinmadi")}
            </p>
          )}
          <button
            type="submit"
            className="form-button form-button--danger"
            disabled={cancel.isPending}
          >
            {cancel.isPending ? "Bekor qilinmoqda..." : "Ha, bekor qilish"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}

export function OrderCustomer({ order }: { order: OperatorOrder }) {
  return (
    <FormPanel title="Mijoz ma’lumotlari" icon={UserRound}>
      <div className="form-readout">
        <UserRound size={18} />
        <strong>{customerName(order)}</strong>
      </div>
      <div className="form-readout">
        <Phone size={18} />
        <span>{order.customer.phoneNumber || "Telefon kiritilmagan"}</span>
      </div>
      {order.customer.phoneNumber && (
        <CustomerCallButton
          phoneNumber={order.customer.phoneNumber}
          className="form-call"
        />
      )}
    </FormPanel>
  );
}

export function OrderProducts({
  order,
  quantities,
  onQuantity,
}: {
  order: OperatorOrder;
  quantities?: number[];
  onQuantity?: (index: number, quantity: number) => void;
}) {
  return (
    <FormPanel title="Mahsulotlar" icon={Package}>
      {order.items.map((item, index) => (
        <div
          className="form-order-product"
          key={`${item.numericId}-${item.variantKey ?? index}`}
        >
          <ProductPortrait
            src={item.thumbnailUrl}
            name={item.name_uz}
            quantity={quantities?.[index] ?? item.quantity}
          />
          <div className="min-w-0">
            <h3>{item.name_uz}</h3>
            <p>
              #{item.numericId}
              {item.variantName ? ` · ${item.variantName}` : ""}
            </p>
            <strong>
              {formatPrice(item.price)} <span>/ dona</span>
            </strong>
            {onQuantity && (
              <QuantityControl
                label={`${item.name_uz}: miqdor`}
                value={quantities?.[index] ?? item.quantity}
                onChange={(value) => onQuantity(index, value)}
              />
            )}
          </div>
        </div>
      ))}
      {quantities && (
        <div className="form-total">
          <span>
            Mahsulotlar jami<small>Yetkazish alohida to‘lanadi</small>
          </span>
          <strong>
            {formatPrice(
              order.items.reduce(
                (sum, item, index) => sum + item.price * quantities[index],
                0,
              ),
            )}
          </strong>
        </div>
      )}
    </FormPanel>
  );
}

export function OrderEditor({ order }: { order: OperatorOrder }) {
  const update = useUpdateOperatorOrder();
  const confirm = useConfirmOperatorOrder();
  const form = useRef<HTMLFormElement>(null);
  const submission = useRef(false);
  const [delivery, setDelivery] = useState<DeliveryDraft>({
    regionId: order.delivery?.regionId ?? "",
    cityId: order.delivery?.cityId ?? "",
    deliveryType: order.delivery?.type ?? "",
    address: order.delivery?.address ?? order.deliveryAddress ?? "",
  });
  const [notes, setNotes] = useState(order.notes ?? "");
  const [quantities, setQuantities] = useState(
    order.items.map((item) => item.quantity),
  );
  const [review, setReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = update.isPending || confirm.isPending;
  // The pending-order quantity endpoint cannot represent attributed pricing
  // or multiple variants of the same product. Preserve their original lines.
  const quantitiesEditable =
    !order.marketerId &&
    new Set(order.items.map((item) => item.numericId)).size ===
      order.items.length;
  const save = async () => {
    if (!delivery.deliveryType) throw new Error("Yetkazish turini tanlang");
    setSaved(false);
    await update.mutateAsync({
      id: order._id,
      body: {
        regionId: delivery.regionId,
        cityId: delivery.cityId,
        deliveryType: delivery.deliveryType,
        address: delivery.address.trim(),
        notes,
        ...(quantitiesEditable &&
        quantities.some((value, index) => value !== order.items[index].quantity)
          ? {
              items: order.items.map((item, index) => ({
                numericId: item.numericId,
                quantity: quantities[index],
              })),
            }
          : {}),
      },
    });
    setSaved(true);
  };
  const submit = async (confirmAfter: boolean) => {
    if (submission.current || !form.current?.reportValidity()) return;
    submission.current = true;
    try {
      await save();
      if (confirmAfter) {
        await confirm.mutateAsync({ id: order._id, notes });
        setReview(false);
      }
    } catch {
      /* Mutation errors remain visible in the form and review sheet. */
    } finally {
      submission.current = false;
    }
  };
  const error = update.error || confirm.error;
  return (
    <>
      <form
        ref={form}
        className="editing-stack"
        onSubmit={(event) => {
          event.preventDefault();
          setReview(true);
        }}
      >
        <fieldset disabled={busy} className="editing-columns">
          <div className="editing-stack">
            <OrderCustomer order={order} />
            <OrderProducts
              order={order}
              quantities={quantities}
              onQuantity={
                quantitiesEditable
                  ? (index, quantity) =>
                      setQuantities((current) =>
                        current.map((value, i) =>
                          i === index ? quantity : value,
                        ),
                      )
                  : undefined
              }
            />
          </div>
          <div className="editing-stack">
            <DeliveryFields
              value={delivery}
              onChange={setDelivery}
              allowOnline={order.paymentMethod !== "pod"}
            />
            <FormPanel title="Izoh" icon={FileText}>
              <FormField label="Buyurtma izohi">
                <textarea
                  rows={2}
                  maxLength={3000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Izoh kiriting..."
                />
              </FormField>
            </FormPanel>
            <div className="form-actions">
              <button
                type="button"
                className="form-button"
                disabled={!deliveryComplete(delivery)}
                onClick={() => void submit(false)}
              >
                <Save size={18} />
                Saqlash
              </button>
            </div>
            {!deliveryComplete(delivery) && (
              <p className="form-notice">
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
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="form-error">
            {errorText(error, "O‘zgarishlar saqlanmadi")}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="form-success">
            Ma’lumotlar saqlandi.
          </p>
        )}
      </form>
      <CancelOrderButton order={order} disabled={busy} />
      <BottomSheet
        open={review}
        onClose={() => {
          if (!busy) setReview(false);
        }}
        title="Buyurtmani tasdiqlaysizmi?"
        description="Kiritilgan o‘zgarishlar saqlanadi, so‘ng buyurtma tasdiqlanadi."
      >
        <div className="editing-stack">
          <p className="form-summary">
            {customerName(order)} · {order.customer.phoneNumber}
            <br />
            {order.items
              .map((item, index) => `${item.name_uz} × ${quantities[index]}`)
              .join(", ")}
            <br />
            {delivery.address}
          </p>
          {error && (
            <p role="alert" className="form-error">
              {errorText(error, "Tasdiqlanmadi")}
            </p>
          )}
          <button
            type="button"
            className="form-button form-button--primary"
            disabled={busy}
            onClick={() => void submit(true)}
          >
            {busy ? "Saqlanmoqda..." : "Ha, tasdiqlash"}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
