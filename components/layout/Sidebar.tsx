"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartColumnStacked, CircleDollarSign, ClipboardList, LayoutDashboard, Megaphone, Settings, UsersRound } from "lucide-react";
import { navItems } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

const icons: Record<string, React.ElementType> = {
  "/dashboard": LayoutDashboard,
  "/calendar": CalendarDays,
  "/groups": UsersRound,
  "/privileges": ChartColumnStacked,
  "/settlement": CircleDollarSign,
  "/tasks": ClipboardList,
  "/notice": Megaphone,
  "/settings": Settings,
};

export function Sidebar({ role }: { role?: UserRole }) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 border-r border-white/10 bg-[#14151a] px-4 py-5 md:block">
      <Link href="/dashboard" className="block px-2">
        <p className="text-lg font-bold tracking-normal text-white">STAGELINK</p>
        <p className="text-xs text-zinc-500">운영 통합 정산관리</p>
      </Link>
      <nav className="mt-8 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || role === "admin")
          .map((item) => {
            const Icon = icons[item.href];
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                  active
                    ? "bg-[#E8457A]/15 font-medium text-[#E8457A]"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
