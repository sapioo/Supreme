export const draftingTemplates = [
  {
    id: 'legal-notice',
    name: 'Legal Notice',
    shortName: 'Notice',
    category: 'Pre-litigation',
    description: 'A structured notice for demand, breach, recovery, or pre-litigation action.',
    source: String.raw`\documentclass[12pt]{article}
\title{LEGAL NOTICE}
\author{[LAWYER / FIRM NAME]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Addressee}
To,
[NAME OF NOTICE RECIPIENT]
[ADDRESS]

\section{Client Details}
Under instructions from and on behalf of my client, [CLIENT NAME], residing at [CLIENT ADDRESS], I issue this legal notice.

\section{Facts}
1. That [STATE THE FIRST MATERIAL FACT].
2. That [STATE THE SECOND MATERIAL FACT].
3. That despite repeated requests, [STATE DEFAULT / BREACH / OMISSION].

\section{Legal Grounds}
The acts and omissions described above constitute breach of legal obligation and have caused loss, prejudice, and avoidable hardship to my client.

\section{Demand}
You are hereby called upon to [STATE DEMAND] within [NUMBER] days from receipt of this notice.

\section{Consequences}
Failing compliance, my client shall be constrained to initiate appropriate civil and/or criminal proceedings at your risk as to costs and consequences.

\section{Closing}
A copy of this notice is retained in my office for record and future action.

\end{document}`,
  },
  {
    id: 'reply-notice',
    name: 'Reply Notice',
    shortName: 'Reply',
    category: 'Pre-litigation',
    description: 'A defensive response to a received notice with denials, clarifications, and reservations.',
    source: String.raw`\documentclass[12pt]{article}
\title{REPLY TO LEGAL NOTICE}
\author{On behalf of [CLIENT NAME]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Reference}
This reply is issued in response to your notice dated [DATE] addressed to my client, [CLIENT NAME].

\section{Preliminary Position}
The allegations set out in your notice are denied except to the extent expressly admitted herein.

\section{Clarified Facts}
1. That [STATE THE CORRECT FACTUAL BACKGROUND].
2. That [STATE MATERIAL OMISSION OR MISCHARACTERISATION].
3. That my client has at all times acted in accordance with law and contractual obligations.

\section{Legal Response}
Your claims are misconceived in law and on facts for reasons including [STATE KEY LEGAL DEFENCE].

\section{Reservation of Rights}
My client reserves all rights and remedies available in law and equity.

\section{Without Prejudice Resolution}
Without prejudice to the above, my client remains willing to discuss an amicable resolution on terms acceptable in law.

\end{document}`,
  },
  {
    id: 'legal-memo',
    name: 'Legal Memo',
    shortName: 'Memo',
    category: 'Advisory',
    description: 'An internal advisory memo for issues, analysis, risk, and recommended action.',
    source: String.raw`\documentclass[12pt]{article}
\title{LEGAL MEMORANDUM}
\author{Prepared for: [CLIENT / PARTNER]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Question Presented}
[STATE THE LEGAL QUESTION IN ONE OR TWO SENTENCES.]

\section{Short Answer}
[STATE THE PRACTICAL ANSWER AND LIKELY OUTCOME.]

\section{Facts}
[SUMMARISE THE MATERIAL FACTS RELEVANT TO THE QUESTION.]

\section{Applicable Law}
[IDENTIFY STATUTES, RULES, CONTRACTUAL CLAUSES, AND CASE LAW.]

\section{Analysis}
[APPLY THE LAW TO THE FACTS. DEAL WITH BOTH SUPPORTING AND ADVERSE POINTS.]

\section{Risk Assessment}
[SET OUT LITIGATION, COMMERCIAL, TIMELINE, AND EVIDENTIARY RISKS.]

\section{Recommendation}
[STATE THE RECOMMENDED NEXT STEPS.]

\end{document}`,
  },
  {
    id: 'opinion-letter',
    name: 'Opinion Letter',
    shortName: 'Opinion',
    category: 'Advisory',
    description: 'A client-facing legal opinion with issue framing, assumptions, and reasoned conclusions.',
    source: String.raw`\documentclass[12pt]{article}
\title{LEGAL OPINION}
\author{Issued by [LAWYER / FIRM]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Instructions}
This opinion is issued on the basis of instructions and documents provided by [CLIENT NAME].

\section{Questions for Opinion}
1. Whether [QUESTION 1].
2. Whether [QUESTION 2].

\section{Assumptions and Scope}
This opinion proceeds on the assumption that [STATE MATERIAL ASSUMPTIONS] and is limited to [SCOPE].

\section{Relevant Law}
[SET OUT THE GOVERNING STATUTES, RULES, AND AUTHORITIES.]

\section{Opinion}
[PROVIDE THE REASONED VIEW AND QUALIFICATIONS.]

\section{Recommended Action}
[SET OUT PRACTICAL NEXT STEPS.]

\end{document}`,
  },
  {
    id: 'petition',
    name: 'Petition',
    shortName: 'Petition',
    category: 'Litigation',
    description: 'A litigation petition skeleton with parties, facts, grounds, and prayer.',
    source: String.raw`\documentclass[12pt]{article}
\title{IN THE [COURT / TRIBUNAL] AT [PLACE]}
\author{[PETITIONER] Versus [RESPONDENT]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Cause Title}
[PETITIONER NAME AND DETAILS]

Versus

[RESPONDENT NAME AND DETAILS]

\section{Jurisdiction}
This Hon'ble Court has jurisdiction to entertain the present petition because [STATE JURISDICTIONAL BASIS].

\section{Facts}
1. That [MATERIAL FACT 1].
2. That [MATERIAL FACT 2].
3. That the cause of action arose on [DATE / PERIOD].

\section{Grounds}
A. Because [LEGAL GROUND 1].
B. Because [LEGAL GROUND 2].
C. Because the impugned action is arbitrary, unlawful, and contrary to settled legal principles.

\section{Interim Relief}
Pending final disposal, the Petitioner prays that this Hon'ble Court may [STATE INTERIM RELIEF].

\section{Prayer}
In view of the facts and grounds stated above, it is most respectfully prayed that this Hon'ble Court may be pleased to:

1. [PRIMARY RELIEF].
2. [ANCILLARY RELIEF].
3. Pass such other order as this Hon'ble Court may deem fit and proper.

\section{Annexures}
Annexure P-1: [DESCRIPTION]
Annexure P-2: [DESCRIPTION]

\end{document}`,
  },
  {
    id: 'written-statement',
    name: 'Written Statement',
    shortName: 'Statement',
    category: 'Litigation',
    description: 'A defendant-side pleading with preliminary objections, para-wise replies, and prayer.',
    source: String.raw`\documentclass[12pt]{article}
\title{WRITTEN STATEMENT}
\author{Filed by [DEFENDANT NAME]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Introductory Submission}
The Defendant submits this written statement in answer to the plaint filed by the Plaintiff.

\section{Preliminary Objections}
1. That the suit is not maintainable for [GROUND].
2. That this Hon'ble Court lacks [JURISDICTION / CAUSE OF ACTION / LIMITATION COMPLIANCE].

\section{Para-wise Reply}
Paragraph 1: [ADMIT / DENY / PARTLY ADMIT WITH EXPLANATION].

Paragraph 2: [ADMIT / DENY / PARTLY ADMIT WITH EXPLANATION].

\section{Additional Facts}
[SET OUT DEFENDANT'S POSITIVE CASE.]

\section{Legal Defence}
[STATE CONTRACTUAL, STATUTORY, PROCEDURAL, OR EQUITABLE DEFENCES.]

\section{Prayer}
It is respectfully prayed that the suit be dismissed with costs and such further orders as this Hon'ble Court deems fit.

\end{document}`,
  },
  {
    id: 'bail-application',
    name: 'Bail Application',
    shortName: 'Bail',
    category: 'Criminal',
    description: 'A criminal application format for facts, grounds for bail, and undertakings.',
    source: String.raw`\documentclass[12pt]{article}
\title{APPLICATION FOR BAIL}
\author{Filed by [ACCUSED NAME]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Case Particulars}
FIR No. [NUMBER], Police Station [NAME], under Sections [SECTIONS].

\section{Applicant Background}
[STATE PERSONAL DETAILS, CUSTODY PERIOD, AND RELEVANT CIRCUMSTANCES.]

\section{Facts}
[SUMMARISE THE PROSECUTION CASE BRIEFLY AND FAIRLY.]

\section{Grounds for Bail}
1. That the Applicant is innocent and has been falsely implicated.
2. That investigation is [COMPLETE / SUBSTANTIALLY COMPLETE].
3. That no useful purpose will be served by continued incarceration.

\section{Undertakings}
The Applicant undertakes to cooperate with investigation and abide by all conditions imposed by this Hon'ble Court.

\section{Prayer}
It is respectfully prayed that the Applicant be released on bail on such terms as this Hon'ble Court deems fit.

\end{document}`,
  },
  {
    id: 'brief',
    name: 'Brief / Written Submission',
    shortName: 'Brief',
    category: 'Litigation',
    description: 'A court-ready submission outline for issues, propositions, and relief.',
    source: String.raw`\documentclass[12pt]{article}
\title{WRITTEN SUBMISSIONS}
\author{On behalf of [PARTY NAME]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Overview}
[STATE THE CORE POSITION OF THE PARTY IN A CONCISE OPENING.]

\section{Issues}
1. Whether [ISSUE 1].
2. Whether [ISSUE 2].

\section{Statement of Facts}
[SET OUT THE FACTUAL BACKGROUND IN CHRONOLOGICAL ORDER.]

\section{Submissions}
I. [FIRST PROPOSITION OF LAW]

[DEVELOP THE ARGUMENT WITH FACTS, LAW, AND AUTHORITIES.]

II. [SECOND PROPOSITION OF LAW]

[DEVELOP THE ARGUMENT WITH FACTS, LAW, AND AUTHORITIES.]

\section{Authorities}
1. [CASE / STATUTE / RULE]
2. [CASE / STATUTE / RULE]

\section{Relief Sought}
For the reasons stated above, it is respectfully submitted that [STATE RELIEF / OUTCOME SOUGHT].

\end{document}`,
  },
  {
    id: 'affidavit',
    name: 'Affidavit',
    shortName: 'Affidavit',
    category: 'Evidence',
    description: 'A sworn statement format for facts, verification, and annexure references.',
    source: String.raw`\documentclass[12pt]{article}
\title{AFFIDAVIT}
\author{[DEPONENT NAME]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Deponent Details}
I, [NAME], aged about [AGE] years, residing at [ADDRESS], do hereby solemnly affirm and state as under:

\section{Statement of Facts}
1. That [FACT 1].
2. That [FACT 2].
3. That the contents of this affidavit are true to my knowledge and belief.

\section{Documents Relied Upon}
Annexure A: [DESCRIPTION]
Annexure B: [DESCRIPTION]

\section{Verification}
Verified at [PLACE] on [DATE] that the contents of this affidavit are true and correct to my knowledge and belief.

\end{document}`,
  },
  {
    id: 'board-resolution',
    name: 'Board Resolution',
    shortName: 'Resolution',
    category: 'Corporate',
    description: 'A corporate authorization draft for approvals, signatories, and implementation steps.',
    source: String.raw`\documentclass[12pt]{article}
\title{CERTIFIED TRUE COPY OF BOARD RESOLUTION}
\author{[COMPANY NAME]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Meeting Details}
A meeting of the Board of Directors of [COMPANY NAME] was held on [DATE] at [PLACE / MODE].

\section{Background}
The Board considered the proposal concerning [TRANSACTION / AUTHORISATION / APPOINTMENT].

\section{Resolved}
RESOLVED THAT [STATE PRIMARY APPROVAL].

\section{Further Resolved}
RESOLVED FURTHER THAT [AUTHORISE SPECIFIC OFFICER / SIGNATORY] to do all acts, deeds, and things necessary to give effect to this resolution.

\section{Certification}
Certified to be a true copy of the resolution passed by the Board of Directors.

\end{document}`,
  },
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    shortName: 'Agreement',
    category: 'Contracts',
    description: 'A compact services contract with scope, fees, term, confidentiality, and liability terms.',
    source: String.raw`\documentclass[12pt]{article}
\title{SERVICE AGREEMENT}
\author{Between [SERVICE PROVIDER] and [CLIENT]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Parties}
This Agreement is entered into between [SERVICE PROVIDER DETAILS] and [CLIENT DETAILS].

\section{Scope of Services}
[DESCRIBE THE SERVICES, DELIVERABLES, AND PERFORMANCE EXPECTATIONS.]

\section{Fees and Payment}
[SET OUT FEES, INVOICING, TAXES, AND PAYMENT TIMELINES.]

\section{Term and Termination}
This Agreement shall commence on [DATE] and continue until [DATE / EVENT], unless terminated earlier in accordance with this Agreement.

\section{Confidentiality}
Each party shall keep confidential all non-public information disclosed in connection with this Agreement.

\section{Liability and Indemnity}
[ALLOCATE RISK, LIMITS OF LIABILITY, AND INDEMNITIES.]

\section{Governing Law}
This Agreement shall be governed by the laws of [JURISDICTION].

\end{document}`,
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    shortName: 'NDA',
    category: 'Contracts',
    description: 'A confidentiality agreement for disclosures, permitted use, exclusions, and remedies.',
    source: String.raw`\documentclass[12pt]{article}
\title{NON-DISCLOSURE AGREEMENT}
\author{Between [DISCLOSING PARTY] and [RECEIVING PARTY]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Purpose}
The parties wish to exchange certain confidential information in connection with [TRANSACTION / DISCUSSION].

\section{Definition of Confidential Information}
Confidential Information includes [DATA / MATERIALS / ORAL DISCLOSURES] designated or understood to be confidential.

\section{Receiving Party Obligations}
The Receiving Party shall use the Confidential Information solely for the stated purpose and protect it with reasonable care.

\section{Exclusions}
Confidential Information does not include information that is public, independently developed, or lawfully received from a third party.

\section{Term}
The confidentiality obligations under this Agreement shall continue for [PERIOD].

\section{Remedies}
The parties agree that unauthorised disclosure may cause irreparable harm and entitle the Disclosing Party to equitable relief.

\end{document}`,
  },
  {
    id: 'employment-contract',
    name: 'Employment Contract',
    shortName: 'Employment',
    category: 'HR',
    description: 'An employment offer and terms template with duties, compensation, and termination clauses.',
    source: String.raw`\documentclass[12pt]{article}
\title{EMPLOYMENT AGREEMENT}
\author{Between [EMPLOYER] and [EMPLOYEE]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Appointment}
[EMPLOYER] appoints [EMPLOYEE] as [DESIGNATION] with effect from [DATE].

\section{Duties and Reporting}
[STATE ROLE, RESPONSIBILITIES, AND REPORTING LINE.]

\section{Compensation and Benefits}
[SET OUT SALARY, BONUS, ALLOWANCES, AND BENEFITS.]

\section{Confidentiality and IP}
The Employee shall maintain confidentiality and assign all work product and intellectual property created in the course of employment.

\section{Leave and Conduct}
[STATE LEAVE ENTITLEMENTS, POLICIES, AND MISCONDUCT EXPECTATIONS.]

\section{Termination}
Either party may terminate employment in accordance with [NOTICE PERIOD / GROUNDS].

\end{document}`,
  },
  {
    id: 'contract-review-note',
    name: 'Contract Review Note',
    shortName: 'Review Note',
    category: 'Advisory',
    description: 'A clause-by-clause review note for red flags, negotiation asks, and fallback positions.',
    source: String.raw`\documentclass[12pt]{article}
\title{CONTRACT REVIEW NOTE}
\author{Prepared for [CLIENT / TEAM]}
\date{[DATE]}

\begin{document}
\maketitle

\section{Document Reviewed}
[IDENTIFY THE AGREEMENT, VERSION, AND COUNTERPARTY.]

\section{Commercial Context}
[STATE THE DEAL OBJECTIVE, TIMELINE, AND BUSINESS SENSITIVITIES.]

\section{Priority Issues}
1. [ISSUE / RED FLAG 1].
2. [ISSUE / RED FLAG 2].
3. [ISSUE / RED FLAG 3].

\section{Clause Comments}
[SUMMARISE COMMENTS CLAUSE BY CLAUSE.]

\section{Negotiation Position}
[SET OUT MUST-HAVES, NICE-TO-HAVES, AND FALLBACKS.]

\section{Recommendation}
[STATE WHETHER TO SIGN, RENEGOTIATE, OR HOLD.]

\end{document}`,
  },
];

export function getDraftingTemplate(templateId) {
  return draftingTemplates.find((template) => template.id === templateId) || draftingTemplates[0];
}
