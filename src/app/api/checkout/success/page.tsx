import { redirect } from "next/navigation";

export default function LegacySuccessPage() {
  redirect("/checkout/success");
}
