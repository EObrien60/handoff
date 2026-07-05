"use client";

import { PageHeader } from "../_components/app-shell";
import { EmptyState } from "@/components/ui";

export default function FilesPage() {
  return (
    <>
      <PageHeader title="Files" description="Documents shared with your clients." />
      <EmptyState title="Files are coming soon" description="Files uploaded through requests will appear here, per client." />
    </>
  );
}
