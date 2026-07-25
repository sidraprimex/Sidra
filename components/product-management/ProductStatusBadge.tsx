import type { ProductStatus } from "@/types/phase4-product";

const labels: Record<ProductStatus, string> = {
  draft: "Draft",
  pendingReview: "Pending review",
  approved: "Approved",
  published: "Published",
  hidden: "Hidden",
  archived: "Archived",
  suspended: "Suspended",
};

export function ProductStatusBadge({ status }: { readonly status: ProductStatus }): React.JSX.Element {
  return (
    <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
      {labels[status]}
    </span>
  );
}
