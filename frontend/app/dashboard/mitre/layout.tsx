import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CyberGuard AI | MITRE ATT&CK",
};

export default function MitreLayout({ children }: { children: ReactNode }) {
  return children;
}

