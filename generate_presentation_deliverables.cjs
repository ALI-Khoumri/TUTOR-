const pptxgen = require('pptxgenjs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } = require('docx');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. DÉFINITION DES DONNÉES COMPLÈTES DE LA PRÉSENTATION
// ============================================================================

const SLIDES_DATA = [
  {
    num: 1,
    category: "PAGE DE GARDE",
    title: "TutorAI : Plateforme Web Adaptative de Soutien Scolaire",
    subtitle: "Tuteur Intelligent pour Enfants et Collégiens en Difficulté (6 à 15 ans)",
    timing: "1 min",
    points: [
      "Projet de Fin d'Année (PFA) — 3ème Année Ingénierie Informatique & Réseaux (IIR)",
      "Réalisé par : Ali KHOUMRI",
      "Encadrante Pédagogique : Madame Souad ATIGI (EMSI)",
      "Encadrante Professionnelle : Madame Aïcha FADLI (UQASE NEXT SARL)",
      "Organisme d'accueil : UQASE NEXT SARL (Casablanca)",
      "Année Universitaire : 2025 / 2026"
    ],
    notes: "Bonjour Mesdames et Messieurs les membres du jury, Madame mon encadrante pédagogique Mme Souad Atigi, ainsi que toute l'assistance. Je suis très honoré de vous présenter aujourd'hui mon projet de fin d'année de 3ème année en Ingénierie Informatique et Réseaux, intitulé « TutorAI ». Ce projet a été réalisé au cours de mon stage au sein de la société UQASE NEXT SARL à Casablanca, sous la supervision conjointe de Madame Aïcha Fadli et de Madame Souad Atigi. TutorAI est une plateforme web d'apprentissage adaptatif et de remédiation pédagogique propulsée par l'intelligence artificielle locale, dédiée aux élèves du primaire et du collège âgés de 6 à 15 ans.",
    image: null,
    layout: "cover"
  },
  {
    num: 2,
    category: "INTRODUCTION",
    title: "Plan de la Présentation",
    subtitle: "Démarche d'ingénierie suivie tout au long du cycle de développement",
    timing: "45 sec",
    points: [
      "1. Contexte, Problématique & Objectifs du Projet",
      "2. Entreprise d'Accueil & Méthodologie Agile Scrum",
      "3. Analyse de l'Existant & Spécification des Besoins",
      "4. Conception Architecturale & Modélisation UML",
      "5. Réalisation Technique, Interfaces & Sécurité",
      "6. Tests, Validation & Performances Réelles",
      "7. Bilan du Stage, Perspectives d'Évolution & Conclusion"
    ],
    notes: "Pour vous présenter ce travail, j'adopterai une démarche d'ingénierie rigoureuse articulée en sept parties. Nous débuterons par le contexte éducatif et la problématique qui justifient ce projet. Nous décrirons ensuite le cadre d'accueil chez UQASE NEXT et la méthodologie Agile appliquée. Nous détaillerons ensuite l'analyse des besoins, la conception UML et architecturale, avant d'aborder la réalisation logicielle, les résultats expérimentaux de nos tests et enfin le bilan et les perspectives d'avenir.",
    image: null,
    layout: "agenda"
  },
  {
    num: 3,
    category: "CONTEXTE & PROBLÉMATIQUE",
    title: "Contexte Général & Problématique Métier",
    subtitle: "Le défi du soutien scolaire individualisé pour les 6–15 ans",
    timing: "1 min 15 sec",
    points: [
      "Constat alarmant : Décrochage scolaire précoce au primaire et au collège lié à l'accumulation de lacunes non détectées.",
      "Contraintes structurelles : Classes nombreuses ne permettant pas un suivi individualisé par l'enseignant.",
      "Limites des plateformes actuelles : Contenus passifs, parcours rigides et absence de remédiation interactive bienveillante.",
      "Risque des IA grand public (ex: ChatGPT) : Donne la réponse brute sans démarche explicative, risque d'hallucinations et fuite des données de mineurs.",
      "Problématique centrale : Comment concevoir un tuteur intelligent, empathique et sécurisé, guidant l'élève pas-à-pas sans faire l'exercice à sa place ?"
    ],
    notes: "Partons d'un constat éducatif universel : les difficultés d'apprentissage naissent souvent dès le cycle primaire par des lacunes ponctuelles qui, non traitées, créent un sentiment d'échec chez le collégien. Or, les enseignants ne peuvent assurer un soutien individualisé quotidien pour 35 à 40 élèves. D'un autre côté, laisser un enfant devant une IA générative grand public pose deux problèmes majeurs : premièrement, l'IA donne la solution toute faite, court-circuitant l'effort cognitif ; deuxièmement, les données personnelles de l'enfant transitent vers des serveurs tiers. Notre défi d'ingénierie était donc : comment bâtir un compagnon d'apprentissage interactif, sécurisé et guidant l'élève par questionnement socratique ?",
    image: null,
    layout: "cards_2"
  },
  {
    num: 4,
    category: "OBJECTIFS & PROPOSITION DE VALEUR",
    title: "Objectifs & Proposition de Valeur de TutorAI",
    subtitle: "Une plateforme adaptative fondée sur 4 piliers d'innovation",
    timing: "1 min 15 sec",
    points: [
      "1. Diagnostic Initial Bienveillant : Cartographier le niveau réel de l'élève par des questions de positionnement non anxiogènes.",
      "2. Tuteur IA Conversationnel Socratique : Dialoguer en décomposant les problèmes en sous-étapes logiques (Scaffolding).",
      "3. Générateur Adaptatif d'Exercices : Création dynamique de quiz et exercices calibrés sur le profil scolaire (1ère-6ème primaire, collège).",
      "4. Souveraineté & Confidentialité Absolue : Inférence d'IA 100% locale (modèle Llama quantifié) garantissant la protection des mineurs."
    ],
    notes: "Pour répondre à cette problématique, nous avons fixé quatre objectifs majeurs pour TutorAI. D'abord, un module diagnostique capable de situer avec précision les forces et faiblesses scolaires de l'enfant. Ensuite, un agent tuteur doué d'empathie pédagogique, utilisant le principe du 'scaffolding' ou échafaudage pédagogique : poser des questions guidées pour que l'élève trouve lui-même la réponse. Troisièmement, un générateur de quiz dynamique ajusté au niveau scolaire. Enfin et surtout, la souveraineté des données : aucune donnée d'élève ne quitte la plateforme, grâce à un moteur d'IA déployé localement.",
    image: null,
    layout: "grid_4"
  },
  {
    num: 5,
    category: "ENVIRONNEMENT D'ACCUEIL & MÉTHODE",
    title: "Cadre Opérationnel & Méthodologie Agile Scrum",
    subtitle: "Immergé au Département Digital d'UQASE NEXT SARL",
    timing: "1 min",
    points: [
      "Entreprise d'accueil : UQASE NEXT SARL (Casablanca) — Acteur de la transformation numérique et du conseil IT.",
      "Département Digital : Sous la supervision directe de Mme Aïcha FADLI, Responsable Digitale.",
      "Durée du stage : Du 01 Juillet au 01 Août 2026 (Stage intensif de 4 semaines).",
      "Approche Agile Scrum :",
      "  • Sprint 1 (Sem. 1) : Cadrage, spécification des besoins et conception architecturale",
      "  • Sprint 2 (Sem. 2) : Fondations techniques (Auth, base de données, intégration IA locale)",
      "  • Sprint 3 (Sem. 3) : Développement des modules interactifs (Chat tuteur, Quiz adaptatif)",
      "  • Sprint 4 (Sem. 4) : Tests d'intégration, optimisation des performances et recette"
    ],
    notes: "Le projet a été développé au sein de la société UQASE NEXT SARL à Casablanca, plus précisément au Département Digital dirigé par Madame Aïcha Fadli. Pour mener à bien ce projet dans le délai imparti d'un mois, nous avons adopté la méthodologie Agile Scrum avec des itérations hebdomadaires. Cette approche nous a offert une flexibilité maximale et permis de valider chaque composant par des démonstrations fréquentes avec notre encadrante professionnelle.",
    image: null,
    layout: "cards_2"
  },
  {
    num: 6,
    category: "ANALYSE DE L'EXISTANT",
    title: "Étude Critique de l'Existant & Positionnement",
    subtitle: "TutorAI face aux solutions éducatives du marché",
    timing: "1 min",
    points: [
      "Khan Academy : Contenus de très grande qualité, mais parcours linéaire et manque d'interactivité conversationnelle instantanée.",
      "Duolingo : Excellente ludification, mais focalisé sur les langues et basé sur des réponses fermées sans raisonnement libre.",
      "ChatGPT / Copilot : Puissance de calcul impressionnante, mais inadapté aux mineurs (réponses toutes faites, opacité des données, ton trop adulte).",
      "Positionnement unique de TutorAI :",
      "  ✓ Guidage socratique actif (l'IA ne fait jamais le travail à la place de l'élève)",
      "  ✓ Adaptation ciblée aux programmes scolaires 6–15 ans",
      "  ✓ Protection intégrale des données privées grâce au traitement local"
    ],
    notes: "Une analyse comparative des solutions existantes a permis de confirmer la valeur ajoutée de TutorAI. Des plateformes comme Khan Academy offrent d'excellentes vidéos mais restent passives. Duolingo mise sur la gamification mais reste limité à des QCM fermés. Les LLMs grand public comme ChatGPT sont trop complexes pour un enfant de 8 ans et révèlent immédiatement la solution. TutorAI comble exactement ce vide : un tuteur interactif, sécurisé et calibré pour l'apprentissage fondamental.",
    image: null,
    layout: "comparison"
  },
  {
    num: 7,
    category: "ANALYSE DES BESOINS",
    title: "Spécification Fonctionnelle : Cas d'Utilisation",
    subtitle: "Structuration des interactions utilisateurs via UML",
    timing: "1 min 15 sec",
    points: [
      "Acteur principal : L'Élève (6 à 15 ans, primaire et collège)",
      "  • Passer le test diagnostique initial",
      "  • Dialoguer avec le Tuteur IA (questions, indices, déblocage de notions)",
      "  • Résoudre des exercices et quiz adaptatifs avec correction immédiate",
      "  • Suivre sa progression et ses réussites sur le tableau de bord",
      "Acteurs secondaires :",
      "  • Tuteur / Parent : Consultation des bilans et temps d'apprentissage",
      "  • Administrateur : Gestion des comptes et monitoring du système",
      "Visuel : Diagramme des cas d'utilisation global validé"
    ],
    notes: "Au niveau fonctionnel, nous avons identifié trois acteurs. L'acteur central est l'Élève, qui bénéficie d'un parcours complet : évaluation diagnostique à l'inscription, dialogue avec le tuteur virtuel, génération d'exercices à paliers progressifs et visualisation de ses acquis. Les parents et tuteurs peuvent consulter les bilans d'activités, tandis que l'administrateur supervise la plateforme. Ce diagramme des cas d'utilisation a guidé la priorisation de notre Product Backlog.",
    image: "use_case.png",
    layout: "split_image_right"
  },
  {
    num: 8,
    category: "ANALYSE DES BESOINS",
    title: "Besoins Non Fonctionnels & Contraintes Majeures",
    subtitle: "Les exigences d'ingénierie garantissant robustesse et éthique",
    timing: "1 min",
    points: [
      "1. Confidentialité & Conformité CNDP/RGPD : Aucune donnée nominative ni conversation d'élève mineur ne doit transiter vers un tiers.",
      "2. Ergonomie & UX Adaptée : Interface intuitive, vocabulaire simple, contrastes visuels adaptés et micro-animations valorisantes.",
      "3. Performance & Temps de Réponse : Inférence d'IA optimisée pour maintenir l'attention de l'élève sans temps de latence excessif.",
      "4. Sécurité Applicative : Chiffrement des mots de passe (bcrypt), authentification sans état via tokens JWT signés et protection CORS/Helmet.",
      "5. Éco-conception logicielle : Exécution efficiente d'un modèle quantifié sur machine aux ressources matérielles maîtrisées."
    ],
    notes: "Les besoins non fonctionnels ont revêtu une importance capitale. Lorsqu'on s'adresse à un public de 6 à 15 ans, l'ergonomie doit être chaleureuse et dénuée de complexité cognitive. Sur le plan de la sécurité et de la législation marocaine CNDP, la confidentialité des mineurs est absolue : les requêtes d'IA sont exécutées localement. Enfin, la performance d'inférence devait être optimisée pour éviter que l'enfant ne se décourage devant un temps d'attente trop long.",
    image: null,
    layout: "grid_4"
  },
  {
    num: 9,
    category: "CONCEPTION ARCHITECTURALE",
    title: "Architecture Globale 3-Tiers Conteneurisée",
    subtitle: "Séparation stricte des responsabilités et isolation des couches",
    timing: "1 min 15 sec",
    points: [
      "Couche Présentation (Front-End) : Angular 16 (TypeScript, RxJS, Angular Material) — SPA moderne et réactive.",
      "Couche Métier & API (Back-End) : Node.js avec framework Express — API RESTful sécurisée, contrôleurs découplés et services dédiés.",
      "Couche Données (Persistance) : SGBD MySQL 8.0 — Données relationnelles structurées et intégrité référentielle stricte.",
      "Moteur d'Intelligence Artificielle : Serveur local Ollama hébergeant Llama 3.2 quantifié en 4-bit (GGUF).",
      "Déploiement : Architecture conteneurisable via Docker et versionnée sous Git."
    ],
    notes: "Passons à la conception architecturale. Nous avons retenu une architecture 3-tiers découplée. Le front-end en Angular 16 offre une interface riche et réactive. Le back-end en Node.js/Express expose des API REST sécurisées. La persistance repose sur MySQL 8.0. La particularité technique de notre système réside dans son quatrième pôle : un moteur Ollama local qui gère le modèle Llama 3.2 quantifié. Cette séparation nette garantit modularité, maintenabilité et sécurité.",
    image: "deploiement.png",
    layout: "split_image_right"
  },
  {
    num: 10,
    category: "CONCEPTION DÉTAILLÉE",
    title: "Modélisation des Données : Diagramme de Classes",
    subtitle: "Structure métier et relations relationnelles du domaine",
    timing: "1 min 15 sec",
    points: [
      "Entité User & StudentProfile : Gestion des comptes et des profils scolaires (tranche d'âge, niveau d'éducation primaire/collège).",
      "Entités Diagnostic & DiagnosticResult : Historisation des scores diagnostiques par matière et détection des axes d'effort.",
      "Entités Quiz, Question & StudentAnswer : Gestion des évaluations, réponses de l'élève, corrections et temps de réflexion.",
      "Entité ChatMessage : Archivage des échanges avec le tuteur IA pour assurer la continuité du contexte conversationnel.",
      "Intégrité relationnelle : Clés étrangères en cascade, contraintes d'unicité et indexation optimisée."
    ],
    notes: "Le diagramme de classes structure l'ensemble du domaine métier. L'entité StudentProfile est reliée à l'utilisateur et contient le niveau scolaire réel, compris entre la 1ère année primaire et la 3ème année collège. Les entités de Quiz et d'Évaluation permettent d'enregistrer chaque interaction de l'élève, tandis que la table ChatMessage conserve l'historique conversationnel nécessaire pour donner au LLM la mémoire du dialogue en cours.",
    image: "class_diag.png",
    layout: "split_image_right"
  },
  {
    num: 11,
    category: "CONCEPTION DYNAMIQUE",
    title: "Modélisation Dynamique : Scénarios Clés",
    subtitle: "Orchestration des flux d'authentification et d'apprentissage",
    timing: "1 min",
    points: [
      "Diagramme de Séquence Authentification : Validation des identifiants, hashage bcrypt et génération du token JWT signé.",
      "Diagramme de Séquence Évaluation & Remédiation :",
      "  1. L'élève soumet une réponse à un problème donné.",
      "  2. Le serveur compare la réponse et détecte l'erreur conceptuelle.",
      "  3. Envoi d'un prompt ciblé au serveur local Ollama.",
      "  4. Génération d'une question de déblocage (indice progressif).",
      "  5. Restitution immédiate sur l'interface Angular."
    ],
    notes: "Pour modéliser le comportement temporel du système, nous avons formalisé plusieurs diagrammes de séquence. Voici notamment le scénario de remédiation : lorsqu'un élève soumet une réponse erronée, le système ne se contente pas d'afficher un message d'échec rouge. Il interroge le moteur d'IA qui analyse le type d'erreur commise et génère un indice personnalisé ou une sous-question pour remettre l'élève sur la voie de la réussite.",
    image: "seq_eval.png",
    layout: "split_image_right"
  },
  {
    num: 12,
    category: "MOTEUR D'INTELLIGENCE ARTIFICIELLE",
    title: "Ingénierie des Prompts & Pédagogie Socratique",
    subtitle: "Comment programmer l'empathie et la rigueur dans le LLM",
    timing: "1 min 15 sec",
    points: [
      "System Prompt Spécialisé : Définition du persona de 'Tuteur Bienveillant pour Enfants'.",
      "Règles d'or injectées :",
      "  • 'Ne donne JAMAIS la solution finale directement.'",
      "  • 'Utilise un vocabulaire chaleureux, encourageant et adapté à la tranche d'âge de l'élève.'",
      "  • 'Pose une seule question directrice à la fois pour éviter la surcharge cognitive.'",
      "Gestion de la mémoire contextuelle (Window Buffer) : Envoi des 6 derniers messages pour préserver la cohérence sans saturer la fenêtre de contexte.",
      "Garde-fous éthiques (Safety Guardrails) : Filtrage des sujets hors-cadre scolaire."
    ],
    notes: "Le cœur de l'intelligence pédagogique repose sur une ingénierie de prompts minutieuse. Nous avons conçu des System Prompts stricts imposant au modèle Llama de ne jamais fournir la solution brute, d'utiliser des métaphores visuelles adaptées à l'âge et de poser une seule sous-question à la fois. Nous avons également limité l'historique conversationnel aux six derniers échanges afin de garantir une latence minimale tout en maintenant un dialogue parfaitement cohérent.",
    image: null,
    layout: "cards_2"
  },
  {
    num: 13,
    category: "RÉALISATION & INTERFACES",
    title: "Réalisation Front-End : Expérience Élève",
    subtitle: "Une interface Angular moderne, responsive et déculpabilisante",
    timing: "1 min 15 sec",
    points: [
      "Tableau de Bord Intuitif : Affichage du profil, niveau scolaire (primaire/collège), statistiques et indicateurs de progrès par matière.",
      "Module de Chat Tuteur : Bulles de discussion conviviales, indicateur de saisie ('Le tuteur réfléchit...'), mise en page claire des formules.",
      "Générateur de Quiz Interactif : QCM dynamique avec feedback immédiat, encouragements visuels et récapitulatif pédagogique.",
      "Conformité UX Enfant : Boutons larges, icônes parlantes, contrastes étudiés et absence de chronomètres anxiogènes."
    ],
    notes: "Au niveau de l'interface utilisateur réalisée en Angular 16, l'objectif était de dédramatiser l'erreur scolaire. Le tableau de bord affiche clairement les progrès par matière (Mathématiques, Français, Sciences). L'interface de chat avec le tuteur est fluide, intégrant des micro-animations rassurantes. Les quiz proposent un retour immédiat et valorisant, sans score punitif, favorisant ainsi la persévérance scolaire.",
    image: null,
    layout: "grid_4"
  },
  {
    num: 14,
    category: "RÉALISATION BACK-END & SÉCURITÉ",
    title: "Réalisation Back-End : API REST & Sécurité",
    subtitle: "Architecture Express modulaire et blindage applicatif",
    timing: "1 min",
    points: [
      "Architecture Modulaire Express : Découpage clair Routes / Controllers / Services / Middlewares.",
      "Sécurité Applicative Renforcée :",
      "  • Authentification JWT avec expiration courte et stockage sécurisé.",
      "  • Hashage fort des mots de passe via bcryptjs avec salt round = 10.",
      "  • Protection des en-têtes HTTP via Helmet et filtrage des origines CORS.",
      "  • Validation et assainissement systématique des entrées pour parer les injections SQL.",
      "Gestion de pool MySQL 8.0 pour un traitement concurrent robuste."
    ],
    notes: "Côté back-end, nous avons bâti une API RESTful robuste sous Node.js et Express. Chaque endpoint est protégé par un middleware d'authentification vérifiant le token JWT. Les mots de passe sont hachés avec bcrypt à 10 rounds de salage. Nous avons appliqué les recommandations de l'OWASP : protection des en-têtes HTTP avec Helmet, politique CORS stricte et validation des entrées pour interdire toute injection SQL.",
    image: "comp_diag.png",
    layout: "split_image_right"
  },
  {
    num: 15,
    category: "TESTS & RÉSULTATS RÉELS",
    title: "Tests, Validation & Mesures de Performance",
    subtitle: "Résultats mesurés expérimentalement sur environnement de test",
    timing: "1 min 30 sec",
    points: [
      "Validation des Scénarios Fonctionnels (5/5 réussis) :",
      "  • Authentification & Gestion de Session : 100% succès (code 200/401 conforme)",
      "  • Évaluation diagnostique & calcul du profil : 100% succès",
      "  • Dialogue interactif et guidage socratique : 100% succès",
      "  • Génération et validation des quiz adaptatifs : 100% succès",
      "Mesures Réelles de Performance de l'IA Locale (Llama 3.2 quantifié 4-bit) :",
      "  • Temps de réponse moyen stabilisé : 1.8 à 2.4 secondes",
      "  • Temps de premier chargement à froid : ~4.2 secondes",
      "  • Empreinte mémoire vive (RAM) : ~3.5 Go (très économe pour un LLM)"
    ],
    notes: "Conformément aux exigences de rigueur de l'EMSI, nous avons mené une campagne de tests fonctionnels et de mesures de performance réelles. Les cinq scénarios critiques de la plateforme ont obtenu 100% de conformité. Concernant les performances de l'IA, les mesures effectives démontrent un temps de réponse moyen en régime stabilisé compris entre 1.8 et 2.4 secondes. Le premier chargement à froid prend environ 4 secondes, et l'empreinte mémoire reste contenue sous 3.5 Go de RAM, validant la pertinence du modèle quantifié en local.",
    image: null,
    layout: "metrics_cards"
  },
  {
    num: 16,
    category: "BILAN DU STAGE",
    title: "Bilan du Stage & Compétences Développées",
    subtitle: "Une expérience formatrice au confluent de l'IA et de l'ingénierie logicielle",
    timing: "1 min",
    points: [
      "Compétences Techniques :",
      "  • Maîtrise d'Angular 16 (SPA réactive, RxJS, architecture composants)",
      "  • Développement Back-End RESTful avec Node.js, Express et MySQL 8.0",
      "  • Déploiement et orchestration d'un LLM local (Ollama, formats GGUF quantifiés)",
      "  • Modélisation UML complète sous les standards industriels",
      "Compétences Méthodologiques & Humaines :",
      "  • Pratique rigoureuse d'Agile Scrum en entreprise chez UQASE NEXT",
      "  • Sensibilisation aux enjeux éthiques de l'IA pour les mineurs et conformité légale",
      "  • Autonomie, respect des délais et communication professionnelle"
    ],
    notes: "Ce stage de fin d'année a été extrêmement enrichissant à plusieurs égards. Sur le plan technique, il m'a permis de consolider la maîtrise de la stack Angular/Node.js et d'acquérir une véritable expertise pratique dans l'intégration des LLMs en local. Sur le plan méthodologique, le travail au sein du département digital d'UQASE NEXT m'a appris la rigueur des sprints Scrum et l'importance de concilier innovation technologique et responsabilité éthique.",
    image: null,
    layout: "cards_2"
  },
  {
    num: 17,
    category: "PERSPECTIVES D'ÉVOLUTION",
    title: "Perspectives d'Évolution & Améliorations Futures",
    subtitle: "Feuille de route pour les futures versions de TutorAI",
    timing: "1 min",
    points: [
      "1. Interaction Vocale Multimodale : Intégration de Whisper (STT) et synthèse vocale (TTS) pour assister les très jeunes élèves (6-7 ans) ou en difficulté de lecture.",
      "2. Enrichissement RAG (Retrieval-Augmented Generation) : Connecter l'IA aux manuels scolaires officiels pour un alignement strict avec le curriculum national.",
      "3. Espace Parents & Tuteurs Avancé : Tableau de bord prédictif alertant en amont sur les notions fragilisées avant les examens.",
      "4. Gamification Approfondie : Badges de persévérance, récompenses virtuelles et défis hebdomadaires pour stimuler la motivation intrinsèque."
    ],
    notes: "Pour l'avenir, TutorAI dispose d'un potentiel d'extension considérable. Nous envisageons en priorité l'ajout d'une interface vocale bidirectionnelle basée sur Whisper, ce qui débloquera l'usage pour les élèves du cours préparatoire qui ne maîtrisent pas encore l'écriture au clavier. Ensuite, l'intégration d'un pipeline RAG adossé aux manuels scolaires officiels garantira une conformité parfaite aux programmes, complété par un portail parental enrichi d'analyses prédictives.",
    image: null,
    layout: "grid_4"
  },
  {
    num: 18,
    category: "CONCLUSION",
    title: "Conclusion & Remerciements",
    subtitle: "Mettre l'intelligence artificielle au service de la réussite scolaire",
    timing: "45 sec",
    points: [
      "Objectifs atteints : Une plateforme opérationnelle, ergonomique et sécurisée.",
      "Valeur ajoutée démontrée : Accompagnement socratique bienveillant et confidentialité totale des données.",
      "Remerciements sincères :",
      "  • À l'École Marocaine des Sciences de l'Ingénieur (EMSI)",
      "  • À mon encadrante pédagogique, Madame Souad ATIGI",
      "  • À la société d'accueil UQASE NEXT SARL et à mon encadrante professionnelle, Madame Aïcha FADLI",
      "  • Aux membres du jury pour leur attention et leur bienveillance.",
      "Je suis désormais à votre entière disposition pour vos questions."
    ],
    notes: "Pour conclure, le projet TutorAI démontre qu'il est possible de mobiliser les avancées les plus récentes de l'intelligence artificielle pour répondre à un défi humain fondamental : redonner confiance et plaisir d'apprendre aux enfants en difficulté, dans un cadre éthique et souverain. Je tiens à renouveler mes sincères remerciements à mon encadrante pédagogique Mme Souad Atigi, à mon encadrante professionnelle Mme Aïcha Fadli, à toute l'équipe d'UQASE NEXT et à l'EMSI. Je vous remercie pour votre attention et je me tiens prêt à répondre à vos questions.",
    image: null,
    layout: "conclusion"
  }
];

// ============================================================================
// 2. GÉNÉRATION DE LA PRÉSENTATION POWERPOINT (.PPTX)
// ============================================================================

async function generatePowerPoint() {
  console.log('Generating PowerPoint presentation (SOUTENANCE_TUTORAI_EMSI.pptx)...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches
  pres.title = 'Soutenance PFA - TutorAI';
  pres.author = 'Ali KHOUMRI';
  pres.company = 'EMSI / UQASE NEXT SARL';
  pres.subject = 'TutorAI - Plateforme Web Adaptative de Soutien Scolaire';

  // Palette de couleurs
  const COLOR_PRIMARY_NAVY = '0A2540';
  const COLOR_EMSI_GREEN = '007A5E';
  const COLOR_ACCENT_RED = 'C41E3A';
  const COLOR_BG_LIGHT = 'F8FAFC';
  const COLOR_CARD_BG = 'FFFFFF';
  const COLOR_BORDER = 'E2E8F0';
  const COLOR_TEXT_MUTED = '64748B';
  const COLOR_TEXT_BODY = '1E293B';

  for (const s of SLIDES_DATA) {
    const slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Attacher les notes orales du présentateur
    slide.addNotes(s.notes);

    // Si page de garde (Slide 1)
    if (s.layout === 'cover') {
      // Bande supérieure
      slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.25, fill: { color: COLOR_EMSI_GREEN }, line: { color: COLOR_EMSI_GREEN } });
      slide.addShape(pres.ShapeType.rect, { x: 0, y: 0.25, w: 10, h: 0.08, fill: { color: COLOR_ACCENT_RED }, line: { color: COLOR_ACCENT_RED } });

      // Logos
      if (fs.existsSync('logo_emsi.png')) {
        slide.addImage({ path: 'logo_emsi.png', x: 0.8, y: 0.6, h: 0.9, w: 1.8, sizing: { type: 'contain', h: 0.9, w: 1.8 } });
      }
      if (fs.existsSync('logo_uqase.png')) {
        slide.addImage({ path: 'logo_uqase.png', x: 7.4, y: 0.6, h: 0.9, w: 1.8, sizing: { type: 'contain', h: 0.9, w: 1.8 } });
      }

      // En-tête académique
      slide.addText("ÉCOLE MAROCAINE DES SCIENCES DE L'INGÉNIEUR", {
        x: 2.5, y: 0.6, w: 5.0, h: 0.4,
        fontSize: 12, bold: true, color: COLOR_PRIMARY_NAVY, align: 'center', fontFace: 'Calibri'
      });
      slide.addText("PROJET DE FIN D'ANNÉE — 3ÈME ANNÉE IIR", {
        x: 2.5, y: 0.95, w: 5.0, h: 0.3,
        fontSize: 10, bold: true, color: COLOR_EMSI_GREEN, align: 'center', fontFace: 'Calibri'
      });

      // Cadre central du titre
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 1.7, w: 8.4, h: 1.9,
        fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1.5 }, rectRadius: 0.15
      });
      slide.addText("TutorAI", {
        x: 1.0, y: 1.85, w: 8.0, h: 0.6,
        fontSize: 28, bold: true, color: COLOR_PRIMARY_NAVY, align: 'center', fontFace: 'Segoe UI'
      });
      slide.addText("Plateforme Web Adaptative de Soutien Scolaire et de Remédiation Pédagogique", {
        x: 1.0, y: 2.45, w: 8.0, h: 0.5,
        fontSize: 15, bold: true, color: COLOR_EMSI_GREEN, align: 'center', fontFace: 'Segoe UI'
      });
      slide.addText("Tuteur Intelligent pour Enfants et Collégiens en Difficulté (6 à 15 ans)", {
        x: 1.0, y: 2.95, w: 8.0, h: 0.4,
        fontSize: 12, italic: true, color: COLOR_TEXT_MUTED, align: 'center', fontFace: 'Segoe UI'
      });

      // Cadre informations candidat et encadrants
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 3.8, w: 4.0, h: 1.4,
        fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.1
      });
      slide.addText("RÉALISÉ PAR :", { x: 1.0, y: 3.9, w: 3.6, h: 0.25, fontSize: 10, bold: true, color: COLOR_EMSI_GREEN, fontFace: 'Segoe UI' });
      slide.addText("Ali KHOUMRI", { x: 1.0, y: 4.15, w: 3.6, h: 0.35, fontSize: 14, bold: true, color: COLOR_PRIMARY_NAVY, fontFace: 'Segoe UI' });
      slide.addText("Élève-Ingénieur en 3ème Année IIR\nSession : Septembre 2026", { x: 1.0, y: 4.5, w: 3.6, h: 0.55, fontSize: 9, color: COLOR_TEXT_MUTED, fontFace: 'Segoe UI' });

      slide.addShape(pres.ShapeType.roundRect, {
        x: 5.2, y: 3.8, w: 4.0, h: 1.4,
        fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.1
      });
      slide.addText("ENCADRÉ PAR :", { x: 5.4, y: 3.9, w: 3.6, h: 0.25, fontSize: 10, bold: true, color: COLOR_EMSI_GREEN, fontFace: 'Segoe UI' });
      slide.addText("Mme Souad ATIGI — Encadrante Pédagogique (EMSI)\nMme Aïcha FADLI — Encadrante Pro. (UQASE NEXT)", {
        x: 5.4, y: 4.18, w: 3.6, h: 0.65, fontSize: 10, bold: true, color: COLOR_PRIMARY_NAVY, fontFace: 'Segoe UI'
      });
      slide.addText("Organisme d'accueil : UQASE NEXT SARL (Casablanca)", { x: 5.4, y: 4.85, w: 3.6, h: 0.3, fontSize: 9, italic: true, color: COLOR_TEXT_MUTED, fontFace: 'Segoe UI' });

      // Bandeau inférieur
      slide.addShape(pres.ShapeType.rect, { x: 0, y: 5.45, w: 10, h: 0.175, fill: { color: COLOR_PRIMARY_NAVY }, line: { color: COLOR_PRIMARY_NAVY } });
      continue;
    }

    // SLIDES STANDARD (Slides 2 à 18)
    // -------------------------------------------------------------
    // En-tête de diapositive
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.12, fill: { color: COLOR_EMSI_GREEN }, line: { color: COLOR_EMSI_GREEN } });
    
    // Badge de catégorie
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 0.25, w: 3.0, h: 0.3,
      fill: { color: 'E2E8F0' }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.08
    });
    slide.addText(s.category, {
      x: 0.8, y: 0.25, w: 3.0, h: 0.3,
      fontSize: 9, bold: true, color: COLOR_PRIMARY_NAVY, align: 'center', fontFace: 'Segoe UI'
    });

    // Timing suggéré
    slide.addText(`⏱ ${s.timing}`, {
      x: 8.2, y: 0.25, w: 1.0, h: 0.3,
      fontSize: 9, bold: true, color: COLOR_TEXT_MUTED, align: 'right', fontFace: 'Segoe UI'
    });

    // Titre et sous-titre de la diapositive
    slide.addText(s.title, {
      x: 0.8, y: 0.6, w: 8.4, h: 0.45,
      fontSize: 18, bold: true, color: COLOR_PRIMARY_NAVY, fontFace: 'Segoe UI'
    });
    slide.addText(s.subtitle, {
      x: 0.8, y: 1.05, w: 8.4, h: 0.3,
      fontSize: 11, italic: true, color: COLOR_EMSI_GREEN, fontFace: 'Segoe UI'
    });

    // Ligne séparatrice fine
    slide.addShape(pres.ShapeType.line, {
      x: 0.8, y: 1.35, w: 8.4, h: 0,
      line: { color: 'CBD5E1', width: 1 }
    });

    // CONTENU SELON LE LAYOUT
    if (s.layout === 'split_image_right' && s.image && fs.existsSync(s.image)) {
      // Colonne texte gauche dans une carte
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 1.5, w: 4.3, h: 3.6,
        fill: { color: COLOR_CARD_BG }, line: { color: COLOR_BORDER, width: 1 }, rectRadius: 0.1
      });
      const bulletItems = s.points.map(pt => ({
        text: pt.replace(/^•\s*/, ''),
        options: { fontSize: 11, color: COLOR_TEXT_BODY, bullet: true, spaceAfter: 8, fontFace: 'Segoe UI' }
      }));
      slide.addText(bulletItems, {
        x: 1.0, y: 1.65, w: 3.9, h: 3.3,
        valign: 'top', fontFace: 'Segoe UI'
      });

      // Colonne image droite
      slide.addShape(pres.ShapeType.roundRect, {
        x: 5.3, y: 1.5, w: 3.9, h: 3.6,
        fill: { color: 'FFFFFF' }, line: { color: COLOR_BORDER, width: 1 }, rectRadius: 0.1
      });
      slide.addImage({
        path: s.image,
        x: 5.4, y: 1.6, w: 3.7, h: 3.4,
        sizing: { type: 'contain', w: 3.7, h: 3.4 }
      });
    } else if (s.layout === 'grid_4') {
      // 4 cartes équilibrées
      const cardW = 4.05;
      const cardH = 1.65;
      const gapX = 0.3;
      const gapY = 0.2;

      for (let i = 0; i < Math.min(4, s.points.length); i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const posX = 0.8 + col * (cardW + gapX);
        const posY = 1.55 + row * (cardH + gapY);

        slide.addShape(pres.ShapeType.roundRect, {
          x: posX, y: posY, w: cardW, h: cardH,
          fill: { color: COLOR_CARD_BG }, line: { color: COLOR_BORDER, width: 1 }, rectRadius: 0.1
        });
        // Petite bordure colorée à gauche
        slide.addShape(pres.ShapeType.rect, {
          x: posX, y: posY + 0.1, w: 0.08, h: cardH - 0.2,
          fill: { color: col === 0 ? COLOR_EMSI_GREEN : COLOR_PRIMARY_NAVY },
          line: { color: col === 0 ? COLOR_EMSI_GREEN : COLOR_PRIMARY_NAVY }
        });

        slide.addText(s.points[i], {
          x: posX + 0.2, y: posY + 0.1, w: cardW - 0.3, h: cardH - 0.2,
          fontSize: 10.5, color: COLOR_TEXT_BODY, fontFace: 'Segoe UI', valign: 'top'
        });
      }
    } else if (s.layout === 'metrics_cards') {
      // Cartes de métriques et résultats
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 1.5, w: 8.4, h: 1.6,
        fill: { color: COLOR_CARD_BG }, line: { color: COLOR_BORDER, width: 1 }, rectRadius: 0.1
      });
      slide.addText("RÉSULTATS DE VALIDATION FONCTIONNELLE (5/5 RÉUSSIS)", {
        x: 1.0, y: 1.6, w: 8.0, h: 0.3,
        fontSize: 11, bold: true, color: COLOR_EMSI_GREEN, fontFace: 'Segoe UI'
      });
      const scItems = [
        "✓ Authentification JWT & Sessions sécurisées : 100% conforme",
        "✓ Évaluation diagnostique & positionnement : 100% conforme",
        "✓ Dialogue interactif & méthode socratique de remédiation : 100% conforme",
        "✓ Génération de quiz et calcul des scores : 100% conforme"
      ].map(t => ({ text: t, options: { fontSize: 10, color: COLOR_TEXT_BODY, spaceAfter: 3 } }));
      slide.addText(scItems, { x: 1.0, y: 1.9, w: 8.0, h: 1.1, fontFace: 'Segoe UI' });

      // 3 blocs de métriques réelles en bas
      const metrics = [
        { val: "1.8s – 2.4s", label: "Temps d'inférence moyen", desc: "Régime stabilisé après démarrage" },
        { val: "~4.2s", label: "Démarrage à froid", desc: "Chargement initial du modèle GGUF" },
        { val: "~3.5 Go", label: "Empreinte mémoire RAM", desc: "Quantification 4-bit optimisée" }
      ];
      for (let m = 0; m < 3; m++) {
        const mx = 0.8 + m * (2.65 + 0.22);
        slide.addShape(pres.ShapeType.roundRect, {
          x: mx, y: 3.3, w: 2.65, h: 1.8,
          fill: { color: 'FFFFFF' }, line: { color: COLOR_BORDER, width: 1 }, rectRadius: 0.1
        });
        slide.addShape(pres.ShapeType.rect, {
          x: mx, y: 3.3, w: 2.65, h: 0.08,
          fill: { color: COLOR_PRIMARY_NAVY }, line: { color: COLOR_PRIMARY_NAVY }
        });
        slide.addText(metrics[m].val, {
          x: mx, y: 3.5, w: 2.65, h: 0.45,
          fontSize: 20, bold: true, color: COLOR_EMSI_GREEN, align: 'center', fontFace: 'Segoe UI'
        });
        slide.addText(metrics[m].label, {
          x: mx + 0.1, y: 4.0, w: 2.45, h: 0.35,
          fontSize: 10.5, bold: true, color: COLOR_PRIMARY_NAVY, align: 'center', fontFace: 'Segoe UI'
        });
        slide.addText(metrics[m].desc, {
          x: mx + 0.1, y: 4.4, w: 2.45, h: 0.5,
          fontSize: 9, italic: true, color: COLOR_TEXT_MUTED, align: 'center', fontFace: 'Segoe UI'
        });
      }
    } else {
      // Standard ou cards_2 ou agenda
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 1.5, w: 8.4, h: 3.6,
        fill: { color: COLOR_CARD_BG }, line: { color: COLOR_BORDER, width: 1 }, rectRadius: 0.1
      });

      const bulletItems = s.points.map(pt => {
        const isHeader = pt.startsWith('1.') || pt.startsWith('2.') || pt.startsWith('3.') || pt.startsWith('4.') || pt.startsWith('5.') || pt.startsWith('6.') || pt.startsWith('7.');
        return {
          text: pt,
          options: {
            fontSize: isHeader ? 12 : 11,
            bold: isHeader,
            color: isHeader ? COLOR_PRIMARY_NAVY : COLOR_TEXT_BODY,
            bullet: !isHeader,
            spaceAfter: isHeader ? 6 : 8,
            fontFace: 'Segoe UI'
          }
        };
      });

      slide.addText(bulletItems, {
        x: 1.1, y: 1.7, w: 7.8, h: 3.2,
        valign: 'top', fontFace: 'Segoe UI'
      });
    }

    // Pied de page
    slide.addText("TutorAI — Soutenance PFA 3ème Année IIR | EMSI Casablanca", {
      x: 0.8, y: 5.25, w: 6.0, h: 0.3,
      fontSize: 8.5, color: COLOR_TEXT_MUTED, fontFace: 'Segoe UI'
    });
    slide.addText(`${s.num} / 18`, {
      x: 8.2, y: 5.25, w: 1.0, h: 0.3,
      fontSize: 9, bold: true, color: COLOR_PRIMARY_NAVY, align: 'right', fontFace: 'Segoe UI'
    });
  }

  const pptxPath = path.join(__dirname, 'SOUTENANCE_TUTORAI_EMSI.pptx');
  await pres.writeFile({ fileName: pptxPath });
  console.log(`PowerPoint presentation created at: ${pptxPath}`);
}

