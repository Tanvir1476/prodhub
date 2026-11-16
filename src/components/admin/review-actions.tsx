"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewRequest } from "@/lib/actions/admin";

type Kind = "submission" | "change_request" | "deletion_request";

const COPY: Record<Kind, { approveTitle: string; approveText: string; approveLabel: string; rejectTitle: string; rejectText: string }> = {
  submission: {
    approveTitle: "Approve & Publish this submission?",
    approveText: "A new product will be created from the submitted details and become visible to all visitors immediately.",
    approveLabel: "Approve & Publish",
    rejectTitle: "Reject this submission?",
    rejectText: "The product will not be published. You can leave a note explaining the decision for the record.",
  },
  change_request: {
    approveTitle: "Approve this change request?",
    approveText: "Every proposed value will be applied to the product right away and recorded in the request history.",
    approveLabel: "Approve & Apply",
    rejectTitle: "Reject this change request?",
    rejectText: "The product stays exactly as it is. Add a rejection reason so the decision is traceable.",
  },
  deletion_request: {
    approveTitle: "Approve removal of this product?",
    approveText: "The product will be archived: hidden from visitors immediately but recoverable from the Products page.",
    approveLabel: "Approve & Archive",
    rejectTitle: "Reject this deletion request?",
    rejectText: "The product remains published. Add a reason for rejecting the request.",
  },
};

interface ReviewActionsProps {
  kind: Kind;
  id: string;
  size?: "sm" | "default";
  /** Called after a successful decision, e.g. to navigate away */
  afterSuccess?: () => void;
  compact?: boolean;
}

export function ReviewActions({ kind, id, size = "sm", afterSuccess, compact }: ReviewActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const copy = COPY[kind];

  const run = (decision: "approve" | "reject") => {
    startTransition(async () => {
      const result = await reviewRequest(kind, decision, { id, note: note.trim() || null });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setDialog(null);
      setNote("");
      afterSuccess?.();
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size={size} variant="success" onClick={() => setDialog("approve")} disabled={pending} aria-label="Approve">
          <Check /> {compact ? null : "Approve"}
        </Button>
        <Button size={size} variant="outline" className="text-destructive hover:bg-red-50 hover:text-destructive" onClick={() => setDialog("reject")} disabled={pending} aria-label="Reject">
          <X /> {compact ? null : "Reject"}
        </Button>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && !pending && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "approve" ? copy.approveTitle : copy.rejectTitle}</DialogTitle>
            <DialogDescription>{dialog === "approve" ? copy.approveText : copy.rejectText}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`note-${id}`}>{dialog === "approve" ? "Admin note (optional)" : "Rejection reason"}</Label>
            <Textarea
              id={`note-${id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={dialog === "approve" ? "e.g. Verified against the manufacturer's site." : "e.g. Could not verify the proposed price."}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            {dialog === "approve" ? (
              <Button variant="success" loading={pending} onClick={() => run("approve")}>
                {!pending && <Check />} {copy.approveLabel}
              </Button>
            ) : (
              <Button variant="destructive" loading={pending} onClick={() => run("reject")}>
                {!pending && <X />} Reject Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
