import { NewProductController } from "@/components/product-management/NewProductController";
import { AccountShell } from "@/components/account/AccountShell";
export default async function EditProductPage({ params }: { readonly params: Promise<{ readonly id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  return <AccountShell mode="seller" eyebrow="Studio catalogue" title="Edit product"><NewProductController existingProductId={id} /></AccountShell>;
}
