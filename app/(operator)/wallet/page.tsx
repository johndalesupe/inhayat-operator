"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpRight,
  TrendingUp,
  History,
  CheckCircle2,
  Clock3,
  CreditCard,
  HandCoins,
  Loader2,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { MetricCard, PageHeading } from "@/src/components/WorkspaceDesign";
import {
  BottomSheet,
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

const schema = yup.object({
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
type FormValues = yup.InferType<typeof schema>;
const statusLabel: Record<OperatorWithdrawalStatus, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlandi",
  rejected: "Rad etildi",
};
const transactionLabel: Record<OperatorWalletTransaction["type"], string> = {
  order_fee: "Operator haqi",
  order_fee_reapply: "Operator haqi",
  order_fee_reversal: "Haq qaytarildi",
  withdrawal_request: "Yechish so'rovi",
  withdrawal_reject: "So'rov qaytarildi",
  admin_prepayment: "Oldindan to'lov",
};

function dateText(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("uz-UZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
}

function TransactionRow({ item }: { item: OperatorWalletTransaction }) {
  const credit = item.direction === "credit";
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl px-2 py-3 even:bg-[#f8f9fc]">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${credit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
      >
        {credit ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {transactionLabel[item.type]}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold text-slate-500">
          {item.orderNumber ? `${item.orderNumber} · ` : ""}
          {item.note || item.description || "-"}
        </p>
        <p className="mt-1 text-[10px] font-semibold text-slate-400">
          {dateText(item.createdAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`text-sm font-bold ${credit ? "text-emerald-700" : "text-rose-700"}`}
        >
          {credit ? "+" : "-"}
          {formatPrice(item.amount)}
        </p>
        <p className="mt-1 text-[10px] font-bold text-slate-400">
          {item.balanceAfter < 0
            ? `${formatPrice(Math.abs(item.balanceAfter))} qarz`
            : `${formatPrice(item.balanceAfter)} qoldiq`}
        </p>
      </div>
    </div>
  );
}

function WithdrawalRow({ item }: { item: OperatorWithdrawal }) {
  const Icon =
    item.status === "confirmed"
      ? CheckCircle2
      : item.status === "rejected"
        ? XCircle
        : Clock3;
  return (
    <div className="rounded-xl px-2 py-3 even:bg-[#f8f9fc]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {formatPrice(item.amount)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {item.cardHolderName} · •••• {item.cardNumber.slice(-4)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            {dateText(item.requestedAt)}
          </p>
        </div>
        <span
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${item.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : item.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}
        >
          <Icon className="h-3 w-3" />
          {statusLabel[item.status]}
        </span>
      </div>
      {item.rejectedReason ? (
        <p className="mt-2 rounded-xl bg-rose-50 p-2 text-[11px] font-bold text-rose-700">
          {item.rejectedReason}
        </p>
      ) : null}
    </div>
  );
}

export default function WalletPage() {
  const walletQuery = useOperatorWallet();
  const withdrawalsQuery = useOperatorWithdrawals();
  const transactionsQuery = useOperatorTransactions();
  const createWithdrawal = useCreateOperatorWithdrawal();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<"transactions" | "withdrawals">(
    "transactions",
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const wallet = walletQuery.data;
  const balance = wallet?.balance ?? 0;
  const debt = wallet?.debtAmount ?? Math.max(-balance, 0);
  const withdrawals = withdrawalsQuery.data ?? [];
  const transactions = useMemo(
    () => transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [transactionsQuery.data?.pages],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { amount: 0, cardNumber: "", cardHolderName: "" },
  });

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (
        entry?.isIntersecting &&
        transactionsQuery.hasNextPage &&
        !transactionsQuery.isFetchingNextPage
      )
        void transactionsQuery.fetchNextPage();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [transactionsQuery]);
  async function submit(values: FormValues) {
    try {
      await createWithdrawal.mutateAsync({
        amount: Math.round(values.amount),
        cardNumber: values.cardNumber,
        cardHolderName: values.cardHolderName,
      });
      reset();
      setSheetOpen(false);
    } catch {
      /* The mutation error is displayed in the sheet. */
    }
  }

  return (
    <div className="space-y-3.5">
      <PageHeading
        eyebrow="Moliyaviy hisob"
        title="Mening hamyonim"
        description="Mehnatingiz natijasi. Barcha kirim va chiqimlar bir joyda."
      />
      <div className="grid items-stretch gap-3 lg:grid-cols-[1.1fr_1fr]">
        <section className="wallet-hero">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-white/80">
                <Wallet size={16} />
                {debt > 0 ? "Operator qarzi" : "Mavjud balans"}
              </span>
              <span className="text-[10px] font-semibold tracking-[.15em] text-white/60">
                INHAYAT
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-[-1px] tabular-nums">
              {walletQuery.isLoading
                ? "\u2014"
                : formatPrice(debt > 0 ? debt : balance)}
            </p>
            <p className="mt-1.5 text-[11px] text-white/65">
              {debt > 0
                ? "Kelgusi daromaddan qoplanadi"
                : "Yechib olish uchun mavjud mablag'"}
            </p>
            <button
              type="button"
              disabled={balance <= 0 || walletQuery.isLoading}
              onClick={() => setSheetOpen(true)}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-[#6b58d0] hover:bg-white/90 disabled:opacity-40"
            >
              <ArrowUpRight size={15} />
              Pul yechish
            </button>
          </div>
        </section>
        <section className="grid grid-cols-2 gap-2.5">
          <MetricCard
            icon={Clock3}
            label="Kutilayotgan haq"
            tone="amber"
            value={
              <span className="text-sm">
                {formatPrice(wallet?.pendingFeeAmount ?? 0)}
              </span>
            }
            detail={`${wallet?.pendingFeeOrderCount ?? 0} ta buyurtma`}
          />
          <MetricCard
            icon={TrendingUp}
            label="Jami topildi"
            tone="mint"
            value={
              <span className="text-sm">
                {formatPrice(wallet?.totalEarned ?? 0)}
              </span>
            }
          />
          <MetricCard
            icon={ArrowDownToLine}
            label="Chiqarildi"
            value={
              <span className="text-sm">
                {formatPrice(wallet?.totalWithdrawn ?? 0)}
              </span>
            }
          />
          <MetricCard
            icon={HandCoins}
            label="Oldindan to'lov"
            value={
              <span className="text-sm">
                {formatPrice(wallet?.totalPrepaid ?? 0)}
              </span>
            }
          />
        </section>
      </div>
      {debt > 0 ? (
        <div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
          <HandCoins className="mr-1 inline h-4 w-4" />
          {formatPrice(debt)} qarz keyingi operator haqlaridan avtomatik
          qoplanadi.
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <h2 className="section-title flex items-center gap-2">
          <History size={16} className="text-blue-600" />
          Hisob tarixi
        </h2>
        <div className="flex rounded-xl bg-white p-1">
          <button
            type="button"
            onClick={() => setView("transactions")}
            aria-pressed={view === "transactions"}
            className="filter-chip"
          >
            Tranzaksiyalar
          </button>
          <button
            type="button"
            onClick={() => setView("withdrawals")}
            aria-pressed={view === "withdrawals"}
            className="filter-chip"
          >
            So&apos;rovlar &middot; {withdrawals.length}
          </button>
        </div>
      </div>
      <GlassPanel className="overflow-hidden p-3">
        {(view === "transactions" && transactionsQuery.isLoading) ||
        (view === "withdrawals" && withdrawalsQuery.isLoading) ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2
              className="animate-spin text-blue-600"
              size={22}
              aria-label="Hamyon yuklanmoqda"
            />
          </div>
        ) : walletQuery.error ||
          withdrawalsQuery.error ||
          transactionsQuery.error ? (
          <p className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
            {errorText(
              walletQuery.error ??
                withdrawalsQuery.error ??
                transactionsQuery.error,
              "Hamyon yuklanmadi",
            )}
          </p>
        ) : view === "transactions" ? (
          transactions.length ? (
            <>
              {transactions.map((item) => (
                <TransactionRow key={item._id} item={item} />
              ))}
              <div
                ref={loadMoreRef}
                className="flex h-10 items-center justify-center"
              >
                {transactionsQuery.isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">
                    {transactionsQuery.hasNextPage
                      ? "Yana yuklanmoqda"
                      : "Barcha tranzaksiyalar"}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="p-6 text-center text-xs font-bold text-slate-500">
              Tranzaksiyalar hozircha yo&apos;q
            </p>
          )
        ) : withdrawals.length ? (
          withdrawals.map((item) => (
            <WithdrawalRow key={item._id} item={item} />
          ))
        ) : (
          <p className="p-6 text-center text-xs font-bold text-slate-500">
            So&apos;rovlar hozircha yo&apos;q
          </p>
        )}
      </GlassPanel>
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Pul yechish"
        description={`Yechish mumkin: ${formatPrice(Math.max(balance, 0))}`}
      >
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div>
            <label
              htmlFor="withdrawal-amount"
              className="text-xs font-bold text-slate-600"
            >
              Summa
            </label>
            <input
              id="withdrawal-amount"
              type="number"
              min={1}
              max={Math.max(balance, 0) || undefined}
              {...register("amount")}
              className={`${inputClass} mt-1`}
              placeholder="100000"
            />
            <FieldError message={errors.amount?.message} />
          </div>
          <div>
            <label
              htmlFor="withdrawal-card"
              className="text-xs font-bold text-slate-600"
            >
              Karta raqami
            </label>
            <input
              id="withdrawal-card"
              inputMode="numeric"
              {...register("cardNumber")}
              className={`${inputClass} mt-1`}
              placeholder="8600 0000 0000 0000"
            />
            <FieldError message={errors.cardNumber?.message} />
          </div>
          <div>
            <label
              htmlFor="withdrawal-holder"
              className="text-xs font-bold text-slate-600"
            >
              Karta egasi
            </label>
            <input
              id="withdrawal-holder"
              {...register("cardHolderName")}
              className={`${inputClass} mt-1`}
              placeholder="ISM FAMILIYA"
            />
            <FieldError message={errors.cardHolderName?.message} />
          </div>
          {createWithdrawal.error ? (
            <p className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
              {errorText(createWithdrawal.error, "So'rov yuborilmadi")}
            </p>
          ) : null}
          <PrimaryButton
            type="submit"
            disabled={balance <= 0 || createWithdrawal.isPending}
            className="w-full"
          >
            {createWithdrawal.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            So&apos;rov yuborish
          </PrimaryButton>
        </form>
      </BottomSheet>
    </div>
  );
}
