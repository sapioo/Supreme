export const draftingTemplates = [
  {
    id: 'legal-notice',
    name: 'Legal Notice',
    shortName: 'Notice',
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
    id: 'legal-memo',
    name: 'Legal Memo',
    shortName: 'Memo',
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
    id: 'petition',
    name: 'Petition',
    shortName: 'Petition',
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
    id: 'brief',
    name: 'Brief / Written Submission',
    shortName: 'Brief',
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
];

export function getDraftingTemplate(templateId) {
  return draftingTemplates.find((template) => template.id === templateId) || draftingTemplates[0];
}
