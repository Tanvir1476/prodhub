import { StatusBadge } from "@/components/status-badge";

const MAP: Record<string, { text: string; status?: "approved" | "rejected" | "published" | "archived" }> = {
  "submission.approved": { text: "Published submission", status: "published" },
  "submission.rejected": { text: "Rejected submission", status: "rejected" },
  "change_request.approved": { text: "Applied change request to", status: "approved" },
  "change_request.rejected": { text: "Rejected change request for", status: "rejected" },
  "deletion_request.approved": { text: "Archived via deletion request", status: "archived" },
  "deletion_request.rejected": { text: "Rejected deletion request for", status: "rejected" },
  "product.created": { text: "Created product" },
  "product.updated": { text: "Updated product" },
  "product.deleted": { text: "Permanently deleted" },
  "product.archived": { text: "Archived product", status: "archived" },
  "product.restored": { text: "Restored product", status: "published" },
};

export function describeAction(action: string) {
  return MAP[action] ?? { text: action };
}

export function ActionLabel({ action, withBadge = true }: { action: string; withBadge?: boolean }) {
  const entry = describeAction(action);
  return (
    <>
      {entry.text}
      {withBadge && entry.status && <StatusBadge status={entry.status} className="ml-1.5 align-middle" />}
    </>
  );
}
