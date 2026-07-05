import { Card } from "@/components/ui";

export default function ExpiredPage() {
  return (
    <Card className="p-8 text-center">
      <h1 className="font-display text-2xl text-ink">This link has expired</h1>
      <p className="mt-2 text-sm text-muted">
        Sign-in links are single-use and expire after 15 minutes. Please ask for a fresh link, or open the most
        recent email we sent you.
      </p>
    </Card>
  );
}
