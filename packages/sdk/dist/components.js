import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useHandoffTheme } from "./react";
import { useRequests } from "./react";
/**
 * Self-styled dashboard primitives — inline styles only, so they drop into any
 * app without Tailwind or a CSS import. All read the theme from context (accent
 * etc.), so branding flows from <HandoffProvider theme={{ accent }}>.
 */
const statusLabel = {
    draft: "Draft",
    sent: "Waiting on client",
    in_progress: "In progress",
    submitted: "Ready to review",
    completed: "Completed",
    cancelled: "Cancelled",
};
/* ---------- StatusBadge ---------- */
export function StatusBadge({ status }) {
    const t = useHandoffTheme();
    const tone = {
        draft: [t.surfaceAlt, t.muted],
        sent: ["#f6eddb", "#9a6a12"],
        in_progress: ["#f6eddb", "#9a6a12"],
        submitted: [hexA(t.accent, 0.12), t.accent],
        completed: ["#e6f0e8", "#2f6b3f"],
        cancelled: [t.surfaceAlt, t.faint],
    };
    const [bg, fg] = tone[status];
    return (_jsx("span", { style: {
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 500,
            background: bg,
            color: fg,
        }, children: statusLabel[status] }));
}
/* ---------- StatTile / StatGrid ---------- */
export function StatGrid({ children }) {
    return (_jsx("div", { style: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }, children: children }));
}
export function StatTile({ label, value, hint }) {
    const t = useHandoffTheme();
    return (_jsxs("div", { style: { ...card(t), padding: 16 }, children: [_jsx("div", { style: { fontSize: 12, color: t.faint, textTransform: "uppercase", letterSpacing: 0.4 }, children: label }), _jsx("div", { style: { marginTop: 6, fontSize: 28, fontWeight: 600, color: t.ink }, children: value }), hint && _jsx("div", { style: { marginTop: 2, fontSize: 12, color: t.muted }, children: hint })] }));
}
export function DataTable({ columns, rows, onRowClick, empty, }) {
    const t = useHandoffTheme();
    if (rows.length === 0) {
        return _jsx("div", { style: { ...card(t), padding: 24, color: t.muted, fontSize: 14 }, children: empty ?? "Nothing here yet." });
    }
    return (_jsx("div", { style: { ...card(t), overflow: "hidden" }, children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontFamily: t.fontFamily }, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((c) => (_jsx("th", { style: {
                                textAlign: "left",
                                padding: "10px 16px",
                                fontSize: 12,
                                fontWeight: 600,
                                color: t.faint,
                                textTransform: "uppercase",
                                letterSpacing: 0.4,
                                borderBottom: `1px solid ${t.line}`,
                                width: c.width,
                            }, children: c.header }, c.key))) }) }), _jsx("tbody", { children: rows.map((row, i) => (_jsx("tr", { onClick: onRowClick ? () => onRowClick(row) : undefined, style: { cursor: onRowClick ? "pointer" : "default", borderTop: i ? `1px solid ${t.line}` : undefined }, children: columns.map((c) => (_jsx("td", { style: { padding: "12px 16px", fontSize: 14, color: t.ink }, children: c.render(row) }, c.key))) }, i))) })] }) }));
}
/* ---------- DashboardShell ---------- */
export function DashboardShell({ brand, nav, children, }) {
    const t = useHandoffTheme();
    return (_jsxs("div", { style: { display: "flex", minHeight: "100vh", fontFamily: t.fontFamily, background: t.surfaceAlt, color: t.ink }, children: [_jsxs("aside", { style: {
                    width: 232,
                    flexShrink: 0,
                    borderRight: `1px solid ${t.line}`,
                    background: t.surface,
                    padding: "20px 12px",
                }, children: [_jsx("div", { style: { padding: "0 8px 16px", fontWeight: 700, color: t.accent }, children: brand }), nav] }), _jsx("main", { style: { flex: 1, minWidth: 0 }, children: children })] }));
}
/* ---------- RequestInbox (ready-made widget) ---------- */
/**
 * A complete requests-by-status inbox backed by the Handoff API. Drop it into a
 * dashboard and pass onOpen to route to a detail view.
 */
export function RequestInbox({ onOpen }) {
    const t = useHandoffTheme();
    const { data, loading, error } = useRequests();
    if (loading && !data)
        return _jsx("div", { style: { padding: 24, color: t.muted }, children: "Loading\u2026" });
    if (error)
        return _jsx("div", { style: { padding: 24, color: "#a23a2e" }, children: "Couldn\u2019t load requests." });
    const order = ["submitted", "sent", "in_progress", "draft", "completed", "cancelled"];
    const groups = order
        .map((status) => ({ status, items: (data ?? []).filter((r) => r.status === status) }))
        .filter((g) => g.items.length);
    if (groups.length === 0)
        return _jsx("div", { style: { padding: 24, color: t.muted }, children: "No requests yet." });
    return (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: 24 }, children: groups.map((g) => (_jsxs("section", { children: [_jsxs("div", { style: { marginBottom: 8, fontSize: 12, fontWeight: 600, color: t.faint, textTransform: "uppercase", letterSpacing: 0.4 }, children: [statusLabel[g.status], " \u00B7 ", g.items.length] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: g.items.map((r) => {
                        const done = r.items.filter((i) => i.status === "completed").length;
                        return (_jsxs("div", { onClick: onOpen ? () => onOpen(r) : undefined, style: {
                                ...card(t),
                                padding: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: onOpen ? "pointer" : "default",
                            }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 500, color: t.ink }, children: r.title }), _jsxs("div", { style: { marginTop: 2, fontSize: 13, color: t.muted }, children: [r.customer.name, " \u00B7 ", done, "/", r.items.length, " done"] })] }), _jsx(StatusBadge, { status: r.status })] }, r.id));
                    }) })] }, g.status))) }));
}
/* ---------- helpers ---------- */
function card(t) {
    return { background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius };
}
function hexA(hex, alpha) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
