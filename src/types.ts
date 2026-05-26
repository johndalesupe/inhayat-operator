export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedData<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type OperatorProfile = {
  _id: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  isActive: boolean;
  isOnline?: boolean;
  lastSeenAt?: string | null;
};

export type OrderItem = {
  productId: string;
  numericId: number;
  name_uz: string;
  name_ru: string;
  quantity: number;
  originalPrice: number;
  discount: number;
  price: number;
  thumbnailUrl: string | null;
};

export type OrderDelivery = {
  regionId: string;
  regionNameUz: string;
  regionNameRu: string;
  cityId: string;
  cityNameUz: string;
  cityNameRu: string;
  type: "normal" | "express";
  price: number;
  address: string;
};

export type DeliveryRegion = {
  _id: string;
  name: {
    uz: string;
    ru: string;
  };
  normalizedName: string;
  isActive: boolean;
};

export type DeliveryCityPrice = {
  normalPrice: number;
  expressAvailable: boolean;
  expressPrice: number | null;
};

export type DeliveryCity = {
  _id: string;
  regionId: string;
  name: {
    uz: string;
    ru: string;
  };
  normalizedName: string;
  isActive: boolean;
  price: DeliveryCityPrice;
};

export type OrderPayment = {
  grossAmount: number;
  deliveryPaidAmount: number;
  orderPaidAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  deliveryPaid: boolean;
};

export type OperatorOrder = {
  _id: string;
  orderNumber: string;
  customer: {
    telegramId: number | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    phoneNumber: string | null;
    language: string;
  };
  items: OrderItem[];
  totalAmount: number;
  itemsAmount: number;
  payment: OrderPayment | null;
  delivery: OrderDelivery | null;
  deliveryAddress: string | null;
  status:
    | "pending"
    | "callback_later"
    | "confirmed"
    | "assigned"
    | "in_delivery"
    | "delivered"
    | "cancelled";
  notes: string | null;
  operatorId: string | null;
  operatorName: string | null;
  operatorPhoneNumber: string | null;
  operatorFee: number;
  operatorAcceptedAt: string | null;
  operatorConfirmedAt: string | null;
  operatorFeeCreditedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OperatorWallet = {
  _id: string;
  operatorId: string;
  operatorName: string;
  operatorPhoneNumber: string;
  balance: number;
  pendingFeeAmount: number;
  pendingFeeOrderCount: number;
  pendingWithdrawalAmount: number;
  totalEarned: number;
  totalWithdrawn: number;
  createdAt: string;
  updatedAt: string;
};

export type OperatorWithdrawalStatus = "pending" | "confirmed" | "rejected";

export type OperatorWithdrawal = {
  _id: string;
  operatorId: string;
  walletId: string;
  operatorName: string;
  operatorPhoneNumber: string;
  amount: number;
  cardNumber: string;
  cardHolderName: string;
  status: OperatorWithdrawalStatus;
  requestedAt: string;
  confirmedAt: string | null;
  confirmedByAdminId: string | null;
  confirmedByAdminEmail: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OperatorWalletTransactionType =
  | "order_fee"
  | "order_fee_reapply"
  | "order_fee_reversal"
  | "withdrawal_request"
  | "withdrawal_reject";

export type OperatorWalletTransactionDirection = "credit" | "debit";

export type OperatorWalletTransaction = {
  _id: string;
  operatorId: string;
  walletId: string;
  operatorName: string;
  operatorPhoneNumber: string;
  type: OperatorWalletTransactionType;
  direction: OperatorWalletTransactionDirection;
  amount: number;
  balanceAfter: number;
  orderId: string | null;
  orderNumber: string | null;
  withdrawalId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWithdrawalRequest = {
  amount: number;
  cardNumber: string;
  cardHolderName: string;
};

export type OperatorSettings = {
  _id: string;
  feePrice: number;
  streamStartTime: string;
  streamEndTime: string;
  timezone: string;
  isStreamEnabled: boolean;
  stream: {
    isOpen: boolean;
    currentTime: string;
    timezone: string;
  };
};

export type StreamResponse = {
  items: OperatorOrder[];
  settings: OperatorSettings;
};

export type ProcessResponse = {
  items: OperatorOrder[];
};
