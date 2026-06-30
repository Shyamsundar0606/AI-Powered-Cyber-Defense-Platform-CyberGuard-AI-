import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CyberGuard AI | Threat Hunting",
};

export default function ThreatHuntingLayout({ children }: { children: ReactNode }) {
  return children;
}

