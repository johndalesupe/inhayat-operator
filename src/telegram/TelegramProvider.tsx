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
  const safe = webApp.contentSafeAreaInset ?? webApp.safeAreaInset;
  if (!safe) return;
  const root = document.documentElement;
  root.style.setProperty("--tg-safe-top", `${safe.top}px`);
  root.style.setProperty("--tg-safe-right", `${safe.right}px`);
  root.style.setProperty("--tg-safe-bottom", `${safe.bottom}px`);
  root.style.setProperty("--tg-safe-left", `${safe.left}px`);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let connectedApp: TelegramWebApp | null = null;
    const updateInsets = () => {
      if (connectedApp) applyInsets(connectedApp);
    };
    const connect = () => {
      const app = window.Telegram?.WebApp ?? null;
      if (!app && attempts++ < 30) {
        window.setTimeout(connect, 100);
        return;
      }
      if (app) {
        connectedApp = app;
        app.ready();
        app.expand();
        app.enableClosingConfirmation?.();
        app.setHeaderColor?.("#f4f9ff");
        app.setBackgroundColor?.("#f4f9ff");
        app.setBottomBarColor?.("#ffffff");
        applyInsets(app);
        app.onEvent?.("safeAreaChanged", updateInsets);
        app.onEvent?.("contentSafeAreaChanged", updateInsets);
        setWebApp(app);
      }
      setReady(true);
    };
    connect();
    return () => {
      connectedApp?.offEvent?.("safeAreaChanged", updateInsets);
      connectedApp?.offEvent?.("contentSafeAreaChanged", updateInsets);
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
      initData: webApp?.initData ?? "",
      isTelegram: Boolean(webApp?.initData),
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
    [ready, webApp],
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
