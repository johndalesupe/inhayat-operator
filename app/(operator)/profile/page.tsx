"use client";

import Image from "next/image";
import Link from "next/link";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Loader2,
  LogOut,
  Phone,
  PencilLine,
  ShieldCheck,
  Save,
  Send,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { PageHeading } from "@/src/components/WorkspaceDesign";
import {
  BottomSheet,
  FieldError,
  GlassPanel,
  PrimaryButton,
  inputClass,
} from "@/src/components/ui";
import {
  useEnableOperatorNotifications,
  useOperatorLogout,
  useOperatorProfile,
  useUpdateOperatorProfile,
  useUploadOperatorAvatar,
} from "@/src/hooks/useOperatorAuth";
import { errorText } from "@/src/lib/format";

const schema = yup.object({
  fullName: yup
    .string()
    .trim()
    .min(2, "Kamida 2 ta belgi")
    .required("Ism majburiy"),
});
type ProfileForm = yup.InferType<typeof schema>;

function initials(name?: string) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MenuButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f7f6fc]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">
          {description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </button>
  );
}

export default function ProfilePage() {
  const profileQuery = useOperatorProfile();
  const updateProfile = useUpdateOperatorProfile();
  const uploadAvatar = useUploadOperatorAvatar();
  const enableNotifications = useEnableOperatorNotifications();
  const logout = useOperatorLogout();
  const [editOpen, setEditOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const profile = profileQuery.data;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: yupResolver(schema),
    defaultValues: { fullName: "" },
  });

  useEffect(() => {
    if (profile) reset({ fullName: profile.fullName });
  }, [profile, reset]);
  async function submit(values: ProfileForm) {
    try {
      await updateProfile.mutateAsync(values.fullName);
      setEditOpen(false);
    } catch {
      /* The mutation error is displayed in the sheet. */
    }
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
    <div className="space-y-3.5">
      <PageHeading
        eyebrow="Shaxsiy sozlamalar"
        title="Mening profilim"
        description="Profil va bildirishnomalarni o'zingizga moslang."
      />
      <GlassPanel className="overflow-hidden p-0">
        <div className="profile-banner flex flex-wrap items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-lg font-bold text-blue-700 shadow-sm">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={64}
                height={64}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              initials(profile?.fullName) || <UserRound className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-950">
              {profile?.fullName ?? "Operator"}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              {profile?.phoneNumber ?? "-"}
            </p>
            {profile?.telegramUsername ? (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-700">
                <Send className="h-3 w-3" />@{profile.telegramUsername}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="primary-button inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold"
          >
            <PencilLine size={14} />
            Tahrirlash
          </button>
        </div>
      </GlassPanel>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <GlassPanel className="overflow-hidden p-2">
          <h2 className="section-title px-3 pb-2 pt-2">Hisob sozlamalari</h2>
          <Link
            href="/wallet"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-[#f7f6fc]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <WalletCards className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">
                Hamyon
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                Balans, tranzaksiya va yechib olish
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
          <MenuButton
            icon={<Bell className="h-4 w-4" />}
            title="Bildirishnomalar"
            description={
              profile?.telegramWriteAccess
                ? "Telegram xabarlari faol"
                : "Telegram xabarlarini faollashtiring"
            }
            onClick={() => setNotificationsOpen(true)}
          />
        </GlassPanel>
        <GlassPanel className="p-4">
          <h2 className="section-title flex items-center gap-2">
            <ShieldCheck size={17} className="text-emerald-600" />
            Hisob ma&apos;lumotlari
          </h2>
          <dl className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs">
              <dt className="text-slate-500">Kirish usuli</dt>
              <dd className="font-semibold">Telegram + SMS</dd>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs">
              <dt className="text-slate-500">Telegram xabarlari</dt>
              <dd
                className={`font-semibold ${profile?.telegramWriteAccess ? "text-emerald-600" : "text-amber-600"}`}
              >
                {profile?.telegramWriteAccess ? "Yoqilgan" : "O'chirilgan"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">
            Telefon raqamingizni yangilash uchun administratorga murojaat
            qiling.
          </p>
        </GlassPanel>
      </div>
      <button
        type="button"
        onClick={logout}
        className="flex h-10 items-center justify-center px-4 gap-2 rounded-xl bg-rose-50 text-sm font-semibold text-rose-700 active:bg-rose-100"
      >
        <LogOut className="h-4 w-4" />
        Hisobdan chiqish
      </button>

      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Profilni tahrirlash"
        description="Ism va avatarni yangilang. Telefon raqamni faqat admin o'zgartiradi."
      >
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-slate-700">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt="Avatar"
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-slate-800">
              <Camera className="h-4 w-4" />
              {uploadAvatar.isPending ? "Yuklanmoqda" : "Rasm tanlash"}
              <input
                type="file"
                accept="image/*"
                disabled={uploadAvatar.isPending}
                className="hidden"
                onChange={(event) => upload(event.target.files?.[0])}
              />
            </label>
          </div>
          {avatarError ? (
            <p className="text-xs font-bold text-rose-600">{avatarError}</p>
          ) : null}
          <div>
            <label
              htmlFor="profile-name"
              className="text-xs font-bold text-slate-600"
            >
              To&apos;liq ism
            </label>
            <input
              id="profile-name"
              {...register("fullName")}
              className={`${inputClass} mt-1`}
            />
            <FieldError message={errors.fullName?.message} />
          </div>
          <div>
            <label
              htmlFor="profile-phone"
              className="text-xs font-bold text-slate-600"
            >
              Telefon
            </label>
            <input
              id="profile-phone"
              readOnly
              value={profile?.phoneNumber ?? ""}
              className={`${inputClass} mt-1 bg-slate-50 text-slate-500`}
            />
          </div>
          {updateProfile.error ? (
            <p className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
              {errorText(updateProfile.error, "Profil saqlanmadi")}
            </p>
          ) : null}
          <PrimaryButton
            type="submit"
            disabled={!isDirty || updateProfile.isPending}
            className="w-full"
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Saqlash
          </PrimaryButton>
        </form>
      </BottomSheet>
      <BottomSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Telegram xabarlari"
        description="Balans, bonus va pul yechish holatlari bot orqali yuboriladi."
      >
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {profile?.telegramWriteAccess ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Bell className="h-5 w-5 text-slate-500" />
            )}
            {profile?.telegramWriteAccess
              ? "Xabarlar yoqilgan"
              : "Ruxsat talab qilinadi"}
          </p>
        </div>
        {!profile?.telegramWriteAccess ? (
          <PrimaryButton
            type="button"
            disabled={enableNotifications.isPending}
            onClick={() => enableNotifications.mutate()}
            className="mt-3 w-full"
          >
            {enableNotifications.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Xabarlarni yoqish
          </PrimaryButton>
        ) : null}
        {enableNotifications.error ? (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">
            {errorText(enableNotifications.error, "Bildirishnomalar yoqilmadi")}
          </p>
        ) : null}
      </BottomSheet>
    </div>
  );
}
