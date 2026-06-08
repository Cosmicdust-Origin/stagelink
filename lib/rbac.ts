import type { UserRole } from "@/lib/types";

export const roleLabels: Record<UserRole, string> = {
  super_admin: "서비스 마스터",
  admin: "관리자",
  owner: "대표",
  staff: "직원",
  manager: "직원",
};

export const roleBadgeClasses: Record<UserRole, string> = {
  super_admin: "bg-sky-500/15 text-sky-300",
  admin: "bg-[#E8457A]/15 text-[#E8457A]",
  owner: "bg-amber-500/15 text-amber-300",
  staff: "bg-emerald-500/15 text-emerald-300",
  manager: "bg-emerald-500/15 text-emerald-300",
};

export type NavAccess = "members" | "settlement" | "master";

export function normalizeRole(role?: string | null): UserRole | undefined {
  if (
    role === "super_admin" ||
    role === "admin" ||
    role === "owner" ||
    role === "staff" ||
    role === "manager"
  ) {
    return role;
  }
}

export function canAccessMembers(role?: string | null) {
  return normalizeRole(role) === "admin";
}

export function canAccessSettlement(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "super_admin" || normalized === "admin" || normalized === "owner";
}

export function canAccessMaster(role?: string | null) {
  return normalizeRole(role) === "super_admin";
}

export function canOperate(role?: string | null) {
  return Boolean(normalizeRole(role));
}

export function canAccessNav(access: NavAccess | undefined, role?: string | null) {
  if (access === "members") return canAccessMembers(role);
  if (access === "settlement") return canAccessSettlement(role);
  if (access === "master") return canAccessMaster(role);
  return Boolean(normalizeRole(role));
}
