/**
 * Mock AI Response System — CourtRoom AI
 * Generates contextual AI arguments and scoring for the simulation
 */

/**
 * AI response templates per case per side
 * When user is petitioner, AI plays respondent and vice versa
 */
const aiResponses = {
  'ram-janmabhoomi': {
    petitioner: [
      "My Lords, the documentary evidence is irrefutable. The Babri Masjid stood on this site since 1528, and our community maintained continuous possession. Under settled principles of property law — including the Transfer of Property Act and the Limitation Act — this unbroken chain of possession establishes legal title that cannot be extinguished by acts of mob violence.",
      "The demolition of December 6, 1992 was not merely criminal — it was an affront to the rule of law itself. As this Hon'ble Court held in the Bommai case, the Constitution does not permit the subversion of law through organized illegality. To award title based on such destruction would set a dangerous precedent — that might makes right.",
      "My learned friend relies on faith. But with greatest respect, faith alone cannot establish title in a court of law. The Places of Worship Act, 1991 was enacted precisely to prevent the weaponization of historical claims against existing religious structures. Section 4 mandates that the religious character of a place shall continue as it existed on August 15, 1947.",
      "The ASI report, upon careful examination, is riddled with methodological deficiencies. It merely establishes the existence of a pre-existing structure — not a temple, much less a temple at Ram's birthplace. My Lords, archaeology deals in probabilities; property law demands certainties.",
      "In conclusion, My Lords, this case tests whether India's constitutional order — built on secularism and rule of law — can withstand the pressure of majoritarian sentiment. We pray that this Court upholds the title of the Waqf Board and sends a message that in India, law prevails over lawlessness."
    ],
    respondent: [
      "My Lords, Ram Lalla Virajman — the deity as juristic person — has been recognized by this Court and by Indian jurisprudence for over a century. A deity never dies, never sleeps, and never abandons its seat. The limitation period cannot extinguish what is, by its very nature, eternal and inalienable.",
      "The ASI excavation, conducted under this Court's own supervision, revealed a massive Hindu religious structure with pillar bases, divine figures, and architectural features inconsistent with Islamic construction. This is not conjecture — it is hard archaeological evidence that corroborates centuries of historical belief.",
      "My learned friend invokes the Places of Worship Act. But this Act explicitly exempts the Ram Janmabhoomi-Babri Masjid dispute from its purview — Parliament itself recognized the unique character of this case. Section 5 carves out this exception, and rightly so.",
      "The unbroken tradition of worship at this site is not mere faith — it is living possession. Hindu devotees have worshipped at this location continuously, even within the mosque structure, as recorded by multiple British-era gazetteers and traveller accounts. This constitutes possessory title reinforced by devotional practice.",
      "My Lords, we are not asking this Court to adjudicate matters of faith. We are asking it to recognize what the evidence overwhelmingly demonstrates — that this site has been regarded as the birthplace of Lord Ram for millennia, and the deity's claim is both legally and historically sound."
    ]
  },
  'kesavananda-bharati': {
    petitioner: [
      "My Lords, the question before this Bench is not whether Parliament can amend — it is whether Parliament can destroy. Article 368 grants the power of amendment, which by definition means to improve or modify, not to abrogate the very foundation upon which the Constitution stands.",
      "The fundamental rights enshrined in Part III are not gifts of Parliament — they are inherent rights recognized by the Constitution. They precede the state and define its limits. If Parliament can abolish these rights through amendment, then the Constitution ceases to be a constitution and becomes a mere statute.",
      "My learned friend argues for the sovereignty of Parliament. But sovereignty in India does not vest in Parliament — it vests in the People. 'We, the People of India' ordained this Constitution, and the People's basic compact cannot be altered by their agents without destroying the agency itself.",
      "The Ninth Schedule device is a constitutional fraud. It allows Parliament to place any legislation beyond judicial review, effectively nullifying Article 13 and the entire scheme of fundamental rights. If this continues unchecked, India will have a Constitution without constitutionalism.",
      "I submit that certain features of this Constitution — its federal character, judicial review, fundamental rights, secularism, the rule of law — are so essential that they constitute its identity. Amend them and you have a different constitution. This is not judicial overreach — this is the judiciary performing its most sacred duty: guarding the Constitution."
    ],
    respondent: [
      "My Lords, Article 368 is unambiguous. It states that Parliament may amend 'any provision of this Constitution.' The word 'any' admits of no exception. To read implied limitations into this clear text is to judicially re-write what the framers deliberately left open.",
      "The doctrine of implied limitations has no basis in the constitutional text or in the Constituent Assembly debates. Dr. Ambedkar himself rejected proposals to make fundamental rights unamendable. He understood that a rigid constitution could become an instrument of injustice.",
      "India is a nation of stark inequalities. The directive principles in Part IV represent the aspirations of millions — land reform, social justice, equitable distribution of resources. If fundamental rights are placed beyond amendment, these aspirations will forever remain paper promises.",
      "My learned friend speaks of basic structure. But who defines this structure? Not the people, not their elected representatives — but appointed judges. This amounts to a judicial veto over the democratic process, and it fundamentally violates the separation of powers.",
      "The Golaknath decision froze the Constitution in time, creating a crisis that necessitated the 24th and 25th Amendments. This Court must restore the balance by recognizing that a living democracy requires a Constitution capable of growth, adaptation, and transformation through its own amendment process."
    ]
  },
  'navtej-johar': {
    petitioner: [
      "My Lords, Section 377 is not an Indian law — it is a colonial imposition. Lord Macaulay drafted it in 1861 based on Victorian-era English morality. Even Britain repealed its equivalent law in 1967. We are defending a relic that its creators have long abandoned.",
      "The Puttaswamy judgment of this very Court established that the right to privacy protects individual autonomy in intimate decisions. Sexual orientation and the choice of a partner fall squarely within this protected zone. Section 377 invades this sacred constitutional space.",
      "My learned friend will argue about societal morality. But this Court has repeatedly held — from Manoj Narula to NALSA — that constitutional morality must prevail over societal morality. The Constitution was designed to protect minorities from majoritarian moral judgments.",
      "The impact of Section 377 goes beyond criminal prosecution. It creates a culture of fear, blackmail, and invisibility. LGBTQ+ individuals are denied their right to live with dignity under Article 21, their right to equality under Article 14, and their freedom of expression under Article 19.",
      "We are not asking this Court to approve or disapprove of any lifestyle. We are asking it to hold that the State has no business criminalizing love between consenting adults. As Justice Kennedy wrote in Obergefell — the Constitution promises liberty to all, not just those whose experiences conform to the majority."
    ],
    respondent: [
      "My Lords, Section 377 has been part of Indian criminal law for over 150 years. It reflects deeply held moral convictions across Indian religions and cultural traditions. The Court should be cautious about overriding such deeply rooted societal consensus through judicial decree.",
      "The proper forum for decriminalization is Parliament, not the judiciary. This is a matter of legislative policy involving complex social considerations. In the Suresh Kumar Koushal decision of 2013, this Court correctly held that a minuscule minority cannot dictate terms to the legislature.",
      "Section 377 serves legitimate public health objectives. The provision has been invoked in cases of child sexual abuse and non-consensual acts. Reading it down may create lacunae in the protection of vulnerable populations, particularly minors.",
      "The petitioners conflate the right to privacy with a right to engage in specific sexual acts. Privacy is not absolute — Article 19(2) through 19(6) enumerate reasonable restrictions. Public morality and decency are well-established grounds for restricting fundamental rights.",
      "If this Court reads down Section 377, it opens the door to challenges against all morality-based legislation. The judiciary must exercise restraint and respect the separation of powers, leaving moral policy decisions to the elected representatives of the people."
    ]
  },
  'puttaswamy': {
    petitioner: [
      "My Lords, the question is not whether privacy exists in the Constitution — it is whether this Court will finally acknowledge what has always been there. Privacy inheres in every guarantee of Part III: the right to life, personal liberty, freedom of speech, and freedom of movement. It is the oxygen of these rights.",
      "The decisions in M.P. Sharma and Kharak Singh were products of their time. They were decided when the Constitution was young and its full implications were not yet understood. Subsequent decisions — from Gobind to R. Rajagopal to NALSA — have progressively recognized privacy. It is time to resolve this inconsistency.",
      "Aadhaar is the largest biometric surveillance system ever constructed. It collects fingerprints, iris scans, and demographic data of 1.3 billion people, linking them to every government service. Without constitutional protection for privacy, this system operates without meaningful limits on state power.",
      "My learned friend argues that privacy cannot be fundamental because it is not enumerated. But Part III lists rights in broad strokes — Article 21's 'life and personal liberty' has been the wellspring of countless unenumerated rights from education to shelter to clean environment. Privacy is no different.",
      "The international consensus is overwhelming. The UDHR, the ICCPR, the European Convention — all recognize privacy as fundamental. Every major democracy protects this right. India, the world's largest democracy, cannot remain the sole outlier among free nations."
    ],
    respondent: [
      "My Lords, this question has been settled by two Constitution Benches. M.P. Sharma, decided by an 8-judge bench, and Kharak Singh, by a 6-judge bench, both held that privacy is not a fundamental right. Judicial discipline demands that these precedents be followed unless overruled by a bench of equal or larger strength.",
      "Aadhaar is the most effective tool for targeted welfare delivery that India has ever possessed. It has eliminated ghost beneficiaries, prevented diversion of subsidies worth thousands of crores, and ensured that benefits reach the intended recipients. These are compelling state interests.",
      "The petitioner seeks an absolute right to privacy. But no right is absolute — not even the right to life. If privacy is elevated to fundamental status, every state action from tax collection to law enforcement to census-taking becomes vulnerable to challenge.",
      "India is a developing nation with unique challenges. We cannot import Western notions of privacy developed in societies with vastly different demographics, governance structures, and welfare needs. Our constitutional framework must be interpreted in our socio-economic context.",
      "The proper safeguard against misuse of data is not a judicially created fundamental right — it is comprehensive data protection legislation, which the government is in the process of framing. Legislative solutions are both more nuanced and more democratically legitimate than judicial mandates."
    ]
  },
  'vishaka': {
    petitioner: [
      "My Lords, Bhanwari Devi was gang-raped as punishment for performing her duty — preventing a child marriage. The trial court acquitted the accused, holding that upper-caste men would not rape a lower-caste woman. This case exposes a systemic absence of legal protection for working women in India.",
      "There is no legislation in India that specifically addresses sexual harassment at the workplace. The IPC provisions on outraging modesty are wholly inadequate — they do not cover the spectrum of harassment from hostile work environment to quid pro quo demands that women face daily.",
      "Article 32 empowers this Court to enforce fundamental rights. Under Article 21, the right to life includes the right to live with dignity. Under Article 19(1)(g), every citizen has the right to practice a profession. Sexual harassment at the workplace directly violates both these rights.",
      "India is a signatory to CEDAW — the Convention on the Elimination of All Forms of Discrimination Against Women. Article 11 requires states parties to take measures to eliminate discrimination against women in employment. This Court can rely on international conventions to fill the legislative vacuum.",
      "We pray that this Court exercises its unique constitutional power to lay down binding guidelines that will protect the dignity of every working woman in India until Parliament enacts comprehensive legislation. The Constitution demands no less."
    ],
    respondent: [
      "My Lords, the existing criminal law framework provides adequate remedies. Sections 354 and 509 of the IPC address acts of outraging the modesty of a woman and using words or gestures to insult modesty. These provisions, properly enforced, are sufficient to address workplace harassment.",
      "With greatest respect, what the petitioners seek is essentially judicial legislation. Framing guidelines with the force of law — defining sexual harassment, prescribing complaint mechanisms, mandating institutional changes — this is squarely within the domain of the legislature.",
      "The doctrine of separation of powers is a basic feature of our Constitution. If this Court begins to frame detailed guidelines on workplace policy, it sets a precedent for judicial encroachment on legislative territory in every area where Parliament has not yet acted.",
      "International conventions like CEDAW are not self-executing in India. They do not become part of domestic law until Parliament legislates. Article 253 grants this power exclusively to Parliament. The Court cannot use international treaties to bypass the legislative process.",
      "Each workplace has unique characteristics — factories differ from offices, rural cooperatives from multinational corporations. A single set of judicial guidelines cannot adequately address this diversity. Legislative deliberation, with input from stakeholders, is far better suited to crafting appropriate policy."
    ]
  }
};

