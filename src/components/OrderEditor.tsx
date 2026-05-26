"use client";

import { useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useOperatorCities, useOperatorRegions } from "../hooks/useOperatorOrders";
import { formatPrice } from "../lib/format";
import type { DeliveryCity, OperatorOrder } from "../types";
import {
  ActionButton,
  EmptyState,
  FieldError,
  GlassPanel,
  PrimaryButton,
  inputClass,
  textareaClass,
} from "./ui";

const orderFormSchema = yup.object({
  regionId: yup.string().trim().required("Viloyat yoki shahar kerak"),
  cityId: yup.string().trim().required("Shahar yoki tuman kerak"),
  address: yup.string().trim().required("Manzil kerak"),
  notes: yup.string().default(""),
  items: yup
    .array(
      yup.object({
        numericId: yup.number().required(),
        quantity: yup
          .number()
          .typeError("Miqdor raqam bo'lishi kerak")
          .integer("Butun raqam kiriting")
          .min(1, "Kamida 1 dona")
          .required("Miqdor kerak"),
      }),
    )
    .required(),
});

export type OrderFormValues = yup.InferType<typeof orderFormSchema>;

function defaultValues(order: OperatorOrder): OrderFormValues {
  return {
    regionId: order.delivery?.regionId ?? "",
    cityId: order.delivery?.cityId ?? "",
    address: order.delivery?.address ?? order.deliveryAddress ?? "",
    notes: order.notes ?? "",
    items: order.items.map((item) => ({
      numericId: item.numericId,
      quantity: item.quantity,
    })),
  };
}

