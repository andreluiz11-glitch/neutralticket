import { redirect } from "next/navigation";

export default function LegacyPendingPage() {
  redirect("/checkout/pending");
}
