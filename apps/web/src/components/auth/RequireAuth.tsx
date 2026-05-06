"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasAccessToken } from "@/lib/auth-token";

type RequireAuthProps = {
  children: ReactNode;
  nextPath?: string;
};

export function RequireAuth({ children, nextPath }: RequireAuthProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (hasAccessToken()) {
      setIsAllowed(true);
      return;
    }

    const redirectTarget = nextPath ?? pathname ?? "/";
    router.replace(`/login?next=${encodeURIComponent(redirectTarget)}`);
  }, [nextPath, pathname, router]);

  if (!isAllowed) {
    return null;
  }

  return children;
}
