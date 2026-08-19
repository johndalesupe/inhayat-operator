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
  telegramId?: number | null;
  telegramUsername?: string | null;
  telegramWriteAccess?: boolean;
  telegramLinkedAt?: string | null;
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
  type:
    | "normal"
    | "private_dp"
    | "express"
    | "to_home"
    | "yandex"
    | "taxi_delivery";
  provider?: "beepost" | "private_dp" | "yandex" | "same_day" | "legacy_taxi";
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
  toHomeAvailable?: boolean;
  toHomePrice?: number | null;
  yandexAvailable?: boolean;
  beepostEnabled?: boolean;
  beepostCustomerVisible?: boolean;
  beepostCityCenterPrice?: number | null;
  beepostToHomePrice?: number | null;
  sameDayAvailable?: boolean;
  sameDayPrice?: number | null;
  sameDayRequiresPrepayment?: boolean;
  privateDpEnabled?: boolean;
  privateDpCustomerVisible?: boolean;
  privateDpPrice?: number | null;
  deliveryOptions?: Array<{
    type: Exclude<NonNullable<OperatorOrder["delivery"]>["type"], "taxi_delivery">;
    customerVisible: boolean;
    titleUz: string;
    titleRu: string;
    descriptionUz: string;
    descriptionRu: string;
    sortOrder: number;
  }>;
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

export type MarketerCommissionLog = {
  _id: string;
  type: "commission" | "reversal" | "adjustment" | "withdrawal";
  direction: "credit" | "debit";
  amount: number;
  eligibleSubtotal: number;
  commissionRateBps: number;
  balanceAfter: number;
  orderId: string | null;
  referralId: string | null;
  note: string | null;
  reasonUz: string | null;
  reasonCode: "awarded" | "restored" | "reversed" | null;
  fromStatus: string | null;
  toStatus: string | null;
  transitionSource: string | null;
  settlementCycle: number;
  createdAt: string;
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
  paymentMethod: "pod" | "payme" | "click";
  paymentStatus:
    | "unpaid"
    | "pending"
    | "processing"
    | "paid"
    | "partially_paid"
    | "failed"
    | "cancelled"
    | "refunded";
  paidAt: string | null;
  delivery: OrderDelivery | null;
  deliveryAddress: string | null;
  status:
    | "pending"
    | "callback_later"
    | "confirmed"
    | "assigned"
    | "in_delivery"
    | "returning"
    | "returned"
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
  marketerCommissionLogs?: MarketerCommissionLog[];
  createdAt: string;
  updatedAt: string;
};

export type OperatorWallet = {
  _id: string;
  operatorId: string;
  operatorName: string;
  operatorPhoneNumber: string;
  balance: number;
  debtAmount: number;
  pendingFeeAmount: number;
  pendingFeeOrderCount: number;
  pendingWithdrawalAmount: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalPrepaid: number;
  lastPrepaymentAt: string | null;
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
  | "withdrawal_reject"
  | "admin_prepayment";

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
  note?: string | null;
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
