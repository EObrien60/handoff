export type ItemType = "upload" | "question" | "approval";
export type ItemStatus = "pending" | "completed" | "changes_requested";
export type RequestStatus = "draft" | "sent" | "in_progress" | "submitted" | "completed" | "cancelled";
export interface Contact {
    id: string;
    email: string;
    name: string | null;
}
export interface Customer {
    id: string;
    name: string;
    status: "active" | "archived";
    createdAt: string;
    contacts: Contact[];
}
export interface RequestItemSummary {
    id: string;
    status: ItemStatus;
}
export interface RequestSummary {
    id: string;
    title: string;
    status: RequestStatus;
    createdAt: string;
    sentAt: string | null;
    customer: {
        id: string;
        name: string;
    };
    items: RequestItemSummary[];
}
export interface NewRequestItem {
    type: ItemType;
    label: string;
}
export interface Org {
    id: string;
    name: string;
    slug: string;
    status: string;
    accentColor: string | null;
    logoUrl: string | null;
    trialEndsAt: string | null;
}
