import { CheckCircle2, Clock, Globe, XCircle, Archive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ReviewStatus } from "@/lib/types";

type Status = ReviewStatus | "published" | "archived";

const MAP: Record<Status, { label: string; variant: "warning" | "success" | "destructive" | "info" | "muted"; Icon: typeof Clock }> = {
  pending: { label: "Pending Review", variant: "warning", Icon: Clock },
  approved: { label: "Approved", variant: "success", Icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", Icon: XCircle },
  published: { label: "Published", variant: "info", Icon: Globe },
  archived: { label: "Archived", variant: "muted", Icon: Archive },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { label, variant, Icon } = MAP[status] ?? MAP.pending;
  return (
    <Badge variant={variant} className={className}>
      <Icon /> {label}
    </Badge>
  );
}

export function AvailabilityBadge({ quantity, className }: { quantity: number; className?: string }) {
  if (quantity <= 0)
    return (
      <Badge variant="destructive" className={className}>
        Out of stock
      </Badge>
    );
  if (quantity <= 5)
    return (
      <Badge variant="warning" className={className}>
        Only {quantity} left
      </Badge>
    );
  return (
    <Badge variant="success" className={className}>
      In stock
    </Badge>
  );
}
