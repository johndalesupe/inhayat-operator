"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Insets = { top: number; right: number; bottom: number; left: number };
type TelegramWebApp = {
  initData: string;
  platform?: string;
  version?: string;
  isFullscreen?: boolean;
  safeAreaInset?: Insets;
  contentSafeAreaInset?: Insets;
  ready(): void;
  expand(): void;
  requestFullscreen?: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  requestWriteAccess?: (callback?: (allowed: boolean) => void) => void;
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
  BackButton?: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  HapticFeedback?: {
    impactOccurred(style: "light" | "medium" | "heavy"): void;
    notificationOccurred(type: "success" | "warning" | "error"): void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

type TelegramContextValue = {
  webApp: TelegramWebApp | null;
  initData: string;
  isTelegram: boolean;
  ready: boolean;
  requestNotifications: () => Promise<boolean>;
  haptic: (type?: "light" | "success" | "warning" | "error") => void;
};

const TelegramContext = createContext<TelegramContextValue | null>(null);

function applyInsets(webApp: TelegramWebApp) {
  const safe = webApp.safeAreaInset ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const content = webApp.contentSafeAreaInset ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  const missingInsetApi = !webApp.safeAreaInset && !webApp.contentSafeAreaInset;
  const mobileTopGuard = window.matchMedia("(max-width: 768px)").matches ? 52 : 0;
  const root = document.documentElement;
  root.style.setProperty(
    "--tg-safe-top",
    `${Math.max(safe.top + content.top, mobileTopGuard, missingInsetApi ? 52 : 0)}px`,
  );
  root.style.setProperty(
    "--tg-safe-right",
    `${safe.right + content.right}px`,
  );
  root.style.setProperty(
    "--tg-safe-bottom",
    `${safe.bottom + content.bottom}px`,
  );
  root.style.setProperty(
    "--tg-safe-left",
    `${safe.left + content.left}px`,
  );
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [initData, setInitData] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let initDataAttempts = 0;
    let disposed = false;
    let retryTimer: number | undefined;
    let connectedApp: TelegramWebApp | null = null;
    let retryFullscreen: (() => void) | null = null;
    const updateInsets = () => {
      if (connectedApp) applyInsets(connectedApp);
    };
    const syncSession = () => {
      if (disposed || !connectedApp) return;
      const nextInitData = connectedApp.initData?.trim() ?? "";
      setInitData(nextInitData);
      setReady(true);
      if (!nextInitData && initDataAttempts++ < 100) {
        retryTimer = window.setTimeout(syncSession, 100);
      }
    };
    const connect = () => {
      if (disposed) return;
      const app = window.Telegram?.WebApp ?? null;
      if (!app && attempts++ < 100) {
        retryTimer = window.setTimeout(connect, 100);
        return;
      }
      if (app) {
        connectedApp = app;
        app.ready();
        app.expand();
        app.enableClosingConfirmation?.();
        app.setHeaderColor?.("#f5f7fb");
        app.setBackgroundColor?.("#f5f7fb");
        app.setBottomBarColor?.("#ffffff");
        try {
          app.requestFullscreen?.();
        } catch {
          // Older clients can require the next trusted pointer event.
        }
        applyInsets(app);
        app.onEvent?.("safeAreaChanged", updateInsets);
        app.onEvent?.("contentSafeAreaChanged", updateInsets);
        app.onEvent?.("fullscreenChanged", updateInsets);
        retryFullscreen = () => {
          if (app.isFullscreen) return;
          try {
            app.requestFullscreen?.();
          } catch {
            // The current Telegram client does not support fullscreen.
          }
        };
        window.addEventListener("pointerdown", retryFullscreen, { once: true });
        setWebApp(app);
        syncSession();
      } else {
        setReady(true);
      }
    };
    const refresh = () => {
      if (connectedApp) syncSession();
      else connect();
    };
    window.addEventListener("telegram-web-app-ready", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    connect();
    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      window.removeEventListener("telegram-web-app-ready", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
      connectedApp?.offEvent?.("safeAreaChanged", updateInsets);
      connectedApp?.offEvent?.("contentSafeAreaChanged", updateInsets);
      connectedApp?.offEvent?.("fullscreenChanged", updateInsets);
      if (retryFullscreen) window.removeEventListener("pointerdown", retryFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!webApp?.BackButton) return;
    const root = pathname === "/stream" || pathname === "/login";
    const goBack = () => router.back();
    if (root) webApp.BackButton.hide();
    else {
      webApp.BackButton.show();
      webApp.BackButton.onClick(goBack);
    }
    return () => webApp.BackButton?.offClick(goBack);
  }, [pathname, router, webApp]);

  const value = useMemo<TelegramContextValue>(
    () => ({
      webApp,
      initData,
      isTelegram: Boolean(webApp),
      ready,
      requestNotifications: () =>
        new Promise<boolean>((resolve) => {
          if (!webApp?.requestWriteAccess) return resolve(false);
          let settled = false;
          const finish = (allowed: boolean) => {
            if (settled) return;
            settled = true;
            resolve(allowed);
          };
          window.setTimeout(() => finish(false), 8_000);
          webApp.requestWriteAccess((allowed) => finish(allowed));
        }),
      haptic: (type = "light") => {
        if (type === "light") webApp?.HapticFeedback?.impactOccurred("light");
        else webApp?.HapticFeedback?.notificationOccurred(type);
      },
    }),
    [initData, ready, webApp],
  );

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const value = useContext(TelegramContext);
  if (!value) throw new Error("useTelegram must be inside TelegramProvider");
  return value;
}
