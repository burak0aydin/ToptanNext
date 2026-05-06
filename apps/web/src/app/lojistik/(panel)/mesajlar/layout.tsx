import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";

type LogisticsMessagesLayoutProps = {
  children: ReactNode;
};

export default function LogisticsMessagesLayout({ children }: LogisticsMessagesLayoutProps) {
  return <RequireAuth>{children}</RequireAuth>;
}