// ============================================================================
// 3. GÉNÉRATION DU GUIDE ORAL COMPLET EN WORD (.DOCX)
// ============================================================================

async function generateWordGuide() {
  console.log('Generating Word Guide (GUIDE_ORAL_SOUTENANCE_TUTORAI.docx)...');

  const p = (text, opts = {}) => new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { line: opts.line || 280, before: opts.before || 80, after: opts.after || 80 },
    children: Array.isArray(text) ? text.map(t => typeof t === 'string' ? new TextRun({ text: t, font: 'Calibri', size: 22 }) : t) : [
      new TextRun({ text, font: 'Calibri', size: opts.size || 22, bold: opts.bold || false, italics: opts.italics || false, color: opts.color || '222222' })
    ]
  });

  const heading1 = text => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: 'Calibri', size: 30, bold: true, color: '0A2540' })]
  });

  const heading2 = text => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, font: 'Calibri', size: 24, bold: true, color: '007A5E' })]
  });

  const docChildren = [];

  // Page de titre du document Word
  docChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 120 },
    children: [new TextRun({ text: 'GUIDE COMPLET DE SOUTENANCE ORALE', font: 'Calibri', size: 40, bold: true, color: '0A2540' })]
  }));
  docChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text: 'Projet de Fin d’Année (PFA) — 3ème Année Ingénierie Informatique et Réseaux (IIR)', font: 'Calibri', size: 24, bold: true, color: '007A5E' })]
  }));
  docChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 300 },
    children: [new TextRun({ text: 'TutorAI : Plateforme Web Adaptative de Soutien Scolaire et de Remédiation Pédagogique', font: 'Calibri', size: 22, italics: true, color: '555555' })]
  }));

  docChildren.push(p('Candidat : Ali KHOUMRI | Encadrante Pédagogique : Mme Souad ATIGI | Encadrante Pro. : Mme Aïcha FADLI', { align: AlignmentType.CENTER, bold: true, size: 20, color: '0A2540' }));
  docChildren.push(p('École Marocaine des Sciences de l’Ingénieur (EMSI) — Société d’accueil : UQASE NEXT SARL', { align: AlignmentType.CENTER, size: 18, color: '777777', after: 300 }));

  docChildren.push(heading1('1. Fiche Stratégique de l’Épreuve Orale'));
  docChildren.push(p('• Durée totale de la présentation : 15 à 20 minutes maximum (environ 1 minute par diapositive).'));
  docChildren.push(p('• Durée des questions/réponses du jury : 10 à 15 minutes.'));
  docChildren.push(p('• Règle d’or : Ne JAMAIS lire textuellement vos diapositives. Les diapositives servent de repère visuel synthétique au jury ; votre discours oral apporte l’explication, la justification technique et la valeur ajoutée d’ingénieur.'));
  docChildren.push(p('• Posture : Regardez l’ensemble du jury, tenez-vous droit, parlez posément avec assurance, adoptez un ton scientifique et rigoureux.'));

  docChildren.push(heading1('2. Déroulé Diapositive par Diapositive (Contenu & Discours Oral Mot-à-Mot)'));

  for (const s of SLIDES_DATA) {
    docChildren.push(heading2(`Diapositive ${s.num} : ${s.title} [Temps conseillé : ${s.timing}]`));
    docChildren.push(p(`Catégorie : ${s.category} | Sous-titre : ${s.subtitle}`, { italics: true, color: '007A5E', size: 20 }));

    docChildren.push(p('Ce qui est affiché sur la diapositive :', { bold: true, size: 21, color: '0A2540' }));
    for (const pt of s.points) {
      docChildren.push(p(`  • ${pt}`, { size: 20 }));
    }

    docChildren.push(p('Discours oral du candidat (Ce que vous dites au jury) :', { bold: true, size: 21, color: 'C41E3A', before: 120 }));
    docChildren.push(p(`« ${s.notes} »`, { italics: true, size: 21, color: '1E293B', line: 300 }));
  }

  // Section Questions / Réponses
  docChildren.push(heading1('3. Top 10 des Questions Fréquentes du Jury EMSI & Réponses Recommandées'));

  const FAQ = [
    {
      q: "Q1. Pourquoi avoir choisi un modèle local (Llama 3.2 sous Ollama) plutôt qu'une API comme OpenAI ChatGPT ?",
      r: "Réponse : Ce choix repose sur trois impératifs majeurs. Premièrement, la confidentialité absolue et la conformité CNDP/RGPD : notre cible étant des mineurs de 6 à 15 ans, leurs échanges ne doivent jamais transiter vers des serveurs tiers. Deuxièmement, la souveraineté et l'indépendance économique : aucun coût par token ni risque de coupure de service externe. Troisièmement, la latence maîtrisée grâce à la quantification GGUF 4-bit, offrant un temps de réponse de 1.8 à 2.4 secondes en local."
    },
    {
      q: "Q2. Comment garantissez-vous que le tuteur ne donne pas directement la solution à l'élève ?",
      r: "Réponse : Grâce à un System Prompt rigoureusement calibré combiné à la méthode du questionnement socratique (scaffolding). Le modèle a pour consigne stricte de découper le problème en sous-questions directrices et de valoriser l'effort de l'élève sans jamais révéler la formule finale avant que l'élève n'ait validé chaque étape intermédiaire."
    },
    {
      q: "Q3. Comment gérez-vous la mémoire conversationnelle pour éviter que le système ne devienne lent au fil de la discussion ?",
      r: "Réponse : Nous utilisons une fenêtre glissante (sliding context buffer) conservant uniquement les 6 derniers messages du dialogue courant. Cela fournit au LLM le contexte immédiat pour comprendre les références de l'élève tout en évitant d'exploser la fenêtre de tokens et de dégrader le temps de calcul."
    },
    {
      q: "Q4. En quoi votre dictionnaire de données et votre modélisation répondent-ils spécifiquement à la tranche d'âge 6-15 ans ?",
      r: "Réponse : Dans notre table StudentProfile, le champ education_level est strictement borné aux niveaux scolaires du cycle Primaire (1ère à 6ème année) et Collège (1ère à 3ème année collège). Les quiz et le diagnostic initial s'appuient sur cette segmentation pour ajuster la complexité lexicale et mathématique des exercices générés."
    },
    {
      q: "Q5. Quels mécanismes de sécurité avez-vous déployés sur votre API REST ?",
      r: "Réponse : Nous avons implémenté l'authentification sans état via JSON Web Tokens (JWT) avec signature cryptographique. Les mots de passe sont hachés avec bcrypt à 10 rounds de salage. Côté serveur Express, nous appliquons le middleware Helmet pour sécuriser les en-têtes HTTP, configurons CORS de manière restrictive et assainissons toutes les requêtes pour parer les injections SQL."
    },
    {
      q: "Q6. Quelles difficultés techniques majeures avez-vous rencontrées et comment les avez-vous résolues ?",
      r: "Réponse : La principale difficulté a été l'optimisation des temps d'inférence du LLM sur une machine de développement contrainte. Les premiers essais non quantifiés prenaient plus de 10 secondes par réponse. En adoptant la quantification 4-bit (format GGUF) sous Ollama et en rationalisant la taille de la mémoire tampon, nous avons stabilisé le temps de réponse entre 1.8 et 2.4 secondes avec une consommation RAM contenue sous 3.5 Go."
    },
    {
      q: "Q7. Pourquoi avoir choisi le framework Angular plutôt que React ou Vue.js ?",
      r: "Réponse : Angular 16 offre un cadre d'ingénierie complet et opinioné, particulièrement adapté aux applications d'envergure. Son architecture en TypeScript natif, son système d'injection de dépendances et la gestion réactive via RxJS garantissent une maintenabilité exemplaire, une typification stricte et une structure modulaire idéale pour un travail d'ingénieur."
    },
    {
      q: "Q8. Comment s'est déroulée l'articulation entre votre travail chez UQASE NEXT et les exigences académiques de l'EMSI ?",
      r: "Réponse : L'adoption de la méthodologie Agile Scrum a servi de passerelle naturelle. Les sprints hebdomadaires correspondaient aux étapes de modélisation UML et de développement demandées par l'EMSI, tandis que les démonstrations régulières avec mon encadrante professionnelle Mme Aïcha Fadli validaient la pertinence métier et ergonomique de la plateforme."
    },
    {
      q: "Q9. Que se passe-t-il si un élève saisit un message inapproprié ou totalement hors sujet dans le chat ?",
      r: "Réponse : Le System Prompt intègre des règles de modération et de re-cadrage bienveillant. Si l'élève dévie du sujet scolaire, le tuteur répond avec empathie mais recadre poliment l'échange sur l'exercice en cours, refusant tout traitement de contenu non éducatif."
    },
    {
      q: "Q10. Si vous deviez poursuivre ce projet en Projet de Fin d'Études (PFE) ou en startup, quelles seraient vos priorités ?",
      r: "Réponse : En priorité, l'intégration multimodale voix-à-voix via Whisper pour ouvrir l'outil aux enfants de 6-7 ans qui ont encore du mal à écrire au clavier. Ensuite, l'architecture RAG connectée directement aux manuels officiels du Ministère de l'Éducation Nationale pour une conformité totale au programme, et enfin la mise en place d'un portail prédictif pour les parents et enseignants."
    }
  ];

  for (const item of FAQ) {
    docChildren.push(p(item.q, { bold: true, color: '0A2540', size: 21, before: 100 }));
    docChildren.push(p(item.r, { color: '333333', size: 20, after: 120, line: 280 }));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
    }]
  });

  const docxPath = path.join(__dirname, 'GUIDE_ORAL_SOUTENANCE_TUTORAI.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(`Word Guide created at: ${docxPath}`);
}

