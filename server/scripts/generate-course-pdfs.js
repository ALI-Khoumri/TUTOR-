const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outDir = path.join(__dirname, '..', '..', 'src', 'assets', 'courses');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createCoursePdf(fileName, subjectName, chapters) {
  const filePath = path.join(outDir, fileName);
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Cover Banner
  doc.rect(45, 45, 505, 80).fill('#1e3a8a');
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
     .text('TutorAI — Manuel & Polycopie de Cours', 60, 62);
  doc.fontSize(13).font('Helvetica')
     .text(subjectName + ' • Support Academique Officiel', 60, 95);

  doc.moveDown(4);
  doc.fillColor('#0f172a');

  chapters.forEach((ch, index) => {
    if (index > 0) doc.addPage();

    // Chapter Header
    doc.fillColor('#2563eb').fontSize(16).font('Helvetica-Bold')
       .text('Chapitre ' + (index + 1) + ' : ' + ch.title);
    doc.fillColor('#64748b').fontSize(10).font('Helvetica')
       .text('Duree estimee : ' + ch.duration + ' | Niveau : ' + ch.level);
    doc.moveDown(1);

    // Section 1: Vue d'ensemble
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
       .text('1. Vue d\'ensemble du cours');
    doc.fillColor('#334155').fontSize(10).font('Helvetica')
       .text(ch.summary, { align: 'justify', lineGap: 3 });
    doc.moveDown(1);

    // Section 2: Points clés
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
       .text('2. Points cles et fondamentaux');
    doc.font('Helvetica').fontSize(10).fillColor('#334155');
    ch.keyPoints.forEach(pt => {
      doc.text('•  ' + pt, { indent: 10, lineGap: 2 });
    });
    doc.moveDown(1);

    // Section 3: Textes et règles
    if (ch.rules && ch.rules.length > 0) {
      doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
         .text('3. Notions cles et regles fondamentales');
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#1d4ed8');
      ch.rules.forEach(r => {
        doc.text('  ' + r, { indent: 10, lineGap: 2 });
      });
      doc.moveDown(1);
    }

    // Section 4: Cas pratique
    if (ch.caseStudy) {
      doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
         .text('4. Exemple d\'application & Cas pratique');
      doc.font('Helvetica').fontSize(10).fillColor('#b45309')
         .text(ch.caseStudy, { indent: 10, lineGap: 2 });
      doc.moveDown(1);
    }

    // Section 5: Pièges d'examen
    if (ch.pitfalls && ch.pitfalls.length > 0) {
      doc.fillColor('#b91c1c').fontSize(12).font('Helvetica-Bold')
         .text('5. Pieges d\'examen a eviter');
      doc.font('Helvetica').fontSize(10).fillColor('#991b1b');
      ch.pitfalls.forEach(p => {
        doc.text('!  ' + p, { indent: 10, lineGap: 2 });
      });
      doc.moveDown(1);
    }

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text('Document edite par TutorAI — Conforme aux programmes officiels', 45, 800, { align: 'center' });
  });

  doc.end();
  return new Promise(resolve => stream.on('finish', () => {
    console.log('Created:', fileName, fs.statSync(filePath).size, 'bytes');
    resolve();
  }));
}

