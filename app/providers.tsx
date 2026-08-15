"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/src/store/store";
import { TelegramProvider } from "@/src/telegram/TelegramProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: "always",
            refetchOnReconnect: "always",
            retry: 1,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TelegramProvider>{children}</TelegramProvider>
      </QueryClientProvider>
    </Provider>
  );
}
