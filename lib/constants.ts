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
  { href: "/dashboard", label: "대시보드", adminOnly: false },
  { href: "/calendar", label: "캘린더", adminOnly: false },
  { href: "/groups", label: "그룹 관리", adminOnly: false },
  { href: "/privileges", label: "특전 현황", adminOnly: false },
  { href: "/settlement", label: "정산 관리", adminOnly: true },
  { href: "/tasks", label: "업무 보드", adminOnly: false },
  { href: "/notice", label: "공지 게시판", adminOnly: false },
  { href: "/settings", label: "설정", adminOnly: false },
  { href: "/account", label: "마이페이지", adminOnly: false },
] as const;
