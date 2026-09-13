/**
 * ai-quiz-blueprints.js
 * Comprehensive pedagogical blueprint targets for all Moroccan school curriculum subjects.
 * Provides 15 distinct, structured curricular targets per subject to ensure 100% dynamic,
 * non-repetitive, high-quality question generation by local Ollama AI (llama3.2).
 */

const BLUEPRINTS_BY_SUBJECT = {
  'francais': [
    "Grammaire / Classes de mots : Dans une phrase courte du quotidien, identifier la classe grammaticale (nom commun, verbe d'action, adjectif qualificatif ou adverbe) d'un mot précis.",
    "Conjugaison : Compléter une phrase avec la forme exacte au présent de l'indicatif d'un verbe régulier ou irrégulier usuel pour un sujet donné.",
    "Orthographe : Compléter une phrase à trou avec le bon homophone grammatical (a / à, et / est, son / sont, on / ont).",
    "Vocabulaire : Trouver l'antonyme (mot de sens contraire) d'un adjectif courant parmi 4 adjectifs.",
    "Syntaxe : Identifier la fonction logique dans la phrase (sujet du verbe, verbe, complément d'objet direct COD ou complément circonstanciel de lieu).",
    "Accords : Choisir l'accord correct en genre et en nombre d'un adjectif qualificatif avec le nom qu'il qualifie.",
    "Vocabulaire : Trouver le synonyme exact d'un mot d'action ou de sentiment parmi 4 propositions.",
    "Conjugaison : Choisir la bonne forme verbale au passé composé avec l'auxiliaire avoir ou être.",
    "Orthographe : Identifier l'orthographe correcte du pluriel d'un nom particulier (mots en -eau, -al ou exceptions).",
    "Ponctuation et types : Reconnaitre le type d'une phrase (déclarative, interrogative, exclamative ou impérative).",
    "Figures de style : Identifier une comparaison simple ou une expression imagée dans une phrase descriptive.",
    "Conjugaison : Trouver la forme correcte d'un verbe au futur simple de l'indicatif.",
    "Grammaire : Reconnaitre la nature d'un déterminant (article défini, article indéfini, adjectif possessif ou démonstratif).",
    "Vocabulaire : Identifier un mot appartenant à la même famille (préfixe, suffixe ou radical partagé).",
    "Logique de texte : Choisir le connecteur logique approprié (mais, donc, car, parce que) pour lier deux propositions."
  ],

  'math': [
    "Calcul numérique : Calculer le résultat d'une opération simple respectant les priorités opératoires (multiplication avant addition/soustraction).",
    "Calcul mental : Trouver le résultat exact d'une multiplication ou d'une division simple.",
    "Fractions : Identifier une fraction équivalente ou la simplification d'une fraction simple (ex: 2/4 = 1/2).",
    "Géométrie : Identifier une propriété caractéristique d'une figure plane (carré, rectangle, losange, triangle rectangle).",
    "Mesures : Calculer le périmètre d'un rectangle ou d'un carré connaissant ses dimensions.",
    "Proportionnalité : Calculer un pourcentage simple et direct sur un nombre entier (ex: 50%, 25%, 10%).",
    "Nombres décimaux : Comparer deux nombres décimaux ou trouver le nombre décimal compris entre deux valeurs.",
    "Géométrie : Identifier la nature d'un angle (angle droit, angle aigu, angle obtus) ou la somme des angles d'un triangle.",
    "Résolution de problème : Résoudre un petit problème concret du quotidien (achat, monnaie ou partage équitable).",
    "Algèbre : Trouver la valeur de l'inconnue x dans une équation élémentaire (ex: x + 7 = 15 ou 3x = 24).",
    "Géométrie : Calculer l'aire d'un rectangle ou d'un carré simple (L × l ou c × c).",
    "Unités de mesure : Convertir une unité de longueur ou de masse (ex: centimètres en mètres, ou grammes en kilogrammes).",
    "Fractions : Additionner deux fractions simples ayant le même dénominateur.",
    "Logique et données : Lire une information clé dans un tableau de données simple ou calculer une moyenne élémentaire.",
    "Puissances et multiples : Identifier un multiple ou un diviseur commun de deux nombres entiers simples."
  ],

  'arabe': [
    "النحو : في جملة فعلية مفيدة، تحديد الفاعل وعلامة رفعه (الضمة الظاهرة).",
    "النحو : تحديد المفعول به في جملة واضحة مع بيان علامة نصبه الفتحة.",
    "الصرف : التمييز بين الفعل الماضي والمضارع والأمر في جملة قصيرة.",
    "الإملاء : اختيار الكلمة الصحيحة التي تحتوي على التاء المربوطة أو المبسوطة.",
    "المعجم : تحديد ضد (عكس) كلمة شائعة من بين أربعة اختيارات.",
    "النحو : تحديد المبتدأ أو الخبر في جملة اسمية بسيطة وضبطه بالشكل.",
    "الصرف : صياغة اسم الفاعل من فعل ثلاثي مجرد (مثل: كتب -> كاتب).",
    "الإملاء : التمييز بين همزة الوصل وهمزة القطع في كلمة محددة.",
    "المعجم : اختيار مرادف كلمة دالة على خلق أو شعور من بين 4 مفردات.",
    "الأساليب : تمييز أسلوب التعجب أو الاستفهام أو النهي في جملة تامة.",
    "النحو : عمل النواسخ الفعلية (كان وأخواتها) في رفع المبتدأ ونصب الخبر.",
    "النحو : عمل النواسخ الحرفية (إن وأخواتها) في نصب المبتدأ ورفع الخبر.",
    "الصرف : تحويل المفرد إلى المثنى المذكر أو المؤنث بزيادة الألف والنون.",
    "الإملاء : كتابة الألف اللينة الممدودة أو المقصورة في أواخر الكلمات.",
    "التعبير والبلاغة : تمييز التشبيه الواضح الذي يحتوي على أداة التشبيه (الكاف أو مثل)."
  ],

  'education_islamique': [
    "العقيدة : معرفة أركان الإسلام الخمسة أو أركان الإيمان الستة والتمييز بينها.",
    "القرآن الكريم : فهم المعنى العام لآية كريمة من قصار السور المقررة.",
    "السيرة النبوية : مولد النبي محمد صلى الله عليه وسلم ونشأته المباركة في مكة.",
    "العبادات : التمييز بين فرائض الوضوء وسننه الأساسية.",
    "الأخلاق الإسلامية : فضيلة الصدق والأمانة في المعاملات مع الناس.",
    "العبادات : عدد ركعات الصلوات المفروضة الخمس (الصبح، الظهر، العصر، المغرب، العشاء).",
    "السيرة النبوية : بداية نزول الوحي على رسول الله صلى الله عليه وسلم بغار حراء.",
    "العبادات : شروط وآداب صيام شهر رمضان المبارك.",
    "الآداب الإسلامية : بر الوالدين والإحسان إليهما وحسن معاملة الجيران.",
    "السيرة النبوية : الهجرة النبوية الشريفة من مكة المكرمة إلى المدينة المنورة.",
    "القرآن الكريم : فضل تلاوة القرآن الكريم وتدبر معانيه السامية.",
    "الطهارة : أهمية النظافة وطهارة الثوب والبدن والمكان لصحة الصلاة.",
    "العقيدة : الإيمان بأسماء الله الحسنى ومعنى اسم من أسمائه الكريمة كالرحيم أو الخالق.",
    "الأخلاق : قيمة التسامح والعفو والرحمة في سيرة النبي صلى الله عليه وسلم.",
    "السيرة النبوية : خلق الرسول صلى الله عليه وسلم ومواقفه مع الأطفال والضعفاء."
  ],

  'physique_chimie': [
    "Chimie : Identifier les 3 états physiques de la matière (solide, liquide, gaz) et leurs propriétés macroscopiques.",
    "Mesures : Choisir le bon instrument et l'unité légale pour mesurer une masse (balance, kilogramme) ou un volume (éprouvette graduée, litre).",
    "Électricité : Identifier les éléments nécessaires au fonctionnement d'un circuit électrique simple (pile, lampe, interrupteur, fils).",
    "Chimie : Distinguer un mélange homogène d'un mélange hétérogène à travers un exemple du quotidien (eau salée, eau boueuse).",
    "Électricité : Reconnaître les matériaux conducteurs (métaux, eau salée) et les matériaux isolants (plastique, bois, verre).",
    "Chimie : Identifier le nom d'un changement d'état physique (fusion, solidification, vaporisation, condensation).",
    "Physique : Caractériser la trajectoire d'un objet en mouvement (rectiligne, circulaire ou curviligne).",
    "Chimie : Comprendre la dissolution d'un soluté dans l'eau et la notion de solution saturée.",
    "Électricité : Distinguer les caractéristiques d'un circuit en boucle simple (série) et avec dérivations.",
    "Physique : Calculer une vitesse moyenne simple à partir de la distance et du temps (v = d / t).",
    "Chimie : Connaître la composition approximative de l'air (environ 78% de diazote et 21% de dioxygène).",
    "Lumière : Distinguer une source primaire de lumière d'un objet diffusant (récepteur de lumière).",
    "Chimie : Comprendre pourquoi certains corps flottent sur l'eau et d'autres coulent (notion de masse volumique comparée à l'eau).",
    "Mécanique : Reconnaître les effets d'une force (mise en mouvement, modification de trajectoire, déformation).",
    "Sécurité : Connaître les règles de sécurité indispensables face aux risques électriques ou aux produits chimiques ménagers."
  ],

  'biologie': [
    "Nutrition : Identifier le rôle protecteur, énergétique ou bâtisseur des groupes d'aliments (glucides, lipides, protéines, vitamines).",
    "Respiration : Expliquer les échanges gazeux respiratoires pulmonaires (absorption du dioxygène O2 et rejet du dioxyde de carbone CO2).",
    "Circulation : Décrire le rôle moteur du cœur et la circulation du sang dans les artères et les veines.",
    "Botanique : Identifier les besoins fondamentaux d'une plante verte pour fabriquer sa matière (lumière, eau, sels minéraux, dioxyde de carbone).",
    "Écologie : Identifier la place d'un être vivant dans une chaîne alimentaire simple (producteur végétal, consommateur herbivore, carnivore).",
    "Reproduction des plantes : Reconnaitre le rôle des fleurs, du pollen et des graines dans la reproduction sexuée des végétaux.",
    "Mouvement : Identifier le rôle coordonné des os, des articulations et des muscles lors d'un mouvement de flexion ou extension.",
    "Géologie : Décrire les étapes du cycle de l'eau dans la nature (évaporation, condensation en nuages, précipitations, ruissellement).",
    "Santé : Comprendre l'importance de l'hygiène, du sommeil et de l'exercice physique pour le système immunitaire.",
    "Biodiversité : Identifier une action humaine positive ou négative sur l'équilibre d'un écosystème naturel.",
    "Digestion : Identifier le parcours des aliments et la transformation en nutriments dans l'appareil digestif.",
    "Système nerveux : Reconnaitre comment les organes des sens captent un stimulus transmis au cerveau par les nerfs.",
    "Géologie : Identifier les manifestations d'un séisme ou les caractéristiques d'une éruption volcanique.",
    "Croissance : Reconnaitre les grandes étapes de croissance et de développement chez l'être humain ou les animaux.",
    "Éco-citoyenneté : Expliquer pourquoi le recyclage des déchets et la préservation de l'eau douce sont essentiels."
  ],

  'anglais': [
    "Grammar : Complete a sentence with the correct form of the verb 'to be' in the present simple (am / is / are).",
    "Vocabulary : Identify the correct daily routine action verb (wake up, brush teeth, have breakfast, go to school).",
    "Grammar : Choose the correct present continuous form (am/is/are + verb-ing) for an action happening right now.",
    "Vocabulary : Select the appropriate family member term (father, sister, uncle, cousin) described in a short context.",
    "Prepositions : Complete a sentence with the correct preposition of place (in, on, under, between, behind).",
    "Grammar : Choose the right question word (Who, What, Where, When, Why, How) for a given answer.",
    "Vocabulary : Identify the correct English expression for telling the time or a date.",
    "Grammar : Select the correct simple past form of a common regular or irregular verb (e.g. visited, went, played, ate).",
    "Vocabulary : Choose the correct food or drink item from a polite dining or shopping situation.",
    "Modals : Use the modal verb 'can' or 'cannot' to express ability or permission in a sentence.",
    "Vocabulary : Select the correct weather adjective (sunny, rainy, windy, snowy, cloudy) matching a short description.",
    "Grammar : Choose the correct comparative or superlative form (taller than, the highest, faster).",
    "Vocabulary : Identify a common school classroom object or subject from its definition.",
    "Grammar : Complete a sentence with the right possessive adjective (my, your, his, her, our, their).",
    "Communication : Select the most polite and natural response to a greeting, introduction, or simple question."
  ],

  'histoire_geo': [
    "Histoire : Identifier l'ordre chronologique des grandes périodes historiques (Préhistoire, Antiquité, Moyen Âge, Temps modernes, Époque contemporaine).",
    "Géographie : Identifier un continent ou un océan sur le planisphère mondial.",
    "Histoire : Comprendre l'apparition des premières écritures et civilisations autour du bassin méditerranéen.",
    "Géographie : Reconnaitre les lignes imaginaires fondamentales de la Terre (l'Équateur, les Tropiques, le Méridien de Greenwich).",
    "Histoire du Maroc : Connaitre une grande dynastie marocaine (les Idrissides, Almoravides, Almohades, Mérinides, Saadiens ou Alaouites).",
    "Géographie : Identifier les grandes zones climatiques mondiales (zone froide/polaire, tempérée, chaude/tropicale).",
    "Éducation civique : Connaitre un droit fondamental de l'enfant ou un devoir citoyen à l'école.",
    "Histoire : Décrire la vie au Moyen Âge : châteaux forts, chevaliers, rôle des artisans et paysans.",
    "Géographie : Distinguer un paysage rural agricole d'un paysage urbain de grande métropole.",
    "Histoire : Reconnaitre les grandes découvertes géographiques de la Renaissance (navigateurs et caravelles).",
    "Géographie : Comprendre l'importance de la gestion durable des ressources en eau au Maroc et dans le monde.",
    "Éducation civique : Identifier les valeurs fondamentales de la tolérance, de la coopération et du respect mutuel.",
    "Histoire du Maroc : Connaitre les faits marquants de l'indépendance du Maroc et la portée historique de la Marche Verte (1975).",
    "Géographie : Reconnaitre l'utilité des réseaux de transport modernes (routes, trains à grande vitesse, ports maritimes).",
    "Histoire : Identifier une grande invention qui a transformé la vie humaine (imprimerie, machine à vapeur, électricité)."
  ],

  'informatique': [
    "Matériel : Identifier un composant matériel essentiel de l'ordinateur (unité centrale, écran, clavier, souris, mémoire vive RAM).",
    "Logiciels : Différencier un système d'exploitation (Windows, Linux, macOS) d'un logiciel applicatif (navigateur web, traitement de texte).",
    "Données : Connaître les unités de mesure de la capacité de stockage numérique (Octet, Ko, Mo, Go, To).",
    "Algorithmique : Définir la notion d'algorithme comme une suite ordonnée et logique d'instructions pour accomplir une tâche.",
    "Sécurité : Identifier la bonne pratique pour créer un mot de passe robuste et protéger ses données personnelles.",
    "Internet : Comprendre le rôle d'une adresse web (URL) et la fonction d'un navigateur internet pour afficher des pages web.",
    "Programmation : Reconnaitre ce qu'est une variable (un espace mémoire pour stocker une valeur modifiable).",
    "Bureautique : Connaître un raccourci clavier universel essentiel (Ctrl+C pour copier, Ctrl+V pour coller, Ctrl+Z pour annuler).",
    "Algorithmique : Identifier le fonctionnement d'une condition logique élémentaire (Si condition Alors action Sinon autre action).",
    "Communication : Identifier les éléments d'un courriel électronique (adresse email du destinataire, objet, corps du message et pièce jointe).",
    "Programmation : Comprendre le rôle d'une boucle répétitive (Répéter 5 fois) dans un programme visuel ou textuel.",
    "Sécurité : Reconnaitre un message suspect d'hameçonnage (phishing) et la règle de ne jamais divulguer de mot de passe.",
    "Fichiers : Reconnaitre l'organisation des fichiers dans des dossiers et l'arborescence du disque dur.",
    "Débogage : Identifier la démarche pour repérer et corriger un bogue ou une erreur dans une suite d'instructions.",
    "Citoyenneté numérique : Adopter un comportement respectueux en ligne (la nétiquette) et limiter le temps excessif devant les écrans."
  ],

  'eps': [
    "Physiologie : Identifier les réactions du corps lors de l'effort physique (augmentation de la fréquence cardiaque et respiratoire).",
    "Échauffement : Comprendre le rôle indispensable de l'échauffement progressif avant toute activité sportive pour éviter les blessures.",
    "Esprit sportif : Reconnaitre les principes du fair-play : respect des règles, des arbitres et des adversaires.",
    "Hydratation : Expliquer pourquoi il est crucial de s'hydrater régulièrement avant, pendant et après l'effort.",
    "Sécurité : Identifier les équipements de protection obligatoires selon l'activité (casque, protège-tibias, chaussures adaptées).",
    "Sports collectifs : Comprendre la notion de jeu d'équipe, de démarquage et de passe pour progresser collectivement.",
    "Récupération : Identifier les facteurs d'une bonne récupération musculaire (étirements doux, sommeil réparateur, alimentation saine).",
    "Athlétisme : Distinguer une épreuve de course de vitesse (sprint) d'une course d'endurance (demi-fond).",
    "Rythme cardiaque : Savoir comment prendre son pouls au repos et après un exercice soutenu.",
    "Santé et bien-être : Expliquer pourquoi la pratique régulière d'une activité physique renforce le cœur et réduit le stress.",
    "Gymnastique : Reconnaitre des notions clés de motricité : équilibre, coordination et souplesse.",
    "Règlements : Comprendre l'utilité des lignes de jeu et des zones hors-limites dans un sport collectif.",
    "Entraide : Identifier le rôle de l'arbitrage et du soutien mutuel entre coéquipiers.",
    "Posture : Adopter une posture ergonomique et sécuritaire pour soulever une charge ou courir sans se blesser le dos.",
    "Énergie et alimentation : Identifier le repas adapté avant une compétition sportive (sucres lents, fruits, eau)."
  ],

  'methodologie': [
    "Organisation : Structurer son espace de travail et son bureau pour favoriser une concentration maximale sans distraction.",
    "Gestion du temps : Établir un planning de révision régulier et réaliste plutôt que de tout apprendre à la dernière minute.",
    "Mémorisation : Utiliser la répétition espacée et la reformulation avec ses propres mots pour ancrer durablement une leçon.",
    "Prise de notes : Savoir souligner ou surligner les mots-clés essentiels d'un texte plutôt que des paragraphes entiers.",
    "Fiches de synthèse : Créer des fiches de révision claires avec des titres, puces et schémas récapitulatifs.",
    "Lecture active : Lire un énoncé deux fois attentivement en repérant la question exacte posée et les données fournies.",
    "Gestion du stress : Pratiquer la respiration calme et la pensée positive avant un examen ou une interrogation orale.",
    "Auto-évaluation : Tester ses connaissances en se posant des questions ou en refaisant les exercices sans regarder le corrigé.",
    "Découpage des tâches : Diviser un devoir long ou complexe en plusieurs petites étapes faciles à accomplir.",
    "Relecture méthodique : Conserver 5 minutes à la fin d'un devoir pour vérifier l'orthographe, les calculs et les unités.",
    "Cartes mentales : Organiser visuellement les idées principales d'un chapitre sous forme de schéma heuristique ou carte mentale.",
    "Sommeil et cerveau : Comprendre pourquoi un sommeil suffisant (8 à 9 heures) est indispensable à la consolidation de la mémoire.",
    "Poser des questions : Oser demander des explications à son enseignant ou son tuteur dès qu'une notion reste floue.",
    "Analyser ses erreurs : Utiliser ses erreurs passées comme des leviers de progression pour ne plus les reproduire.",
    "Motivation : Se fixer des petits objectifs quotidiens atteignables et célébrer chaque étape franchie."
  ],

  'gestion': [
    "Entreprise : Définir ce qu'est une entreprise et son objectif de production de biens ou de services pour satisfaire un besoin.",
    "Recettes et dépenses : Distinguer les flux entrants (chiffre d'affaires / ventes) des flux sortants (charges, achats, salaires).",
    "Calcul du résultat : Savoir que Résultat = Produits - Charges, et identifier un bénéfice (résultat positif) ou une perte (résultat négatif).",
    "Facturation : Identifier le rôle légal et comptable d'une facture de vente dans une transaction commerciale.",
    "Partenaires : Différencier le rôle d'un client (qui achète) de celui d'un fournisseur (qui approvisionne l'entreprise).",
    "Bilan simplifié : Comprendre que l'Actif représente ce que l'entreprise possède et le Passif ce qu'elle doit.",
    "Trésorerie : Définir la trésorerie disponible comme les liquidités immédiates en compte bancaire et caisse.",
    "Stocks : Comprendre l'importance de la gestion des stocks pour éviter les ruptures tout en limitant les coûts d'entreposage.",
    "Budget : Définir un budget prévisionnel comme une estimation anticipée des dépenses et recettes futures.",
    "Prix de vente : Savoir que le prix de vente doit couvrir le coût d'achat et les charges pour dégager une marge commerciale.",
    "TVA : Comprendre que la Taxe sur la Valeur Ajoutée est un impôt indirect collecté par l'entreprise pour l'État.",
    "Banques : Identifier le rôle du crédit bancaire pour financer des investissements durables (matériel, locaux).",
    "Ressources humaines : Comprendre le rôle du bulletin de paie et du contrat de travail dans la relation salarié-employeur.",
    "Marketing : Identifier comment une étude de marché aide à adapter un produit aux attentes réelles des consommateurs.",
    "Éthique : Comprendre la responsabilité sociétale et environnementale d'une entreprise moderne."
  ]
};

