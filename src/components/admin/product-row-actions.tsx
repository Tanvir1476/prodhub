"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProduct, setProductArchived } from "@/lib/actions/admin";
import type { Product } from "@/lib/types";

export function ProductRowActions({ product, afterDelete }: { product: Pick<Product, "id" | "name" | "is_archived">; afterDelete?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"delete" | "archive" | null>(null);

  const archive = (archived: boolean) =>
    startTransition(async () => {
      const result = await setProductArchived(product.id, archived);
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
      setConfirm(null);
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setConfirm(null);
      if (afterDelete) router.push(afterDelete);
      else router.refresh();
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Product actions" disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${product.id}`}>
              <Eye /> View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Pencil /> Edit product
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {product.is_archived ? (
            <DropdownMenuItem onSelect={() => archive(false)}>
              <ArchiveRestore /> Restore to catalogue
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirm("archive")}>
              <Archive /> Archive (hide)
            </DropdownMenuItem>
          )}
          <DropdownMenuItem destructive onSelect={() => setConfirm("delete")}>
            <Trash2 /> Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && !pending && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete" ? "Delete this product permanently?" : "Archive this product?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete" ? (
                <>
                  <strong>{product.name}</strong> and its image will be removed for good, along with any pending requests that
                  reference it. This cannot be undone. Consider archiving instead if you might need it later.
                </>
              ) : (
                <>
                  <strong>{product.name}</strong> will be hidden from visitors but kept in the database. You can restore it at any time.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm === "delete" ? "destructive" : "default"}
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                if (confirm === "delete") remove();
                else archive(true);
              }}
            >
              {confirm === "delete" ? "Delete permanently" : "Archive product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
