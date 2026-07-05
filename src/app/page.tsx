import Link from "next/link";

/**
 * Public landing — the 30-second pitch. Server component, no auth. The primary
 * CTA points at /dashboard, which triggers gate login for new/returning staff.
 */
export default function Landing() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl tracking-tight text-brand">Handoff</span>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#how" className="text-muted hover:text-ink">How it works</a>
          <a href="#pricing" className="text-muted hover:text-ink">Pricing</a>
          <Link href="/dashboard" className="font-medium text-ink hover:text-brand">Sign in</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-24 text-center sm:pt-24">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1 text-xs font-medium text-muted">
          For bookkeepers, accountants &amp; fractional finance teams
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Stop chasing clients<br />for documents.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Handoff is the client workspace that kills the email chase. One link, everything you
          need — uploaded, answered, and signed off. In your brand.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-[var(--radius)] bg-brand px-6 py-3 font-medium text-brand-contrast shadow-sm transition-colors hover:bg-brand-ink"
          >
            Start free trial
          </Link>
          <a href="#how" className="rounded-[var(--radius)] px-6 py-3 font-medium text-ink hover:bg-surface-2">
            See how it works →
          </a>
        </div>
        <p className="mt-4 text-xs text-faint">14-day trial · no card required · your clients never need an account</p>
      </section>

      {/* The problem */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-faint">The daily tax</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-display text-xl text-muted sm:text-2xl">
            {["Did you get my email?", "Can you re-send that?", "Any update?", "Which file was it?", "Can you approve this?"].map(
              (q) => (
                <span key={q} className="rounded-lg bg-surface-2 px-3 py-1.5 line-through decoration-brand/60">
                  {q}
                </span>
              ),
            )}
          </div>
          <p className="mt-6 text-muted">All of it, gone. Your clients just open one link and get it done.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="text-center font-display text-3xl tracking-tight text-ink">Three steps. Ten minutes.</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { n: "1", t: "Add a client", d: "A company or a person, and who to contact. No setup wizard." },
            { n: "2", t: "Build a request", d: "A checklist: upload these, answer that, approve this. Reuse it as a template." },
            { n: "3", t: "Send one link", d: "They open it on their phone — no password, no app — and it's done." },
          ].map((s) => (
            <div key={s.n} className="rounded-[calc(var(--radius)+2px)] border border-line bg-surface p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-tint font-display text-lg text-brand-ink">
                {s.n}
              </span>
              <p className="mt-4 font-medium text-ink">{s.t}</p>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-line bg-surface/50">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <h2 className="text-center font-display text-3xl tracking-tight text-ink">Simple pricing</h2>
          <p className="mt-2 text-center text-muted">Priced per seat, never per client. Your best clients shouldn&rsquo;t cost you more.</p>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
            {[
              { name: "Solo", price: "$29", sub: "1 seat", features: ["Unlimited clients", "Branding", "Templates"], featured: false },
              { name: "Firm", price: "$79", sub: "up to 5 seats", features: ["Everything in Solo", "Reminders", "Shared files"], featured: true },
              { name: "Studio", price: "$199", sub: "unlimited seats", features: ["Custom domain", "White-label email", "Priority support"], featured: false },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-[calc(var(--radius)+2px)] border bg-surface p-6 ${p.featured ? "border-brand shadow-md" : "border-line"}`}
              >
                <p className="font-medium text-ink">{p.name}</p>
                <p className="mt-3 font-display text-4xl text-ink">
                  {p.price}
                  <span className="text-base font-normal text-faint">/mo</span>
                </p>
                <p className="text-sm text-faint">{p.sub}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted">
                  {p.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/dashboard"
              className="rounded-[var(--radius)] bg-brand px-6 py-3 font-medium text-brand-contrast shadow-sm transition-colors hover:bg-brand-ink"
            >
              Start your free trial
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 py-10 text-sm text-faint">
        <span className="font-display text-lg text-brand">Handoff</span> · Everything your clients need, after they become clients.
      </footer>
    </div>
  );
}
