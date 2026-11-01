"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Box,
  CirclePlus,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  DeliveryFields,
  FormField,
  FormPanel,
  QuantityControl,
} from "@/src/components/OrderFormParts";
import { ProductPortrait } from "@/src/components/OrderVisuals";
import { useCreateOperatorOrder } from "@/src/hooks/useOperatorOrders";
import { operatorApi } from "@/src/lib/api";
import {
  deliveryComplete,
  emptyDelivery,
  type DeliveryDraft,
} from "@/src/lib/delivery";
import { errorText, formatPrice } from "@/src/lib/format";
import type { OperatorCatalogProduct } from "@/src/types";

type Line = {
  key: string;
  product: OperatorCatalogProduct;
  quantity: number;
  variantKey: string;
};
function selection(line: Line) {
  const variant = line.product.variants.find(
    (item) => item.key === line.variantKey,
  );
  const value = variant ?? line.product;
  return {
    variant,
    stock: value.stock,
    price:
      value.discountPrice != null && value.discountPrice < value.price
        ? value.discountPrice
        : value.price,
    image: value.thumbnailUrl,
  };
}

export default function CreateOrderPage() {
  const router = useRouter();
  const create = useCreateOperatorOrder();
  const requestId = useRef<string | null>(null);
  const submitting = useRef(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [ids, setIds] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [delivery, setDelivery] = useState<DeliveryDraft>(emptyDelivery);
  const [notes, setNotes] = useState("");
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");
  const busy = create.isPending;
  const total = lines.reduce(
    (sum, line) => sum + selection(line).price * (line.quantity || 0),
    0,
  );
  const changeLine = (key: string, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  async function addProducts() {
    if (looking) return;
    const numericIds = ids
      .trim()
      .split(/[\s,;]+/)
      .map(Number);
    if (
      !numericIds.length ||
      numericIds.some((id) => !Number.isSafeInteger(id) || id < 1) ||
      numericIds.length + lines.length > 20
    ) {
      setError("Mahsulot ID raqamlarini kiriting. Ko‘pi bilan 20 ta mahsulot.");
      return;
    }
    setLooking(true);
    setError("");
    try {
      const products = await Promise.all(
        numericIds.map((id) => operatorApi.catalogProduct(id)),
      );
      setLines((current) => [
        ...current,
        ...products.map((product) => ({
          key: crypto.randomUUID(),
          product,
          quantity: 1,
          variantKey:
            product.variants.length === 1 ? product.variants[0].key : "",
        })),
      ]);
      setIds("");
    } catch (err) {
      setError(errorText(err, "Mahsulot topilmadi"));
    } finally {
      setLooking(false);
    }
  }

  async function submit() {
    if (submitting.current) return;
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!/^(?:\+?998)?\d{9}$/.test(normalizedPhone) || !name.trim()) {
      setError("Mijoz ismi va telefon raqamini tekshiring.");
      return;
    }
    if (!lines.length || !deliveryComplete(delivery)) {
      setError("Mahsulot va yetkazish ma’lumotlarini to‘ldiring.");
      return;
    }
    if (
      lines.some(
        (line) =>
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > Math.min(99, selection(line).stock) ||
          (line.product.variants.length > 0 && !selection(line).variant),
      )
    ) {
      setError("Mahsulot varianti va mavjud miqdorni tekshiring.");
      return;
    }
    const keys = lines.map(
      (line) => `${line.product.numericId}:${line.variantKey}`,
    );
    if (new Set(keys).size !== keys.length) {
      setError(
        "Bir xil mahsulot va variantni birlashtirib, miqdorini oshiring.",
      );
      return;
    }
    submitting.current = true;
    setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const order = await create.mutateAsync({
        requestId: requestId.current,
        clientName: name.trim(),
        phoneNumber: normalizedPhone,
        items: lines.map((line) => ({
          numericId: line.product.numericId,
          quantity: line.quantity,
          ...(line.variantKey ? { variantKey: line.variantKey } : {}),
        })),
        regionId: delivery.regionId,
        cityId: delivery.cityId,
        deliveryType: delivery.deliveryType as Exclude<
          DeliveryDraft["deliveryType"],
          ""
        >,
        deliveryAddress: delivery.address.trim(),
        notes: notes.trim(),
      });
      router.push(`/process/${order._id}`);
    } catch (err) {
      setError(
        errorText(
          err,
          "Buyurtma yaratilmadi. Ma’lumotlarni tekshirib qayta urinib ko‘ring.",
        ),
      );
      submitting.current = false;
    }
  }

  return (
    <div className="editing-workspace">
      <header className="editing-heading editing-heading--back">
        <Link href="/process" aria-label="Jarayonga qaytish">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1>Buyurtma yaratish</h1>
          <p>Saqlanganda tasdiqlanadi va sizga biriktiriladi.</p>
        </div>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="editing-form"
      >
        <fieldset disabled={busy} className="editing-columns">
          <div className="editing-stack">
            <FormPanel title="Mijoz ma’lumotlari" icon={UserRound}>
              <FormField label="Telefon raqami" icon={Phone}>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  maxLength={24}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </FormField>
              <FormField label="Mijoz ismi" icon={UserRound}>
                <input
                  required
                  maxLength={160}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ism va familiya"
                />
              </FormField>
            </FormPanel>
            <FormPanel title="Mahsulotlar" icon={Box}>
              <div className="product-id-search">
                <FormField label="Mahsulot ID" icon={Search}>
                  <input
                    inputMode="numeric"
                    value={ids}
                    onChange={(event) => setIds(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addProducts();
                      }
                    }}
                    placeholder="1042 yoki 1042, 1050"
                  />
                </FormField>
                <button
                  type="button"
                  className="form-button form-button-soft"
                  onClick={() => void addProducts()}
                  disabled={looking || !ids.trim()}
                  aria-label="Mahsulotlarni qo‘shish"
                >
                  {looking ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                </button>
              </div>
              {!lines.length && (
                <p className="form-hint">
                  Bir yoki bir nechta ID kiriting. Narx va mavjud miqdor
                  avtomatik yuklanadi.
                </p>
              )}
              {lines.map((line) => {
                const selected = selection(line);
                return (
                  <div className="create-product" key={line.key}>
                    <div className="form-product-preview">
                      <ProductPortrait
                        src={selected.image}
                        name={line.product.name}
                        quantity={line.quantity}
                      />
                      <div>
                        <span className="form-hint">
                          #{line.product.numericId}
                        </span>
                        <h3>{line.product.name}</h3>
                        <p>
                          <strong>{formatPrice(selected.price)}</strong> / dona
                        </p>
                      </div>
                      <button
                        type="button"
                        className="remove-product"
                        aria-label={`${line.product.name}ni olib tashlash`}
                        onClick={() =>
                          setLines((current) =>
                            current.filter((item) => item.key !== line.key),
                          )
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="product-options">
                      {line.product.variants.length > 0 && (
                        <FormField label="Variant" icon={Tag}>
                          <select
                            required
                            value={line.variantKey}
                            onChange={(event) =>
                              changeLine(line.key, {
                                variantKey: event.target.value,
                                quantity: 1,
                              })
                            }
                          >
                            <option value="">Tanlang</option>
                            {line.product.variants.map((variant) => (
                              <option
                                key={variant.key}
                                value={variant.key}
                                disabled={!variant.stock}
                              >
                                {variant.name} · {variant.stock} dona
                              </option>
                            ))}
                          </select>
                        </FormField>
                      )}
                      <div className="quantity-field">
                        <span>Miqdor</span>
                        <QuantityControl
                          label={`${line.product.name} miqdori`}
                          value={line.quantity}
                          max={selected.stock}
                          onChange={(quantity) =>
                            changeLine(line.key, { quantity })
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </FormPanel>
          </div>
          <div className="editing-stack">
            <DeliveryFields value={delivery} onChange={setDelivery} />
            <FormPanel title="Izoh va yakun" icon={MessageSquare}>
              <FormField label="Izoh (ixtiyoriy)">
                <textarea
                  rows={2}
                  maxLength={3000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Mijozning qo‘shimcha istaklari..."
                />
              </FormField>
              <div className="form-total">
                <span>
                  Buyurtma summasi <small>Yetkazish alohida to‘lanadi</small>
                </span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </FormPanel>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="form-button form-button--primary form-submit"
              disabled={
                busy || looking || !lines.length || !deliveryComplete(delivery)
              }
            >
              {busy ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CirclePlus size={22} />
              )}
              {busy ? "Yaratilmoqda..." : "Yaratish va tasdiqlash"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
