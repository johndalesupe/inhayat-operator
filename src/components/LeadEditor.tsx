"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLeadActions } from "../hooks/useOperatorLeads";
import {
  useOperatorCities,
  useOperatorRegions,
} from "../hooks/useOperatorOrders";
import { errorText, formatPrice } from "../lib/format";
import type { OperatorLead, OrderDelivery, UpdateOperatorLead } from "../types";
import {
  BottomSheet,
  GlassPanel,
  PrimaryButton,
  inputClass,
  textareaClass,
} from "./ui";
import { CustomerCallButton } from "./CustomerCallButton";
import { deliveryLabel } from "./OrderEditor";

export function LeadEditor({ lead }: { lead: OperatorLead }) {
  const router = useRouter();
  const { update, convert } = useLeadActions();
  const [name, setName] = useState(lead.clientName ?? "");
  const [phone, setPhone] = useState(lead.clientPhoneNumber ?? "");
  const [quantity, setQuantity] = useState(lead.quantity);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [regionId, setRegion] = useState(lead.delivery?.regionId ?? "");
  const [cityId, setCity] = useState(lead.delivery?.cityId ?? "");
  const [type, setType] = useState<OrderDelivery["type"]>(
    lead.delivery?.type ?? "normal",
  );
  const [address, setAddress] = useState(lead.delivery?.address ?? "");
  const [confirming, setConfirming] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [saved, setSaved] = useState(false);
  const regions = useOperatorRegions();
  const cities = useOperatorCities(regionId);
  const city = cities.data?.find((item) => item._id === cityId);
  const busy = update.isPending || convert.isPending;
  const editable = !lead.orderId && lead.status !== "archived";
  const options: OrderDelivery["type"][] = city
    ? [
        ...(city.price.beepostCityCenterPrice != null ||
        city.price.normalPrice != null
          ? ["normal" as const]
          : []),
        ...(city.price.beepostToHomePrice != null ||
        city.price.toHomePrice != null
          ? ["to_home" as const]
          : []),
        ...(city.price.privateDpPrice != null ? ["private_dp" as const] : []),
        ...(city.price.sameDayRequiresPrepayment === false &&
        (city.price.sameDayPrice != null || city.price.expressPrice != null)
          ? ["express" as const]
          : []),
      ]
    : [];
  const fields = (): UpdateOperatorLead => ({
    clientName: name.trim(),
    clientPhoneNumber: phone.trim(),
    quantity,
    notes,
  });
  const save = async (status?: UpdateOperatorLead["status"]) => {
    setSaved(false);
    await update.mutateAsync({
      id: lead._id,
      body: { ...fields(), ...(status ? { status } : {}) },
    });
    setSaved(true);
  };
  if (!editable)
    return (
      <GlassPanel className="space-y-3 p-5">
        <p className="font-semibold">
          {lead.orderId ? "Lead buyurtmaga aylantirilgan" : "Lead arxivlangan"}
        </p>
        <Link
          className="text-sm font-semibold text-blue-700"
          href={lead.orderId ? `/process/${lead.orderId}` : "/stream"}
        >
          {lead.orderNumber ?? "Oqimga qaytish"} →
        </Link>
      </GlassPanel>
    );

  return (
    <div className="space-y-4">
      <GlassPanel className="space-y-3 p-4">
        <span className="soft-badge bg-violet-50 text-violet-700">
          Lead · Oqim #{lead.streamNumericId}
        </span>
        <h2 className="font-semibold">{lead.product.nameUz}</h2>
        <p className="text-xs text-slate-500">
          {formatPrice(lead.product.discountPrice ?? lead.product.price)} / dona
          · Yakuniy narx tasdiqlashda hisoblanadi
        </p>
        {lead.clientPhoneNumber && (
          <CustomerCallButton phoneNumber={lead.clientPhoneNumber} />
        )}
        {lead.status === "call_back" && (
          <p className="text-xs text-amber-700">
            Mijozga qayta qo&apos;ng&apos;iroq qilish kerak.
          </p>
        )}
      </GlassPanel>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!options.includes(type)) return;
          void save()
            .then(() => setConfirming(true))
            .catch(() => {});
        }}
      >
        <fieldset disabled={busy} className="space-y-4">
          <GlassPanel className="grid gap-4 p-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold">
              Mijoz ismi
              <input
                className={inputClass}
                required
                maxLength={160}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="space-y-1.5 text-xs font-semibold">
              Telefon
              <input
                className={inputClass}
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>
            <label className="space-y-1.5 text-xs font-semibold">
              Miqdor
              <input
                className={inputClass}
                required
                type="number"
                min={1}
                max={99}
                step={1}
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <label className="space-y-1.5 text-xs font-semibold sm:col-span-2">
              Izoh
              <textarea
                className={textareaClass}
                maxLength={3000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="button"
                className="min-h-10 text-xs font-semibold text-blue-700"
                onClick={() => void save().catch(() => {})}
              >
                Saqlash
              </button>
              <button
                type="button"
                className="min-h-10 text-xs font-semibold text-amber-700"
                onClick={() => void save("call_back").catch(() => {})}
              >
                Keyinroq qo&apos;ng&apos;iroq qilish
              </button>
              <button
                type="button"
                className="min-h-10 text-xs font-semibold text-rose-700"
                onClick={() => setArchiving(true)}
              >
                Arxivlash
              </button>
            </div>
          </GlassPanel>
          <GlassPanel className="grid gap-4 p-4 sm:grid-cols-2">
            <h2 className="section-title sm:col-span-2">Yetkazib berish</h2>
            <label className="space-y-1.5 text-xs font-semibold">
              Viloyat
              <select
                className={inputClass}
                required
                value={regionId}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setCity("");
                }}
              >
                <option value="">Tanlang</option>
                {regions.data?.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name.uz}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold">
              Shahar / tuman
              <select
                className={inputClass}
                required
                disabled={!regionId || cities.isLoading}
                value={cityId}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">Tanlang</option>
                {cities.data?.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name.uz}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold">
              Yetkazish turi
              <select
                className={inputClass}
                required
                value={options.includes(type) ? type : ""}
                onChange={(e) =>
                  setType(e.target.value as OrderDelivery["type"])
                }
              >
                <option value="">Tanlang</option>
                {options.map((item) => (
                  <option key={item} value={item}>
                    {deliveryLabel(item, city)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold sm:col-span-2">
              Manzil
              <input
                className={inputClass}
                required
                maxLength={500}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
              />
            </label>
            {(regions.error || cities.error) && (
              <p role="alert" className="text-xs text-rose-700 sm:col-span-2">
                Manzillar yuklanmadi.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    void regions.refetch();
                    if (regionId) void cities.refetch();
                  }}
                >
                  Qayta urinish
                </button>
              </p>
            )}
            {city && !options.length && (
              <p className="text-xs text-amber-700 sm:col-span-2">
                Bu hududda yetkazishda to&apos;lov usuli mavjud emas.
              </p>
            )}
          </GlassPanel>
          <PrimaryButton
            type="submit"
            disabled={busy || !city || !options.includes(type)}
            className="w-full"
          >
            {busy && <Loader2 size={16} className="animate-spin" />} Buyurtmani
            tasdiqlash
          </PrimaryButton>
        </fieldset>
      </form>
      {(update.error || convert.error) && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {errorText(update.error ?? convert.error, "Amal bajarilmadi")}
        </p>
      )}
      {saved && !update.error && (
        <p role="status" className="text-xs text-emerald-700">
          Ma&apos;lumotlar saqlandi.
        </p>
      )}
      <BottomSheet
        open={confirming}
        onClose={() => {
          if (!busy) setConfirming(false);
        }}
        title="Buyurtmani tasdiqlaysizmi?"
        description="Mijoz bilan kelishganingizdan so'ng tasdiqlang."
      >
        <div className="space-y-4">
          <p className="text-sm">
            {name} · {phone}
            <br />
            {lead.product.nameUz} × {quantity}
            <br />
            {city?.name.uz}, {address}
            <br />
            {deliveryLabel(type, city)}
          </p>
          {convert.error && (
            <p role="alert" className="text-sm text-rose-700">
              {errorText(convert.error, "Buyurtma yaratilmadi")}
            </p>
          )}
          <PrimaryButton
            type="button"
            disabled={busy}
            className="w-full"
            onClick={() =>
              convert.mutate(
                {
                  id: lead._id,
                  body: {
                    regionId,
                    cityId,
                    deliveryType: type,
                    deliveryAddress: address,
                  },
                },
                {
                  onSuccess: (result) => {
                    setConfirming(false);
                    if (result.orderId)
                      router.push(`/process/${result.orderId}`);
                  },
                },
              )
            }
          >
            {busy ? "Saqlanmoqda..." : "Ha, tasdiqlash"}
          </PrimaryButton>
        </div>
      </BottomSheet>
      <BottomSheet
        open={archiving}
        onClose={() => {
          if (!busy) setArchiving(false);
        }}
        title="Leadni arxivlash"
        description="Buyurtma yaratilmaydi. Lead faol ro'yxatdan olib tashlanadi."
      >
        <PrimaryButton
          type="button"
          disabled={busy}
          className="w-full"
          onClick={() =>
            void save("archived")
              .then(() => router.push("/stream"))
              .catch(() => setArchiving(false))
          }
        >
          Arxivlashni tasdiqlash
        </PrimaryButton>
      </BottomSheet>
    </div>
  );
}