function FullscreenOverlay({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function OrderEditor({
  order,
  onSave,
  onConfirm,
  onCancel,
  onCallbackLater,
  canConfirm,
  canCallbackLater,
  confirmedPopupOpen,
  onCloseConfirmedPopup,
  saving,
  confirming,
  cancelling,
  callbacking,
}: {
  order: OperatorOrder | null;
  onSave: (id: string, values: OrderFormValues) => void;
  onConfirm: (id: string, notes?: string) => void;
  onCancel: (id: string, cancelReason?: string) => void;
  onCallbackLater: (id: string, notes?: string) => void;
  canConfirm: boolean;
  canCallbackLater: boolean;
  confirmedPopupOpen: boolean;
  onCloseConfirmedPopup: () => void;
  saving: boolean;
  confirming: boolean;
  cancelling: boolean;
  callbacking: boolean;
}) {
  const [pendingAction, setPendingAction] = useState<
    "confirm" | "cancel" | "callback" | null
  >(null);
  const [cancelReason, setCancelReason] = useState("");
  const form = useForm<OrderFormValues>({
    resolver: yupResolver(orderFormSchema),
    defaultValues: order ? defaultValues(order) : undefined,
  });
  const selectedRegionId = useWatch({
    control: form.control,
    name: "regionId",
  });
  const selectedCityId = useWatch({
    control: form.control,
    name: "cityId",
  });
  const regionsQuery = useOperatorRegions();
  const citiesQuery = useOperatorCities(selectedRegionId);
  const cities = useMemo(
    () => citiesQuery.data ?? [],
    [citiesQuery.data],
  );
  const selectedCity = useMemo(
    () => cities.find((city) => city._id === selectedCityId) ?? null,
    [cities, selectedCityId],
  );

  if (!order) {
    return (
      <EmptyState
        icon={<UserRound className="h-5 w-5" />}
        title="Buyurtma tanlang"
        description="Mijozga qo'ng'iroq qilib, manzil va miqdorni shu yerda yangilang."
      />
    );
  }

  const itemErrors = form.formState.errors.items;
  const deliveryType = order.delivery?.type ?? "normal";
  const selectedDeliveryPrice = selectedCity
    ? deliveryType === "express"
      ? (selectedCity.price.expressPrice ?? 0)
      : selectedCity.price.normalPrice
    : (order.delivery?.price ?? 0);

  function cityLabel(city: DeliveryCity) {
    const price =
      deliveryType === "express"
        ? (city.price.expressPrice ?? 0)
        : city.price.normalPrice;
    const unavailable =
      deliveryType === "express" && !city.price.expressAvailable;
    return `${city.name.uz} - ${formatPrice(price)}${
      unavailable ? " (express yo'q)" : ""
    }`;
  }

  function openConfirmAction() {
    if (!canConfirm) return;
    void form.handleSubmit(() => setPendingAction("confirm"))();
  }

  function submitPendingAction() {
    if (!order || !pendingAction) return;
    if (pendingAction === "confirm") {
      void form.handleSubmit((values) => {
        onConfirm(order._id, values.notes);
        setPendingAction(null);
      })();
      return;
    }

    if (pendingAction === "callback") {
      void form.handleSubmit((values) => {
        onCallbackLater(order._id, values.notes);
        setPendingAction(null);
      })();
      return;
    }

    onCancel(order._id, cancelReason.trim() || undefined);
    setPendingAction(null);
  }

  return (
    <GlassPanel className="p-5">
      <div className="mb-5">
        <p className="text-sm font-bold text-neutral-500">
          Buyurtma tahriri
        </p>
        <h2 className="text-lg font-semibold text-neutral-950">
          Yetkazish va tasdiqlash
        </h2>
      </div>

      <form className="space-y-4">
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-3">
          <span className="mb-1 block text-sm font-semibold text-neutral-700">
            Telefon
          </span>
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-neutral-950">
            <Phone className="h-4 w-4 shrink-0 text-neutral-500" />
            <span className="break-words">
              {order.customer.phoneNumber ?? "-"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-neutral-700">
              Viloyat yoki shahar
            </span>
            <select
              {...form.register("regionId", {
                onChange: () => {
                  form.setValue("cityId", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                },
              })}
              className={inputClass}
              disabled={regionsQuery.isLoading}
            >
              <option value="">Tanlang</option>
              {(regionsQuery.data ?? []).map((region) => (
                <option key={region._id} value={region._id}>
                  {region.name.uz}
                </option>
              ))}
            </select>
            <FieldError message={form.formState.errors.regionId?.message} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-neutral-700">
              Shahar yoki tuman
            </span>
            <select
              {...form.register("cityId")}
              className={inputClass}
              disabled={!selectedRegionId || citiesQuery.isLoading}
            >
              <option value="">
                {selectedRegionId ? "Tanlang" : "Avval viloyatni tanlang"}
              </option>
              {cities.map((city) => {
                const disabled =
                  deliveryType === "express" && !city.price.expressAvailable;
                return (
                  <option key={city._id} value={city._id} disabled={disabled}>
                    {cityLabel(city)}
                  </option>
                );
              })}
            </select>
            <FieldError message={form.formState.errors.cityId?.message} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-neutral-700">
            Yetkazish narxi
          </span>
          <div className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold text-neutral-950">
            <MapPin className="h-4 w-4 text-neutral-500" />
            <span>
              {deliveryType === "express" ? "Express" : "Oddiy"} -{" "}
              {formatPrice(selectedDeliveryPrice)}
            </span>
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-neutral-700">
            Manzil
          </span>
          <textarea
            {...form.register("address")}
            rows={3}
            className={textareaClass}
          />
          <FieldError message={form.formState.errors.address?.message} />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-700">
            Mahsulot miqdori
          </p>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div
                key={item.numericId}
                className="grid grid-cols-[1fr_96px] items-start gap-3 rounded-xl border border-neutral-200 bg-white/80 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    #{item.numericId} {item.name_uz}
                  </p>
                  <p className="text-xs font-semibold text-neutral-500">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min={1}
                    {...form.register(`items.${index}.quantity`)}
                    className={`${inputClass} h-10 px-3`}
                  />
                  <input
                    type="hidden"
                    {...form.register(`items.${index}.numericId`)}
                  />
                  <FieldError message={itemErrors?.[index]?.quantity?.message} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-neutral-700">
            Izoh
          </span>
          <textarea
            {...form.register("notes")}
            rows={3}
            className={textareaClass}
          />
        </label>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-neutral-950">
          <div className="flex justify-between text-sm font-semibold text-neutral-600">
            <span>Mahsulotlar</span>
            <span>{formatPrice(order.itemsAmount)}</span>
          </div>
          {order.delivery && (
            <div className="mt-2 flex justify-between text-sm font-semibold text-neutral-600">
              <span>Yetkazish</span>
              <span>{formatPrice(order.delivery.price)}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
            <span>Qolgan summa</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <ActionButton
            type="button"
            isLoading={saving}
            onClick={form.handleSubmit((values) => onSave(order._id, values))}
          >
            Saqlash
          </ActionButton>
          <div
            className={
              canConfirm && canCallbackLater
                ? "grid gap-2 sm:grid-cols-3"
                : canConfirm
                  ? "grid grid-cols-2 gap-2"
                : "grid gap-2"
            }
          >
            <ActionButton
              type="button"
              disabled={cancelling || confirming || callbacking}
              onClick={() => setPendingAction("cancel")}
              className="border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Bekor qilish
            </ActionButton>
            {canCallbackLater && (
              <ActionButton
                type="button"
                disabled={confirming || cancelling || callbacking}
                onClick={() => setPendingAction("callback")}
                className="border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100"
              >
                {callbacking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Keyinroq
              </ActionButton>
            )}
            {canConfirm ? (
              <PrimaryButton
                type="button"
                disabled={confirming || cancelling || callbacking}
                onClick={openConfirmAction}
                className="from-emerald-600 via-green-600 to-teal-500"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Tasdiqlash
              </PrimaryButton>
            ) : (
              <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Tasdiqlangan
              </div>
            )}
          </div>
        </div>
      </form>

      {pendingAction && (
        <FullscreenOverlay>
          <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/45 p-0 sm:items-center sm:justify-center sm:p-4">
            <div className="w-full rounded-t-3xl border border-white/80 bg-white p-5 sm:max-w-md sm:rounded-2xl">
            <div className="mb-4 flex items-start gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  pendingAction === "cancel"
                    ? "bg-red-50 text-red-700"
                    : pendingAction === "callback"
                      ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {pendingAction === "cancel" ? (
                  <XCircle className="h-5 w-5" />
                ) : pendingAction === "callback" ? (
                  <Phone className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </span>
              <div>
                <h3 className="text-base font-semibold text-neutral-950">
                  {pendingAction === "cancel"
                    ? "Buyurtmani bekor qilasizmi?"
                    : pendingAction === "callback"
                      ? "Keyinroq qo'ng'iroq qilinsinmi?"
                    : "Buyurtmani tasdiqlaysizmi?"}
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-neutral-500">
                  {pendingAction === "cancel"
                    ? "Bekor qilingandan keyin buyurtma jarayondan chiqadi."
                    : pendingAction === "callback"
                      ? "Mijoz telefonga javob bermagan bo'lsa, buyurtma qayta qo'ng'iroq qilish holatiga o'tadi."
                    : "Tasdiqlangandan keyin buyurtma keyingi jarayonga o'tadi."}
                </p>
              </div>
            </div>

            {pendingAction === "cancel" && (
              <label className="mb-4 block">
                <span className="mb-1 block text-sm font-semibold text-neutral-700">
                  Bekor qilish sababi
                </span>
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  rows={3}
                  className={textareaClass}
                  placeholder="Masalan: mijoz fikridan qaytdi"
                />
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={confirming || cancelling || callbacking}
              >
                Ortga
              </ActionButton>
              <button
                type="button"
                onClick={submitPendingAction}
                disabled={confirming || cancelling || callbacking}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${
                  pendingAction === "cancel"
                    ? "bg-red-600"
                    : pendingAction === "callback"
                      ? "bg-amber-600"
                    : "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500"
                }`}
              >
                {confirming || cancelling || callbacking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : pendingAction === "cancel" ? (
                  <XCircle className="h-4 w-4" />
                ) : pendingAction === "callback" ? (
                  <Phone className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {pendingAction === "cancel"
                  ? "Bekor qilish"
                  : pendingAction === "callback"
                    ? "Keyinroq"
                    : "Tasdiqlash"}
              </button>
            </div>
          </div>
          </div>
        </FullscreenOverlay>
      )}

      {confirmedPopupOpen && (
        <FullscreenOverlay>
          <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/45 p-0 sm:items-center sm:justify-center sm:p-4">
            <div className="w-full rounded-t-3xl border border-white/80 bg-white p-5 sm:max-w-md sm:rounded-2xl">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-neutral-950">
                    Buyurtma tasdiqlandi
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-neutral-500">
                    Buyurtma muvaffaqiyatli tasdiqlandi. Endi uni qayta
                    tasdiqlab bo&apos;lmaydi.
                  </p>
                </div>
              </div>
              <PrimaryButton
                type="button"
                onClick={onCloseConfirmedPopup}
                className="w-full from-emerald-600 via-green-600 to-teal-500"
              >
                Tushunarli
              </PrimaryButton>
            </div>
          </div>
        </FullscreenOverlay>
      )}
    </GlassPanel>
  );
}
