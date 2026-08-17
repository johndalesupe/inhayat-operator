"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  HandCoins,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import {
  FieldError,
  GlassPanel,
  PrimaryButton,
  inputClass,
} from "@/src/components/ui";
import {
  useCreateOperatorWithdrawal,
  useOperatorTransactions,
  useOperatorWallet,
  useOperatorWithdrawals,
} from "@/src/hooks/useOperatorWallet";
import { errorText, formatPrice } from "@/src/lib/format";
import type {
  OperatorWalletTransaction,
  OperatorWithdrawal,
  OperatorWithdrawalStatus,
} from "@/src/types";

const withdrawalSchema = yup.object({
  amount: yup
    .number()
    .typeError("Summani kiriting")
    .min(1, "Summa 0 dan katta bo'lishi kerak")
    .required("Summa majburiy"),
  cardNumber: yup
    .string()
    .matches(/^[\d\s-]{12,23}$/, "Karta raqamni to'g'ri kiriting")
    .required("Karta raqam majburiy"),
  cardHolderName: yup
    .string()
    .trim()
    .min(2, "Karta egasi ismini kiriting")
    .required("Karta egasi majburiy"),
});

type WithdrawalForm = yup.InferType<typeof withdrawalSchema>;

const statusLabel: Record<OperatorWithdrawalStatus, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlandi",
  rejected: "Rad etildi",
};

const statusClass: Record<OperatorWithdrawalStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-cyan-200 bg-cyan-50 text-cyan-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

function dateText(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
            {label}
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-950">{value}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700">
          {icon}
        </span>
      </div>
    </GlassPanel>
  );
}

function WithdrawalRow({ item }: { item: OperatorWithdrawal }) {
  const StatusIcon =
    item.status === "confirmed"
      ? CheckCircle2
      : item.status === "rejected"
        ? XCircle
        : Clock3;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-base font-semibold text-neutral-950">
            {formatPrice(item.amount)}
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-500">
            {item.cardHolderName} · **** {item.cardNumber.slice(-4)}
          </p>
          <p className="mt-1 text-xs font-semibold text-neutral-400">
            {dateText(item.requestedAt)}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[item.status]}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {statusLabel[item.status]}
        </span>
      </div>
      {item.rejectedReason && (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {item.rejectedReason}
        </p>
      )}
    </div>
  );
}

const transactionLabel: Record<OperatorWalletTransaction["type"], string> = {
  order_fee: "Operator haqi",
  order_fee_reapply: "Operator haqi",
  order_fee_reversal: "Operator haqi qaytarildi",
  withdrawal_request: "Pul yechish so'rovi",
  withdrawal_reject: "Rad etilgan so'rov qaytarildi",
  admin_prepayment: "Oldindan to'lov",
};

