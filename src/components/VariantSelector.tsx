"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import type { OperatorCatalogProduct } from "../types";
import { formatPrice } from "../lib/format";
import { ProductPortrait } from "./OrderVisuals";

export function VariantSelector({
  product,
  value,
  onChange,
  disabled,
}: {
  product: OperatorCatalogProduct;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const name = useId();
  if (!product.variants.length) return null;
  return (
    <fieldset className="variant-picker" disabled={disabled}>
      <legend>Variantni tanlang</legend>
      <div className="variant-picker-options">
        {product.variants.map((variant) => {
          const price =
            variant.discountPrice != null &&
            variant.discountPrice < variant.price
              ? variant.discountPrice
              : variant.price;
          return (
            <label
              className="variant-option"
              key={variant.key}
              data-selected={value === variant.key}
              data-unavailable={variant.stock < 1}
            >
              <input
                type="radio"
                name={name}
                value={variant.key}
                checked={value === variant.key}
                disabled={variant.stock < 1}
                required
                onChange={() => onChange(variant.key)}
              />
              <ProductPortrait
                src={variant.thumbnailUrl}
                fallbacks={[
                  ...(variant.images ?? []),
                  product.thumbnailUrl,
                  ...(product.images ?? []),
                ]}
                name={variant.name}
              />
              <span className="variant-option-copy">
                <strong>{variant.name}</strong>
                {!!Object.keys(variant.attributes ?? {}).length && (
                  <span>
                    {Object.values(variant.attributes ?? {}).join(" / ")}
                  </span>
                )}
                <b>{formatPrice(price)}</b>
                <small>
                  {variant.stock > 0
                    ? `${variant.stock} dona mavjud`
                    : "Tugagan"}
                </small>
              </span>
              <span className="variant-option-check" aria-hidden="true">
                {value === variant.key && <Check size={13} />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
