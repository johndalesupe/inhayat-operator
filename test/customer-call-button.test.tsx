import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CustomerCallButton } from "../src/components/CustomerCallButton";

const { haptic } = vi.hoisted(() => ({ haptic: vi.fn() }));
vi.mock("../src/telegram/TelegramProvider", () => ({
  useTelegram: () => ({ haptic }),
}));

beforeEach(() => {
  haptic.mockReset();
});
afterEach(cleanup);

function clickCallButton(phoneNumber: string, compact = false) {
  const navigation = vi.fn();
  render(
    <div
      onClick={(event) => {
        const link = event.target as HTMLAnchorElement;
        navigation({
          cancelled: event.defaultPrevented,
          href: link.getAttribute("href"),
          target: link.target,
          rel: link.rel,
        });
        // Inspect the native handoff without asking the test host to dial.
        event.preventDefault();
      }}
    >
      <CustomerCallButton phoneNumber={phoneNumber} compact={compact} />
    </div>,
  );
  fireEvent.click(screen.getByRole("link", { name: /Mijozga/ }));
  return navigation;
}

describe("customer phone handoff from Telegram", () => {
  it.each([false, true])(
    "preserves a user-initiated external phone link (compact=%s)",
    (compact) => {
      const navigation = clickCallButton(" +998 (90) 123-45-67 ", compact);
      expect(navigation).toHaveBeenCalledWith({
        cancelled: false,
        href: "tel:+998901234567",
        target: "_blank",
        rel: "noopener noreferrer",
      });
      expect(haptic).toHaveBeenCalledWith("light");
    },
  );

  it("still hands off the call when Telegram haptics are unavailable", () => {
    haptic.mockImplementation(() => {
      throw new Error("Haptics unsupported by this client");
    });
    const navigation = clickCallButton("90 123 45 67");
    expect(navigation).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelled: false,
        href: "tel:901234567",
        target: "_blank",
      }),
    );
  });
});
