"use client";

import {
  Building2,
  Map,
  MapPin,
  Minus,
  Plus,
  Truck,
  type LucideIcon,
} from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
} from "react";
import {
  useOperatorCities,
  useOperatorRegions,
} from "../hooks/useOperatorOrders";
import {
  deliveryChoices,
  deliveryLabel,
  type DeliveryDraft,
} from "../lib/delivery";
import { formatPrice } from "../lib/format";

export function FormPanel({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`form-panel ${className}`}>
      <h2 className="form-panel-title">
        <Icon size={21} />
        {title}
      </h2>
      {children}
    </section>
  );
}
export function FormField({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const labelId = useId();
  const controls = Children.map(children, (child) =>
    isValidElement<{ "aria-labelledby"?: string }>(child) &&
    typeof child.type === "string" &&
    ["input", "select", "textarea"].includes(child.type)
      ? cloneElement(child, { "aria-labelledby": labelId })
      : child,
  );
  return (
    <label className={`form-field ${className}`}>
      <span id={labelId}>{label}</span>
      <span className={`form-control ${Icon ? "has-icon" : ""}`}>
        {Icon && <Icon size={18} />}
        {controls}
      </span>
    </label>
  );
}
export function QuantityControl({
  value,
  onChange,
  label = "Miqdor",
  max = 99,
  disabled = false,
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className="quantity-control">
      <button
        type="button"
        disabled={disabled || value <= 1}
        aria-label={`${label}: kamaytirish`}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={17} />
      </button>
      <input
        aria-label={label}
        type="number"
        inputMode="numeric"
        min={1}
        max={Math.min(99, max)}
        required
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <button
        type="button"
        disabled={disabled || value >= Math.min(99, max)}
        aria-label={`${label}: oshirish`}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={17} />
      </button>
    </div>
  );
}
export function DeliveryFields({
  value,
  onChange,
  allowOnline = false,
}: {
  value: DeliveryDraft;
  onChange: (next: DeliveryDraft) => void;
  allowOnline?: boolean;
}) {
  const regions = useOperatorRegions();
  const cities = useOperatorCities(value.regionId);
  const city = cities.data?.find((item) => item._id === value.cityId);
  const choices = deliveryChoices(city, allowOnline);
  const selected = choices.find((item) => item.type === value.deliveryType);
  return (
    <FormPanel title="Yetkazib berish" icon={Truck}>
      <div className="form-two-columns">
        <FormField label="Viloyat" icon={Map}>
          <select
            required
            value={value.regionId}
            disabled={regions.isLoading}
            onChange={(event) =>
              onChange({
                ...value,
                regionId: event.target.value,
                cityId: "",
                deliveryType: "",
              })
            }
          >
            <option value="">Tanlang</option>
            {regions.data?.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name.uz}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Shahar / tuman" icon={Building2}>
          <select
            required
            value={value.cityId}
            disabled={!value.regionId || cities.isLoading}
            onChange={(event) =>
              onChange({
                ...value,
                cityId: event.target.value,
                deliveryType: "",
              })
            }
          >
            <option value="">Tanlang</option>
            {cities.data?.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name.uz}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Yetkazish turi" icon={Truck}>
        <select
          required
          value={selected ? value.deliveryType : ""}
          disabled={!city}
          onChange={(event) =>
            onChange({
              ...value,
              deliveryType: event.target.value as DeliveryDraft["deliveryType"],
            })
          }
        >
          <option value="">Tanlang</option>
          {choices.map((item) => (
            <option key={item.type} value={item.type}>
              {deliveryLabel(item.type, city)} · {formatPrice(item.price)}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        label={
          value.deliveryType === "normal" ? "Manzil (ixtiyoriy)" : "Manzil"
        }
        icon={MapPin}
      >
        <input
          required={Boolean(
            value.deliveryType && value.deliveryType !== "normal",
          )}
          maxLength={500}
          value={value.address}
          placeholder="Manzilni kiriting..."
          onChange={(event) =>
            onChange({ ...value, address: event.target.value })
          }
        />
      </FormField>
      {selected && (
        <p className="form-hint">
          Yetkazish: {formatPrice(selected.price)}. Alohida to‘lanadi.
        </p>
      )}
      {city && !choices.length && (
        <p role="status" className="form-hint">
          Bu hududda yetkazishda to‘lash usuli mavjud emas.
        </p>
      )}
      {(regions.isError || cities.isError) && (
        <p role="alert" className="form-error">
          Hududlar yuklanmadi.{" "}
          <button
            type="button"
            onClick={() => {
              void regions.refetch();
              if (value.regionId) void cities.refetch();
            }}
          >
            Qayta urinish
          </button>
        </p>
      )}
    </FormPanel>
  );
}
