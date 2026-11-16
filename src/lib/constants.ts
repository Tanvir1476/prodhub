export const SITE_NAME = "ProdHub";
export const SITE_TAGLINE = "Discover, Share & Manage Products Together.";
export const SITE_DESCRIPTION =
  "A collaborative platform where everyone can explore product information, contribute new listings, and help keep product details accurate and up to date.";

export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Kitchen",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Books & Stationery",
  "Toys & Games",
  "Grocery",
  "Automotive",
  "Other",
] as const;

export const COLOR_SUGGESTIONS = [
  "Black",
  "White",
  "Gray",
  "Silver",
  "Red",
  "Blue",
  "Navy",
  "Green",
  "Olive",
  "Yellow",
  "Orange",
  "Pink",
  "Purple",
  "Brown",
  "Beige",
  "Gold",
  "Teal",
  "Maroon",
  "Cream",
] as const;

export const CHANGEABLE_FIELDS: { value: string; label: string; hint: string }[] = [
  { value: "name", label: "Product name", hint: "Correct the title of the product." },
  { value: "quantity", label: "Quantity", hint: "Update the available stock count." },
  { value: "price", label: "Price (BDT)", hint: "Propose a corrected price in Taka." },
  { value: "colors", label: "Colors", hint: "Comma-separated list, e.g. Black, Navy, Olive." },
  { value: "image_url", label: "Product image", hint: "Upload a better or more accurate photo." },
  { value: "purchase_link", label: "Purchase link", hint: "A working URL where the product can be bought." },
  { value: "description", label: "Description", hint: "Improve or correct the product description." },
  { value: "category", label: "Category", hint: "Move the product to a more suitable category." },
];

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  CHANGEABLE_FIELDS.map((f) => [f.value, f.label])
);

export const PAGE_SIZE = 12;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const MESSAGES = {
  submissionReceived:
    "Thank you for your contribution! Your product submission has been received and is awaiting Admin review.",
  changeRequestReceived:
    "Your change request has been submitted successfully. The Admin will review your suggestion before any updates are applied.",
  deletionRequestReceived:
    "Your removal request has been submitted. The product will stay visible until the Admin reviews and approves the request.",
};
