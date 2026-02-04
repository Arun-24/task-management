"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FocusFlowDashboard from "@/components/ui/dashboard";
import { getAuthToken } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) router.replace("/signin");
  }, [router]);

  return <FocusFlowDashboard />;
}
