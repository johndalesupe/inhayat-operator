import Image from "next/image";
import { Package, Check } from "lucide-react";
import type { OperatorOrder } from "../types";

export function ProductPortrait({
  src,
  name,
  quantity,
  tone = "order",
}: {
  src?: string | null;
  name: string;
  quantity?: number;
  tone?: "order" | "lead";
}) {
  return (
    <div className={`product-portrait product-portrait--${tone}`}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="(max-width: 640px) 80px, 96px"
          unoptimized
          className="object-contain p-2"
        />
      ) : (
        <Package size={30} strokeWidth={1.3} aria-hidden="true" />
      )}
      {quantity != null && (
        <span className="product-quantity">×{quantity}</span>
      )}
    </div>
  );
}

export function OrderProgress({ status }: { status: OperatorOrder["status"] }) {
  const stopped = ["cancelled", "returning", "returned"].includes(status);
  const step =
    status === "delivered"
      ? 3
      : ["confirmed", "assigned", "in_delivery"].includes(status)
        ? 2
        : 1;
  return (
    <div
      className="order-progress"
      data-stopped={stopped}
      aria-label={
        stopped
          ? "Buyurtma yetkazilishi to'xtatilgan"
          : `Buyurtma jarayoni: ${step} / 3`
      }
    >
      {["Qabul", "Tasdiq", "Yetkazish"].map((label, index) => (
        <span
          key={label}
          data-complete={!stopped && step > index}
          data-current={!stopped && step === index}
        >
          <i aria-hidden="true">
            {!stopped && step > index ? (
              <Check size={10} strokeWidth={3} />
            ) : null}
          </i>
          {label}
        </span>
      ))}
    </div>
  );
}
