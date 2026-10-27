"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Headset,
  LayoutGrid,
  Loader2,
  LogOut,
  Radio,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  useOperatorLogout,
  useOperatorProfile,
} from "../hooks/useOperatorAuth";
import { useProcessOrders, useStreamOrders } from "../hooks/useOperatorOrders";
import { useOperatorRealtime } from "../hooks/useOperatorRealtime";
import { clearToken, getToken } from "../lib/api";
import { clearSession, hydrateAuth, setOperator } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useTelegram } from "../telegram/TelegramProvider";
import { Brand } from "./WorkspaceDesign";

const navItems = [
  { href: "/stream", label: "Oqim", icon: Radio },
  { href: "/process", label: "Jarayon", icon: LayoutGrid },
  { href: "/wallet", label: "Hamyon", icon: Wallet },
  { href: "/profile", label: "Hisob", icon: UserRound },
] as const;

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
  const telegram = useTelegram();
  const { token, hydrated, operator } = useAppSelector((state) => state.auth);
  const profileQuery = useOperatorProfile();
  const streamQuery = useStreamOrders();
  const processQuery = useProcessOrders();
  const activeOperator = operator ?? profileQuery.data ?? null;
  const streamCount = streamQuery.data?.items.length ?? 0;
  const processCount = processQuery.data?.items.length ?? 0;
  const streamOpen = streamQuery.data?.settings.stream.isOpen ?? false;
  const realtimeNotice = useOperatorRealtime(token);
  const pendingCount =
    processQuery.data?.items.filter((order) => order.status === "pending")
      .length ?? 0;

  useEffect(() => {
    dispatch(hydrateAuth(getToken()));
  }, [dispatch]);
  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
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
    if (!profileQuery.isError) return;
    clearToken();
    dispatch(clearSession());
    router.replace("/login");
  }, [dispatch, profileQuery.isError, router]);

  if (!hydrated || !token || profileQuery.isLoading) {
    return (
      <main className="operator-stage flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
      </main>
    );
  }

  const navCount = (href: string) =>
    href === "/stream"
      ? streamCount
      : href === "/process"
        ? processCount
        : null;
  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/stream" && pathname.startsWith(`${href}/`));

  return (
    <main className="operator-stage">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:p-3"
      >
        Asosiy tarkibga o&apos;tish
      </a>
      {realtimeNotice && (
        <div
          role="status"
          className={`fixed left-3 right-3 top-[calc(.5rem+var(--tg-safe-top))] z-[80] mx-auto max-w-md rounded-xl px-4 py-3 text-xs font-semibold shadow-lg ${realtimeNotice.tone === "warning" ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`}
        >
          {realtimeNotice.message}
        </div>
      )}
      <aside className="workspace-sidebar">
        <Link
          href="/stream"
          aria-label="Inhayat ? buyurtmalar oqimi"
          className="px-2"
        >
          <Brand />
        </Link>
        <p className="eyebrow mb-3 mt-9 px-3">Ish maydoni</p>
        <nav aria-label="Asosiy navigatsiya" className="space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="workspace-nav"
              data-active={isActive(href)}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
              {navCount(href) !== null && (
                <span className="nav-count">{navCount(href)}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-6 rounded-2xl bg-[#f8f7fd] p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${streamOpen ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            <p className="text-[11px] font-semibold">
              {streamOpen ? "Oqim ochiq" : "Oqim yopiq"}
            </p>
          </div>
          <p className="text-[11px] leading-5 text-slate-500">
            {pendingCount > 0
              ? `${pendingCount} ta buyurtma tasdiqlashingizni kutmoqda.`
              : "Yangi buyurtmalarni oqimdan qabul qiling."}
          </p>
          <Link
            href="/stream"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700"
          >
            Oqimga o&apos;tish <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="mt-auto pt-8">
          <div className="mb-4 flex items-center gap-2 px-3 text-[10px] text-slate-400">
            <Headset size={14} />
            Har bir buyurtmaga e&apos;tibor.
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e9e3ff] text-xs font-bold text-blue-700">
              {activeOperator?.avatarUrl ? (
                <Image
                  src={activeOperator.avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(activeOperator?.fullName) || <UserRound size={16} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {activeOperator?.fullName}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">Operator</p>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex h-10 w-full items-center gap-2 px-3 text-[11px] font-medium text-slate-500 hover:text-rose-600"
          >
            <LogOut size={15} />
            Hisobdan chiqish
          </button>
        </div>
      </aside>
      <section className="workspace-main min-w-0">
        <div className="workspace-topbar">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-400 lg:flex">
            <span>Ish maydoni</span>
            <ChevronRight size={12} />
            <span className="font-medium text-slate-700">
              {navItems.find((item) => isActive(item.href))?.label ??
                "Buyurtma"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${streamOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${streamOpen ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              {streamOpen ? "Oqim ochiq" : "Oqim yopiq"}
            </span>
            <Link
              href="/profile"
              aria-label="Profilni ochish"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#e9e3ff] text-[10px] font-bold text-blue-700"
            >
              {activeOperator?.avatarUrl ? (
                <Image
                  src={activeOperator.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(activeOperator?.fullName) || <UserRound size={14} />
              )}
            </Link>
          </div>
        </div>
        <div id="workspace-content" className="workspace-content">
          {children}
        </div>
      </section>
      <nav aria-label="Mobil navigatsiya" className="workspace-bottomnav">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={isActive(href) ? 2.1 : 1.7} />
            {label}
            {(navCount(href) ?? 0) > 0 && (
              <span className="absolute left-[58%] top-0 rounded-full bg-blue-700 px-1 text-[8px] leading-3.5 text-white">
                {(navCount(href) ?? 0) > 99 ? "99+" : navCount(href)}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </main>
  );
}
