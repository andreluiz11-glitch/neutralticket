"use client";

import { usePathname } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import SiteHeader from "@/components/SiteHeader";

export default function AppHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/api")) {
    return null;
  }

  if (pathname.startsWith("/admin")) {
    return <AdminHeader />;
  }

  return <SiteHeader />;
}