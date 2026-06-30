import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CyberGuard AI | Security Operations Center",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}

