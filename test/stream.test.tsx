import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import StreamPage from "../app/(operator)/stream/page";
import ProcessPage from "../app/(operator)/process/page";
import type {
  OperatorLead,
  OperatorOrder,
  OperatorSettings,
} from "../src/types";

const mocks = vi.hoisted(() => ({
  stream: vi.fn(),
  process: vi.fn(),
  acceptLead: vi.fn(),
  acceptOrder: vi.fn(),
  push: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("../src/hooks/useOperatorOrders", () => ({
  useStreamOrders: mocks.stream,
  useProcessOrders: mocks.process,
  useAcceptOrder: () => ({ mutate: mocks.acceptOrder, isPending: false }),
}));
vi.mock("../src/hooks/useOperatorLeads", () => ({
  useLeadActions: () => ({
    accept: { mutate: mocks.acceptLead, isPending: false },
  }),
}));
vi.mock("../src/telegram/TelegramProvider", () => ({
  useTelegram: () => ({ haptic: vi.fn() }),
}));

const lead: OperatorLead = {
  _id: "lead-1",
  streamNumericId: 42,
  productNumericId: 7,
  product: {
    nameUz: "Atirgul kremi",
    nameRu: "Крем",
    price: 80000,
    discountPrice: null,
    thumbnailUrl: null,
  },
  quantity: 2,
  source: "web",
  status: "received",
  createdAt: "2026-11-01T07:00:00Z",
};
const settings: OperatorSettings = {
  feePrice: 5000,
  isStreamEnabled: true,
  streamStartTime: "01:00",
  streamEndTime: "22:00",
  stream: { isOpen: true, currentTime: "12:00" },
} as OperatorSettings;
const order = {
  _id: "order-1",
  orderNumber: "IN-100",
  createdAt: "2026-11-01T08:00:00Z",
  status: "pending",
  customer: { firstName: "Test", phoneNumber: "+998000000000" },
  items: [
    {
      numericId: 9,
      name_uz: "Yuz yuvish geli",
      quantity: 1,
      price: 50000,
      thumbnailUrl: null,
    },
  ],
  totalAmount: 50000,
  itemsAmount: 50000,
  paymentMethod: "pod",
  paymentStatus: "unpaid",
  delivery: {
    type: "express",
    regionNameUz: "Toshkent",
    cityNameUz: "Yunusobod",
  },
} as OperatorOrder;
function response(
  items: OperatorOrder[] = [],
  leads: OperatorLead[] = [lead],
  isOpen = true,
) {
  return {
    data: {
      items,
      leads,
      settings: { ...settings, stream: { ...settings.stream, isOpen } },
    },
    dataUpdatedAt: Date.now(),
    isLoading: false,
    isFetching: false,
    refetch: mocks.refetch,
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.stream.mockReturnValue(response());
  mocks.process.mockReturnValue(response([], []));
});
afterEach(cleanup);

describe("operator lead rendering regression", () => {
  it("limits quick-form access to both form leads and form orders", () => {
    const data = response(
      [
        order,
        {
          ...order,
          _id: "quick-order",
          source: "lead_stream",
          orderNumber: "QUICK-1",
        },
      ],
      [
        lead,
        { ...lead, _id: "quick-lead", source: "web_form", streamNumericId: 43 },
      ],
    );
    mocks.stream.mockReturnValue({
      ...data,
      data: { ...data.data, streamPermissions: ["quick_form_orders"] },
    });
    render(<StreamPage />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      screen.queryByRole("article", { name: "Buyurtma IN-100" }),
    ).toBeNull();
    expect(
      screen.queryByRole("article", { name: "Lead #42: Atirgul kremi" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /^Leadlar/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Kutilayotgan/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Tezkor forma/ }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
  it("removes a revoked category and resets its selected filter without a reload", () => {
    const data = response([order]);
    mocks.stream.mockReturnValue(data);
    const view = render(<StreamPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Leadlar/ }));
    mocks.stream.mockReturnValue({
      ...data,
      data: { ...data.data, streamPermissions: ["pending_orders"] },
    });
    view.rerender(<StreamPage />);
    expect(screen.queryByText("Atirgul kremi")).toBeNull();
    expect(screen.getByText("Yuz yuvish geli")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /^Barchasi/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
  it("explains zero permissions while preserving the link to accepted work", () => {
    const data = response([order]);
    mocks.stream.mockReturnValue({
      ...data,
      data: { ...data.data, streamPermissions: [] },
    });
    render(<StreamPage />);
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.getByText("Oqim turlari ruxsat etilmagan")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Ish jarayonida/ }).getAttribute("href"),
    ).toBe("/process");
  });
  it("renders an available lead even when there are no orders", () => {
    render(<StreamPage />);
    expect(
      screen.getByRole("article", { name: "Lead #42: Atirgul kremi" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Lead #42 qabul qilish" }),
    ).toBeTruthy();
    expect(screen.queryByText("Oqimda hozircha buyurtma yo'q")).toBeNull();
  });
  it("shows both types by default and keeps lead filtering independent of orders", () => {
    mocks.stream.mockReturnValue(response([order]));
    render(<StreamPage />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Leadlar/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Atirgul kremi")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Kutilayotgan/ }));
    expect(screen.queryByText("Atirgul kremi")).toBeNull();
    expect(screen.getByText("Yuz yuvish geli")).toBeTruthy();
  });
  it("searches lead products and shows an honest no-results state", () => {
    render(<StreamPage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Oqimdan qidirish" }),
      { target: { value: "atirgul" } },
    );
    expect(screen.getByText("Atirgul kremi")).toBeTruthy();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Oqimdan qidirish" }),
      { target: { value: "no-match" } },
    );
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.getByText("Natija topilmadi")).toBeTruthy();
  });
  it("accepts a lead through the lead API and opens its processing page", () => {
    render(<StreamPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Lead #42 qabul qilish" }),
    );
    expect(mocks.acceptLead).toHaveBeenCalledWith(
      "lead-1",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    mocks.acceptLead.mock.calls[0][1].onSuccess();
    expect(mocks.push).toHaveBeenCalledWith("/leads/lead-1");
    expect(mocks.acceptOrder).not.toHaveBeenCalled();
  });
  it("does not expose contact fields before acceptance, even if a response includes them", () => {
    mocks.stream.mockReturnValue(
      response(
        [],
        [
          {
            ...lead,
            clientName: "Hidden customer",
            clientPhoneNumber: "+998111111111",
          },
        ],
      ),
    );
    render(<StreamPage />);
    expect(screen.queryByText("Hidden customer")).toBeNull();
    expect(screen.queryByText("+998111111111")).toBeNull();
  });
  it("disables acceptance when the stream is closed", () => {
    mocks.stream.mockReturnValue(response([], [lead], false));
    render(<StreamPage />);
    const button = screen.getByRole("button", {
      name: "Lead #42 qabul qilish",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(mocks.acceptLead).not.toHaveBeenCalled();
  });
  it("removes already-owned leads from available work and counts them in progress", () => {
    mocks.process.mockReturnValue(response([], [lead]));
    render(<StreamPage />);
    expect(screen.queryByRole("article", { name: /Lead #42/ })).toBeNull();
    expect(screen.getByText("0 buyurtma, 1 lead")).toBeTruthy();
  });
  it("shows owned leads on the orders page and filters them separately", () => {
    mocks.process.mockReturnValue(
      response(
        [order],
        [
          {
            ...lead,
            clientName: "Accepted customer",
            clientPhoneNumber: "+998000000001",
          },
        ],
      ),
    );
    render(<ProcessPage />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Leadlar/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Accepted customer")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Tasdiqlangan/ }));
    expect(screen.queryByRole("article")).toBeNull();
  });
});
