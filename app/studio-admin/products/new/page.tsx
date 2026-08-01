import { NewProductController } from "@/components/product-management/NewProductController";
import { AccountShell } from "@/components/account/AccountShell";
export default function NewProductPage(): React.JSX.Element {
  return <AccountShell mode="seller" eyebrow="Studio catalogue" title="List a product"><NewProductController /></AccountShell>;
}
