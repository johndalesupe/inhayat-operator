"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { Brand, WorkflowGraphic } from "@/src/components/WorkspaceDesign";
import { getToken } from "@/src/lib/api";
import { errorText } from "@/src/lib/format";
import { useRequestOtp, useVerifyOtp } from "@/src/hooks/useOperatorAuth";
import {
  FieldError,
  GlassPanel,
  PrimaryButton,
  inputClass,
} from "@/src/components/ui";
import { useTelegram } from "@/src/telegram/TelegramProvider";

const phoneSchema = yup.object({
  phoneNumber: yup
    .string()
    .trim()
    .matches(/^\+?998\d{9}$/, "+998901234567 formatida kiriting")
    .required("Telefon raqam kerak"),
});

const otpSchema = yup.object({
  code: yup
    .string()
    .trim()
    .matches(/^\d{4,8}$/, "SMS kod 4-8 ta raqam bo'lishi kerak")
    .required("SMS kod kerak"),
});

type PhoneForm = yup.InferType<typeof phoneSchema>;
type OtpForm = yup.InferType<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+998");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const telegram = useTelegram();

  const phoneForm = useForm<PhoneForm>({
    resolver: yupResolver(phoneSchema),
    defaultValues: { phoneNumber: "+998" },
  });
  const otpForm = useForm<OtpForm>({
    resolver: yupResolver(otpSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (getToken()) router.replace("/stream");
  }, [router]);

  const error = requestOtp.error ?? verifyOtp.error;

  if (!telegram.ready) {
    return (
      <main className="operator-stage login-stage flex min-h-dvh items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
      </main>
    );
  }

  if (!telegram.isTelegram) {
    return (
      <main className="operator-stage login-stage flex min-h-dvh items-center justify-center px-4 py-8">
        <GlassPanel className="login-card w-full max-w-[390px] p-6 text-center">
          <div className="mb-6 flex justify-center">
            <Brand />
          </div>
          <div className="flex justify-center">
            <WorkflowGraphic />
          </div>
          <h1 className="mt-4 text-lg font-bold">Telegram orqali oching</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Operator paneli faqat rasmiy Telegram bot ichidagi Mini App orqali
            ishlaydi.
          </p>
        </GlassPanel>
      </main>
    );
  }

  if (!telegram.initData) {
    return (
      <main className="operator-stage login-stage flex min-h-dvh items-center justify-center px-4 py-8">
        <GlassPanel className="login-card w-full max-w-[390px] p-6 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-700" />
          <h1 className="mt-4 text-base font-bold">
            Telegram sessiyasi ulanmoqda
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Xavfsiz kirish ma’lumoti olinmoqda. Oynani yopmang.
          </p>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="operator-stage login-stage flex min-h-dvh items-center justify-center px-3 py-5 text-neutral-950">
      <GlassPanel className="login-card w-full max-w-[420px] p-5 sm:p-7">
        <div className="mb-6">
          <Brand />
        </div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Xush kelibsiz.
        </h1>
        <p className="mb-5 text-xs text-slate-400">
          Mijozlarga yaqinroq. Natijalarga tezroq.
        </p>
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-blue-50/80 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-xs font-semibold">Xavfsiz operator kirishi</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              Telegram hisobingiz aniqlandi. Endi operator telefon raqamingizni
              SMS kod bilan tasdiqlang.
            </p>
          </div>
        </div>
        {!otpSent ? (
          <form
            className="space-y-4"
            onSubmit={phoneForm.handleSubmit(async (values) => {
              const response = await requestOtp.mutateAsync(values.phoneNumber);
              setPhoneNumber(response.phoneNumber);
              setDevOtp(response.devOtp ?? null);
              setOtpSent(true);
            })}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-neutral-700">
                Telefon raqam
              </span>
              <input
                {...phoneForm.register("phoneNumber")}
                placeholder="+998901234567"
                inputMode="tel"
                autoComplete="tel"
                className={`${inputClass} text-base`}
              />
              <FieldError
                message={phoneForm.formState.errors.phoneNumber?.message}
              />
            </label>

            <PrimaryButton
              type="submit"
              className="w-full"
              disabled={requestOtp.isPending}
            >
              {requestOtp.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Smartphone className="h-4 w-4" />
              SMS kod olish
            </PrimaryButton>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={otpForm.handleSubmit((values) =>
              verifyOtp.mutate({ phoneNumber, code: values.code }),
            )}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-neutral-700">
                SMS kod
              </span>
              <input
                {...otpForm.register("code")}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                className={`${inputClass} text-center text-base tracking-[0.28em]`}
              />
              <FieldError message={otpForm.formState.errors.code?.message} />
            </label>

            {devOtp && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                Dev OTP: {devOtp}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <PrimaryButton
                type="submit"
                disabled={verifyOtp.isPending}
                className="w-full"
              >
                {verifyOtp.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <ArrowRight size={15} /> Kirish
              </PrimaryButton>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  otpForm.reset();
                }}
                className="secondary-button inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold"
              >
                <ArrowLeft size={14} />
                Raqamni o&apos;zgartirish
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorText(error, "Kirish bajarilmadi")}
          </div>
        )}
      </GlassPanel>
    </main>
  );
}