function generateTopicTargets(topicName, countNeeded, subKey) {
  const isAr = subKey === 'arabe' || subKey === 'education_islamique';
  const isEn = subKey === 'anglais';
  if (isAr) {
    return [
      `المفهوم الأساسي والتعريف الدقيق لموضوع : ${topicName}`,
      `مثال تطبيقي مباشر ومبسط حول : ${topicName}`,
      `القاعدة الجوهرية والشرط الأساسي في : ${topicName}`,
      `التمييز بين الحالات والأنواع المرتبطة بـ : ${topicName}`,
      `الخطأ الشائع الواجب تفاديه عند التعامل مع : ${topicName}`,
      `استخراج أو تحديد عنصر مرتبط بـ : ${topicName} من جملة نموذجية`,
      `سؤال في الدلالة أو الصياغة الصحيحة لموضوع : ${topicName}`,
      `تحليل مسألة أو تركيب لغوي يعتمد على : ${topicName}`,
      `المقارنة والتمييز بين مفهوم : ${topicName} ومفاهيم أخرى مشابهة`,
      `سؤال استنتاجي وتطبيقي يختبر الاستيعاب العميق لـ : ${topicName}`,
      `الضبط بالشكل التام أو الإعراب الخاص بـ : ${topicName}`,
      `حالة خاصة أو استثناء مهم في : ${topicName}`,
      `تطبيق عملي في سياق مفيد على : ${topicName}`,
      `تحويل أو تصريف أو إعادة صياغة مرتبطة بـ : ${topicName}`,
      `خلاصة وقاعدة جامعة يجب تذكرها حول : ${topicName}`
    ].slice(0, countNeeded);
  }
  if (isEn) {
    return [
      `Core definition and fundamental concept of ${topicName}`,
      `Direct and simple real-world application example of ${topicName}`,
      `Key grammar or vocabulary rule governing ${topicName}`,
      `Common pitfall or frequent mistake to avoid with ${topicName}`,
      `Fill-in-the-blank exercise applying ${topicName} in a complete sentence`,
      `Distinguishing ${topicName} from related or similar concepts`,
      `Sentence transformation or reformulation using ${topicName}`,
      `Identifying the correct usage of ${topicName} among 4 choices`,
      `Reading context and finding an example of ${topicName}`,
      `Practical communication scenario involving ${topicName}`,
      `Irregular or exceptional cases in ${topicName}`,
      `Step-by-step reasoning problem applying ${topicName}`,
      `Negative or question form related to ${topicName}`,
      `Choosing the correct distractor vs accurate answer for ${topicName}`,
      `Summary principle and golden rule to remember about ${topicName}`
    ].slice(0, countNeeded);
  }
  return [
    `Définition fondamentale et sens concret de la notion : ${topicName}`,
    `Exemple d'application directe en une étape de : ${topicName}`,
    `Règle principale ou condition indispensable liée à : ${topicName}`,
    `Erreur classique ou piège fréquent à éviter sur : ${topicName}`,
    `Exercice concret à compléter mettant en pratique : ${topicName}`,
    `Distinction entre ${topicName} et une notion proche ou complémentaire`,
    `Formule, propriété ou repère caractéristique de : ${topicName}`,
    `Petit problème concret ou mise en situation pratique de : ${topicName}`,
    `Identification d'un exemple correct de ${topicName} parmi 4 propositions`,
    `Cas particulier ou exception importante concernant : ${topicName}`,
    `Raisonnement logique ou déduction étape par étape avec : ${topicName}`,
    `Analyse critique d'une proposition fausse sur : ${topicName}`,
    `Calcul, accord ou transformation méthodique fondé sur : ${topicName}`,
    `Conséquence directe ou résultat attendu de : ${topicName}`,
    `Synthèse et règle d'or à toujours retenir sur : ${topicName}`
  ].slice(0, countNeeded);
}

