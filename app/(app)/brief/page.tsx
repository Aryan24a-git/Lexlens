import type { Metadata } from "next";
import Link from "next/link";
import { LawyerBriefView } from "@/features/actions";
import type { LawyerBrief } from "@/core/domain/schemas";

export const metadata: Metadata = {
  title: "Lawyer Consultation Brief — LexLens",
  description:
    "A 2-page, printable client brief summarizing contractual risks, crucial terms, and key questions to ask an attorney during consultation.",
};

const SAMPLE_BRIEF: LawyerBrief = {
  documentMeta: {
    fileName: "Residential_Lease_Agreement.pdf",
    docType: "lease_residential",
    parties: ["Oakridge Realty LLC (Landlord)", "Jane Doe (Tenant)"],
    perspective: "tenant",
    generatedAt: new Date().toISOString(),
  },
  situationSummary:
    "12-month fixed-term residential lease for Unit 4B at 142 Elm Street. The agreement imposes joint and several liability, automatic 12-month renewal unless 60 days advance written notice is tendered, and landlord right of entry on 12 hours notice.",
  topRisks: [
    {
      headline: "Automatic 12-month renewal trap with narrow 60-day notice window",
      clauseId: "C3",
      level: "high",
    },
    {
      headline: "Landlord right of entry with only 12 hours notice (statutory standard is 24 hours)",
      clauseId: "C8",
      level: "high",
    },
    {
      headline: "Strict $100 late penalty on day 3 plus $15 daily compounding fee",
      clauseId: "C5",
      level: "medium",
    },
    {
      headline: "Tenant responsible for all plumbing repairs under $250",
      clauseId: "C11",
      level: "medium",
    },
  ],
  keyTerms: [
    {
      term: "Joint and Several Liability",
      meaning: "Each tenant is 100% legally responsible for the entire rent amount if roommates fail to pay.",
      clauseId: "C2",
    },
    {
      term: "Liquidated Damages for Early Move-Out",
      meaning: "Forfeiture of full security deposit plus mandatory two months rent as termination penalty.",
      clauseId: "C14",
    },
    {
      term: "Habitability Repair Notice",
      meaning: "Tenant must submit all defect reports in writing via certified mail within 48 hours.",
      clauseId: "C9",
    },
  ],
  openQuestions: [
    "Is the 12-hour landlord entry clause enforceable under local tenant protection statutes?",
    "Can the liquidated damages clause of 2 months rent be challenged as an unlawful penalty if the landlord re-rents immediately?",
    "Does local law cap late payment fees or require a mandatory 5-day grace period before penalties accrue?",
    "Can we amend Section 11 to clarify that pre-existing plumbing defects remain landlord responsibility?",
  ],
  missingInfo: [
    "Move-in condition inspection checklist / inventory report",
    "Lead-based paint and local rent ordinance disclosure addenda",
    "Designation of bank where security deposit is held in escrow",
  ],
  suggestedAgenda: [
    "Review enforceability of entry and renewal provisions (10 mins)",
    "Assess financial exposure under liquidated damages and late fee clauses (10 mins)",
    "Formulate 3 specific amendment requests to send landlord before signing (10 mins)",
  ],
  disclaimer:
    "LexLens gives legal information, not legal advice. For decisions that matter, talk to a qualified lawyer.",
};

export default function BriefPage() {
  return (
    <div className="min-h-screen bg-[var(--baize-950)] text-[var(--text-on-dark)] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation back to workspace */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 text-xs font-medium text-[var(--brass-300)] hover:text-[var(--brass-200)] transition-colors"
          >
            <span>←</span>
            <span>Back to Document Workspace</span>
          </Link>

          <span className="text-xs text-[var(--text-on-dark-2)]">
            Print Preview & Dossier
          </span>
        </div>

        {/* Lawyer Brief Viewer */}
        <LawyerBriefView brief={SAMPLE_BRIEF} isLoading={false} />
      </div>
    </div>
  );
}
