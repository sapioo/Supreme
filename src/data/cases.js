/**
 * Landmark Indian Cases — CourtRoom AI Data
 * Each case contains full details for the simulation arena
 */

const cases = [
  {
    id: 'ram-janmabhoomi',
    name: 'M Siddiq (D) Thr Lrs v. Mahant Suresh Das & Ors',
    shortName: 'Ram Janmabhoomi v. Babri Masjid',
    year: 2019,
    court: 'Supreme Court of India',
    courtBadge: 'SC',
    summary: 'The historic land title dispute over the site in Ayodhya — balancing faith, history, and constitutional secularism.',
    difficulty: 5,
    tags: ['Property Law', 'Constitutional Law', 'Religious Rights'],
    articles: ['Article 14', 'Article 15', 'Article 25', 'Article 26'],
    petitioner: {
      name: 'M Siddiq (Sunni Waqf Board)',
      position: 'Claimant of Babri Masjid Title',
      description: 'Argued that the Babri Masjid stood on the disputed site since 1528, and the Muslim community held continuous title. Challenged the demolition as unconstitutional and demanded restoration of the mosque or full title rights to the land.',
      keyArgs: [
        'The mosque stood for over 450 years — continuous possession establishes legal title under settled property law.',
        'Demolition of the mosque in 1992 was an act of criminal destruction — the court cannot reward illegality.',
        'Under Article 25-26, freedom of religion includes the right to maintain places of worship without interference.',
        'Archaeological evidence is inconclusive and cannot override documented historical possession.',
        'The Places of Worship Act, 1991 mandates maintaining the religious character of places as they existed on 15 August 1947.'
      ]
    },
    respondent: {
      name: 'Mahant Suresh Das (Ram Lalla Virajman)',
      position: 'Deity as Juristic Person — Claimant of Birthplace',
      description: 'Argued that the disputed site is the birthplace of Lord Ram, that the deity holds juristic personality and inherent title to the land, and that faith and archaeological evidence support the Hindu claim to the site.',
      keyArgs: [
        'Ram Lalla Virajman, the deity as a juristic person, has an inherent and inalienable right to the birthplace.',
        'Archaeological Survey of India evidence confirms a pre-existing Hindu structure beneath the mosque.',
        'The belief in Ram Janmasthan is ancient, unbroken, and constitutionally protected under Articles 25-26.',
        'The doctrine of adverse possession cannot extinguish the rights of a deity — a deity never abandons its seat.',
        'Hindu religious texts and traveller accounts across centuries confirm Ayodhya as the birthplace of Lord Ram.'
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
    summary: 'The foundational case that established the Basic Structure Doctrine — Parliament cannot amend the Constitution to destroy its essential features.',
    difficulty: 5,
    tags: ['Constitutional Law', 'Basic Structure', 'Fundamental Rights'],
    articles: ['Article 13', 'Article 31', 'Article 368'],
    petitioner: {
      name: 'Kesavananda Bharati Sripadagalvaru',
      position: 'Challenger of Unlimited Amendment Power',
      description: 'A religious leader from Kerala who challenged the 29th Amendment that placed the Kerala Land Reforms Act in the Ninth Schedule, arguing that Parliament\'s power to amend the Constitution is not unlimited and cannot destroy fundamental rights.',
      keyArgs: [
        'Fundamental rights are not mere statutory provisions — they form the core identity of the Constitution.',
        'Parliament derives its power FROM the Constitution; it cannot use that power to destroy the source itself.',
        'The Ninth Schedule cannot be used as a shield to immunize legislation from fundamental rights review.',
        'Article 368 grants power to amend, not to re-write or destroy the Constitution.',
        'The framers intended fundamental rights to be inviolable — the Constituent Assembly debates confirm this.'
      ]
    },
    respondent: {
      name: 'State of Kerala',
      position: 'Defender of Parliamentary Sovereignty',
      description: 'Argued that Parliament, as the supreme representative body, has unlimited power to amend any provision of the Constitution under Article 368, including fundamental rights, to fulfill the directive principles of state policy.',
      keyArgs: [
        'Article 368 confers plenary amendment power with no implied limitations — the text is clear.',
        'Parliamentary sovereignty is the bedrock of democracy — elected representatives must have power to reshape law.',
        'Land reforms are essential to fulfill Directive Principles under Part IV — fundamental rights cannot obstruct social justice.',
        'The Golaknath decision was wrongly decided and must be overruled — it has no constitutional basis.',
        'Judicial review of constitutional amendments itself undermines parliamentary supremacy and democratic governance.'
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
    petitioner: {
      name: 'Navtej Singh Johar & Others',
      position: 'Challenger of Section 377 IPC',
      description: 'A group of LGBTQ+ individuals including dancer Navtej Singh Johar challenged Section 377 as violating their fundamental rights to equality, non-discrimination, freedom of expression, and right to life and personal liberty.',
      keyArgs: [
        'Section 377 is a colonial relic from 1861 — it reflects Victorian morality, not Indian constitutional values.',
        'Criminalizing consensual private conduct between adults violates the right to privacy under Article 21 (Puttaswamy).',
        'Sexual orientation is an intrinsic part of identity — Article 15 prohibits discrimination on this ground.',
        'The provision has a chilling effect on free expression and forces individuals to live in fear and secrecy.',
        'The constitutional morality of inclusiveness must prevail over majoritarian social morality.'
      ]
    },
    respondent: {
      name: 'Union of India',
      position: 'Defender of Section 377 IPC (initially)',
      description: 'While the Union eventually left the matter to the Court\'s wisdom, the original defense argued that Section 377 reflected societal morality, that decriminalization should come through Parliament, and that the provision served public health interests.',
      keyArgs: [
        'Section 377 reflects the will of Parliament and prevailing societal moral standards.',
        'Decriminalization of such conduct should come through legislative process, not judicial interpretation.',
        'The provision serves legitimate state interests in public health and prevention of HIV/AIDS transmission.',
        'Indian society\'s cultural and religious values do not endorse homosexual conduct.',
        'The Suresh Kumar Koushal decision (2013) correctly upheld Section 377 — there\'s no reason to revisit it.'
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
    petitioner: {
      name: 'Justice K.S. Puttaswamy (Retd.)',
      position: 'Champion of the Right to Privacy',
      description: 'A retired High Court judge who challenged the Aadhaar scheme as violating citizens\' right to privacy, arguing that privacy is an intrinsic part of life and personal liberty guaranteed under Article 21 of the Constitution.',
      keyArgs: [
        'Privacy is not merely a statutory right — it is an intrinsic part of life and personal liberty under Article 21.',
        'The M.P. Sharma and Kharak Singh decisions wrongly denied privacy as a fundamental right and must be overruled.',
        'Aadhaar creates a mass surveillance architecture that threatens individual autonomy and informational self-determination.',
        'International human rights law recognizes privacy as a fundamental right — India cannot be an outlier.',
        'The dignity of the individual, which is the cornerstone of Part III, necessarily includes the right to privacy.'
      ]
    },
    respondent: {
      name: 'Union of India',
      position: 'Defender of Aadhaar & State Interest',
      description: 'Argued that there is no independent fundamental right to privacy, that previous Constitution Benches had settled this question, and that Aadhaar serves legitimate state interests in efficient welfare delivery and prevention of fraud.',
      keyArgs: [
        'M.P. Sharma (8-judge bench) and Kharak Singh (6-judge bench) held that privacy is not a fundamental right.',
        'Aadhaar serves compelling state interest — efficient delivery of subsidies and elimination of fraud worth crores.',
        'An expansive right to privacy would impede legitimate state actions including law enforcement and national security.',
        'Privacy, if recognized, must be subject to reasonable restrictions — it cannot be absolute.',
        'The social welfare benefits of Aadhaar far outweigh any marginal privacy concerns.'
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
    summary: 'The PIL that established binding guidelines against sexual harassment at the workplace — laying the groundwork for gender justice in India.',
    difficulty: 3,
    tags: ['Constitutional Law', 'Gender Justice', 'Workplace Rights', 'PIL'],
    articles: ['Article 14', 'Article 15', 'Article 19(1)(g)', 'Article 21'],
    petitioner: {
      name: 'Vishaka & Other Women\'s Groups',
      position: 'Advocates for Workplace Safety',
      description: 'Women\'s rights organizations filed a PIL after the brutal gang-rape of Bhanwari Devi, a social worker in Rajasthan, demanding legal protection for women against sexual harassment at the workplace in the absence of legislation.',
      keyArgs: [
        'The gang-rape of Bhanwari Devi exposes a systemic failure — there is no law protecting working women from harassment.',
        'Sexual harassment at the workplace violates Articles 14, 15, 19(1)(g), and 21 of the Constitution.',
        'In the absence of legislation, the Court must exercise its power under Article 32 to fill the legislative vacuum.',
        'International conventions, especially CEDAW, obligate India to take measures against workplace harassment.',
        'The right to work with dignity is a fundamental right — it cannot exist without freedom from sexual harassment.'
      ]
    },
    respondent: {
      name: 'State of Rajasthan',
      position: 'State Response to Workplace Harassment',
      description: 'The State argued that existing criminal law provisions were sufficient to deal with incidents of harassment and that legislative policy-making should be left to Parliament, not the judiciary.',
      keyArgs: [
        'Existing provisions under the IPC (Sections 354, 509) adequately address acts of sexual harassment.',
        'Framing guidelines with the force of law is a legislative function — the Court would be overstepping its role.',
        'Individual incidents, however tragic, should not lead to judicial law-making that bypasses Parliament.',
        'The separation of powers doctrine requires deference to the legislature on policy matters.',
        'Administrative mechanisms within organizations are better suited than blanket judicial mandates.'
      ]
    }
  }
];

export default cases;