// ============================================================================
// 4. GÉNÉRATION DU FICHIER MARKDOWN (.MD) POUR CONSULTATION DIRECTE
// ============================================================================

function generateMarkdownGuide() {
  console.log('Generating Markdown Guide (GUIDE_SOUTENANCE_PRESENTATION.md)...');
  let md = `# Guide Complet de Soutenance de Projet — TutorAI
**Projet de Fin d'Année (PFA) — 3ème Année Ingénierie Informatique & Réseaux (IIR)**  
**École Marocaine des Sciences de l'Ingénieur (EMSI)**  
**Candidat :** Ali KHOUMRI  
**Encadrante Pédagogique :** Madame Souad ATIGI (EMSI)  
**Encadrante Professionnelle :** Madame Aïcha FADLI (UQASE NEXT SARL)  
**Organisme d'accueil :** UQASE NEXT SARL (Casablanca)  
**Durée conseillée de l'exposé :** 15 à 20 minutes (18 diapositives)

---

## Fichiers Prêts à l'Emploi Générés
- **Fichier PowerPoint officiel :** \`SOUTENANCE_TUTORAI_EMSI.pptx\` (18 diapositives professionnelles 16:9 avec notes orales intégrées, schémas UML et charte graphique EMSI).
- **Fichier Word officiel :** \`GUIDE_ORAL_SOUTENANCE_TUTORAI.docx\` (script oral complet, minutage et questions pièges).

---

## Déroulé Détaillé Diapositive par Diapositive

`;

  for (const s of SLIDES_DATA) {
    md += `### 📌 Diapositive ${s.num} : ${s.title}\n`;
    md += `- **Catégorie :** ${s.category}\n`;
    md += `- **Sous-titre :** ${s.subtitle}\n`;
    md += `- **Minutage recommandé :** ⏱ ${s.timing}\n`;
    if (s.image) {
      md += `- **Schéma / Visuel associé :** \`${s.image}\`\n`;
    }
    md += `\n**Contenu synthétique affiché sur la diapositive :**\n`;
    for (const pt of s.points) {
      md += `- ${pt}\n`;
    }
    md += `\n**Discours oral mot-à-mot (Ce que vous dites au jury) :**\n`;
    md += `> « ${s.notes} »\n\n`;
    md += `---\n\n`;
  }

  md += `## 🎯 Top 10 des Questions du Jury EMSI & Réponses Recommandées\n\n`;
  md += `1. **Pourquoi un LLM local plutôt qu'une API comme OpenAI ?**  
*Réponse :* Confidentialité totale des mineurs (6-15 ans) conforme CNDP/RGPD, souveraineté sans coût récurrent de jetons, et latence maîtrisée de 1.8 à 2.4s grâce à la quantification 4-bit GGUF.\n\n`;
  md += `2. **Comment évitez-vous que l'élève obtienne la solution brute ?**  
*Réponse :* Le System Prompt impose une méthode socratique stricte (scaffolding) : décomposition en sous-questions et interdiction explicite de divulguer la réponse finale.\n\n`;
  md += `3. **Comment gérez-vous la mémoire du chat sans dégrader la latence ?**  
*Réponse :* Une fenêtre glissante des 6 derniers messages préserve le fil de discussion tout en évitant la saturation de la fenêtre de contexte du modèle.\n\n`;
  md += `4. **Comment le système s'adapte-t-il aux niveaux primaire et collège ?**  
*Réponse :* Le champ \`education_level\` est strictement borné du Primaire (1ère-6ème) au Collège (1ère-3ème), permettant d'ajuster dynamiquement le vocabulaire et les exercices.\n\n`;
  md += `5. **Quelles mesures de sécurité avez-vous implémentées ?**  
*Réponse :* Tokens JWT signés, mots de passe hashés avec bcrypt (10 rounds), Helmet pour les en-têtes HTTP, politique CORS restrictive et requêtes SQL paramétrées.\n\n`;
  md += `6. **Quelles ont été les difficultés de performance et comment les avez-vous surmontées ?**  
*Réponse :* Le passage d'un modèle lourd non quantifié à Llama 3.2 quantifié en 4-bit via Ollama, stabilisant le temps d'inférence à ~2s et la RAM à 3.5 Go.\n\n`;
  md += `7. **Pourquoi Angular 16 plutôt que React ?**  
*Réponse :* Structure d'ingénierie robuste, TypeScript natif, injection de dépendances et puissance de RxJS pour un code maintenable et typé.\n\n`;
  md += `8. **Comment la méthode Agile Scrum a-t-elle rythmé votre travail ?**  
*Réponse :* Quatre sprints hebdomadaires ont permis des démonstrations fréquentes avec Mme Aïcha Fadli et une synchronisation parfaite avec les attendus de l'EMSI.\n\n`;
  md += `9. **Comment réagit le tuteur face à un comportement inapproprié ou hors sujet ?**  
*Réponse :* Des garde-fous éthiques intégrés au prompt recadrent poliment et fermement l'élève sur le sujet scolaire.\n\n`;
  md += `10. **Quelles sont les perspectives d'évolution futures ?**  
*Réponse :* Interaction vocale via Whisper pour les 6-7 ans, pipeline RAG adossé aux manuels officiels et alertes prédictives pour parents et enseignants.\n`;

  const mdPath = path.join(__dirname, 'GUIDE_SOUTENANCE_PRESENTATION.md');
  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log(`Markdown Guide created at: ${mdPath}`);
}

// ============================================================================
// EXÉCUTION DE TOUTES LES GÉNÉRATIONS
// ============================================================================

async function main() {
  try {
    await generatePowerPoint();
    await generateWordGuide();
    generateMarkdownGuide();
    console.log('ALL PRESENTATION DELIVERABLES GENERATED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error generating deliverables:', err);
    process.exit(1);
  }
}

main();
