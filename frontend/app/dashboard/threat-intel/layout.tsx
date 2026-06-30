import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CyberGuard AI | Threat Intelligence",
};

export default function ThreatIntelLayout({ children }: { children: ReactNode }) {
  return children;
}

