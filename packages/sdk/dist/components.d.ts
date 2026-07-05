import type { ReactNode } from "react";
import type { RequestStatus, RequestSummary } from "./types";
export declare function StatusBadge({ status }: {
    status: RequestStatus;
}): import("react").JSX.Element;
export declare function StatGrid({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function StatTile({ label, value, hint }: {
    label: string;
    value: ReactNode;
    hint?: string;
}): import("react").JSX.Element;
export interface Column<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    width?: string;
}
export declare function DataTable<T>({ columns, rows, onRowClick, empty, }: {
    columns: Column<T>[];
    rows: T[];
    onRowClick?: (row: T) => void;
    empty?: ReactNode;
}): import("react").JSX.Element;
export declare function DashboardShell({ brand, nav, children, }: {
    brand: ReactNode;
    nav?: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
/**
 * A complete requests-by-status inbox backed by the Handoff API. Drop it into a
 * dashboard and pass onOpen to route to a detail view.
 */
export declare function RequestInbox({ onOpen }: {
    onOpen?: (r: RequestSummary) => void;
}): import("react").JSX.Element;
