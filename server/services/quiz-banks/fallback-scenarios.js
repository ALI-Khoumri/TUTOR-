/**
 * 30 distinct pedagogical scenarios covering diverse analytical and methodology skills.
 * Used when questions need to be generated for any subject with zero repetition.
 */
function getUniqueFallbackScenarios(targetSubject) {
  return [
    {
      concept: 'Analyse des définitions et notions fondamentales',
      question: `En ${targetSubject}, quelle est la première étape méthodologique indispensable pour aborder un problème nouveau ?`,
      options: [
        `Identifier précisément les termes clés, les hypothèses posées et le cadre conceptuel`,
        `Appliquer directement des calculs ou des déductions sans relire l'énoncé`,
        `Supposer que les principes généraux ne s'appliquent pas dans ce cas précis`,
        `Ignorer les conditions de validité pour gagner du temps`
      ],
      explanation: `Une démarche rigoureuse commence toujours par l'analyse claire des concepts et des hypothèses de départ.`
    },
    {
      concept: 'Raisonnement et démarche logique',
      question: `Dans la pratique de ${targetSubject}, comment valide-t-on la solidité d'une démonstration ou d'un raisonnement ?`,
      options: [
        `En vérifiant que chaque étape intermédiaire découle logiquement des règles et théorèmes établis`,
        `En se fiant uniquement à sa première intuition sans justification`,
        `En modifiant les données initiales pour obtenir le résultat souhaité`,
        `En considérant qu'une conclusion non démontrée est vraie d'office`
      ],
      explanation: `La validité d'une démarche repose sur l'enchaînement logique et la justification de chaque transition.`
    },
    {
      concept: 'Contrôle de cohérence et ordres de grandeur',
      question: `Quelle attitude réflexive un élève en ${targetSubject} doit-il adopter face à un résultat final ?`,
      options: [
        `Vérifier les ordres de grandeur, les unités et la cohérence avec le contexte réel`,
        `Accepter le résultat sans aucune vérification ni recul`,
        `Arrondir arbitrairement les valeurs sans respecter les règles de précision`,
        `Oublier de vérifier si l'on a répondu précisément à la question posée`
      ],
      explanation: `Le contrôle de cohérence et l'esprit critique sont essentiels pour éliminer les erreurs de raisonnement.`
    },
    {
      concept: 'Distinction des principes et exceptions',
      question: `Quelle distinction essentielle doit toujours être respectée dans l'étude rigoureuse de ${targetSubject} ?`,
      options: [
        `Distinguer les principes généraux universels de leurs conditions spécifiques d'application et exceptions`,
        `Confondre les causes et les conséquences sans distinction`,
        `Considérer toutes les variables comme constantes sans vérification préalable`,
        `Mélanger les règles théoriques et les simples hypothèses de travail`
      ],
      explanation: `Savoir discerner la règle générale de ses conditions spécifiques d'application est une compétence clé.`
    },
    {
      concept: 'Démarche de résolution progressive',
      question: `Face à une situation complexe en ${targetSubject}, quelle stratégie de résolution est la plus efficace ?`,
      options: [
        `Décomposer le problème global en sous-objectifs plus simples, ordonnés et vérifiables`,
        `Tenter de tout résoudre d'un seul bloc de manière désordonnée`,
        `Abandonner dès la première difficulté sans consulter les repères méthodologiques`,
        `Ignorer les données contextuelles fournies dans l'énoncé`
      ],
      explanation: `La décomposition méthodique permet de surmonter la complexité sans omission ni confusion.`
    },
    {
      concept: 'Identification des hypothèses implicites',
      question: `Dans l'analyse d'une démonstration en ${targetSubject}, pourquoi est-il crucial de repérer les hypothèses implicites ?`,
      options: [
        `Parce qu'une conclusion n'est valide que si toutes ses conditions sous-jacentes sont réunies et vérifiées`,
        `Pour allonger artificiellement la rédaction de sa copie`,
        `Parce que les hypothèses implicites sont toujours fausses par définition`,
        `Pour contredire systématiquement l'auteur de l'énoncé`
      ],
      explanation: `Expliciter les postulats invisibles évite de bâtir un raisonnement sur des bases incertaines.`
    },
    {
      concept: 'Causalité vs Corrélation',
      question: `Lors de l'interprétation de données en ${targetSubject}, quel piège logique majeur doit impérativement être évité ?`,
      options: [
        `Confondre une simple corrélation statistique avec un lien de causalité direct entre deux phénomènes`,
        `Utiliser des graphiques clairs pour présenter ses résultats`,
        `Calculer des moyennes représentatives`,
        `Comparer des valeurs mesurées dans les mêmes conditions`
      ],
      explanation: `Deux grandeurs qui évoluent de concert ne prouvent pas que l'une provoque l'autre (présence possible d'un facteur tiers).`
    },
    {
      concept: 'Formulation d\'hypothèses testables',
      question: `En ${targetSubject}, quelle est la qualité fondamentale d'une bonne hypothèse de travail ?`,
      options: [
        `Elle doit être réfutable, c'est-à-dire pouvoir être mise à l'épreuve par l'observation ou le calcul`,
        `Elle doit être formulée de façon vague pour ne jamais avoir tort`,
        `Elle doit être indiscutable et invérifiable par quiconque`,
        `Elle doit être confirmée d'avance sans aucune expérimentation`
      ],
      explanation: `Une hypothèse scientifique ou académique doit pouvoir être confrontée au réel pour être validée ou rejetée.`
    },
    {
      concept: 'Choix pertinent des outils méthodologiques',
      question: `Comment choisit-on judicieusement un outil d'analyse ou une formule en ${targetSubject} ?`,
      options: [
        `En vérifiant que le domaine d'application de l'outil correspond exactement aux conditions du problème`,
        `En choisissant toujours la formule la plus longue pour impressionner le lecteur`,
        `En utilisant au hasard le premier théorème venu sans vérifier ses critères`,
        `En appliquant systématiquement la même recette sans réfléchir au contexte`
      ],
      explanation: `Chaque outil d'analyse possède un périmètre de validité strict qu'il faut obligatoirement contrôler.`
    },
    {
      concept: 'Interprétation critique des données',
      question: `Face à un graphique ou un tableau de données en ${targetSubject}, quelle démarche d'analyse s'impose ?`,
      options: [
        `Lire les axes, les unités, identifier les tendances globales, puis relever les valeurs remarquables et anomalies`,
        `Se concentrer uniquement sur un point isolé sans regarder la tendance d'ensemble`,
        `Ignorer l'échelle des grandeurs représentées`,
        `Affirmer des conclusions sans s'appuyer sur aucun chiffre du document`
      ],
      explanation: `L'analyse rigoureuse d'un document commence par le cadrage des axes et des unités avant toute interprétation.`
    },
    {
      concept: 'Détection des biais et erreurs d\'inattention',
      question: `Quel réflexe permet de limiter drastiquement les erreurs d'inattention en ${targetSubject} ?`,
      options: [
        `Vérifier systématiquement l'homogénéité dimensionnelle et la cohérence logique avant de clore une étape`,
        `Écrire le plus vite possible sans se relire`,
        `Faire confiance aveugle à la première impression sans vérification`,
        `Rendre son devoir sans relire les consignes`
      ],
      explanation: `La vérification pas à pas et le contrôle croisé des unités sécurisent les étapes de raisonnement.`
    },
    {
      concept: 'Synthèse et clarté de la communication',
      question: `Dans la restitution écrite d'une réponse en ${targetSubject}, quel critère valorise le plus le correcteur ?`,
      options: [
        `La clarté, la concision, la structure en étapes numérotées et la justification explicite du résultat`,
        `L'utilisation d'un vocabulaire imprécis et familier`,
        `Un pavé de texte sans saut de ligne ni mise en évidence de la conclusion`,
        `L'absence de justification sous prétexte que le résultat est évident`
      ],
      explanation: `Une argumentation claire, structurée et directement compréhensible démontre la maîtrise intellectuelle du sujet.`
    },
    {
      concept: 'Modélisation conceptuelle',
      question: `Pourquoi recourt-on fréquemment à la modélisation simplifiée en ${targetSubject} ?`,
      options: [
        `Pour isoler les facteurs prépondérants d'un phénomène complexe et en comprendre les mécanismes essentiels`,
        `Pour rendre les cours inutilement abstraits`,
        `Parce qu'il est interdit d'étudier la réalité telle qu'elle est`,
        `Pour supprimer toute exigence de rigueur mathématique`
      ],
      explanation: `Le modèle est une abstraction féconde qui permet de dégager les lois fondamentales d'un système.`
    },
    {
      concept: 'Gestion des contraintes et marges d\'incertitude',
      question: `Comment un spécialiste de ${targetSubject} traite-t-il la notion d'incertitude ou de marge d'erreur ?`,
      options: [
        `En quantifiant les intervalles de confiance et en précisant la précision des mesures ou hypothèses`,
        `En prétendant que ses résultats sont exacts au milliardième près sans preuve`,
        `En masquant les incertitudes pour paraître plus sûr de lui`,
        `En abandonnant le travail dès qu'il y a un doute`
      ],
      explanation: `Prendre en compte les incertitudes est le propre de toute science rigoureuse et responsable.`
    },
    {
      concept: 'Démarche de validation croisée',
      question: `En quoi consiste la « validation croisée » d'un résultat en ${targetSubject} ?`,
      options: [
        `Retrouver le même résultat par une méthode différente ou un angle d'attaque indépendant`,
        `Faire corriger sa copie par deux camarades qui n'ont pas compris le cours`,
        `Répéter le même calcul faux deux fois de suite`,
        `Demander au hasard la réponse à un camarade de classe`
      ],
      explanation: `La convergence de deux approches indépendantes vers le même résultat est la meilleure garantie de justesse.`
    },
    {
      concept: 'Raisonnement par analogie et limites',
      question: `Quel est le danger d'utiliser une analogie ou une métaphore pour expliquer un concept de ${targetSubject} ?`,
      options: [
        `Croire que l'analogie est parfaite et transposer des propriétés qui ne s'appliquent pas au domaine cible`,
        `Rendre le cours trop facile à comprendre`,
        `Utiliser des images concrètes pour aider la mémoire`,
        `Faire des parallèles historiques instructifs`
      ],
      explanation: `L'analogie est un excellent levier pédagogique initial, mais elle a des limites strictes qu'il faut savoir borner.`
    },
    {
      concept: 'Transfert de compétences',
      question: `Qu'est-ce qui caractérise un haut niveau d'expertise en ${targetSubject} ?`,
      options: [
        `La capacité à mobiliser des principes fondamentaux dans un contexte inédit ou interdisciplinaire`,
        `La récitation par cœur de corrigés sans savoir les adapter à une variante`,
        `L'incapacité à expliquer la matière à un non-spécialiste`,
        `Le refus d'aborder des problèmes sortant des exercices types`
      ],
      explanation: `Le transfert d'apprentissage démontre que les concepts sont assimilés en profondeur et non superficiellement mémorisés.`
    },
    {
      concept: 'Décomposition systémique',
      question: `Dans l'étude d'un système complexe en ${targetSubject}, quel avantage offre l'approche systémique ?`,
      options: [
        `Comprendre les interactions dynamiques entre les composantes plutôt que d'étudier chaque élément de manière isolée`,
        `Ignorer l'objectif global du système`,
        `Considérer que chaque pièce fonctionne sans aucun lien avec les autres`,
        `Remplacer toute analyse quantitative par des impressions vagues`
      ],
      explanation: `L'approche systémique met en lumière les rétroactions, boucles et propriétés émergentes de l'ensemble.`
    },
    {
      concept: 'Évaluation critique des sources',
      question: `Face à une affirmation controversée relative à ${targetSubject}, quelle attitude est la plus rigoureuse ?`,
      options: [
        `Vérifier les données primaires, la réputation scientifique des sources et la méthodologie employée`,
        `Partager immédiatement l'information sur les réseaux sociaux`,
        `Croire sur parole la première personne qui s'exprime avec assurance`,
        `Rejeter en bloc toute nouvelle publication sans la lire`
      ],
      explanation: `L'évaluation critique de la solidité des preuves et du consensus scientifique protège de la désinformation.`
    },
    {
      concept: 'Argumentation dialectique',
      question: `Quelle démarche garantit l'objectivité d'une discussion académique en ${targetSubject} ?`,
      options: [
        `Examiner avec rigueur les arguments opposés et leurs fondements avant d'établir une synthèse nuancée`,
        `Attaquer personnellement son interlocuteur au lieu de répondre sur le fond`,
        `Répéter son avis plus fort sans écouter les contre-exemples`,
        `Déclarer que toutes les opinions se valent sans distinction de valeur démonstrative`
      ],
      explanation: `L'objectivité repose sur la confrontation honnête des thèses rivales soumises aux mêmes critères de preuve.`
    },
    {
      concept: 'Analyse des cas limites',
      question: `Pourquoi teste-t-on souvent les « cas limites » (ex: zéro, l'infini, cas extrêmes) d'une loi en ${targetSubject} ?`,
      options: [
        `Parce que si la formule produit une absurdité dans un cas limite évident, elle est nécessairement incorrecte`,
        `Pour inventer de nouveaux exercices sans rapport avec le cours`,
        `Parce que les cas limites sont les seuls qui existent dans la réalité`,
        `Pour annuler toutes les lois générales de la matière`
      ],
      explanation: `Le test des valeurs extrêmes permet de détecter instantanément une formule erronée ou incohérente.`
    },
    {
      concept: 'Priorisation sous contrainte temporelle',
      question: `Face à une évaluation chronométrée en ${targetSubject}, quelle gestion stratégique s'avère la plus payante ?`,
      options: [
        `Sécuriser d'abord l'ensemble des questions accessibles et bien balisées avant d'investir du temps sur les cas épineux`,
        `Bloquer 45 minutes sur une question difficile sans regarder la suite du sujet`,
        `Répondre au hasard sans poser aucun calcul`,
        `Quitter la salle dès que le sujet comporte une formule méconnue`
      ],
      explanation: `Maximiser les points certains avant d'explorer les questions d'ouverture assure une note honorable et limite le stress.`
    },
    {
      concept: 'Recherche de la cause racine',
      question: `Lorsqu'une anomalie se produit dans un processus en ${targetSubject}, quelle méthode d'investigation est requise ?`,
      options: [
        `Remonter la chaîne causale pour trouver la cause racine structurelle au lieu de traiter un symptôme superficiel`,
        `Changer au hasard plusieurs paramètres en même temps sans noter les modifications`,
        `Accuser immédiatement un facteur externe sans vérifier le protocole`,
        `Ignorer l'anomalie en espérant qu'elle ne se reproduira pas`
      ],
      explanation: `Traiter la cause racine empêche la réapparition récurrente des dysfonctionnements dans tout système rigoureux.`
    },
    {
      concept: 'Preuve par contre-exemple',
      question: `En logique et démarche démonstrative de ${targetSubject}, quelle est la puissance d'un contre-exemple unique ?`,
      options: [
        `Un seul contre-exemple vérifié suffit à invalider formellement une proposition universelle (« Tous les X sont Y »)`,
        `Un contre-exemple ne prouve jamais rien`,
        `Il faut au moins 10 000 contre-exemples pour contredire une affirmation`,
        `Le contre-exemple confirme toujours la règle générale sans exception`
      ],
      explanation: `Pour affirmer une règle universelle, il faut la démontrer ; pour la détruire, un seul cas contraire rigoureux suffit.`
    },
    {
      concept: 'Éthique et responsabilité citoyenne',
      question: `Quelle responsabilité éthique incombe à un élève ou citoyen en ${targetSubject} ?`,
      options: [
        `Garantir l'intégrité intellectuelle, la transparence des démarches et le respect d'autrui`,
        `Rechercher son intérêt personnel sans considération des conséquences pour les autres`,
        `Copier ou falsifier des résultats pour obtenir une bonne note`,
        `Considérer que le respect des règles n'a aucune importance`
      ],
      explanation: `La rigueur méthodologique est indissociable de l'intégrité intellectuelle et de l'honnêteté personnelle.`
    },
    {
      concept: 'Précision de la terminologie',
      question: `Pourquoi le respect scrupuleux du vocabulaire précis est-il exigé en ${targetSubject} ?`,
      options: [
        `Parce que chaque terme a une définition précise sans laquelle le raisonnement devient ambigu et trompeur`,
        `Pour exclure les élèves du savoir`,
        `Pour faire du remplissage dans les copies d'examen`,
        `Parce que les mots n'ont aucune importance dans les matières appliquées`
      ],
      explanation: `La précision du vocabulaire est le miroir de la précision conceptuelle : nommer mal les choses, c'est ajouter au malheur du monde.`
    },
    {
      concept: 'Anticipation des effets secondaires',
      question: `Dans la prise de décision ou le dimensionnement en ${targetSubject}, pourquoi analyse-t-on les effets de second ordre ?`,
      options: [
        `Pour éviter les conséquences imprévues ou perverses qui pourraient ruiner le bénéfice de l'action principale`,
        `Parce que seuls les effets secondaires comptent`,
        `Pour retarder indéfiniment la prise de décision`,
        `Parce que les actions humaines n'ont jamais qu'un seul effet direct`
      ],
      explanation: `La loi des conséquences involontaires exige de regarder au-delà du premier effet évident pour anticiper les équilibres futurs.`
    },
    {
      concept: 'Structure de la preuve',
      question: `Comment s'articule une démonstration mathématique ou conceptuelle irréprochable en ${targetSubject} ?`,
      options: [
        `Hypothèses initiales clairement posées -> Théorèmes applicables cités -> Étapes logiques d'inférence -> Conclusion explicite`,
        `Affirmation brute du résultat sans étape intermédiaire`,
        `Mélange désordonné de calculs au brouillon recopiés sans phrases de liaison`,
        `Copie du résultat d'un voisin sans justification`
      ],
      explanation: `Le schéma canonique Hypothèse - Règle - Déduction - Conclusion garantit la clarté et l'irréfutabilité de la preuve.`
    },
    {
      concept: 'Adaptabilité méthodologique',
      question: `Face à une observation inattendue qui contredit la théorie admise en ${targetSubject}, que doit faire le chercheur ?`,
      options: [
        `Vérifier soigneusement l'expérience, reproduire l'observation, et si elle persiste, envisager une révision ou un affinement de la théorie`,
        `Jeter l'appareil de mesure à la poubelle`,
        `Prétendre que l'observation n'a jamais eu lieu`,
        `Modifier artificiellement la théorie en secret`
      ],
      explanation: `C'est précisément par l'analyse des faits inattendus et récalcitrants que la science progresse et affine ses paradigmes.`
    },
    {
      concept: 'Amélioration continue et recul réflexif',
      question: `Après avoir terminé la résolution complète d'un problème en ${targetSubject}, quelle habitude scelle la véritable progression ?`,
      options: [
        `Prendre 2 minutes pour faire un bilan réflexif : « Qu'ai-je appris ? Quel piège ai-je évité ? Comment généraliser cette idée ? »`,
        `Oublier immédiatement tout ce que l'on vient de faire`,
        `Brûler ses feuilles de brouillon sans analyse`,
        `Considérer que le cours n'a plus aucun intérêt`
      ],
      explanation: `La boucle réflexive finale transforme l'effort ponctuel en un schéma cognitif pérenne et réutilisable dans de futurs contextes.`
    }
  ];
}

module.exports = { getUniqueFallbackScenarios };
