"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Mail, Monitor, Mountain, PenSquare, Tags, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { THEME_PREFERENCE_LABELS, THEME_PREFERENCE_ORDER, THEME_SWATCH } from "@/lib/theme";

const NAV_ITEMS = [
  { href: "/", label: "Inbox", icon: Inbox },
  { href: "/rules", label: "Rules", icon: Tags },
  { href: "/terrain", label: "Terrain", icon: Mountain },
  { href: "/compose", label: "Compose", icon: PenSquare },
  { href: "/accounts", label: "Accounts", icon: Users },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { preference, setTheme } = useTheme();
  const { accounts } = useAuthStatus();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[#7a5738]/12 bg-[#10190f] text-[#f6efe1]">
        <div className="flex items-center gap-2 px-5 py-6">
          <Mail size={20} className="text-[#8ea377]" strokeWidth={1.75} />
          <span className="font-serif text-[1.05rem] tracking-tight">Mailroom</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[#f6efe1]/10 text-[#fdfbf5]"
                    : "text-[#f6efe1]/60 hover:bg-[#f6efe1]/5 hover:text-[#f6efe1]"
                )}
              >
                <Icon size={16} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-5 py-5">
          <div className="mb-3 flex items-center gap-1.5">
            {THEME_PREFERENCE_ORDER.map((t) => {
              const active = preference === t;
              const ring = active ? "ring-[#f6efe1]/70" : "ring-[#f6efe1]/15 hover:ring-[#f6efe1]/40";
              if (t === "auto") {
                return (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    title="Auto — follow system"
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-offset-1 ring-offset-[#10190f] transition-all",
                      ring
                    )}
                  >
                    <Monitor size={11} className="text-[#f6efe1]/70" strokeWidth={2} />
                  </button>
                );
              }
              const [surface, accent] = THEME_SWATCH[t];
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={`${THEME_PREFERENCE_LABELS[t]} theme`}
                  className={cn("h-5 w-5 shrink-0 rounded-full ring-1 ring-offset-1 ring-offset-[#10190f] transition-all", ring)}
                  style={{ background: `linear-gradient(135deg, ${surface} 50%, ${accent} 50%)` }}
                />
              );
            })}
          </div>

          {accounts.length > 0 && (
            <Link
              href="/accounts"
              className="mb-2 block truncate rounded-md border border-[#f6efe1]/10 px-2.5 py-2 text-[11px] text-[#f6efe1]/60 hover:text-[#f6efe1]/90"
            >
              {accounts.length} account{accounts.length === 1 ? "" : "s"} connected
            </Link>
          )}

          <p className="text-[11px] leading-relaxed text-[#f6efe1]/35">
            Where the cabin&rsquo;s mail
            <br />
            gets sorted.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-parchment">{children}</main>
    </div>
  );
}
