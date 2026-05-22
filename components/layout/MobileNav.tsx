"use client";

import Link from "next/link";
import { CalendarDays, ClipboardList, Home, Megaphone, Settings } from "lucide-react";

const items = [
  { href: "/dashboard", label: "홈", icon: Home },
  { href: "/calendar", label: "일정", icon: CalendarDays },
  { href: "/tasks", label: "업무", icon: ClipboardList },
  { href: "/notice", label: "공지", icon: Megaphone },
  { href: "/settings", label: "설정", icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-white/10 bg-[#14151a] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="flex h-16 flex-col items-center justify-center gap-1 text-xs text-zinc-300">
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