/**
 * Get AI response for a given case, round, and the side AI is playing
 */
export function getAIResponse(caseId, round, aiSide) {
  const caseResponses = aiResponses[caseId];
  if (!caseResponses) return "The counsel for the opposing side reserves their argument.";
  
  const sideResponses = caseResponses[aiSide];
  if (!sideResponses) return "The counsel seeks the Court's indulgence for a brief moment.";
  
  const index = Math.min(round - 1, sideResponses.length - 1);
  return sideResponses[index];
}

/**
 * Mock scoring system based on user argument quality
 * Analyzes word count, keyword density, and structure
 */
export function scoreArgument(userArgument, caseData, side, round) {
  const text = userArgument.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  
  // Legal terminology detection
  const legalTerms = [
    'article', 'constitution', 'fundamental', 'right', 'precedent',
    'bench', 'held', 'judgment', 'hon\'ble', 'court', 'statutory',
    'legislative', 'judicial', 'doctrine', 'amendment', 'provision',
    'submission', 'contention', 'respondent', 'petitioner', 'counsel',
    'lordship', 'pray', 'submit', 'respectfully', 'tribunal'
  ];
  
  const precedentTerms = [
    'v.', 'versus', 'case', 'decision', 'ratio', 'obiter',
    'overruled', 'distinguished', 'followed', 'relied', 'cited',
    'bench', 'judge', 'justice', 'air ', 'scc ', 'scr '
  ];
  
  const persuasiveTerms = [
    'therefore', 'consequently', 'moreover', 'furthermore', 'indeed',
    'compelling', 'manifestly', 'clearly', 'undoubtedly', 'evidently',
    'paramount', 'essential', 'fundamental', 'critical', 'pivotal'
  ];
  
  const constitutionalTerms = [
    'article 14', 'article 15', 'article 19', 'article 21', 'article 25',
    'article 32', 'article 226', 'article 368', 'part iii', 'part iv',
    'preamble', 'basic structure', 'due process', 'rule of law',
    'separation of powers', 'federalism', 'secularism'
  ];
  
  // Count matches
  const legalCount = legalTerms.filter(t => text.includes(t)).length;
  const precedentCount = precedentTerms.filter(t => text.includes(t)).length;
  const persuasiveCount = persuasiveTerms.filter(t => text.includes(t)).length;
  const constitutionalCount = constitutionalTerms.filter(t => text.includes(t)).length;
  
  // Base scores with some randomness for realism
  const jitter = () => Math.random() * 10 - 5; // ±5 variance
  
  // Length bonus
  const lengthScore = Math.min(wordCount / 2, 30);
  
  const scores = {
    legalReasoning: Math.min(100, Math.max(25, 35 + legalCount * 6 + lengthScore + jitter())),
    useOfPrecedent: Math.min(100, Math.max(15, 25 + precedentCount * 10 + lengthScore * 0.5 + jitter())),
    persuasiveness: Math.min(100, Math.max(20, 30 + persuasiveCount * 8 + lengthScore * 0.7 + jitter())),
    constitutionalValidity: Math.min(100, Math.max(20, 30 + constitutionalCount * 12 + lengthScore * 0.3 + jitter()))
  };
  
  // Round scores
  Object.keys(scores).forEach(key => {
    scores[key] = Math.round(scores[key]);
  });
  
  return scores;
}