async function run() {
  // 1. SVT
  await createCoursePdf('svt-cours.pdf', 'Sciences de la Vie et de la Terre (SVT)', [
    {
      title: 'La Genetique et l\'Heredite Moleculaire',
      duration: '45 min',
      level: 'College',
      summary: 'L\'information genetique est stockee dans l\'ADN sous la forme d\'une sequence specifique de quatre bases azotees (Adenine, Thymine, Guanine, Cytosine). L\'expression des genes comporte deux grandes etapes : la transcription de l\'ADN en ARN messager au sein du noyau cellulaire, suivie de la traduction de l\'ARNm en chaînes polypeptidiques (proteines) au niveau des ribosomes dans le cytoplasme.',
      keyPoints: [
        'L\'ADN est constitue de deux brins antiparalleles enroules en double helice reliee par liaisons hydrogene (A-T, G-C).',
        'La replication de l\'ADN est semi-conservative (Experience princeps de Meselson et Stahl).',
        'Le code genetique est universel, non-chevauchant et degenere (64 codons pour 20 acides amines).',
        'Les mutations genetiques (substitution, deletion, insertion) constituent la source fondamentale de diversite des alleles.'
      ],
      rules: [
        'Loi de Chargaff : Dans l\'ADN bicatenaire, le rapport (A+G)/(T+C) = 1 (egalite purines/pyrimidines).',
        'Codon d\'initiation : AUG (Methionine) et codons d\'arret : UAA, UAG, UGA.'
      ],
      caseStudy: 'Analyse d\'un arbre genealogique pour une maladie autosomique recessive : Calcul de probabilite de transmission montrant qu\'un couple sain hétérozygote a 25% de risque d\'avoir un enfant atteint.',
      pitfalls: [
        'Ne pas confondre un gene (segment d\'ADN responsable d\'une fonction) et un allele (version particuliere de ce gene).',
        'Attention a bien substituer la Thymine (T) par l\'Uracile (U) lors de la transcription en ARNm.'
      ]
    },
    {
      title: 'L\'Immunologie et les Reponses Immunitaires de l\'Organisme',
      duration: '50 min',
      level: 'College',
      summary: 'Le systeme immunitaire assure l\'integrite biologique de l\'organisme contre les agents pathogenes (virus, bacteries, parasites, cellules tumorales). Il s\'articule en deux lignes de defense coordonnees : l\'immunite innee (reaction inflammatoire locale rapide, phagocytose) et l\'immunite adaptative acquise (a mediation humorale via les lymphocytes B ou a mediation cellulaire via les lymphocytes T).',
      keyPoints: [
        'Les 4 signes cardinaux de la reaction inflammatoire : rougeur, chaleur, tumefaction (œdeme) et douleur.',
        'La phagocytose effectuee par les macrophages et polynucleaires neutrophiles detruit la majorite des agents agresseurs.',
        'Les lymphocytes B activés se differencient en plasmocytes secretoires d\'anticorps hautement specifiques.',
        'Les lymphocytes T CD8+ deviennent des cellules cytotoxiques provoquant la lyse des cellules infectees par perforine/granzyme.'
      ],
      rules: [
        'Complexe immun : Liaison specifique anticorps-antigene neutralisant les toxines et facilitant l\'opsonisation.',
        'Selection clonale : Seuls les clones lymphocytaires reconnaissant l\'epitope specifique prolifèrent et creent la memoire immunitaire.'
      ],
      caseStudy: 'Principe de la memoire immunitaire vaccinale : La reponse secondaire apres rappel est dix fois plus rapide et cent fois plus concentree en IgG que la primo-reponse.',
      pitfalls: [
        'Ne pas confondre serotherapie (protection immediate passive a court terme) et vaccination (protection active a memoire durable).',
        'Les lymphocytes T4 (auxiliaires) sont indispensables : leur destruction bloque toute l\'immunite adaptative.'
      ]
    },
    {
      title: 'La Consommation de Matiere Organique et Flux d\'Energie Cellulaire',
      duration: '40 min',
      level: 'College',
      summary: 'Les cellules heterotrophes tirent leur energie chimique sous forme d\'ATP par l\'oxydation du glucose. En milieu aerobie, la respiration cellulaire complete (glycolyse cytoplasmique, cycle de Krebs mitochondrial et chaîne respiratoire) produit 36 a 38 molecules d\'ATP par molecule de glucose. En anaerobie, la fermentation produit seulement 2 ATP.',
      keyPoints: [
        'La glycolyse se deroule dans le hyaloplasme sans O2 et genere 2 ATP et 2 molecules de pyruvate.',
        'Le cycle de Krebs a lieu dans la matrice mitochondriale et genere NADH,H+ et FADH2 hautement energetiques.',
        'La chaîne respiratoire situee sur la membrane interne mitochondriale utilise l\'oxygene comme accepteur terminal.',
        'L\'ATP synthase exploite la force proton-motrice pour regenerer l\'ATP a partir de l\'ADP + Pi.'
      ],
      rules: [
        'Equation bilan de la respiration : C6H12O6 + 6 O2 + 36 ADP + 36 Pi -> 6 CO2 + 6 H2O + 36 ATP.',
        'Rendement energetique de la respiration : environ 40%, contre 2% pour la fermentation lactique ou alcoolique.'
      ],
      caseStudy: 'Metabolisme musculaire pendant un effort anaerobie alactique puis lactique : Transition de la voie phosphagene a la glycolyse avec formation transitoire de lactate.',
      pitfalls: [
        'Le dioxygene n\'intervient pas dans la glycolyse ni directement dans le cycle de Krebs, mais a la toute fin de la chaîne respiratoire.',
        'Ne pas confondre la matrice mitochondriale (lieu du cycle de Krebs) avec l\'espace intermembranaire.'
      ]
    }
  ]);

  // 2. Langue Arabe
  await createCoursePdf('langue-arabe-cours.pdf', 'Langue Arabe (Grammaire, Syntaxe et Rhetorique)', [
    {
      title: 'La Phrase Nominale et les Auxiliaires Modificateurs (Nawasikh)',
      duration: '45 min',
      level: 'College',
      summary: 'La phrase nominale (al-joumla al-ismiyya) s\'articule autour de deux piliers fondamentaux au cas nominatif (marfou\') : le theme (al-moubtada\') et le predicat (al-khabar). L\'introduction des auxiliaires verbaux (Kana et ses sœurs) ou des particules d\'assertion (Inna et ses sœurs) modifie la declinaison syntaxique des termes.',
      keyPoints: [
        'Al-Moubtada et Al-Khabar sont naturellement au cas nominatif (Dammah, Alif pour le duel, Waw pour le pluriel masculin sain).',
        'Kana et ses sœurs maintiennent le nom au nominatif et mettent le predicat a l\'accusatif (Mansoub).',
        'Inna et ses sœurs mettent le nom a l\'accusatif et maintiennent le predicat au nominatif.',
        'Le predicat peut être un mot simple, une proposition verbale, une proposition nominale ou une locution prépositionnelle.'
      ],
      rules: [
        'Regle fondamentale : Le moubtada est obligatoirement defini a l\'origine, sauf derogations syntaxiques autorisees.',
        'L\'accord en genre et en nombre est rigoureux entre le moubtada et le khabar sauf pour les pluriels d\'inamines.'
      ],
      caseStudy: 'Analyse syntaxique (I\'rab) : Dans \"Inna al-\'ilma nouroun\", Inna est une particule d\'insistance et d\'accusatif, al-\'ilma est son nom a l\'accusatif, et nouroun est son predicat au nominatif.',
      pitfalls: [
        'Ne pas intervertir les effets respectifs de Kana (khabar mansoub) et Inna (ism mansoub).',
        'Attention aux noms a declinaison diptote (mamnou\' min as-sarf) prenant une fatha au cas genitif.'
      ]
    },
    {
      title: 'La Rhetorique Arabe : L\'Art de la Metaphore (Al-Isti\'ara)',
      duration: '40 min',
      level: 'College',
      summary: 'La science du Bayan au sein de la rhetorique arabe explore les figures d\'expression metaphoriques et analogiques. La metaphore (al-Isti\'ara) est definie classiquement comme une comparaison absolue dont l\'un des deux termes essentiels (le compare ou le comparant) a ete elide, avec la presence d\'un indice contextuel (Qarina).',
      keyPoints: [
        'Les quatre composants du Tashbih : Al-Mouchabbah, Al-Mouchabbah bihi, l\'outil de comparaison et le point de ressemblance.',
        'Le Tashbih Baligh est une comparaison depourvue d\'outil et de point de comparaison.',
        'L\'Isti\'ara Tasrihiyya mentionne explicitement le comparant tout en omettant le compare.',
        'L\'Isti\'ara Makniyya elide le comparant tout en conservant un de ses attributs ou caracteristiques typiques.'
      ],
      rules: [
        'L\'Isti\'ara repose toujours sur une relation de ressemblance (Mouchabaha).',
        'L\'effet esthetique majeur reside dans la personnification (Tashkhis) ou la materialisation de l\'abstrait (Tajsim).'
      ],
      caseStudy: 'Exemple poetique classique : La lumiere du savoir dissipant les tenebres de l\'ignorance — Metaphore declaree sublimant l\'impact salvateur de la connaissance.',
      pitfalls: [
        'Ne pas confondre la metonymie (Kinaya - relation de continuite/causalite) avec la metaphore (ressemblance).',
        'Toujours expliciter avec precision la Qarina (l\'indice) qui exclut le sens litteral premier.'
      ]
    },
    {
      title: 'Methodologie de l\'Analyse de Texte Litteraire et Dissertation',
      duration: '35 min',
      level: 'College',
      summary: 'L\'etude critique d\'un texte litteraire en langue arabe exige une approche analytique rigoureuse structuree en trois mouvements majeurs : une introduction contextualisee posant la problematique et les hypotheses, un developpement dialectique associant analyse thematique et procede formel, et un bilan conclusif.',
      keyPoints: [
        'L\'introduction situe le texte dans son epoque litteraire (Preislamique, Abbasside, Renaissance, Moderne).',
        'Le developpement articule les champs lexicaux, la prosodie rythmique et les figures de style avec le sens profond.',
        'La conclusion dresse une synthese percutante et repond de maniere argumentee a la question initiale.'
      ],
      rules: [
        'Lien indissociable forme-contenu : Ne jamais isoler les figures de style sans demontrer leur portee expressive.',
        'Rigueur argumentative : Utiliser les connecteurs logiques arabes marquant la deduction, la concession et la synthese.'
      ],
      caseStudy: 'Analyse d\'un poeme de la Nahda : Identifier la volonte de regeneration linguistique et patriotique a travers le lexique choisi.',
      pitfalls: [
        'Eviter le piege de la paraphrase descriptive qui se contente de resumer sans analyser le discours.',
        'Veiller a la perfection orthographique et a la vocalisation correcte des structures syntaxiques cles.'
      ]
    }
  ]);

  // 3. Mathématiques
  await createCoursePdf('mathematiques-cours.pdf', 'Mathématiques : Analyse & Algèbre', [
    {
      title: 'Analyse Reelle et Series Numeriques',
      duration: '45 min',
      level: 'College',
      summary: 'Etude approfondie des suites, series et fonctions d\'une variable reelle. Criteres de convergence, theoremes des valeurs intermediaires, derivees et calcul integral.',
      keyPoints: [
        'Une suite convergente est bornee ; la reciproque n\'est vraie que si elle est monotone.',
        'Criteres de Riemann et de d\'Alembert pour les series a termes positifs.',
        'Calcul des developpements limites et applications aux etudes asymptotiques.'
      ],
      rules: [
        'Formule de Taylor-Lagrange et developpement limite.',
        'Theoreme fondamental de l\'analyse reliant derivation et integration.'
      ],
      caseStudy: 'Calcul de la limite asymptotique d\'une suite recurrente a point fixe.',
      pitfalls: [
        'Ne jamais sommer d\'equivalents terme a terme.',
        'Vérifier la continuite stricte avant d\'appliquer le theoreme de bijection.'
      ]
    }
  ]);

  // 7. Algorithmique & Programmation
  await createCoursePdf('algorithmique-cours.pdf', 'Algorithmique & Structures de Données', [
    {
      title: 'Complexite Asymptotique et Structures de Donnees',
      duration: '40 min',
      level: 'College',
      summary: 'Fondements theoriques de l\'informatique : calcul de la complexite en temps et en espace (Grand O), tableaux, listes chaînées, arbres binaires et algorithmes de tri optimises.',
      keyPoints: [
        'Complexite O(1) pour l\'acces indexe, O(log n) pour la recherche dichotomique, O(n log n) pour le tri fusion.',
        'Structures LIFO (piles) et FIFO (files).',
        'Paradigmes de programmation : diviser pour regner, programmation dynamique, algorithmes gloutons.'
      ],
      rules: [
        'Master Theorem pour resoudre les recurrences du type T(n) = a*T(n/b) + f(n).',
        'Invariant de boucle pour prouver la correction d\'un algorithme.'
      ],
      caseStudy: 'Implementation d\'un algorithme de parcours en largeur (BFS) pour trouver le plus court chemin dans un graphe.',
      pitfalls: [
        'Attention a la condition d\'arret des fonctions recursives (risque de Stack Overflow).',
        'Ne pas confondre la complexite pire cas et la complexite moyenne.'
      ]
    }
  ]);

  console.log('Successfully generated all course PDFs in src/assets/courses/');
}

run().catch(err => {
  console.error('Error generating course PDFs:', err);
  process.exit(1);
});
