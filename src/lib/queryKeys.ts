export const operatorKeys = {
  profile: ["operator", "profile"] as const,
  wallet: ["operator", "wallet"] as const,
  withdrawals: ["operator", "wallet", "withdrawals"] as const,
  transactions: ["operator", "wallet", "transactions"] as const,
  regions: ["operator", "locations", "regions"] as const,
  cities: (regionId?: string) =>
    ["operator", "locations", "cities", regionId ?? "all"] as const,
  stream: ["operator", "orders", "stream"] as const,
  process: ["operator", "orders", "process"] as const,
  order: (id: string) => ["operator", "orders", id] as const,
};
