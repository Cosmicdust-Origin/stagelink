export type UserRole = "admin" | "manager";
export type EventType = "live" | "rehearsal" | "filming" | "meeting" | "other";
export type PrivilegeCategory = "on_site" | "event" | "mail_order" | "goods" | "other";
export type TaskStatus = "todo" | "in_progress" | "done";

export type Profile = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  phone: string | null;
  joined_at: string | null;
  created_at: string;
};

/** 아티스트/아이돌 멤버 (auth 계정 아님, 워크스페이스 소속 독립 데이터) */
export type Member = {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  debut_date: string | null;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
};

export type EventSummary = {
  id: string;
  title: string;
  event_type: EventType;
  group_id: string | null;
  venue: string | null;
  start_at: string;
  end_at: string;
};

export type SettlementType = "rate" | "fixed";

export type PrivilegeType = {
  id: string;
  name: string;
  category: PrivilegeCategory;
  unit_price: number | null;
  settlement_type: SettlementType;
  is_active: boolean;
};

export type PrivilegeRecord = {
  id: string;
  event_id: string;
  member_id: string;
  privilege_type_id: string;
  quantity: number;
};

export type SettlementLine = {
  record_id: string;
  privilege_type: string;
  event_name: string;
  event_date: string;
  quantity: number;
  unit_price: number; // 멤버별 장당 정산액 (settlement_rates.unit_price)
  amount: number;
  settled_at: string | null;
};

export type SettlementMemberSummary = {
  member_id: string;
  member_name: string;
  group_name: string;
  breakdown: SettlementLine[];
  total: number;
  paid: number;
  unpaid: number;
};
