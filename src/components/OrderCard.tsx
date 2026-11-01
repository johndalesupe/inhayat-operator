"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Zap } from "lucide-react";
import {
  customerName,
  deliveryPlace,
  formatPrice,
  orderAge,
} from "../lib/format";
import type { OperatorOrder } from "../types";
import { OrderProgress, ProductPortrait } from "./OrderVisuals";

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
  const first = order.items[0];
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
  const methodLabel =
    paymentMethod === "payme"
      ? "Payme"
      : paymentMethod === "click"
        ? "Click"
        : "Yetkazishda to'lov";
  const paymentLabels: Record<OperatorOrder["paymentStatus"], string> = {
    unpaid: "To'lanmagan",
    pending: "To'lov kutilmoqda",
    processing: "Tekshirilmoqda",
    paid: "To'langan",
    partially_paid: "Qisman to'langan",
    failed: "To'lov xatosi",
    cancelled: "To'lov bekor qilingan",
    refunded: "To'lov qaytarilgan",
  };
  return (
    <article
      className="work-card work-card--order"
      data-selected={selected}
      aria-label={`Buyurtma ${order.orderNumber}`}
    >
      <header className="work-card-header">
        <h3 className="work-order-number">{order.orderNumber}</h3>
        {isExpress && (
          <span className="work-kind work-kind--express">
            <Zap size={12} />
            Tezkor
          </span>
        )}
        <span className="work-time">{orderAge(order)}</span>
      </header>
      <div className="work-product">
        <ProductPortrait
          src={first?.thumbnailUrl}
          name={first?.name_uz ?? "Buyurtma"}
          quantity={order.items.reduce((sum, item) => sum + item.quantity, 0)}
        />
        <div className="min-w-0">
          <p className="work-product-title">{first?.name_uz ?? "Buyurtma"}</p>
          <p className="work-product-meta">
            {order.items.length > 1
              ? `Yana ${order.items.length - 1} tur mahsulot`
              : "1 tur mahsulot"}
          </p>
          <p className="work-price">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>
      <div className="work-customer">
        <p className="truncate font-semibold">{customerName(order)}</p>
        {statusLabel && (
          <span
            className={`work-status ${statusClassName ?? "bg-slate-100 text-slate-600"}`}
          >
            {statusLabel}
          </span>
        )}
      </div>
      {(showContact || showDelivery) && (
        <div className="work-contact">
          {showContact && order.customer.phoneNumber && (
            <span>
              <Phone size={13} />
              {order.customer.phoneNumber}
            </span>
          )}
          {showDelivery && (
            <span>
              <MapPin size={13} />
              {deliveryPlace(order)}
            </span>
          )}
        </div>
      )}
      {showItems && order.items.length > 1 && (
        <div className="work-more-items">
          {order.items.slice(1, showPayment ? undefined : 3).map((item) => (
            <p key={item.numericId}>
              <span>{item.name_uz}</span>
              <strong>×{item.quantity}</strong>
            </p>
          ))}
          {!showPayment && order.items.length > 3 && (
            <p className="text-slate-400">
              Yana {order.items.length - 3} tur mahsulot
            </p>
          )}
        </div>
      )}
      <OrderProgress status={order.status} />
      <footer className="work-card-footer">
        <div className="work-next">
          <span className="block">{methodLabel}</span>
          <span
            className={
              paymentStatus === "paid" ? "text-emerald-700" : "text-slate-500"
            }
          >
            {paymentLabels[paymentStatus]}
          </span>
        </div>
        {detailHref && (
          <Link
            href={detailHref}
            className={`work-action ${order.status === "pending" ? "work-action--primary" : ""}`}
            aria-label={`${order.orderNumber} buyurtma tafsilotlari`}
          >
            {order.status === "pending" ? "Davom ettirish" : "Tafsilotlar"}
            <ArrowUpRight size={16} />
          </Link>
        )}
        {!detailHref && operatorFee > 0 && (
          <span className="work-fee">Haq: {formatPrice(operatorFee)}</span>
        )}
      </footer>
      {showPayment && (
        <dl className="work-payment">
          {[
            ["Mahsulotlar", order.itemsAmount],
            ["Yetkazish", deliveryPrice],
            ["Jami", grossAmount],
            ["To'langan", paidAmount],
            ["Qolgan", remainingAmount],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt>{label}</dt>
              <dd>{formatPrice(Number(value))}</dd>
            </div>
          ))}
        </dl>
      )}
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}