/**
 * Specifically calibrated pedagogical targets for 1st Year Primary (CP - 6 years old).
 * Strictly forbids fractions, multiplications, abstract grammar, and algebra.
 */
const BLUEPRINTS_PRIMAIRE_1 = {
  'francais': [
    "Alphabet et lettres : Identifier une lettre majuscule ou minuscule parmi 4 lettres (ex: reconnaître le 'A' ou le 'b').",
    "Les voyelles : Trouver la voyelle parmi 4 lettres de l'alphabet (a, e, i, o, u).",
    "Son initial : Quel mot commence par la lettre demandée (ex: quel mot commence par la lettre P : Pomme, Chat, Vélo, Lit) ?",
    "Syllabes simples : Compter le nombre de syllabes orales dans un mot simple (ex: 'ba-na-ne' a 3 syllabes).",
    "Les articles simples : Choisir entre 'un' ou 'une' devant un nom familier (ex: un ballon, une fleur).",
    "Les articles définis : Choisir entre 'le' ou 'la' devant un mot courant (ex: le soleil, la table).",
    "Mots du quotidien : Quel mot correspond à l'objet ou à l'animal décrit (un chat, une maison, un livre, une pomme) ?",
    "Phrase simple à trou : Compléter une phrase de 4 mots avec le mot logique (ex: 'Le chat boit du ...' : lait, caillou, bois, fer).",
    "Les couleurs de base : Identifier la bonne couleur d'un objet usuel (ex: le soleil est jaune, l'herbe est verte).",
    "Singulier et pluriel simple : Trouver le mot qui désigne un seul objet (le chat) ou plusieurs objets (les chats).",
    "Les animaux familiers : Quel animal aboie ou miaule (le chien aboie, le chat miaule) ?",
    "L'école et la classe : Quel objet sert à écrire ou dessiner sur un cahier (le crayon, la gomme, la règle, le cartable) ?",
    "La famille : Qui est le père de mon père (mon grand-père, mon frère, mon cousin, mon oncle) ?",
    "Formules de politesse : Que dit-on quand on arrive le matin à l'école (Bonjour, Bonne nuit, Au revoir, Pardon) ?",
    "Sens des mots : Trouver le contraire d'un mot très simple (ex: le contraire de 'grand' est 'petit')."
  ],

  'math': [
    "Dénombrement 1 à 5 : Compter un petit nombre d'objets (ex: 2 étoiles et 1 étoile, cela fait 3 étoiles).",
    "Suite des nombres 1 à 10 : Quel nombre vient juste après 4 (5, 3, 6, 2) ?",
    "Suite des nombres 1 à 10 : Quel nombre vient juste avant 7 (6, 8, 5, 7) ?",
    "Comparaison simple : Quel est le plus grand nombre entre 3 et 8 (8, 3, 2, 5) ?",
    "Comparaison simple : Quel est le plus petit nombre parmi 2, 7, 9, 5 (2, 7, 9, 5) ?",
    "Addition sous 5 : Calculer une addition très simple : 2 + 2 = ? (4, 3, 5, 2).",
    "Addition avec 1 : Calculer : 3 + 1 = ? (4, 5, 2, 3).",
    "Addition sous 10 : Calculer : 4 + 3 = ? (7, 6, 8, 5).",
    "Les compléments à 5 : Si j'ai 3 bonbons, combien m'en manque-t-il pour en avoir 5 (2, 1, 3, 4) ?",
    "Soustraction imagée sous 5 : J'ai 4 biscuits, j'en mange 1, combien m'en reste-t-il (3, 2, 4, 5) ?",
    "Formes géométriques simples : La forme d'une roue de vélo ou d'un ballon est un ... (rond/cercle, carré, triangle, rectangle).",
    "Formes géométriques simples : Combien de côtés possède un triangle (3, 4, 2, 5) ?",
    "Formes géométriques simples : Une boîte avec 4 côtés tous égaux est un ... (carré, triangle, rond, étoile).",
    "Repérage dans l'espace : Où se trouve le chapeau (sur la tête, sous les pieds, derrière le dos) ?",
    "Grandeur et mesure : Entre une souris et un éléphant, quel animal est le plus lourd/grand (l'éléphant, la souris, ils sont égaux) ?"
  ],

  'arabe': [
    "الحروف الهجائية : أَيُّ حَرْفٍ تَبْدَأُ بِهِ كَلِمَةُ «بَاب» ؟ (حرف الباء، حرف الميم، حرف الدال، حرف الراء).",
    "الحركات القصيرة : الحَرَكَةُ فَوْقَ حَرْفِ الدَّالِ فِي كَلِمَةِ «دَار» هِيَ : (الفَتْحَة، الضَّمَّة، الكَسْرَة، السُّكُون).",
    "الحركات القصيرة : الحَرَكَةُ فِي أَوَّلِ كَلِمَةِ «أُمِّي» هِيَ : (الضَّمَّة، الفَتْحَة، الكَسْرَة، السُّكُون).",
    "الحركات الطويلة (المَدّ) : مَا هُوَ حَرْفُ المَدِّ فِي كَلِمَةِ «تِين» ؟ (اليَاء، الأَلِف، الوَاو، النُّون).",
    "الحركات الطويلة (المَدّ) : مَا هُوَ حَرْفُ المَدِّ فِي كَلِمَةِ «تُوت» ؟ (الوَاو، الأَلِف، اليَاء، المِيم).",
    "أسماء الإشارة للمذكر : نَقُولُ لِلْوَلَدِ : (هَذَا وَلَدٌ، هَذِهِ وَلَدٌ، تِلْكَ وَلَدٌ، هُنَا وَلَدٌ).",
    "أسماء الإشارة للمؤنث : نَقُولُ لِلْبِنْتِ : (هَذِهِ بِنْتٌ، هَذَا بِنْتٌ، ذَلِكَ بِنْتٌ، هُنَا بِنْتٌ).",
    "الأدوات المدرسية : بِمَاذَا نَكْتُبُ الدَّرْسَ فِي الدَّفْتَرِ ؟ (بِالقَلَمِ، بِالمِمْحَاةِ، بِالمِسْطَرَةِ، بِالمِحْفَظَةِ).",
    "الأدوات المدرسية : بِمَاذَا نَمْسَحُ الخَطَأَ فِي الدَّفْتَرِ ؟ (بِالمِمْحَاةِ، بِالقَلَمِ، بِالمِقَصِّ، بِالكِتَابِ).",
    "الحيوانات الأليف : مَا هُوَ الحَيَوَانُ الَّذِي يَمُوءُ وَيَقُولُ «مِيَاو» ؟ (القِطُّ، الكَلْبُ، الخَرُوفُ، الحِصَانُ).",
    "الألوان البسيطة : مَا هُوَ لَوْنُ الشَّمْسِ ؟ (أَصْفَر، أَزْرَق، أَخْضَر، أَسْوَد).",
    "أفراد العائلة : أُمُّ أَبِي هِيَ : (جَدَّتِي، أُخْتِي، خَالَتِي، عَمَّتِي).",
    "التحية الإسلامية : عِنْدَمَا نَلْتَقِي بِأَصْدِقَائِنَا نَقُولُ : (السَّلَامُ عَلَيْكُمْ، مَعَ السَّلَامَة، تَصْبَحُ عَلَى خَيْر، عَفْوًا).",
    "الكلمات البسيطة : كَلِمَةُ «كِـتَـاب» تَتَكَوَّنُ مِنْ كَمْ حَرْفٍ ؟ (4 حُرُوف، حَرْفَانِ، 6 حُرُوف، حَرْف وَاحِد).",
    "حواس الإنسان : بِمَاذَا نَسْمَعُ الأَصْوَاتَ ؟ (بِالأُذُنِ، بِالعَيْنِ، بِالأَنْفِ، بِاليَدِ)."
  ],

  'education_islamique': [
    "أركان الإسلام : كَمْ عَدَدُ أَرْكَانِ الإِسْلَامِ ؟ (5 أَرْكَان، 3 أَرْكَان، 7 أَرْكَان، 10 أَرْكَان).",
    "الشهادتان : الرُّكْنُ الأَوَّلُ مِنْ أَرْكَانِ الإِسْلَامِ هُوَ : (الشَّهَادَتَانِ، الصَّوْمُ، الحَجُّ، الزَّكَاةُ).",
    "الصلوات المفروضة : كَمْ عَدَدُ الصَّلَوَاتِ المَفْرُوضَةِ فِي اليَوْمِ وَاللَّيْلَةِ ؟ (5 صَلَوَات، 3 صَلَوَات، 2 صَلَوَات، 7 صَلَوَات).",
    "سورة الفاتحة : مَا هِيَ السُّورَةُ الَّتِي نَقْرَأُهَا فِي كُلِّ رَكْعَةٍ مِنَ الصَّلَاةِ ؟ (سُورَةُ الفَاتِحَة، سُورَةُ النَّاس، سُورَةُ الفَلَق، سُورَةُ الإِخْلَاص).",
    "نبينا الكريم : مَنْ هُوَ نَبِيُّنَا وَرَسُولُنَا الكَرِيمُ ؟ (مُحَمَّدٌ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّم، إِبْرَاهِيم، مُوسَى، عِيسَى).",
    "آداب الأكل : مَاذَا نَقُولُ قَبْلَ أَنْ نَبْدَأَ فِي الأَكْلِ ؟ (بِسْمِ اللَّهِ، الحَمْدُ لِلَّهِ، أَسْتَغْفِرُ اللَّه، سُبْحَانَ اللَّه).",
    "آداب الأكل : مَاذَا نَقُولُ عِنْدَمَا نَنْتَهِي مِنَ الأَكْلِ ؟ (الحَمْدُ لِلَّهِ، بِسْمِ اللَّهِ، مَعَ السَّلَامَة، السَّلَامُ عَلَيْكُمْ).",
    "آداب الأكل : بِأَيِّ يَدٍ نَأْكُلُ الطَّعَامَ كَمَا عَلَّمَنَا رَسُولُ اللَّهِ ؟ (بِاليَدِ اليُمْنَى، بِاليَدِ اليُسْرَى، بِاليَدَيْنِ مَعًا، لَا فَرْقَ).",
    "بر الوالدين : كَيْفَ نُعَامِلُ أُمَّنَا وَأَبَانَا ؟ (بِالإِحْسَانِ وَالاحْتِرَامِ، بِالغَضَبِ، بِالصُّرَاخِ، بِالتَّجَاهُلِ).",
    "الصدق والأمانة : تِلْمِيذٌ وَجَدَ قَلَمًا فِي القِسْمِ لَيْسَ لَهُ، مَاذَا يَفْعَلُ ؟ (يُعْطِيهِ لِلْمُعَلِّمِ، يَأْخُذُهُ إِلَى المَنْزِلِ، يَرْمِيهِ، يُخْفِيهِ).",
    "الطهارة والنظافة : الإِسْلَامُ يَحُثُّنَا عَلَى : (النَّظَافَةِ وَالطَّهَارَةِ، الإِهْمَالِ، تَرْكِ الأَوْسَاخِ، الفَوْضَى).",
    "التحية الإسلامية : تَحِيَّةُ الإِسْلَامِ هِيَ : (السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ، صَبَاحُ الخَيْر فَقَط، هَلَّا، بَايْ).",
    "سورة الإخلاص : قُلْ هُوَ اللَّهُ : (أَحَد، الصَّمَد، الكَبِير، الرَّحِيم).",
    "خالق الكون : مَنْ خَلَقَ الإِنْسَانَ وَالشَّمْسَ وَالسَّمَاءَ ؟ (اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، الإِنْسَان، الطَّبِيعَة، المَلَائِكَة).",
    "الرحمة بالحيوان : إِذَا رَأَيْتُ قِطًّا عَطْشَانًا أَقُومُ بِـ : (سِقَايَتِهِ المَاءَ وَالرِّفْقِ بِهِ، ضَرْبِهِ، إِخَافَتِهِ، طَرْدِهِ)."
  ],

  'biologie': [
    "Les 5 sens : Avec quel organe pouvons-nous voir les couleurs et les formes (les yeux, les oreilles, le nez, la bouche) ?",
    "Les 5 sens : Avec quel organe pouvons-nous entendre de la musique ou un bruit (les oreilles, les yeux, les mains, la langue) ?",
    "Les 5 sens : Quel sens nous permet de sentir la bonne odeur d'une fleur (l'odorat avec le nez, la vue, l'ouïe, le goût) ?",
    "Les 5 sens : Quel organe nous permet de goûter si un aliment est sucré ou salé (la langue dans la bouche, les oreilles, les yeux, le nez) ?",
    "Le corps humain : Combien d'yeux possède un être humain (2 yeux, 1 œil, 3 yeux, 4 yeux) ?",
    "Le corps humain : Combien de mains avons-nous (2 mains, 1 main, 3 mains, 4 mains) ?",
    "Vivant ou non-vivant : Lequel de ces éléments est un être vivant qui grandit et respire (un petit oiseau, un caillou, une règle en plastique, une table) ?",
    "Les animaux et leurs petits : Comment appelle-t-on le petit bébé du chien (le chiot, le chaton, le poussin, le veau) ?",
    "Les animaux et leurs petits : Comment appelle-t-on le petit de la poule (le poussin, le chiot, l'agneau, le caneton) ?",
    "Les plantes : De quoi a besoin une petite graine pour germer et devenir une jolie plante (d'eau et de lumière du soleil, de bonbons, de jus de fruit, de jouets) ?",
    "Le jour et la nuit : Quand le soleil se couche et que la lune apparaît avec les étoiles, c'est ... (la nuit, le jour, le midi, le matin) ?",
    "Les saisons : Quelle est la saison où il fait chaud et où l'on va se baigner à la plage (l'été, l'hiver, l'automne, le printemps) ?",
    "Les saisons : En hiver, quel vêtement met-on pour ne pas avoir froid dehors (un manteau chaud, un maillot de bain, des sandales, un t-shirt court) ?",
    "L'hygiène : Que faut-il faire avant de passer à table pour manger (se laver les mains avec de l'eau et du savon, courir, dessiner, dormir) ?",
    "Les dents : Avec quoi se brosse-t-on les dents après les repas (avec une brosse à dents et du dentifrice, avec du savon, avec une éponge, avec une serviette) ?"
  ],

  'anglais': [
    "Greetings: What do you say in English when you meet someone in the morning (Hello / Good morning, Goodbye, Good night, Sleep well)?",
    "Greetings: What do you say in English when you leave (Goodbye / Bye, Hello, Good morning, Hi)?",
    "Numbers: How many fingers do you have on one hand (Five, Two, Ten, One)?",
    "Numbers: Which number is 'Two' in digits (2, 5, 3, 1)?",
    "Numbers: Which number comes after 'Two' (Three, One, Four, Zero)?",
    "Colors: What color is the sun (Yellow, Blue, Black, Purple)?",
    "Colors: What color is an apple (Red, Blue, Black, Grey)?",
    "Colors: What color is the grass (Green, Red, Orange, Pink)?",
    "Animals: Which animal says 'Meow' (Cat, Dog, Bird, Fish)?",
    "Animals: Which animal says 'Woof' (Dog, Cat, Horse, Duck)?",
    "Family: Who is 'Mother' (Mom, Brother, Sister, Uncle)?",
    "Family: Who is 'Father' (Dad, Sister, Aunt, Cousin)?",
    "School: What do you use to write (Pencil, Bag, Shoe, Apple)?",
    "Body: Point to your 'Eyes' - how many eyes do you have (Two, One, Four, Three)?",
    "Politeness: What magic word do you say when someone helps you (Thank you, Hello, No, Stop)?"
  ]
};

