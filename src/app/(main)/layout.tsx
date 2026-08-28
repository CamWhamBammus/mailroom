import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { hasAnyAccount } from "@/lib/googleAuth";

export default function MainLayout({ children }: { children: ReactNode }) {
  if (!hasAnyAccount()) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
