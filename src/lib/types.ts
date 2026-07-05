// Shared client-side shapes mirroring the API responses.

export type ItemType = "upload" | "question" | "approval";
export type ItemStatus = "pending" | "completed" | "changes_requested";
export type RequestStatus = "draft" | "sent" | "in_progress" | "submitted" | "completed" | "cancelled";

export type Contact = { id: string; email: string; name: string | null };

export type Customer = {
  id: string;
  name: string;
  status: "active" | "archived";
  createdAt: string;
  contacts: Contact[];
};

export type RequestItem = {
  id: string;
  type: ItemType;
  label: string;
  position: number;
  status: ItemStatus;
  response: Record<string, unknown> | null;
};

export type RequestListItem = {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
  sentAt: string | null;
  customer: { id: string; name: string };
  items: { id: string; status: ItemStatus }[];
};

export type RequestDetail = {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
  customer: Customer;
  items: RequestItem[];
};

export type Template = {
  id: string;
  title: string;
  items: { type: ItemType; label: string }[];
  createdAt: string;
};