/**
 * Normalizes education level string into categorized pedagogical curriculum tier.
 */
function detectEducationTier(levelStr = '') {
  const s = String(levelStr || '').toLowerCase().trim();
  if (
    s.includes('1ère année primaire') || s.includes('1ere annee primaire') ||
    s.includes('1ère primaire') || s.includes('1ere primaire') ||
    s.includes('cp') || s.includes('1 ap') || s.includes('1ap') ||
    s.includes('cours préparatoire') || s.includes('premiere primaire') ||
    s.includes('première primaire') || s.includes('1 primaire')
  ) {
    return 'primaire_1'; // Strictly CP / 1ère AP (6 years old)
  }
  if (
    s.includes('2ème année primaire') || s.includes('2eme annee primaire') ||
    s.includes('2ème primaire') || s.includes('2eme primaire') ||
    s.includes('ce1') || s.includes('2 ap') || s.includes('2ap')
  ) {
    return 'primaire_2'; // CE1 (7 years old)
  }
  if (
    s.includes('3ème') || s.includes('3eme') || s.includes('ce2') ||
    s.includes('4ème') || s.includes('4eme') || s.includes('cm1')
  ) {
    return 'primaire_moyen';
  }
  if (
    s.includes('5ème') || s.includes('5eme') || s.includes('cm2') ||
    s.includes('6ème') || s.includes('6eme') || s.includes('6 ap')
  ) {
    return 'primaire_superieur';
  }
  if (s.includes('collège') || s.includes('college')) {
    return 'college';
  }
  return 'primaire_1'; // Safe default for Moroccan school
}

/**
 * Returns curriculum targets matching precisely both the education level and the subject.
 */
function getBlueprintsForLevelAndSubject(levelStr = '', subjectKey = 'francais') {
  const tier = detectEducationTier(levelStr);
  if (tier === 'primaire_1' && BLUEPRINTS_PRIMAIRE_1[subjectKey]) {
    return BLUEPRINTS_PRIMAIRE_1[subjectKey];
  }
  return BLUEPRINTS_BY_SUBJECT[subjectKey] || BLUEPRINTS_BY_SUBJECT['francais'];
}

module.exports = {
  BLUEPRINTS_BY_SUBJECT,
  BLUEPRINTS_PRIMAIRE_1,
  detectEducationTier,
  getBlueprintsForLevelAndSubject,
  generateTopicTargets
};
