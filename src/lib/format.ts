import type { OperatorOrder } from "../types";

export function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} so'm`;
}

export function customerName(order: OperatorOrder) {
  return (
    [order.customer.firstName, order.customer.lastName].filter(Boolean).join(
      " ",
    ) ||
    order.customer.username ||
    "Telegram mijoz"
  );
}

export function deliveryPlace(order: OperatorOrder) {
  if (!order.delivery) return order.deliveryAddress ?? "Manzil belgilanmagan";
  return `${order.delivery.regionNameUz}, ${order.delivery.cityNameUz}`;
}

export function orderAge(order: OperatorOrder) {
  const minutes = Math.max(
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000),
    0,
  );
  if (minutes < 60) return `${minutes} daqiqa`;
  return `${Math.floor(minutes / 60)} soat ${minutes % 60} daqiqa`;
}

export function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
