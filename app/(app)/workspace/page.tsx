import type { Metadata } from "next";
import { WorkspaceView } from "@/features/workspace";

export const metadata: Metadata = {
  title: "Analyze a Document — LexLens",
  description:
    "Upload a contract, lease, or policy to analyze. LexLens explains it in plain language, flags risks, and structures clauses with verified citations.",
};

export default function WorkspacePage() {
  return <WorkspaceView />;
}
