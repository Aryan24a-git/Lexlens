/**
 * Sample legal document fixtures for instant evaluation and demo mode. (prd.md §15, design.md §11)
 */

export interface SampleDocument {
  id: string;
  name: string;
  category: string;
  defaultRole: string;
  suggestedRoles: string[];
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "lease-v1",
    name: "Residential Lease Agreement",
    category: "Real Estate / Tenancy",
    defaultRole: "tenant",
    suggestedRoles: ["tenant", "landlord"],
    content: `RESIDENTIAL LEASE AGREEMENT (V1)

1. PREMISES
Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the residential dwelling located at 742 Evergreen Terrace, Apartment 4B, Springfield ("Premises"), for use solely as a private residential residence.

2. TERM
The term of this Lease shall commence on October 1, 2026 and continue through September 30, 2027 ("Initial Term").

3. RENT & PAYMENTS
Tenant agrees to pay Landlord monthly rent in the amount of $2,200.00 USD, due on the first (1st) day of each calendar month. A grace period of five (5) business days is permitted. If rent is not received by the fifth (5th) business day, Tenant shall pay a late charge of $50.00 USD.

4. SECURITY DEPOSIT & DEDUCTIONS
Upon execution of this Lease, Tenant shall deposit with Landlord the sum of $2,200.00 USD as a security deposit. Within fourteen (14) days after Tenant vacates the Premises, Landlord shall return the deposit minus any deductions for unpaid rent or actual physical damages beyond ordinary wear and tear, accompanied by an itemized written statement.

5. USE OF PREMISES
The Premises shall be occupied exclusively by Tenant and named occupants. Tenant shall not disturb neighbors, commit waste, or conduct unlawful activities on or about the Premises.

6. MAINTENANCE AND REPAIRS
Landlord shall maintain all plumbing, heating, electrical, and structural components of the Premises in good working order. Tenant shall promptly notify Landlord in writing of any defects or needed repairs. Tenant is responsible for basic cleanliness and minor bulb replacements.

7. LANDLORD ENTRY AND ACCESS
Landlord and Landlord's authorized agents may enter the Premises during reasonable business hours for inspections, necessary maintenance, or showing the unit to prospective tenants. Landlord shall provide Tenant with at least forty-eight (48) hours prior written notice, except in cases of bona fide emergency.

8. ASSIGNMENT AND SUBLETTING
Tenant may not assign this Lease or sublet any portion of the Premises without Landlord's prior written consent, which consent shall not be unreasonably withheld or delayed.

9. UTILITIES AND SERVICES
Landlord shall pay for municipal water, sewer, and trash collection. Tenant shall contract and pay directly for electricity, natural gas, internet, and cable services.

10. DEFAULT AND REMEDIES
If Tenant fails to pay rent when due or breaches any material term of this Lease, Landlord may deliver a written notice to cure within seven (7) days. If Tenant fails to cure, Landlord may pursue lawful remedies, including termination of tenancy in accordance with applicable statutory procedures.

11. RENEWAL AND TERMINATION
Upon expiration of the Initial Term, this Lease shall automatically convert to a month-to-month tenancy under the same terms, unless either party gives at least thirty (30) days prior written notice of intent not to renew.

12. INDEMNIFICATION
Tenant agrees to indemnify and hold harmless Landlord from any claims, damages, or liabilities arising from the willful or negligent acts or omissions of Tenant, Tenant's family, or Tenant's guests on the Premises.

13. GOVERNING LAW
This Agreement shall be governed by, and construed in accordance with, the laws of the State of Illinois, without regard to its conflict of laws principles.

14. ENTIRE AGREEMENT
This document constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, oral or written. Any amendment must be in writing and signed by both parties.`,
  },
  {
    id: "lease-v2",
    name: "Residential Lease Agreement (Revised Draft V2)",
    category: "Real Estate / Tenancy",
    defaultRole: "tenant",
    suggestedRoles: ["tenant", "landlord"],
    content: `RESIDENTIAL LEASE AGREEMENT (V2)

1. PREMISES
Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the residential dwelling located at 742 Evergreen Terrace, Apartment 4B, Springfield ("Premises"), for use solely as a private residential residence.

2. TERM
The term of this Lease shall commence on October 1, 2026 and continue through September 30, 2027 ("Initial Term").

3. RENT & PAYMENTS
Tenant agrees to pay Landlord monthly rent in the amount of $2,450.00 USD, due on the first (1st) day of each calendar month. A grace period of two (2) business days is permitted. If rent is not received by the second (2nd) business day, Tenant shall pay a late charge of $125.00 USD.

4. SECURITY DEPOSIT & DEDUCTIONS
Upon execution of this Lease, Tenant shall deposit with Landlord the sum of $2,450.00 USD as a security deposit. Within forty-five (45) days after Tenant vacates the Premises, Landlord shall return the deposit minus any deductions for unpaid rent, physical damages, and a mandatory non-refundable deep cleaning fee of $350.00 USD.

5. USE OF PREMISES
The Premises shall be occupied exclusively by Tenant and named occupants. Tenant shall not disturb neighbors, commit waste, or conduct unlawful activities on or about the Premises.

6. MAINTENANCE AND REPAIRS
Landlord shall maintain all plumbing, heating, electrical, and structural components of the Premises in good working order. Tenant shall promptly notify Landlord in writing of any defects or needed repairs. Tenant is responsible for basic cleanliness and minor bulb replacements.

7. LANDLORD ENTRY AND ACCESS
Landlord and Landlord's authorized agents may enter the Premises at any time with at least twelve (12) hours prior notice for inspections, maintenance, appraisal, or viewing. Landlord may enter without prior notice in any situation deemed urgent by Landlord.

8. ASSIGNMENT AND SUBLETTING
Tenant is strictly prohibited from assigning, transferring, or subletting any portion of the Premises, or listing the Premises on home-sharing or lodging platforms, under any circumstances. Any attempted assignment or sublease is void and constitutes an immediate non-curable default.

9. UTILITIES AND SERVICES
Landlord shall pay for municipal water, sewer, and trash collection. Tenant shall contract and pay directly for electricity, natural gas, internet, and cable services.

10. DEFAULT AND REMEDIES
If Tenant fails to pay rent when due or breaches any material term of this Lease, Landlord may deliver a written notice to cure within seven (7) days. If Tenant fails to cure, Landlord may pursue lawful remedies, including termination of tenancy in accordance with applicable statutory procedures.

11. RENEWAL AND TERMINATION
Upon expiration of the Initial Term, this Lease shall automatically renew for a full subsequent twelve (12) month term at an increased rent determined by Landlord, unless Tenant serves written notice of termination by registered certified mail at least ninety (90) days prior to expiration.

12. INDEMNIFICATION
Tenant agrees to indemnify and hold harmless Landlord from any claims, damages, or liabilities arising from the willful or negligent acts or omissions of Tenant, Tenant's family, or Tenant's guests on the Premises.

13. GOVERNING LAW
This Agreement shall be governed by, and construed in accordance with, the laws of the State of Illinois, without regard to its conflict of laws principles.

14. ENTIRE AGREEMENT
This document constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, oral or written. Any amendment must be in writing and signed by both parties.`,
  },
  {
    id: "freelance",
    name: "Freelance Services Agreement",
    category: "Commercial / Services",
    defaultRole: "freelancer",
    suggestedRoles: ["freelancer", "client"],
    content: `FREELANCE SERVICES AGREEMENT

1. SERVICES AND DELIVERABLES
Contractor agrees to perform the software development, UI design, and technical consulting services described in Statement of Work #1 ("Deliverables"). Contractor shall complete all Deliverables in a timely and workmanlike manner in accordance with the specifications provided by Client.

2. COMPENSATION AND PAYMENT TERMS
Client shall compensate Contractor at the fixed fee rate of $8,500.00 USD. Contractor shall invoice Client upon final milestone delivery. Client shall pay all approved invoices on Net 60 payment terms. No interest or late payment penalty shall accrue on delayed client disbursements.

3. REVISIONS AND ACCEPTANCE
Contractor agrees to make all requested modifications, redesigns, and revisions to the Deliverables without additional compensation, regardless of the number of revision rounds, until Client indicates full subjective satisfaction in writing.

4. INTELLECTUAL PROPERTY AND WORK FOR HIRE
All Deliverables, inventions, source code, designs, and work product created by Contractor under this Agreement shall constitute "work made for hire" owned exclusively by Client from inception. To the extent any rights do not qualify as work made for hire, Contractor hereby irrevocably assigns to Client all worldwide copyright, trademark, patent, trade secret, and moral rights therein.

5. CONFIDENTIALITY
Contractor shall hold in strict confidence all proprietary technical, financial, and business information disclosed by Client. Contractor shall not disclose or use any Confidential Information except as necessary to perform Services under this Agreement. This obligation survives termination indefinitely.

6. TERM AND TERMINATION
This Agreement commences on the Effective Date and continues until completion of Deliverables. Client may terminate this Agreement at any time for convenience upon twenty-four (24) hours written notice. Contractor may not terminate this Agreement prior to satisfactory completion of all agreed Deliverables.

7. NON-SOLICITATION
During the term of this Agreement and for a period of twenty-four (24) months following termination, Contractor shall not directly or indirectly solicit, recruit, hire, or engage any employee, contractor, customer, or vendor of Client, nor induce any counterparty to terminate their relationship with Client.

8. INDEPENDENT CONTRACTOR STATUS
Contractor is an independent contractor, not an employee or agent of Client. Contractor is solely responsible for all federal, state, and local income taxes, self-employment taxes, and worker compensation insurance.

9. LIMITATION OF LIABILITY AND INDEMNITY
Contractor agrees to indemnify and defend Client against all third-party claims arising from Contractor's work. Client's aggregate liability under this Agreement shall not exceed the total fees actually paid to Contractor. Contractor's liability shall not be limited.

10. GOVERNING LAW
This Agreement shall be governed by and construed under the laws of the State of New York, without giving effect to conflicts of law principles.`,
  },
  {
    id: "nda",
    name: "Mutual Non-Disclosure Agreement",
    category: "Confidentiality",
    defaultRole: "receiving_party",
    suggestedRoles: ["disclosing_party", "receiving_party"],
    content: `MUTUAL NON-DISCLOSURE AGREEMENT

1. PURPOSE
The parties wish to explore a potential strategic business collaboration ("Purpose") and in connection therewith may disclose certain confidential and proprietary information to one another.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public technical, business, financial, product, or customer data disclosed by one party ("Disclosing Party") to the other party ("Receiving Party"), whether orally or in writing, that is marked as confidential or that reasonably should be understood to be confidential given the nature of the information.

3. EXCLUSIONS FROM CONFIDENTIALITY
Confidential Information does not include information that: (a) is or becomes publicly known without breach of this Agreement; (b) was already known to Receiving Party prior to disclosure; (c) is independently developed without reference to Disclosing Party's information; or (d) is rightfully received from a third party without duty of confidentiality.

4. OBLIGATIONS OF RECEIVING PARTY
Receiving Party shall protect Disclosing Party's Confidential Information with at least the same degree of care it uses to protect its own confidential information of like nature, but no less than reasonable care. Receiving Party shall not disclose Confidential Information to any third party except to its officers, directors, and legal advisors with a strict need to know who are bound by confidentiality obligations at least as restrictive as those herein.

5. RETURN OR DESTRUCTION OF MATERIALS
Upon written request by Disclosing Party or termination of this Agreement, Receiving Party shall promptly return or certify the permanent destruction of all copies of Confidential Information, retaining only one copy for legal compliance archiving.

6. TERM AND SURVIVAL
This Agreement shall govern disclosures made during a period of one (1) year from the Effective Date. The obligations of confidentiality and non-use shall survive for a period of three (3) years following the date of disclosure.

7. REMEDIES AND INJUNCTIVE RELIEF
Each party acknowledges that any unauthorized disclosure or use of Confidential Information would cause irreparable harm for which monetary damages alone would be inadequate. Accordingly, Disclosing Party shall be entitled to seek equitable relief, including temporary and permanent injunctions, without necessity of posting bond.`,
  },
];
