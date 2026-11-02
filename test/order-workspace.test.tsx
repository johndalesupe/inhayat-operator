import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render as renderUI,
  screen,
  waitFor,
} from "@testing-library/react";
import CreateOrderPage from "../app/(operator)/create/page";
import { CancelOrderButton, OrderEditor } from "../src/components/OrderEditor";
import { LeadEditor } from "../src/components/LeadEditor";
import type { OperatorLead, OperatorOrder } from "../src/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

function render(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return renderUI(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  catalog: vi.fn(),
  update: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  leadUpdate: vi.fn(),
  convert: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("../src/lib/api", () => ({
  operatorApi: { catalogProduct: mocks.catalog },
}));
vi.mock("../src/telegram/TelegramProvider", () => ({
  useTelegram: () => ({ haptic: vi.fn() }),
}));
vi.mock("../src/hooks/useOperatorOrders", () => ({
  useCreateOperatorOrder: () => ({
    mutateAsync: mocks.create,
    isPending: false,
  }),
  useUpdateOperatorOrder: () => ({
    mutateAsync: mocks.update,
    isPending: false,
  }),
  useConfirmOperatorOrder: () => ({
    mutateAsync: mocks.confirm,
    isPending: false,
  }),
  useCancelOperatorOrder: () => ({ mutate: mocks.cancel, isPending: false }),
  useOperatorRegions: () => ({
    data: [{ _id: "region", name: { uz: "Toshkent" } }],
  }),
  useOperatorCities: () => ({
    data: [
      { _id: "city", name: { uz: "Chilonzor" }, price: { normalPrice: 15000 } },
    ],
  }),
}));
vi.mock("../src/hooks/useOperatorLeads", () => ({
  useLeadActions: () => ({
    update: {
      mutateAsync: mocks.leadUpdate,
      mutate: mocks.leadUpdate,
      isPending: false,
    },
    convert: { mutateAsync: mocks.convert, isPending: false },
  }),
}));
const order = {
  _id: "order",
  orderNumber: "IN-100",
  status: "pending",
  customer: { firstName: "Test", phoneNumber: "+998901234567" },
  items: [
    {
      numericId: 1042,
      name_uz: "Atir",
      quantity: 1,
      price: 210000,
      thumbnailUrl: null,
    },
  ],
  delivery: { regionId: "region", cityId: "city", type: "normal", address: "" },
  paymentMethod: "pod",
  notes: "",
} as OperatorOrder;
const product = {
  numericId: 1042,
  name: "Atir",
  price: 210000,
  discountPrice: null,
  thumbnailUrl: null,
  stock: 10,
  variants: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.catalog.mockImplementation(async (id: number) => ({
    ...product,
    numericId: id,
    name: `Atir ${id}`,
  }));
  mocks.create.mockResolvedValue({ _id: "created" });
  mocks.update.mockResolvedValue(order);
  mocks.confirm.mockResolvedValue({ ...order, status: "confirmed" });
  mocks.leadUpdate.mockResolvedValue({});
  mocks.convert.mockResolvedValue({ orderId: "converted" });
});
afterEach(cleanup);

function fillCustomerAndDelivery() {
  fireEvent.change(screen.getByLabelText("Telefon raqami"), {
    target: { value: "+998 90 123 45 67" },
  });
  fireEvent.change(screen.getByLabelText("Mijoz ismi"), {
    target: { value: "Test Mijoz" },
  });
  fireEvent.change(screen.getByLabelText("Viloyat"), {
    target: { value: "region" },
  });
  fireEvent.change(screen.getByLabelText("Shahar / tuman"), {
    target: { value: "city" },
  });
  fireEvent.change(screen.getByLabelText("Yetkazish turi"), {
    target: { value: "normal" },
  });
}
async function addProducts(value = "1042, 1050") {
  fireEvent.change(screen.getByLabelText("Mahsulot ID"), { target: { value } });
  fireEvent.click(
    screen.getByRole("button", { name: "Mahsulotlarni qo‘shish" }),
  );
  await screen.findByText("Atir 1042");
}
describe("operator order workspace", () => {
  it("starts lead processing with the customer's saved variant selected", async () => {
    mocks.catalog.mockResolvedValue({
      ...product,
      variants: [
        {
          key: "50",
          name: "50 ml",
          stock: 4,
          price: 100000,
          thumbnailUrl: "/50.jpg",
        },
        {
          key: "100",
          name: "100 ml",
          stock: 3,
          price: 200000,
          thumbnailUrl: "/100.jpg",
        },
      ],
    });
    render(
      <LeadEditor
        lead={
          {
            _id: "lead",
            streamNumericId: 7,
            productNumericId: 1042,
            variantKey: "100",
            product: { nameUz: "Atir", price: 210000 },
            quantity: 2,
            clientName: "Test",
            clientPhoneNumber: "+998901234567",
            status: "received",
          } as OperatorLead
        }
      />,
    );
    const selected = await screen.findByRole("radio", { name: /100 ml/ });
    expect((selected as HTMLInputElement).checked).toBe(true);
    expect(
      (screen.getByRole("radio", { name: /50 ml/ }) as HTMLInputElement)
        .checked,
    ).toBe(false);
  });
  it("creates multiple product IDs using server pricing and reuses the request ID after a lost response", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Tarmoq uzildi"));
    render(<CreateOrderPage />);
    fillCustomerAndDelivery();
    await addProducts();
    fireEvent.click(
      screen.getByRole("button", { name: "Yaratish va tasdiqlash" }),
    );
    await screen.findByRole("alert");
    fireEvent.click(
      screen.getByRole("button", { name: "Yaratish va tasdiqlash" }),
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/process/created"),
    );
    const body = mocks.create.mock.calls[0][0];
    expect(body.items).toEqual([
      { numericId: 1042, quantity: 1 },
      { numericId: 1050, quantity: 1 },
    ]);
    expect(body.phoneNumber).toBe("+998901234567");
    expect(body.operatorId).toBeUndefined();
    expect(body.totalAmount).toBeUndefined();
    expect(mocks.create.mock.calls[1][0].requestId).toBe(body.requestId);
  });
  it("requires an explicit variant and sends its key with quantity", async () => {
    mocks.catalog.mockResolvedValue({
      ...product,
      name: "Atir 1042",
      variants: [
        { key: "50ml", name: "50 ml", stock: 2, price: 100000 },
        { key: "100ml", name: "100 ml", stock: 3, price: 200000 },
      ],
    });
    render(<CreateOrderPage />);
    fillCustomerAndDelivery();
    await addProducts("1042");
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Yaratish va tasdiqlash" })
        .closest("form")!,
    );
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: /50 ml/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Yaratish va tasdiqlash" }),
    );
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0].items).toEqual([
      { numericId: 1042, quantity: 1, variantKey: "50ml" },
    ]);
  });
  it("saves edited delivery and notes before confirming, without rewriting unchanged quantities", async () => {
    render(<OrderEditor order={{ ...order, marketerId: "marketer" }} />);
    fireEvent.change(screen.getByLabelText("Buyurtma izohi"), {
      target: { value: "Yangi izoh" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Buyurtmani tasdiqlash" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ha, tasdiqlash" }));
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0].body.notes).toBe("Yangi izoh");
    expect(mocks.update.mock.calls[0][0].body.items).toBeUndefined();
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.confirm.mock.invocationCallOrder[0],
    );
  });
  it("never confirms when saving changes fails", async () => {
    mocks.update.mockRejectedValue(new Error("Save failed"));
    render(<OrderEditor order={order} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Buyurtmani tasdiqlash" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ha, tasdiqlash" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
  it("allows confirmed cancellation with a review and reason", () => {
    render(<CancelOrderButton order={{ ...order, status: "confirmed" }} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Buyurtmani bekor qilish" }),
    );
    expect(mocks.cancel).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Bekor qilish sababi"), {
      target: { value: "Mijoz rad etdi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ha, bekor qilish" }));
    expect(mocks.cancel.mock.calls[0][0]).toEqual({
      id: "order",
      cancelReason: "Mijoz rad etdi",
    });
  });
  it.each(["assigned", "in_delivery", "delivered", "cancelled"] as const)(
    "hides cancellation for %s",
    (status) => {
      render(<CancelOrderButton order={{ ...order, status }} />);
      expect(screen.queryByRole("button")).toBeNull();
    },
  );
  it("saves a lead callback without requiring delivery and preserves native phone links", async () => {
    const lead = {
      _id: "lead",
      streamNumericId: 7,
      productNumericId: 1042,
      product: { nameUz: "Atir", price: 210000, thumbnailUrl: null },
      quantity: 1,
      clientName: "Test",
      clientPhoneNumber: "+998901234567",
      status: "received",
    } as OperatorLead;
    render(<LeadEditor lead={lead} />);
    expect(
      screen
        .getByRole("link", { name: /Mijozga qo'ng'iroq/ })
        .getAttribute("target"),
    ).toBe("_blank");
    fireEvent.click(
      screen.getByRole("button", { name: "Keyinroq qo‘ng‘iroq" }),
    );
    await waitFor(() => expect(mocks.leadUpdate).toHaveBeenCalled());
    expect(mocks.leadUpdate.mock.calls[0][0].body.status).toBe("call_back");
    expect(mocks.convert).not.toHaveBeenCalled();
  });
  it("requires a sellable variant before converting and sends only its key", async () => {
    mocks.catalog.mockResolvedValue({
      ...product,
      variants: [
        {
          key: "50",
          name: "50 ml",
          stock: 4,
          price: 100000,
          thumbnailUrl: "/50.jpg",
        },
        {
          key: "100",
          name: "100 ml",
          stock: 0,
          price: 200000,
          thumbnailUrl: "/100.jpg",
        },
      ],
    });
    render(
      <LeadEditor
        lead={
          {
            _id: "lead",
            streamNumericId: 7,
            productNumericId: 1042,
            product: { nameUz: "Atir", price: 210000 },
            quantity: 2,
            clientName: "Test",
            clientPhoneNumber: "+998901234567",
            status: "received",
            delivery: { regionId: "region", cityId: "city", type: "normal" },
          } as OperatorLead
        }
      />,
    );
    const radio = await screen.findByRole("radio", { name: /50 ml/ });
    expect(
      (screen.getByRole("radio", { name: /100 ml/ }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Buyurtmani tasdiqlash",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(radio);
    fireEvent.click(
      screen.getByRole("button", { name: "Buyurtmani tasdiqlash" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ha, tasdiqlash" }));
    await waitFor(() => expect(mocks.convert).toHaveBeenCalled());
    expect(mocks.convert.mock.calls[0][0].body).toEqual({
      regionId: "region",
      cityId: "city",
      deliveryType: "normal",
      deliveryAddress: "",
      variantKey: "50",
    });
    expect(mocks.leadUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.convert.mock.invocationCallOrder[0],
    );
  });
});
