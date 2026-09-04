import { redirect } from "next/navigation";

export default function LegacyFailurePage() {
  redirect("/checkout/failure");
}
