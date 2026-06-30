import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CyberGuard AI | AI SOC Analyst",
};

export default function SocAnalystLayout({ children }: { children: ReactNode }) {
  return children;
}