/**
 * Generate AI scores — generally competitive but beatable
 */
export function getAIScore(round) {
  const baseScore = 55 + round * 5; // AI gets slightly better each round
  const jitter = () => Math.random() * 15 - 7;
  
  return {
    legalReasoning: Math.min(100, Math.round(baseScore + jitter())),
    useOfPrecedent: Math.min(100, Math.round(baseScore + 5 + jitter())),
    persuasiveness: Math.min(100, Math.round(baseScore - 3 + jitter())),
    constitutionalValidity: Math.min(100, Math.round(baseScore + 2 + jitter()))
  };
}

/**
 * Judge commentary based on round performance
 */
export function getJudgeComment(userScore, aiScore) {
  const userTotal = Object.values(userScore).reduce((a, b) => a + b, 0);
  const aiTotal = Object.values(aiScore).reduce((a, b) => a + b, 0);
  
  if (userTotal > aiTotal + 40) {
    const comments = [
      "The Court notes an exceptionally compelling argument from the counsel.",
      "A thorough and well-reasoned submission. The Bench is impressed.",
      "The Court appreciates the depth of legal scholarship demonstrated."
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  } else if (userTotal > aiTotal) {
    const comments = [
      "The Court notes a well-structured argument. The counsel may proceed.",
      "A fair submission. The Bench will take note of the points raised.",
      "The counsel has made their point effectively. We shall consider it."
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  } else if (userTotal === aiTotal) {
    return "Both counsels have presented equally compelling arguments. The Bench observes this with interest.";
  } else if (aiTotal > userTotal + 40) {
    const comments = [
      "The Court observes that the opposing counsel has made a significantly stronger case on this point.",
      "The Bench notes room for improvement in the legal analysis presented.",
      "The counsel may wish to strengthen their arguments with more specific authority."
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  } else {
    const comments = [
      "A reasonable submission, though the opposing counsel perhaps edges ahead on this round.",
      "The Bench has heard both sides. The argument could have been buttressed with stronger precedent.",
      "The Court takes note. Both sides have made their respective cases."
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }
}

export default aiResponses;
