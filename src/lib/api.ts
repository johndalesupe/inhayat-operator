import type {
  ApiResponse,
  CreateWithdrawalRequest,
  DeliveryCity,
  DeliveryRegion,
  OperatorOrder,
  OperatorProfile,
  OperatorSettings,
  OperatorWallet,
  OperatorWalletTransaction,
  OperatorWithdrawal,
  PaginatedData,
  ProcessResponse,
  StreamResponse,
} from "../types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

const TOKEN_KEY = "operator_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
) {
  const headers = new Headers(options.headers);
  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok || !payload?.success) {
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : "So'rov bajarilmadi";
    throw new Error(message);
  }

  return payload.data;
}

export const operatorApi = {
  requestOtp: (phoneNumber: string, initData: string) =>
    request<{ phoneNumber: string; expiresInSeconds: number; devOtp?: string }>(
      "/operator/auth/request-otp",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify({ phoneNumber, initData }),
      },
    ),

  verifyOtp: (phoneNumber: string, code: string, initData: string) =>
    request<{ accessToken: string; operator: OperatorProfile }>(
      "/operator/auth/verify-otp",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify({ phoneNumber, code, initData }),
      },
    ),

  profile: () => request<OperatorProfile>("/operator/auth/profile"),

  registerTelegramWriteAccess: () =>
    request<{ allowed: true }>("/operator/auth/telegram-write-access", {
      method: "POST",
    }),

  updateProfile: (body: { fullName: string }) =>
    request<OperatorProfile>("/operator/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<OperatorProfile>("/operator/profile/avatar", {
      method: "POST",
      body: form,
    });
  },

  settings: () => request<OperatorSettings>("/operator/settings"),

  regions: () => request<DeliveryRegion[]>("/operator/locations/regions"),

  cities: (regionId?: string) => {
    const query = regionId ? `?regionId=${encodeURIComponent(regionId)}` : "";
    return request<DeliveryCity[]>(`/operator/locations/cities${query}`);
  },

  wallet: () => request<OperatorWallet>("/operator/wallet"),

  withdrawals: () =>
    request<OperatorWithdrawal[]>("/operator/wallet/withdrawals"),

  transactions: (page = 1, limit = 10) =>
    request<PaginatedData<OperatorWalletTransaction>>(
      `/operator/wallet/transactions?page=${page}&limit=${limit}`,
    ),

  createWithdrawal: (body: CreateWithdrawalRequest) =>
    request<OperatorWithdrawal>("/operator/wallet/withdrawals", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  stream: () => request<StreamResponse>("/operator/orders/stream"),

  processOrders: () => request<ProcessResponse>("/operator/orders/process"),

  orderDetails: (id: string) =>
    request<OperatorOrder>(`/operator/orders/${id}`),

  acceptOrder: (id: string) =>
    request<OperatorOrder>(`/operator/orders/${id}/accept`, {
      method: "POST",
    }),

  updateOrder: (
    id: string,
    body: {
      deliveryType?: NonNullable<OperatorOrder["delivery"]>["type"];
      regionId?: string;
      cityId?: string;
      address?: string;
      notes?: string;
      items?: Array<{ numericId: number; quantity: number }>;
    },
  ) =>
    request<OperatorOrder>(`/operator/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  confirmOrder: (id: string, notes?: string) =>
    request<OperatorOrder>(`/operator/orders/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  callbackLaterOrder: (id: string, notes?: string) =>
    request<OperatorOrder>(`/operator/orders/${id}/callback-later`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  cancelOrder: (id: string, cancelReason?: string) =>
    request<OperatorOrder>(`/operator/orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancelReason }),
    }),
};
