import type { ReactNode } from "react";
import { OperatorShell } from "@/src/components/OperatorShell";

export default function OperatorLayout({ children }: { children: ReactNode }) {
  return <OperatorShell>{children}</OperatorShell>;
}
