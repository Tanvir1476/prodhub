export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Product {
  id: string;
  name: string;
  quantity: number;
  image_url: string | null;
  price: number;
  colors: string[];
  category: string | null;
  description: string | null;
  purchase_link: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSubmission {
  id: string;
  name: string;
  quantity: number;
  image_url: string | null;
  price: number;
  colors: string[];
  category: string | null;
  description: string | null;
  purchase_link: string | null;
  submitter_name: string | null;
  status: ReviewStatus;
  published_product_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
}

export type ChangeableField =
  | "name"
  | "quantity"
  | "price"
  | "colors"
  | "image_url"
  | "purchase_link"
  | "description"
  | "category";

export type RequestedChanges = Partial<Record<ChangeableField, { current: string; proposed: string }>>;

export interface ChangeRequest {
  id: string;
  product_id: string;
  requested_changes: RequestedChanges;
  reason: string;
  evidence_url: string | null;
  submitter_name: string | null;
  status: ReviewStatus;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  products?: Pick<Product, "id" | "name" | "image_url" | "is_archived"> | null;
}

export interface DeletionRequest {
  id: string;
  product_id: string;
  reason: string;
  additional_info: string | null;
  submitter_name: string | null;
  status: ReviewStatus;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  products?: Pick<Product, "id" | "name" | "image_url" | "price" | "quantity" | "is_archived"> | null;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface PublicStats {
  total_products: number;
  available_products: number;
  community_contributions: number;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
