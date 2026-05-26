"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { getToken } from "@/src/lib/api";
import { errorText } from "@/src/lib/format";
import { useRequestOtp, useVerifyOtp } from "@/src/hooks/useOperatorAuth";
import {
  FieldError,
  GlassPanel,
  PrimaryButton,
  inputClass,
} from "@/src/components/ui";

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

  return (
    <main className="operator-stage flex min-h-screen items-center justify-center px-4 py-8 text-neutral-950">
      <GlassPanel className="w-full max-w-[430px] p-6">
        <h1 className="mb-6 text-center text-xl font-semibold">Kirish</h1>
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
                  className={inputClass}
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
                  className={`${inputClass} tracking-[0.28em]`}
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
                  Tasdiqlash
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    otpForm.reset();
                  }}
                  className="h-11 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                >
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
