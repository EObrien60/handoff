import type { RequestStatus, ItemType } from "./types";

type Tone = "neutral" | "brand" | "ok" | "warn" | "danger";

export const statusMeta: Record<RequestStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Waiting on client", tone: "warn" },
  in_progress: { label: "In progress", tone: "warn" },
  submitted: { label: "Ready to review", tone: "brand" },
  completed: { label: "Completed", tone: "ok" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

/** Order used to group the requests inbox — most action-needing first. */
export const inboxOrder: RequestStatus[] = ["submitted", "sent", "in_progress", "draft", "completed", "cancelled"];

export const itemTypeMeta: Record<ItemType, { label: string; verb: string }> = {
  upload: { label: "Upload", verb: "Upload a file" },
  question: { label: "Question", verb: "Answer a question" },
  approval: { label: "Approval", verb: "Approve a document" },
};
