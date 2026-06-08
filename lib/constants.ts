import type { NavAccess } from "@/lib/rbac";
import type { EventType, TaskStatus } from "@/lib/types";

export const eventTypeLabels: Record<EventType, string> = {
  live: "라이브",
  rehearsal: "리허설",
  filming: "촬영",
  meeting: "미팅",
  other: "기타",
};

export const eventTypeColors: Record<EventType, string> = {
  live: "#E8457A",
  rehearsal: "#4A9FE8",
  filming: "#9B59B6",
  meeting: "#27AE60",
  other: "#95A5A6",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "대기",
  in_progress: "진행 중",
  done: "완료",
};

export const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/calendar", label: "캘린더" },
  { href: "/groups", label: "그룹 관리" },
  { href: "/privileges", label: "특전 현황" },
  { href: "/settlement", label: "정산 관리", access: "settlement" },
  { href: "/tasks", label: "업무 보드" },
  { href: "/notice", label: "공지 게시판" },
  { href: "/members", label: "회원 관리", access: "members" },
  { href: "/settings", label: "설정" },
  { href: "/account", label: "마이페이지" },
  { href: "/master", label: "마스터", access: "master" },
] satisfies ReadonlyArray<{ href: string; label: string; access?: NavAccess }>;
