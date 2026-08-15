"use client";

import Image from "next/image";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Bell,
  Camera,
  CheckCircle2,
  Loader2,
  LogOut,
  Phone,
  Save,
  Send,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import {
  FieldError,
  GlassPanel,
  PrimaryButton,
  inputClass,
} from "@/src/components/ui";
import {
  useOperatorLogout,
  useEnableOperatorNotifications,
  useOperatorProfile,
  useUpdateOperatorProfile,
  useUploadOperatorAvatar,
} from "@/src/hooks/useOperatorAuth";
import { errorText } from "@/src/lib/format";

const profileSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .min(2, "Kamida 2 ta belgi")
    .required("Ism majburiy"),
});

type ProfileForm = yup.InferType<typeof profileSchema>;

function initials(name?: string) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const profileQuery = useOperatorProfile();
  const updateProfile = useUpdateOperatorProfile();
  const uploadAvatar = useUploadOperatorAvatar();
  const logout = useOperatorLogout();
  const enableNotifications = useEnableOperatorNotifications();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const profile = profileQuery.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: yupResolver(profileSchema),
    defaultValues: { fullName: "" },
  });

  useEffect(() => {
    if (profile) reset({ fullName: profile.fullName });
  }, [profile, reset]);

  async function submit(values: ProfileForm) {
    await updateProfile.mutateAsync(values.fullName);
  }

  async function upload(file?: File) {
    if (!file) return;
    setAvatarError(null);
    try {
      await uploadAvatar.mutateAsync(file);
    } catch (error) {
      setAvatarError(errorText(error, "Avatar yuklanmadi"));
    }
  }

  return (
    <div className="space-y-4">
      <GlassPanel className="bg-gradient-to-r from-white/85 via-blue-50/80 to-cyan-50/80 p-4 sm:p-5">
        <h1 className="text-lg font-semibold text-neutral-950">Profil</h1>
        <p className="mt-1 text-sm font-semibold text-neutral-500">
          Ismingiz va avatar rasmingizni yangilang. Telefon raqam
          o&apos;zgarmaydi.
        </p>
      </GlassPanel>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <GlassPanel className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold">
                  {initials(profile?.fullName) || (
                    <UserRound className="h-9 w-9" />
                  )}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-base font-semibold text-neutral-950">
              {profile?.fullName ?? "Operator"}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-neutral-500">
              <Phone className="h-4 w-4" />
              {profile?.phoneNumber ?? "-"}
            </p>

            <label className="mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:border-cyan-200 hover:bg-cyan-50">
              {uploadAvatar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Avatar yuklash
              <input
                type="file"
                accept="image/*"
                disabled={uploadAvatar.isPending}
                className="hidden"
                onChange={(event) => upload(event.target.files?.[0])}
              />
            </label>
            {avatarError && (
              <p className="mt-3 text-sm font-bold text-red-600">
                {avatarError}
              </p>
            )}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                To&apos;liq ism
              </label>
              <input
                {...register("fullName")}
                className={`${inputClass} mt-1`}
                placeholder="Operator ismi"
              />
              <FieldError message={errors.fullName?.message} />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Telefon raqam
              </label>
              <input
                value={profile?.phoneNumber ?? ""}
                readOnly
                className={`${inputClass} mt-1 bg-neutral-50 text-neutral-500`}
              />
              <p className="mt-1 text-xs font-bold text-neutral-500">
                Telefon raqamni faqat super admin o&apos;zgartira oladi.
              </p>
            </div>

            {updateProfile.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {errorText(updateProfile.error, "Profil saqlanmadi")}
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={!isDirty || updateProfile.isPending}
              className="w-full sm:w-auto"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Saqlash
            </PrimaryButton>
            <button
              type="button"
              onClick={logout}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 lg:hidden"
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </button>
          </form>
        </GlassPanel>
      </section>

      <GlassPanel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-neutral-950">
                Telegram bildirishnomalari
              </h2>
              <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">
                Balans, operator bonusi va pul yechish holatlari bot orqali ham
                yuboriladi.
              </p>
              {profile?.telegramUsername && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-700">
                  <Send className="h-3.5 w-3.5" />@{profile.telegramUsername}
                </p>
              )}
            </div>
          </div>
          {profile?.telegramWriteAccess ? (
            <span className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Xabarlar yoqilgan
            </span>
          ) : (
            <button
              type="button"
              disabled={enableNotifications.isPending}
              onClick={() => enableNotifications.mutate()}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {enableNotifications.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Xabarlarni yoqish
            </button>
          )}
        </div>
        {enableNotifications.error && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            {errorText(enableNotifications.error, "Bildirishnomalar yoqilmadi")}
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
