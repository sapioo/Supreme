/**
 * Landmark Indian Cases - CourtRoom AI Data
 * Each case contains the simulation fields plus a richer real-case dossier.
 */

const cases = [
  {
    id: 'ram-janmabhoomi',
    name: 'M Siddiq (D) Thr Lrs v. Mahant Suresh Das & Ors',
    shortName: 'Ram Janmabhoomi v. Babri Masjid',
    year: 2019,
    court: 'Supreme Court of India',
    courtBadge: 'SC',
    summary: 'The historic land title dispute over the site in Ayodhya, balancing faith, history, property law, and constitutional secularism.',
    difficulty: 5,
    tags: ['Property Law', 'Constitutional Law', 'Religious Rights'],
    articles: ['Article 14', 'Article 15', 'Article 25', 'Article 26', 'Article 142'],
    caseDetails: {
      citation: '2019 SCC OnLine SC 1440; (2020) 1 SCC 1',
      caseNumber: 'Civil Appeal Nos. 10866-10867 of 2010',
      decisionDate: '2019-11-09',
      bench: ['Ranjan Gogoi CJI', 'S.A. Bobde J', 'D.Y. Chandrachud J', 'Ashok Bhushan J', 'S. Abdul Nazeer J'],
      jurisdiction: 'Civil appellate jurisdiction; title dispute appeals from the Allahabad High Court',
      caseType: 'Constitution Bench civil appeals concerning title, possession, religious endowment, and constitutional principles',
      legalProvisions: [
        'Constitution of India: Articles 25, 26, 142',
        'Places of Worship (Special Provisions) Act, 1991: Section 5 exception',
        'Evidence Act principles on title, possession, documentary evidence, and expert evidence',
        'Limitation and adverse possession principles'
      ],
      facts: [
        'The dispute concerned title and possession over the 2.77 acre disputed site in Ayodhya.',
        'Hindu parties asserted that the site was the birthplace of Lord Ram and that Ram Lalla Virajman was a juristic person.',
        'Muslim parties asserted title and possession based on the Babri Masjid, said to have existed since 1528.',
        'The Babri Masjid was demolished on 6 December 1992 during pending legal proceedings.'
      ],
      proceduralHistory: [
        'Multiple civil suits over title and possession were filed before the trial court.',
        'The Allahabad High Court delivered a 2010 judgment dividing the disputed land into three parts.',
        'The Supreme Court heard appeals against the Allahabad High Court judgment and conducted extensive final hearings in 2019.'
      ],
      issues: [
        'Who held title to the disputed land?',
        'Whether Ram Lalla Virajman could sue as a juristic person.',
        'Whether Nirmohi Akhara had a maintainable shebait claim.',
        'How documentary evidence, oral evidence, archaeological evidence, possession, and worship practices should be weighed.',
        'What relief would do complete justice after the 1992 demolition.'
      ],
      holdings: [
        'The entire disputed site was awarded for the construction of a Ram temple through a trust to be created by the Union Government.',
        'The Sunni Central Waqf Board was directed to receive an alternative five-acre plot in Ayodhya.',
        'The Nirmohi Akhara suit was held to be barred by limitation, though representation in the trust could be considered.',
        'The demolition of the mosque and prior desecration were treated as serious violations of law.'
      ],
      finalOrder: 'Union Government directed to formulate a scheme and create a trust for temple construction; alternative five-acre land directed for the Sunni Central Waqf Board.',
      significance: 'A major title dispute judgment combining property law, religious endowment law, evidence, secularism, and Article 142 remedial power.',
      relatedCases: ['Ismail Faruqui v. Union of India', 'S.R. Bommai v. Union of India'],
      sourceDocuments: [
        { label: 'Supreme Court Observer case page', type: 'case summary', url: 'https://www.scobserver.in/cases/m-siddiq-v-mahant-das-ayodhya-title-dispute-case-background/' },
        { label: 'Indian Kanoon judgment search', type: 'judgment text', url: 'https://indiankanoon.org/search/?formInput=M%20Siddiq%20Mahant%20Suresh%20Das%209%20November%202019' }
      ],
      documentsExpected: ['Final judgment', 'Allahabad High Court judgment', 'civil suit records', 'ASI report references', 'pleadings', 'written submissions']
    },
    petitioner: {
      name: 'M Siddiq (Sunni Waqf Board)',
      position: 'Claimant of Babri Masjid Title',
      description: 'Argued that the Babri Masjid stood on the disputed site since 1528, and the Muslim community held continuous title. Challenged the demolition as unconstitutional and demanded restoration of the mosque or full title rights to the land.',
      keyArgs: [
        'The mosque stood for over 450 years; continuous possession establishes legal title under settled property law.',
        'Demolition of the mosque in 1992 was an act of criminal destruction; the court cannot reward illegality.',
        'Under Articles 25 and 26, freedom of religion includes the right to maintain places of worship without interference.',
        'Archaeological evidence is inconclusive and cannot override documented historical possession.',
        'The Places of Worship Act, 1991 mandates maintaining the religious character of places as they existed on 15 August 1947.'
      ]
    },
    respondent: {
      name: 'Mahant Suresh Das (Ram Lalla Virajman)',
      position: 'Deity as Juristic Person - Claimant of Birthplace',
      description: 'Argued that the disputed site is the birthplace of Lord Ram, that the deity holds juristic personality and inherent title to the land, and that faith and archaeological evidence support the Hindu claim to the site.',
      keyArgs: [
        'Ram Lalla Virajman, the deity as a juristic person, has an inherent and inalienable right to the birthplace.',
        'Archaeological Survey of India evidence confirms a pre-existing non-Islamic structure beneath the mosque.',
        'The belief in Ram Janmasthan is ancient, unbroken, and constitutionally protected under Articles 25 and 26.',
        'The doctrine of adverse possession cannot extinguish the rights of a deity; a deity never abandons its seat.',
        'Hindu religious texts and traveller accounts across centuries support Ayodhya as the birthplace of Lord Ram.'
      ]
    }
  },
  {
    id: 'kesavananda-bharati',
    name: 'Kesavananda Bharati v. State of Kerala',
    shortName: 'Kesavananda Bharati v. State of Kerala',
    year: 1973,
    court: 'Supreme Court of India',
    courtBadge: 'SC',
    summary: 'The foundational case that established the Basic Structure Doctrine: Parliament cannot amend the Constitution to destroy its essential features.',
    difficulty: 5,
    tags: ['Constitutional Law', 'Basic Structure', 'Fundamental Rights'],
    articles: ['Article 13', 'Article 31', 'Article 32', 'Article 368'],
    caseDetails: {
      citation: '(1973) 4 SCC 225; AIR 1973 SC 1461',
      caseNumber: 'Writ Petition (Civil) No. 135 of 1970',
      decisionDate: '1973-04-24',
      bench: [
        'S.M. Sikri CJI',
        'J.M. Shelat J',
        'K.S. Hegde J',
        'A.N. Grover J',
        'A.N. Ray J',
        'P. Jaganmohan Reddy J',
        'D.G. Palekar J',
        'H.R. Khanna J',
        'K.K. Mathew J',
        'M.H. Beg J',
        'S.N. Dwivedi J',
        'A.K. Mukherjea J',
        'Y.V. Chandrachud J'
      ],
      jurisdiction: 'Original writ jurisdiction under Article 32',
      caseType: 'Thirteen-judge Constitution Bench writ petition challenging constitutional amendments and land reform laws',
      legalProvisions: [
        'Constitution of India: Articles 13, 31, 32, 368',
        'Constitution (24th Amendment) Act, 1971',
        'Constitution (25th Amendment) Act, 1971',
        'Constitution (29th Amendment) Act, 1972',
        'Kerala Land Reforms legislation'
      ],
      facts: [
        'Kesavananda Bharati, head of a Kerala religious mutt, challenged land reform measures affecting mutt property.',
        'The case became a wider constitutional challenge to Parliament power to amend fundamental rights.',
        'The Court considered whether constitutional amendment power under Article 368 had implied limits.'
      ],
      proceduralHistory: [
        'Earlier cases including Shankari Prasad, Sajjan Singh, and Golaknath had produced conflicting views on amendment power.',
        'A thirteen-judge bench was constituted to settle the scope of Article 368.',
        'The judgment was delivered by a narrow 7-6 majority on the basic structure limitation.'
      ],
      issues: [
        'Can Parliament amend any part of the Constitution, including fundamental rights?',
        'Is a constitutional amendment law for the purpose of Article 13?',
        'Does Article 368 contain implied limits?',
        'Are the 24th, 25th, and 29th Amendments constitutionally valid?'
      ],
      holdings: [
        'Parliament has wide power to amend the Constitution, including fundamental rights.',
        'Parliament cannot alter or destroy the basic structure or essential features of the Constitution.',
        'The 24th Amendment was upheld.',
        'Parts of the 25th Amendment were read down or limited.',
        'The basic structure doctrine became the controlling test for future constitutional amendments.'
      ],
      finalOrder: 'Amendment power upheld subject to the basic structure limitation.',
      significance: 'The leading Indian constitutional law precedent on limited constituent power, judicial review, and preservation of constitutional identity.',
      relatedCases: ['Shankari Prasad v. Union of India', 'Sajjan Singh v. State of Rajasthan', 'I.C. Golaknath v. State of Punjab', 'Minerva Mills v. Union of India'],
      sourceDocuments: [
        { label: 'Indian Kanoon judgment search', type: 'judgment text', url: 'https://indiankanoon.org/search/?formInput=Kesavananda%20Bharati%20State%20of%20Kerala%2024%20April%201973' },
        { label: 'Supreme Court Observer case page', type: 'case summary', url: 'https://www.scobserver.in/cases/kesavananda-bharati-v-state-of-kerala-basic-structure-case-background/' }
      ],
      documentsExpected: ['Final judgment', 'separate judicial opinions', 'writ petition', 'constitutional amendment texts', 'land reform statutes']
    },
    petitioner: {
      name: 'Kesavananda Bharati Sripadagalvaru',
      position: 'Challenger of Unlimited Amendment Power',
      description: 'A religious leader from Kerala who challenged the 29th Amendment that placed the Kerala Land Reforms Act in the Ninth Schedule, arguing that Parliament power to amend the Constitution is not unlimited and cannot destroy fundamental rights.',
      keyArgs: [
        'Fundamental rights form the core identity of the Constitution.',
        'Parliament derives its power from the Constitution; it cannot use that power to destroy the source itself.',
        'The Ninth Schedule cannot be used as a shield to immunize legislation from fundamental rights review.',
        'Article 368 grants power to amend, not to rewrite or destroy the Constitution.',
        'The framers intended fundamental rights to remain meaningful and judicially enforceable.'
      ]
    },
    respondent: {
      name: 'State of Kerala',
      position: 'Defender of Parliamentary Sovereignty',
      description: 'Argued that Parliament, as the supreme representative body, has unlimited power to amend any provision of the Constitution under Article 368, including fundamental rights, to fulfill the directive principles of state policy.',
      keyArgs: [
        'Article 368 confers broad amendment power with no express substantive limitations.',
        'Elected representatives must have power to reshape constitutional law for social justice.',
        'Land reforms are essential to fulfill Directive Principles under Part IV.',
        'The Golaknath decision was wrongly decided and should be overruled.',
        'Judicial review of constitutional amendments can undermine democratic governance.'
      ]
    }
  },
  {
    id: 'navtej-johar',
    name: 'Navtej Singh Johar v. Union of India',
    shortName: 'Navtej Singh Johar v. Union of India',
    year: 2018,
    court: 'Supreme Court of India',
    courtBadge: 'SC',
    summary: 'The landmark ruling that decriminalized consensual homosexual acts by reading down Section 377 of the Indian Penal Code.',
    difficulty: 3,
    tags: ['Constitutional Law', 'Fundamental Rights', 'LGBTQ+ Rights'],
    articles: ['Article 14', 'Article 15', 'Article 19', 'Article 21'],
    caseDetails: {
      citation: '(2018) 10 SCC 1',
      caseNumber: 'Writ Petition (Criminal) No. 76 of 2016',
      decisionDate: '2018-09-06',
      bench: ['Dipak Misra CJI', 'A.M. Khanwilkar J', 'R.F. Nariman J', 'D.Y. Chandrachud J', 'Indu Malhotra J'],
      jurisdiction: 'Original writ jurisdiction',
      caseType: 'Constitution Bench writ petition challenging criminalization under Section 377 IPC',
      legalProvisions: [
        'Indian Penal Code, 1860: Section 377',
        'Constitution of India: Articles 14, 15, 19, 21',
        'Privacy and dignity principles from K.S. Puttaswamy'
      ],
      facts: [
        'Petitioners from the LGBTQ+ community challenged Section 377 as applied to consensual adult same-sex conduct.',
        'Section 377 criminalized carnal intercourse against the order of nature.',
        'The challenge followed the Supreme Court 2013 decision in Suresh Kumar Koushal, which had upheld Section 377.'
      ],
      proceduralHistory: [
        'Delhi High Court in Naz Foundation read down Section 377 in 2009.',
        'Supreme Court in Suresh Kumar Koushal reversed Naz Foundation in 2013.',
        'The privacy judgment in Puttaswamy recognized privacy, dignity, autonomy, and sexual orientation as constitutionally significant.',
        'A Constitution Bench heard the renewed challenge in Navtej Singh Johar.'
      ],
      issues: [
        'Whether Section 377 violated equality, dignity, privacy, expression, and non-discrimination rights.',
        'Whether constitutional morality should prevail over majoritarian morality.',
        'Whether Suresh Kumar Koushal should be overruled.',
        'How Section 377 should operate for non-consensual acts, minors, and animals.'
      ],
      holdings: [
        'Section 377 was read down to exclude consensual sexual conduct between adults in private.',
        'Suresh Kumar Koushal was overruled.',
        'Sexual orientation was recognized as an intrinsic aspect of identity.',
        'Section 377 continued to apply to non-consensual acts, acts involving minors, and bestiality.'
      ],
      finalOrder: 'Section 377 IPC read down to decriminalize consensual sexual conduct between adults in private.',
      significance: 'A leading equality, dignity, privacy, and LGBTQ+ rights judgment in Indian constitutional law.',
      relatedCases: ['Naz Foundation v. Government of NCT of Delhi', 'Suresh Kumar Koushal v. Naz Foundation', 'K.S. Puttaswamy v. Union of India', 'NALSA v. Union of India'],
      sourceDocuments: [
        { label: 'Supreme Court Observer case page', type: 'case summary', url: 'https://www.scobserver.in/cases/navtej-singh-johar-v-union-of-india-section-377-case-background/' },
        { label: 'Indian Kanoon judgment search', type: 'judgment text', url: 'https://indiankanoon.org/search/?formInput=Navtej%20Singh%20Johar%20Union%20of%20India%202018' }
      ],
      documentsExpected: ['Final judgment', 'writ petition', 'intervention applications', 'prior judgments in Naz Foundation and Koushal', 'written submissions']
    },
    petitioner: {
      name: 'Navtej Singh Johar & Others',
      position: 'Challenger of Section 377 IPC',
      description: 'A group of LGBTQ+ individuals including dancer Navtej Singh Johar challenged Section 377 as violating their fundamental rights to equality, non-discrimination, freedom of expression, and right to life and personal liberty.',
      keyArgs: [
        'Section 377 is a colonial provision reflecting Victorian morality, not Indian constitutional values.',
        'Criminalizing consensual private conduct between adults violates privacy under Article 21.',
        'Sexual orientation is intrinsic to identity and must be protected against discrimination.',
        'The provision has a chilling effect on expression and forces people to live in fear.',
        'Constitutional morality of inclusion must prevail over majoritarian social morality.'
      ]
    },
    respondent: {
      name: 'Union of India',
      position: 'Defender of Section 377 IPC (initially)',
      description: 'While the Union eventually left the matter to the Court wisdom, the original defense argued that Section 377 reflected societal morality, that decriminalization should come through Parliament, and that the provision served public health interests.',
      keyArgs: [
        'Section 377 reflects legislative policy and should be changed by Parliament.',
        'Courts should not rewrite penal provisions through constitutional interpretation.',
        'The provision can address non-consensual acts and protection of vulnerable persons.',
        'Indian society includes moral and cultural concerns that the legislature may consider.',
        'Any reading down should preserve prosecution of minors, coercion, and non-consensual conduct.'
      ]
    }
  },
  {
    id: 'puttaswamy',
    name: 'Justice K.S. Puttaswamy (Retd.) v. Union of India',
    shortName: 'K.S. Puttaswamy v. Union of India',
    year: 2017,
    court: 'Supreme Court of India',
    courtBadge: 'SC',
    summary: 'The nine-judge bench ruling that unanimously declared the Right to Privacy as a fundamental right under the Constitution.',
    difficulty: 4,
    tags: ['Constitutional Law', 'Privacy', 'Fundamental Rights', 'Aadhaar'],
    articles: ['Article 14', 'Article 19', 'Article 21'],
    caseDetails: {
      citation: '(2017) 10 SCC 1',
      caseNumber: 'Writ Petition (Civil) No. 494 of 2012',
      decisionDate: '2017-08-24',
      bench: [
        'J.S. Khehar CJI',
        'J. Chelameswar J',
        'S.A. Bobde J',
        'R.K. Agrawal J',
        'R.F. Nariman J',
        'A.M. Sapre J',
        'D.Y. Chandrachud J',
        'S.K. Kaul J',
        'S. Abdul Nazeer J'
      ],
      jurisdiction: 'Original writ jurisdiction',
      caseType: 'Nine-judge Constitution Bench reference on whether privacy is a fundamental right',
      legalProvisions: [
        'Constitution of India: Articles 14, 19, 21',
        'Aadhaar framework and state collection of biometric/demographic data',
        'Earlier precedents including M.P. Sharma and Kharak Singh'
      ],
      facts: [
        'Justice K.S. Puttaswamy, a retired judge, challenged the Aadhaar project and its implications for privacy.',
        'The Union argued that earlier larger-bench decisions had rejected a fundamental right to privacy.',
        'A nine-judge bench was formed to settle the constitutional status of privacy.'
      ],
      proceduralHistory: [
        'Aadhaar challenges were pending before smaller benches.',
        'Because M.P. Sharma and Kharak Singh were larger-bench decisions, the privacy question was referred to a nine-judge bench.',
        'The nine-judge bench decided only the existence and scope of privacy as a fundamental right.'
      ],
      issues: [
        'Whether privacy is protected as a fundamental right under the Constitution.',
        'Whether M.P. Sharma and Kharak Singh correctly denied such a right.',
        'How privacy relates to dignity, liberty, autonomy, equality, and expression.',
        'What test should govern state restrictions on privacy.'
      ],
      holdings: [
        'Privacy is a constitutionally protected fundamental right.',
        'Privacy is intrinsic to life, personal liberty, dignity, and freedoms under Part III.',
        'M.P. Sharma and Kharak Singh were overruled to the extent they denied privacy as a fundamental right.',
        'Privacy may be restricted only by valid law satisfying legitimate aim, necessity, and proportionality-like safeguards.'
      ],
      finalOrder: 'Right to privacy unanimously recognized as a fundamental right protected under Part III of the Constitution.',
      significance: 'The foundation for modern Indian privacy, data protection, decisional autonomy, bodily autonomy, and informational self-determination doctrine.',
      relatedCases: ['M.P. Sharma v. Satish Chandra', 'Kharak Singh v. State of Uttar Pradesh', 'Gobind v. State of Madhya Pradesh', 'Aadhaar judgment', 'Navtej Singh Johar v. Union of India'],
      sourceDocuments: [
        { label: 'Supreme Court Observer case page', type: 'case summary', url: 'https://www.scobserver.in/cases/puttaswamy-v-union-of-india-right-to-privacy-case-background/' },
        { label: 'Indian Kanoon judgment search', type: 'judgment text', url: 'https://indiankanoon.org/search/?formInput=K.S.%20Puttaswamy%20Union%20of%20India%2024%20August%202017' }
      ],
      documentsExpected: ['Final judgment', 'reference order', 'Aadhaar pleadings', 'written submissions', 'earlier privacy precedents']
    },
    petitioner: {
      name: 'Justice K.S. Puttaswamy (Retd.)',
      position: 'Champion of the Right to Privacy',
      description: 'A retired High Court judge who challenged the Aadhaar scheme as violating citizens right to privacy, arguing that privacy is an intrinsic part of life and personal liberty guaranteed under Article 21 of the Constitution.',
      keyArgs: [
        'Privacy is intrinsic to life and personal liberty under Article 21.',
        'M.P. Sharma and Kharak Singh wrongly denied privacy as a fundamental right.',
        'Aadhaar creates risks of surveillance and threatens informational self-determination.',
        'International human rights law recognizes privacy as a basic right.',
        'The dignity of the individual necessarily includes privacy.'
      ]
    },
    respondent: {
      name: 'Union of India',
      position: 'Defender of Aadhaar & State Interest',
      description: 'Argued that there is no independent fundamental right to privacy, that previous Constitution Benches had settled this question, and that Aadhaar serves legitimate state interests in efficient welfare delivery and prevention of fraud.',
      keyArgs: [
        'Earlier larger-bench decisions held that privacy is not a fundamental right.',
        'Aadhaar serves compelling state interests in welfare delivery and preventing fraud.',
        'An expansive privacy right could impede law enforcement and national security.',
        'Privacy, if recognized, must be subject to reasonable restrictions.',
        'The social welfare benefits of Aadhaar should be weighed against privacy concerns.'
      ]
    }
  },
  {
    id: 'vishaka',
    name: 'Vishaka & Ors v. State of Rajasthan',
    shortName: 'Vishaka v. State of Rajasthan',
    year: 1997,
    court: 'Supreme Court of India',
    courtBadge: 'SC',
    summary: 'The PIL that established binding guidelines against sexual harassment at the workplace, laying the groundwork for gender justice in India.',
    difficulty: 3,
    tags: ['Constitutional Law', 'Gender Justice', 'Workplace Rights', 'PIL'],
    articles: ['Article 14', 'Article 15', 'Article 19(1)(g)', 'Article 21', 'Article 32'],
    caseDetails: {
      citation: '(1997) 6 SCC 241; AIR 1997 SC 3011',
      caseNumber: 'Writ Petition (Criminal) Nos. 666-670 of 1992',
      decisionDate: '1997-08-13',
      bench: ['J.S. Verma CJI', 'Sujata V. Manohar J', 'B.N. Kirpal J'],
      jurisdiction: 'Original writ jurisdiction through public interest litigation',
      caseType: 'PIL seeking enforceable safeguards against workplace sexual harassment in the absence of legislation',
      legalProvisions: [
        'Constitution of India: Articles 14, 15, 19(1)(g), 21, 32',
        'Convention on the Elimination of All Forms of Discrimination against Women (CEDAW)',
        'Indian Penal Code provisions concerning outraging modesty and harassment'
      ],
      facts: [
        'The petition arose after the gang rape of Bhanwari Devi, a Rajasthan social worker who had acted against child marriage.',
        'Women rights groups filed a PIL seeking protection from sexual harassment at the workplace.',
        'At the time, India had no dedicated workplace sexual harassment statute.'
      ],
      proceduralHistory: [
        'The case was filed as a public interest litigation before the Supreme Court.',
        'The Court considered constitutional guarantees and international obligations in the absence of domestic legislation.',
        'The judgment created binding guidelines until Parliament enacted a law.'
      ],
      issues: [
        'Whether workplace sexual harassment violates fundamental rights.',
        'Whether the Court could frame binding guidelines in the absence of legislation.',
        'Whether international conventions could inform constitutional interpretation.',
        'What duties employers and institutions must follow to prevent and redress harassment.'
      ],
      holdings: [
        'Sexual harassment at the workplace violates Articles 14, 15, 19(1)(g), and 21.',
        'The Court framed Vishaka Guidelines binding on employers and institutions until legislation was enacted.',
        'CEDAW and international norms could be used where consistent with fundamental rights and domestic law.',
        'Employers were required to create complaints mechanisms and preventive measures.'
      ],
      finalOrder: 'Vishaka Guidelines issued as binding law until suitable legislation was enacted.',
      significance: 'The foundation for workplace sexual harassment law in India and a major precedent on gender equality, dignity, and judicial guidelines in legislative gaps.',
      relatedCases: ['Apparel Export Promotion Council v. A.K. Chopra', 'Medha Kotwal Lele v. Union of India'],
      sourceDocuments: [
        { label: 'Indian Kanoon judgment search', type: 'judgment text', url: 'https://indiankanoon.org/search/?formInput=Vishaka%20State%20of%20Rajasthan%201997%206%20SCC%20241' },
        { label: 'Supreme Court Observer search', type: 'case context', url: 'https://www.scobserver.in/?s=Vishaka' }
      ],
      documentsExpected: ['Final judgment', 'PIL petition', 'CEDAW references', 'Vishaka Guidelines', 'later POSH Act materials']
    },
    petitioner: {
      name: 'Vishaka & Other Women Rights Groups',
      position: 'Advocates for Workplace Safety',
      description: 'Women rights organizations filed a PIL after the brutal gang rape of Bhanwari Devi, a social worker in Rajasthan, demanding legal protection for women against sexual harassment at the workplace in the absence of legislation.',
      keyArgs: [
        'The assault on Bhanwari Devi exposed a systemic failure to protect working women.',
        'Sexual harassment at the workplace violates Articles 14, 15, 19(1)(g), and 21.',
        'In the absence of legislation, the Court must use Article 32 to fill the legal vacuum.',
        'International conventions, especially CEDAW, obligate India to act against workplace harassment.',
        'The right to work with dignity cannot exist without freedom from sexual harassment.'
      ]
    },
    respondent: {
      name: 'State of Rajasthan',
      position: 'State Response to Workplace Harassment',
      description: 'The State argued that existing criminal law provisions were sufficient to deal with incidents of harassment and that legislative policy-making should be left to Parliament, not the judiciary.',
      keyArgs: [
        'Existing IPC provisions could address acts of sexual harassment.',
        'Framing guidelines with force of law is primarily a legislative function.',
        'Individual incidents should not produce broad judicial law-making.',
        'Separation of powers requires deference to the legislature on policy matters.',
        'Administrative mechanisms within organizations may be better suited than blanket judicial mandates.'
      ]
    }
  }
];

export default cases;