function TransactionRow({ item }: { item: OperatorWalletTransaction }) {
  const isCredit = item.direction === "credit";
  return (
    <div className="rounded-xl border border-blue-100 bg-white/85 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-950">
            {transactionLabel[item.type]}
          </p>
          {item.orderNumber && (
            <p className="mt-1 w-fit rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
              Buyurtma: {item.orderNumber}
            </p>
          )}
          <p className="mt-1 text-xs font-medium text-neutral-500">
            {item.note || item.description || "-"}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-400">
            {dateText(item.createdAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-sm font-semibold ${
              isCredit ? "text-cyan-700" : "text-rose-700"
            }`}
          >
            {isCredit ? "+" : "-"}
            {formatPrice(item.amount)}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-500">
            {item.balanceAfter < 0
              ? `${formatPrice(Math.abs(item.balanceAfter))} qarz`
              : `${formatPrice(item.balanceAfter)} qoldiq`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const walletQuery = useOperatorWallet();
  const withdrawalsQuery = useOperatorWithdrawals();
  const transactionsQuery = useOperatorTransactions();
  const createWithdrawal = useCreateOperatorWithdrawal();
  const wallet = walletQuery.data;
  const walletBalance = wallet?.balance ?? 0;
  const debtAmount = wallet?.debtAmount ?? Math.max(-walletBalance, 0);
  const withdrawableBalance = Math.max(walletBalance, 0);
  const withdrawals = withdrawalsQuery.data ?? [];
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const transactions = useMemo(
    () => transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [transactionsQuery.data?.pages],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawalForm>({
    resolver: yupResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      cardNumber: "",
      cardHolderName: "",
    },
  });

  async function submit(values: WithdrawalForm) {
    await createWithdrawal.mutateAsync({
      amount: Math.round(values.amount),
      cardNumber: values.cardNumber,
      cardHolderName: values.cardHolderName,
    });
    reset({ amount: 0, cardNumber: "", cardHolderName: "" });
  }

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (
        first?.isIntersecting &&
        transactionsQuery.hasNextPage &&
        !transactionsQuery.isFetchingNextPage
      ) {
        void transactionsQuery.fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [transactionsQuery]);

  return (
    <div className="space-y-4">
      <GlassPanel className="bg-gradient-to-r from-white/85 via-blue-50/80 to-cyan-50/80 p-4 sm:p-5">
        <h1 className="text-lg font-semibold text-neutral-950">Hamyon</h1>
        <p className="mt-1 text-sm font-medium text-neutral-500">
          Tasdiqlangan buyurtmalardan hisoblangan operator haqi va pul yechish
          so&apos;rovlari.
        </p>
      </GlassPanel>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={debtAmount > 0 ? "Operator qarzi" : "Mavjud balans"}
          value={formatPrice(debtAmount > 0 ? debtAmount : walletBalance)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label={`Kutilayotgan${
            wallet?.pendingFeeOrderCount
              ? ` (${wallet.pendingFeeOrderCount} ta)`
              : ""
          }`}
          value={formatPrice(wallet?.pendingFeeAmount ?? 0)}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label="Jami topildi"
          value={formatPrice(wallet?.totalEarned ?? 0)}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Jami chiqarildi"
          value={formatPrice(wallet?.totalWithdrawn ?? 0)}
          icon={<ArrowDownToLine className="h-5 w-5" />}
        />
        <StatCard
          label="Oldindan to'lov"
          value={formatPrice(wallet?.totalPrepaid ?? 0)}
          icon={<HandCoins className="h-5 w-5" />}
        />
      </section>

      {debtAmount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">
          Oldindan to&apos;lov sababli {formatPrice(debtAmount)} qarz mavjud.
          Keyingi operator haqlari avval ushbu qarzni avtomatik qoplaydi.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-700" />
            <h2 className="text-base font-semibold text-neutral-950">
              Pul yechish so&apos;rovi
            </h2>
          </div>
          <form onSubmit={handleSubmit(submit)} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Summa
              </label>
              <input
                type="number"
                min={1}
                max={withdrawableBalance || undefined}
                {...register("amount")}
                className={`${inputClass} mt-1`}
                placeholder="100000"
              />
              <FieldError message={errors.amount?.message} />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Karta raqam
              </label>
              <input
                {...register("cardNumber")}
                className={`${inputClass} mt-1`}
                placeholder="8600 0000 0000 0000"
              />
              <FieldError message={errors.cardNumber?.message} />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Karta egasi
              </label>
              <input
                {...register("cardHolderName")}
                className={`${inputClass} mt-1`}
                placeholder="ISM FAMILIYA"
              />
              <FieldError message={errors.cardHolderName?.message} />
            </div>

            {createWithdrawal.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {errorText(createWithdrawal.error, "So'rov yuborilmadi")}
              </div>
            )}

            {debtAmount > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Qarz yopilmaguncha pul yechish so&apos;rovi yuborib bo&apos;lmaydi.
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={withdrawableBalance <= 0 || createWithdrawal.isPending}
              className="w-full"
            >
              {createWithdrawal.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              So&apos;rov yuborish
            </PrimaryButton>
          </form>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-neutral-950">
              So&apos;rovlar tarixi
            </h2>
            {withdrawalsQuery.isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
            )}
          </div>

          {walletQuery.error || withdrawalsQuery.error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {errorText(
                walletQuery.error ?? withdrawalsQuery.error,
                "Hamyon ma'lumotlari yuklanmadi",
              )}
            </div>
          ) : withdrawalsQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
            </div>
          ) : withdrawals.length ? (
            <div className="mt-4 space-y-3">
              {withdrawals.map((item) => (
                <WithdrawalRow key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <p className="font-semibold text-neutral-950">So&apos;rovlar yo&apos;q</p>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Pul yechish so&apos;rovlari shu yerda ko&apos;rinadi.
              </p>
            </div>
          )}
        </GlassPanel>
      </section>

      <GlassPanel className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-950">
            Tranzaksiyalar
          </h2>
          {transactionsQuery.isFetching && !transactionsQuery.isFetchingNextPage && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
          )}
        </div>

        {transactionsQuery.error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorText(transactionsQuery.error, "Tranzaksiyalar yuklanmadi")}
          </div>
        ) : transactions.length ? (
          <div className="mt-4 space-y-3">
            {transactions.map((item) => (
              <TransactionRow key={item._id} item={item} />
            ))}
            <div ref={loadMoreRef} className="flex h-12 items-center justify-center">
              {transactionsQuery.isFetchingNextPage ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
              ) : transactionsQuery.hasNextPage ? (
                <span className="text-xs font-medium text-neutral-500">
                  Yana yuklanmoqda...
                </span>
              ) : (
                <span className="text-xs font-medium text-neutral-400">
                  Barcha tranzaksiyalar yuklandi
                </span>
              )}
            </div>
          </div>
        ) : transactionsQuery.isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <p className="font-semibold text-neutral-950">Tranzaksiya yo&apos;q</p>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              Yetkazilgan buyurtmalar bo&apos;yicha operator haqi shu yerda
              ko&apos;rinadi.
            </p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
