"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  Headphones,
  LayoutDashboard,
  Loader2,
  LogOut,
  Radio,
  UserRound,
  Wallet,
} from "lucide-react";
import { clearToken, getToken } from "../lib/api";
import { useOperatorLogout, useOperatorProfile } from "../hooks/useOperatorAuth";
import { useProcessOrders, useStreamOrders } from "../hooks/useOperatorOrders";
import { useOperatorRealtime } from "../hooks/useOperatorRealtime";
import { clearSession, hydrateAuth, setOperator } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useTelegram } from "../telegram/TelegramProvider";

const navItems = [
  { href: "/stream", label: "Oqim", icon: Radio },
  { href: "/process", label: "Jarayon", icon: LayoutDashboard },
  { href: "/wallet", label: "Hamyon", icon: Wallet },
  { href: "/profile", label: "Profil", icon: UserRound },
];

function initials(name?: string | null) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function OperatorShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useOperatorLogout();
  const { token, hydrated, operator } = useAppSelector((state) => state.auth);
  const profileQuery = useOperatorProfile();
  const streamQuery = useStreamOrders();
  const processQuery = useProcessOrders();
  const activeOperator = operator ?? profileQuery.data ?? null;
  const streamCount = streamQuery.data?.items.length ?? 0;
  const processCount = processQuery.data?.items.length ?? 0;
  const streamOpen = streamQuery.data?.settings.stream.isOpen ?? false;
  const telegram = useTelegram();

  const realtimeNotice = useOperatorRealtime(token);

  useEffect(() => {
    dispatch(hydrateAuth(getToken()));
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/login");
  }, [hydrated, router, token]);

  useEffect(() => {
    if (!telegram.ready || telegram.isTelegram) return;
    clearToken();
    dispatch(clearSession());
    router.replace("/login");
  }, [dispatch, router, telegram.isTelegram, telegram.ready]);

  useEffect(() => {
    if (profileQuery.data) dispatch(setOperator(profileQuery.data));
  }, [dispatch, profileQuery.data]);

  useEffect(() => {
    if (!telegram.webApp || telegram.webApp.isFullscreen) return;
    const request = () => telegram.webApp?.requestFullscreen?.();
    window.addEventListener("pointerdown", request, { once: true });
    return () => window.removeEventListener("pointerdown", request);
  }, [telegram.webApp]);

  useEffect(() => {
    if (!profileQuery.isError) return;
    clearToken();
    dispatch(clearSession());
    router.replace("/login");
  }, [dispatch, profileQuery.isError, router]);

  if (!hydrated || !token || profileQuery.isLoading) {
    return (
      <main className="operator-stage flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
      </main>
    );
  }

  const navCount = (href: string) => {
    if (href === "/stream") return streamCount;
    if (href === "/process") return processCount;
    return null;
  };

  return (
    <main className="operator-stage min-h-dvh text-neutral-950">
      {realtimeNotice ? (
        <div
          role="status"
          className={`fixed left-[calc(.75rem+var(--tg-safe-left))] right-[calc(.75rem+var(--tg-safe-right))] top-[calc(.5rem+var(--tg-safe-top))] z-[70] mx-auto max-w-md rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur-xl ${
            realtimeNotice.tone === "warning"
              ? "border-amber-200 bg-amber-50/95 text-amber-950"
              : "border-emerald-200 bg-emerald-50/95 text-emerald-950"
          }`}
        >
          {realtimeNotice.message}
        </div>
      ) : null}
      <aside className="fixed inset-y-0 left-0 hidden w-[304px] overflow-hidden border-r border-blue-100/80 bg-white/75 backdrop-blur-2xl lg:block">
        <div className="flex h-dvh min-h-0 flex-col p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/80 p-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-500 text-white">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
                INHAYAT
              </p>
              <h1 className="text-base font-semibold text-neutral-950">
                Operator paneli
              </h1>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-white/90 to-blue-50/80 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-white text-sm font-semibold text-blue-700">
              {activeOperator?.avatarUrl ? (
                <Image
                  src={activeOperator.avatarUrl}
                  alt={activeOperator.fullName}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(activeOperator?.fullName) || (
                  <UserRound className="h-5 w-5" />
                )
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-950">
                {activeOperator?.fullName}
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-neutral-500">
                {activeOperator?.phoneNumber}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-blue-100 bg-white/75 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-500">
                Oqim
              </p>
              <p className="mt-1 text-lg font-semibold text-blue-950">
                {streamCount}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/75 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-500">
                Jarayon
              </p>
              <p className="mt-1 text-lg font-semibold text-blue-950">
                {processCount}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-blue-100 bg-white/70 p-3">
            <div className="flex items-center justify-between rounded-xl border border-blue-50 bg-white/80 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Ish holati
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  streamOpen
                    ? "bg-cyan-100 text-cyan-800"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {streamOpen ? "Ochiq" : "Yopiq"}
              </span>
            </div>
          </div>

          <nav className="mt-4 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              const count = navCount(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                className={`flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition ${
                    active
                      ? "border-blue-200 bg-gradient-to-r from-blue-700 to-cyan-500 text-white"
                      : "border-blue-50 bg-white/65 text-neutral-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-blue-950"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {count !== null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      <section className="min-w-0 flex-1 lg:ml-[304px]">
        <div className="mx-auto max-w-6xl px-3 py-3 pb-[calc(6.5rem+var(--tg-safe-bottom))] sm:px-6 lg:py-6 lg:pb-6">
          {children}
        </div>
      </section>

      <nav className="fixed inset-x-[calc(.5rem+var(--tg-safe-left))] bottom-[calc(.5rem+var(--tg-safe-bottom))] z-50 grid grid-cols-4 gap-1 rounded-[1.25rem] border border-blue-100/80 bg-white/94 p-1.5 backdrop-blur-2xl lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const count = navCount(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition ${
                active
                  ? "bg-gradient-to-br from-blue-700 to-cyan-500 text-white"
                  : "text-neutral-600 hover:bg-cyan-50 hover:text-blue-950"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {count !== null && count > 0 && (
                <span
                  className={`absolute right-2 top-1 rounded-full px-1.5 text-[10px] ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
