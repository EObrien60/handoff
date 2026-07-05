import type { ReactNode, CSSProperties } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organisations } from "@/db/schema";
import { currentContact } from "@/lib/portal-route";

/**
 * Client (Contact) portal shell — white-labelled per organisation. The firm's
 * name and accent colour brand the whole surface, so the client feels like
 * they're dealing with the firm, not "portal software". No Handoff branding.
 */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await currentContact();
  const org = session
    ? await db.query.organisations.findFirst({ where: eq(organisations.id, session.organisationId) })
    : null;

  const brandStyle = org?.accentColor
    ? ({ "--brand": org.accentColor } as CSSProperties)
    : undefined;

  return (
    <div style={brandStyle} className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line bg-surface/70">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 py-4">
          {org?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt={org.name} className="h-7 w-auto" />
          ) : (
            <span className="font-display text-lg tracking-tight text-brand">{org?.name ?? "Workspace"}</span>
          )}
        </div>
      </header>
      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">{children}</div>
      <footer className="mx-auto w-full max-w-2xl px-5 py-6 text-center text-xs text-faint">
        Secured by {org?.name ?? "your provider"}
      </footer>
    </div>
  );
}
