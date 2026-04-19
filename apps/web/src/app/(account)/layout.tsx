import type { ReactNode } from "react";
import { AccountLayoutShell } from "./_components/AccountLayoutShell";

type AccountLayoutProps = {
  children: ReactNode;
};

export default function AccountLayout({ children }: AccountLayoutProps) {
  return <AccountLayoutShell>{children}</AccountLayoutShell>;
}
