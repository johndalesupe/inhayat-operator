import type { DeliveryCity, OrderDelivery } from "../types";

export type DeliveryDraft = {
  regionId: string;
  cityId: string;
  deliveryType: OrderDelivery["type"] | "";
  address: string;
};
export const emptyDelivery: DeliveryDraft = {
  regionId: "",
  cityId: "",
  deliveryType: "",
  address: "",
};
export function deliveryLabel(
  type: OrderDelivery["type"],
  city?: DeliveryCity | null,
) {
  const custom = city?.price.deliveryOptions?.find(
    (option) => option.type === type,
  )?.titleUz;
  return (
    custom ||
    {
      normal: "Beepost — markaz",
      to_home: "Beepost — uyga",
      private_dp: "Xususiy yetkazish",
      express: "Tezkor yetkazish",
      yandex: "Yandex",
      taxi_delivery: "Taksi",
    }[type]
  );
}
export function deliveryChoices(
  city?: DeliveryCity | null,
  allowOnline = false,
) {
  if (!city) return [];
  const p = city.price;
  const options: Array<{
    type: OrderDelivery["type"];
    price: number | null | undefined;
  }> = [
    { type: "normal", price: p.beepostCityCenterPrice ?? p.normalPrice },
    { type: "to_home", price: p.beepostToHomePrice ?? p.toHomePrice },
    { type: "private_dp", price: p.privateDpPrice },
    {
      type: "express",
      price:
        allowOnline || p.sameDayRequiresPrepayment === false
          ? (p.sameDayPrice ?? p.expressPrice)
          : null,
    },
    { type: "yandex", price: allowOnline && p.yandexAvailable ? 0 : null },
  ];
  return options.filter(
    (option): option is { type: OrderDelivery["type"]; price: number } =>
      option.price != null,
  );
}
export function deliveryComplete(value: DeliveryDraft) {
  return Boolean(
    value.regionId &&
    value.cityId &&
    value.deliveryType &&
    (value.deliveryType === "normal" || value.address.trim()),
  );
}
