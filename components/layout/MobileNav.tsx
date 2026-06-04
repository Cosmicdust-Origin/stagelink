"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ChartColumnStacked,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle,
  UsersRound,
  X,
} from "lucide-react";
import { navItems } from "@/lib/constants";
import { canAccessNav } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

const icons: Record<string, React.ElementType> = {
  "/dashboard": LayoutDashboard,
  "/calendar": CalendarDays,
  "/groups": UsersRound,
  "/privileges": ChartColumnStacked,
  "/settlement": CircleDollarSign,
  "/tasks": ClipboardList,
  "/notice": Megaphone,
  "/members": ShieldCheck,
  "/settings": Settings,
  "/account": UserCircle,
};

const bottomTabs = ["/dashboard", "/calendar", "/tasks", "/notice"];

const getNavLabel = (href: string) => navItems.find((item) => item.href === href)?.label ?? href;

export function MobileNav({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const visibleItems = navItems.filter((item) => canAccessNav(item.access, role));

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-white/10 bg-[#14151a] md:hidden">
        {bottomTabs.map((href) => {
          const Icon = icons[href];
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors ${active ? "text-[#E8457A]" : "text-zinc-400"}`}
            >
              <Icon className="h-5 w-5" />
              {getNavLabel(href)}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-16 flex-col items-center justify-center gap-1 text-xs text-zinc-400"
        >
          <Menu className="h-5 w-5" />
          더 보기
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-[#14151a] transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="font-semibold text-white">전체 메뉴</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="grid grid-cols-3 gap-3 p-4">
          {visibleItems.map((item) => {
            const Icon = icons[item.href];
            const active = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center gap-2 rounded-xl py-5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#E8457A]/15 text-[#E8457A]"
                    : "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout inside the drawer */}
        <div className="border-t border-white/10 px-4 pb-10 pt-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 text-sm font-medium text-red-300"
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
