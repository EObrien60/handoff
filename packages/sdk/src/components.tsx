import type { CSSProperties, ReactNode } from "react";
import { useHandoffTheme } from "./react";
import { useRequests } from "./react";
import type { RequestStatus, RequestSummary } from "./types";

/**
 * Self-styled dashboard primitives — inline styles only, so they drop into any
 * app without Tailwind or a CSS import. All read the theme from context (accent
 * etc.), so branding flows from <HandoffProvider theme={{ accent }}>.
 */

const statusLabel: Record<RequestStatus, string> = {
  draft: "Draft",
  sent: "Waiting on client",
  in_progress: "In progress",
  submitted: "Ready to review",
  completed: "Completed",
  cancelled: "Cancelled",
};

/* ---------- StatusBadge ---------- */

export function StatusBadge({ status }: { status: RequestStatus }) {
  const t = useHandoffTheme();
  const tone: Record<RequestStatus, [string, string]> = {
    draft: [t.surfaceAlt, t.muted],
    sent: ["#f6eddb", "#9a6a12"],
    in_progress: ["#f6eddb", "#9a6a12"],
    submitted: [hexA(t.accent, 0.12), t.accent],
    completed: ["#e6f0e8", "#2f6b3f"],
    cancelled: [t.surfaceAlt, t.faint],
  };
  const [bg, fg] = tone[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 500,
        background: bg,
        color: fg,
      }}
    >
      {statusLabel[status]}
    </span>
  );
}

/* ---------- StatTile / StatGrid ---------- */

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
      {children}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  const t = useHandoffTheme();
  return (
    <div style={{ ...card(t), padding: 16 }}>
      <div style={{ fontSize: 12, color: t.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 28, fontWeight: 600, color: t.ink }}>{value}</div>
      {hint && <div style={{ marginTop: 2, fontSize: 12, color: t.muted }}>{hint}</div>}
    </div>
  );
}

/* ---------- DataTable ---------- */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

export function DataTable<T>({
  columns,
  rows,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  const t = useHandoffTheme();
  if (rows.length === 0) {
    return <div style={{ ...card(t), padding: 24, color: t.muted, fontSize: 14 }}>{empty ?? "Nothing here yet."}</div>;
  }
  return (
    <div style={{ ...card(t), overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: t.fontFamily }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: t.faint,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  borderBottom: `1px solid ${t.line}`,
                  width: c.width,
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? "pointer" : "default", borderTop: i ? `1px solid ${t.line}` : undefined }}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "12px 16px", fontSize: 14, color: t.ink }}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- DashboardShell ---------- */

export function DashboardShell({
  brand,
  nav,
  children,
}: {
  brand: ReactNode;
  nav?: ReactNode;
  children: ReactNode;
}) {
  const t = useHandoffTheme();
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: t.fontFamily, background: t.surfaceAlt, color: t.ink }}>
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          borderRight: `1px solid ${t.line}`,
          background: t.surface,
          padding: "20px 12px",
        }}
      >
        <div style={{ padding: "0 8px 16px", fontWeight: 700, color: t.accent }}>{brand}</div>
        {nav}
      </aside>
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  );
}

/* ---------- RequestInbox (ready-made widget) ---------- */

/**
 * A complete requests-by-status inbox backed by the Handoff API. Drop it into a
 * dashboard and pass onOpen to route to a detail view.
 */
export function RequestInbox({ onOpen }: { onOpen?: (r: RequestSummary) => void }) {
  const t = useHandoffTheme();
  const { data, loading, error } = useRequests();

  if (loading && !data) return <div style={{ padding: 24, color: t.muted }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "#a23a2e" }}>Couldn’t load requests.</div>;

  const order: RequestStatus[] = ["submitted", "sent", "in_progress", "draft", "completed", "cancelled"];
  const groups = order
    .map((status) => ({ status, items: (data ?? []).filter((r) => r.status === status) }))
    .filter((g) => g.items.length);

  if (groups.length === 0) return <div style={{ padding: 24, color: t.muted }}>No requests yet.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {groups.map((g) => (
        <section key={g.status}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: t.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>
            {statusLabel[g.status]} · {g.items.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {g.items.map((r) => {
              const done = r.items.filter((i) => i.status === "completed").length;
              return (
                <div
                  key={r.id}
                  onClick={onOpen ? () => onOpen(r) : undefined}
                  style={{
                    ...card(t),
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: onOpen ? "pointer" : "default",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, color: t.ink }}>{r.title}</div>
                    <div style={{ marginTop: 2, fontSize: 13, color: t.muted }}>
                      {r.customer.name} · {done}/{r.items.length} done
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- helpers ---------- */

function card(t: ReturnType<typeof useHandoffTheme>): CSSProperties {
  return { background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius };
}

function hexA(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
