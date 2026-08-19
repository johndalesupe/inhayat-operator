"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Headphones, LayoutDashboard, Loader2, LogOut, Radio, UserRound, Wallet } from "lucide-react";
import { useOperatorLogout, useOperatorProfile } from "../hooks/useOperatorAuth";
import { useProcessOrders, useStreamOrders } from "../hooks/useOperatorOrders";
import { useOperatorRealtime } from "../hooks/useOperatorRealtime";
import { clearToken, getToken } from "../lib/api";
import { clearSession, hydrateAuth, setOperator } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useTelegram } from "../telegram/TelegramProvider";
import { LiveStreamStatus } from "./LiveStreamStatus";

const navItems = [
  { href: "/stream", label: "Oqim", icon: Radio },
  { href: "/process", label: "Jarayon", icon: LayoutDashboard },
  { href: "/wallet", label: "Hamyon", icon: Wallet },
  { href: "/profile", label: "Hisob", icon: UserRound },
] as const;

function initials(name?: string | null) {
  return (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
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
  const streamPage = pathname === "/stream";

  useEffect(() => { dispatch(hydrateAuth(getToken())); }, [dispatch]);
  useEffect(() => { if (hydrated && !token) router.replace("/login"); }, [hydrated, router, token]);
  useEffect(() => {
    if (!telegram.ready || telegram.isTelegram) return;
    clearToken();
    dispatch(clearSession());
    router.replace("/login");
  }, [dispatch, router, telegram.isTelegram, telegram.ready]);
  useEffect(() => { if (profileQuery.data) dispatch(setOperator(profileQuery.data)); }, [dispatch, profileQuery.data]);
  useEffect(() => {
    if (!profileQuery.isError) return;
    clearToken();
    dispatch(clearSession());
    router.replace("/login");
  }, [dispatch, profileQuery.isError, router]);

  if (!hydrated || !token || profileQuery.isLoading) {
    return <main className="operator-stage flex min-h-dvh items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-700" /></main>;
  }

  const navCount = (href: string) => href === "/stream" ? streamCount : href === "/process" ? processCount : null;
  const isActive = (href: string) => pathname === href || (href !== "/stream" && pathname.startsWith(`${href}/`));

  return (
    <main className="operator-stage min-h-dvh text-slate-950">
      {realtimeNotice ? (
        <div role="status" className={`fixed left-[calc(.75rem+var(--tg-safe-left))] right-[calc(.75rem+var(--tg-safe-right))] top-[calc(.5rem+var(--tg-safe-top))] z-[80] mx-auto max-w-md rounded-2xl px-3.5 py-3 text-xs font-bold ${realtimeNotice.tone === "warning" ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`}>
          {realtimeNotice.message}
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 hidden w-[264px] border-r border-slate-200 bg-white lg:block">
        <div className="flex h-dvh min-h-0 flex-col p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white"><Headphones className="h-[18px] w-[18px]" /></span>
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">INHAYAT</p><p className="text-sm font-extrabold text-slate-950">Operator</p></div>
          </div>
          <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-slate-100 p-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-xs font-extrabold text-blue-700">
              {activeOperator?.avatarUrl ? <Image src={activeOperator.avatarUrl} alt={activeOperator.fullName} width={40} height={40} unoptimized className="h-full w-full object-cover" /> : initials(activeOperator?.fullName) || <UserRound className="h-4 w-4" />}
            </div>
            <div className="min-w-0"><p className="truncate text-xs font-extrabold text-slate-950">{activeOperator?.fullName}</p><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{activeOperator?.phoneNumber}</p></div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-xl bg-blue-50 px-2.5 py-2"><p className="text-[10px] font-bold text-blue-600">Oqim</p><p className="mt-0.5 text-base font-black text-blue-950">{streamCount}</p></div>
            <div className="rounded-xl bg-slate-100 px-2.5 py-2"><p className="text-[10px] font-bold text-slate-500">Jarayon</p><p className="mt-0.5 text-base font-black text-slate-950">{processCount}</p></div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2.5 text-white"><span className="text-[10px] font-bold text-slate-400">Oqim holati</span><span className={`text-[10px] font-extrabold ${streamOpen ? "text-emerald-300" : "text-slate-300"}`}>{streamOpen ? "Jonli" : "Yopiq"}</span></div>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const count = navCount(item.href);
              return <Link key={item.href} href={item.href} className={`flex h-11 items-center justify-between rounded-xl px-3 text-xs font-bold transition ${active ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}><span className="flex items-center gap-2.5"><Icon className="h-4 w-4" />{item.label}</span>{count !== null ? <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15" : "bg-slate-100"}`}>{count}</span> : null}</Link>;
            })}
          </nav>
          <button type="button" onClick={logout} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 text-xs font-bold text-rose-700"><LogOut className="h-4 w-4" />Chiqish</button>
        </div>
      </aside>

      <section className="min-w-0 lg:ml-[264px]">
        <div className={`mx-auto max-w-6xl px-2.5 pt-2.5 sm:px-5 lg:px-6 lg:py-5 ${streamPage ? "pb-[calc(10.5rem+var(--tg-safe-bottom))] lg:pb-5" : "pb-[calc(5rem+var(--tg-safe-bottom))] lg:pb-5"}`}>{children}</div>
      </section>

      {streamPage ? (
        <div className="fixed bottom-[calc(4.45rem+var(--tg-safe-bottom))] left-[calc(.65rem+var(--tg-safe-left))] right-[calc(.65rem+var(--tg-safe-right))] z-50 lg:hidden">
          <LiveStreamStatus settings={streamQuery.data?.settings} count={streamCount} syncedAt={streamQuery.dataUpdatedAt} fetching={streamQuery.isFetching} compact onRefresh={() => void streamQuery.refetch()} />
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 bg-white/96 pb-[var(--tg-safe-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid h-[4.25rem] grid-cols-4 pl-[calc(.25rem+var(--tg-safe-left))] pr-[calc(.25rem+var(--tg-safe-right))]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const count = navCount(item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${active ? "text-blue-700" : "text-slate-500"}`}><span className={`flex h-8 min-w-10 items-center justify-center rounded-xl px-2 ${active ? "bg-blue-50" : ""}`}><Icon className="h-[18px] w-[18px]" /></span>{item.label}{count !== null && count > 0 ? <span className="absolute right-[18%] top-1.5 min-w-4 rounded-full bg-blue-700 px-1 text-center text-[9px] leading-4 text-white">{count > 99 ? "99+" : count}</span> : null}</Link>;
          })}
        </div>
      </nav>
    </main>
  );
}
