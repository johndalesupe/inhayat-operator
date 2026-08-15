"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, PackageCheck, Phone, ShoppingBag } from "lucide-react";
import {
  customerName,
  deliveryPlace,
  formatPrice,
  orderAge,
} from "../lib/format";
import type { OperatorOrder } from "../types";
import { GlassPanel } from "./ui";

export function OrderCard({
  order,
  action,
  selected,
  showContact = true,
  showDelivery = true,
  showItems = true,
  showPayment = false,
  detailHref,
  statusLabel,
  statusClassName,
}: {
  order: OperatorOrder;
  action?: React.ReactNode;
  selected?: boolean;
  showContact?: boolean;
  showDelivery?: boolean;
  showItems?: boolean;
  showPayment?: boolean;
  detailHref?: string;
  statusLabel?: string;
  statusClassName?: string;
}) {
  const isExpress = order.delivery?.type === "express";
  const operatorFee = Math.max(Number(order.operatorFee ?? 0), 0);
  const deliveryPrice = order.delivery?.price ?? 0;
  const grossAmount =
    order.payment?.grossAmount ?? order.itemsAmount + deliveryPrice;
  const paidAmount = order.payment?.totalPaidAmount ?? 0;
  const remainingAmount =
    order.payment?.remainingAmount ?? Math.max(grossAmount - paidAmount, 0);
  const paymentMethod = order.paymentMethod ?? "pod";
  const paymentStatus = order.paymentStatus ?? "unpaid";
  const paymentMethodLabel =
    paymentMethod === "payme"
      ? "Payme"
      : paymentMethod === "click"
        ? "Click"
        : "Yetkazishda to'lov";
  const paymentStatusLabel: Record<OperatorOrder["paymentStatus"], string> = {
    unpaid: "To'lanmagan",
    pending: "To'lov kutilmoqda",
    processing: "Tekshirilmoqda",
    paid: "To'langan",
    partially_paid: "Qisman to'langan",
    failed: "To'lov xatosi",
    cancelled: "To'lov bekor qilingan",
    refunded: "To'lov qaytarilgan",
  };
  const paymentSettled = paymentMethod === "pod" || paymentStatus === "paid";

  return (
    <GlassPanel
      className={`p-4 transition ${
        selected ? "border-emerald-200 bg-emerald-50/70" : ""
      } ${
        isExpress
          ? "border-amber-300 bg-amber-50/70 ring-1 ring-amber-200/80"
          : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-semibold text-neutral-950">
              {order.orderNumber}
            </h3>
            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-600">
              {orderAge(order)}
            </span>
            {isExpress && (
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                Express - avval bog&apos;laning
              </span>
            )}
            {operatorFee > 0 && (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                Operator haqi: {formatPrice(operatorFee)}
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                paymentSettled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : paymentStatus === "failed" ||
                      paymentStatus === "cancelled" ||
                      paymentStatus === "refunded"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {paymentMethodLabel} · {paymentStatusLabel[paymentStatus]}
            </span>
            {statusLabel && (
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  statusClassName ?? "border-blue-200 bg-blue-50 text-blue-800"
                }`}
              >
                {statusLabel}
              </span>
            )}
          </div>
          <p className="mt-1 break-words text-sm font-medium text-neutral-500">
            {customerName(order)}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white/75 px-3 py-2 sm:min-w-40">
          <div className="sm:text-right">
            <p className="text-base font-semibold text-neutral-950">
              {formatPrice(order.totalAmount)}
            </p>
            <p className="text-xs font-medium text-neutral-500">
              {order.items.length} mahsulot
            </p>
          </div>
          {detailHref && (
            <Link
              href={detailHref}
              aria-label="Buyurtma tafsilotlari"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white transition hover:bg-neutral-800"
            >
              <Eye className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {(showContact || showDelivery) && (
        <div className="mt-4 grid gap-2 text-sm font-medium text-neutral-600 sm:grid-cols-2">
          {showContact && order.customer.phoneNumber && (
            <div className="flex min-w-0 items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-neutral-500" />
              <span className="min-w-0 break-words">
                {order.customer.phoneNumber}
              </span>
            </div>
          )}
          {showDelivery && (
            <div className="flex min-w-0 items-center gap-2">
              <PackageCheck className="h-4 w-4 shrink-0 text-neutral-500" />
              <span className="min-w-0 break-words">
                {deliveryPlace(order)}
              </span>
            </div>
          )}
        </div>
      )}

      {showItems && (
        <div className="mt-4 space-y-2">
          {order.items.map((item) => (
            <div
              key={item.numericId}
              className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-neutral-100 bg-white/80 p-2"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.name_uz}
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <ShoppingBag className="m-3 h-6 w-6 text-neutral-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  #{item.numericId} {item.name_uz}
                </p>
                <p className="text-xs font-medium text-neutral-500">
                  {item.quantity} x {formatPrice(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPayment && (
        <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-neutral-950">
              To&apos;lov
            </p>
            <p className="text-sm font-semibold text-neutral-950">
              {formatPrice(remainingAmount)}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-neutral-500">Mahsulotlar</span>
              <span className="font-semibold text-neutral-900">
                {formatPrice(order.itemsAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-neutral-500">Yetkazish</span>
              <span className="font-semibold text-neutral-900">
                {formatPrice(deliveryPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-2">
              <span className="font-medium text-neutral-500">Jami</span>
              <span className="font-semibold text-neutral-900">
                {formatPrice(grossAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-neutral-500">
                To&apos;langan
              </span>
              <span className="font-semibold text-emerald-700">
                {formatPrice(paidAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-neutral-700">Qolgan</span>
              <span className="font-semibold text-neutral-950">
                {formatPrice(remainingAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {action && <div className="mt-4">{action}</div>}
    </GlassPanel>
  );
}
