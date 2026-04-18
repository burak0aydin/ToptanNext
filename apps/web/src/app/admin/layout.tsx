import type { ReactNode } from "react";
import { AdminShell } from "./_components/AdminShell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}