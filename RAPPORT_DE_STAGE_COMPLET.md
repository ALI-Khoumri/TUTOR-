# PROJET DE FIN D'ANNÉE (PFA)
## 3ème Année en Ingénierie Informatique et Réseaux (IIR)
### ÉCOLE MAROCAINE DES SCIENCES DE L'INGÉNIEUR (EMSI) — Casablanca

---

# CONCEPTION ET RÉALISATION D'UNE PLATEFORME WEB ADAPTATIVE DE SOUTIEN SCOLAIRE ET DE REMÉDIATION PÉDAGOGIQUE ASSISTÉE PAR INTELLIGENCE ARTIFICIELLE
### — Projet « TutorAI » (Élèves en Difficulté de 6 à 15 ans) —

---

**Réalisé par :**
Ali KHOUMRI  
Élève-Ingénieur en 3ème Année IIR

**Tuteur :**
— **Encadrante Professionnelle :** Madame Aïcha FADLI, Responsable Digitale (UQASE NEXT SARL)  

**Organisme d'accueil :**
UQASE NEXT SARL  
332 Boulevard Brahim Roudani, Étage 5, Appartement 21, Résidence Rayhane, Maarif, Casablanca, Maroc

**Année Universitaire :** 2025 / 2026

---

# Dédicaces

*À mes très chers parents,*  
Pour leur amour inconditionnel, leurs prières bienveillantes, leurs sacrifices constants et leur soutien indéfectible tout au long de mes années d'études. Qu'ils trouvent dans ce modeste travail le témoignage de ma profonde affection et de mon infinie gratitude.

*À mes professeurs de l'École Marocaine des Sciences de l'Ingénieur (EMSI),*  
Pour la rigueur de leur enseignement, la qualité de leur transmission du savoir et leur accompagnement méthodologique continu.

*À mes collègues et amis,*  
Pour leur esprit d'entraide, leur solidarité et les précieux moments de partage intellectuel et humain vécus ensemble.

*À tous ceux qui ont contribué, de près ou de loin, à l'aboutissement de ce projet.*

---

# Remerciements

Au terme de ce projet de fin d'année marquant l'aboutissement de notre troisième année de formation en Ingénierie Informatique et Réseaux à l'École Marocaine des Sciences de l'Ingénieur (EMSI), nous tenons à exprimer notre profonde gratitude à toutes les personnes qui ont contribué au bon déroulement et à la réussite de notre stage.

Nous exprimons tout d'abord nos remerciements les plus chaleureux à la direction générale de la société **UQASE NEXT SARL** pour nous avoir accueillis au sein de ses locaux à Casablanca et pour nous avoir offert un cadre de travail professionnel, stimulant et propice à l'innovation technologique.

Nous adressons notre profonde et sincère reconnaissance à notre encadrante professionnelle, **Madame Aïcha FADLI**, Responsable Digitale au sein d'UQASE NEXT SARL. Nous la remercions tout particulièrement pour sa disponibilité constante, sa bienveillance, la clarté de ses orientations stratégiques et ses précieux conseils méthodologiques. Son leadership éclairé et son expertise reconnue dans le pilotage des projets de transformation digitale ont constitué un appui déterminant pour cadrer notre réflexion et mener à bien les réalisations attendues.

Enfin, nous tenons à témoigner notre respect et notre considération à l'ensemble du corps professoral et administratif de l'**École Marocaine des Sciences de l'Ingénieur (EMSI)** pour l'excellence de la formation académique dispensée et les valeurs d'ingénieur transmises avec dévouement.

---

# Table des matières

- **Dédicaces**
- **Remerciements**
- **Table des matières**
- **Liste des figures**
- **Liste des tableaux**
- **Liste des acronymes**
- **Introduction générale**
- **Chapitre 1 — Présentation du cadre de projet**
  - 1.1. Introduction
  - 1.2. Présentation de la société d'accueil
    - 1.2.1. Fiche signalétique et implantation
    - 1.2.2. Structure et département d'accueil
  - 1.3. Étude de l'existant
  - 1.4. Critique de l'existant et solution proposée
  - 1.5. Méthodologie et démarche de développement
  - 1.6. Planning prévisionnel et ordonnancement
  - 1.7. Conclusion
- **Chapitre 2 — Spécification des besoins**
  - 2.1. Introduction
  - 2.2. Spécification des besoins fonctionnels
    - 2.2.1. Gestion des utilisateurs et profils apprenants
    - 2.2.2. Évaluation diagnostique et progression adaptative
    - 2.2.3. Moteur d'entraînement par quiz interactifs
    - 2.2.4. Espace d'exercices pratiques et évaluation rigoureuse par IA
    - 2.2.5. Génération dynamique de contenus et export PDF
  - 2.3. Spécification des besoins non fonctionnels
    - 2.3.1. Sécurité, intégrité et confidentialité des données
    - 2.3.2. Performance, temps de réponse et scalabilité
    - 2.3.3. Ergonomie, réactivité et accessibilité
    - 2.3.4. Disponibilité, résilience logicielle et mécanismes de repli
  - 2.4. Identification et typologie des acteurs
  - 2.5. Modélisation des cas d'utilisation
    - 2.5.1. Diagramme global des cas d'utilisation
    - 2.5.2. Description textuelle détaillée des cas d'utilisation majeurs
  - 2.6. Conclusion
- **Chapitre 3 — Conception du système**
  - 3.1. Introduction
  - 3.2. Modélisation dynamique du système
    - 3.2.1. Diagrammes de séquences système
    - 3.2.2. Diagrammes de collaboration
    - 3.2.3. Diagramme d'états-transitions
    - 3.2.4. Diagramme d'activités
  - 3.3. Modélisation statique du système
    - 3.3.1. Diagramme de classes métier
    - 3.3.2. Règles formelles de passage au modèle relationnel
    - 3.3.3. Modèle Logique de Données (MLD) en 3FN
    - 3.3.4. Dictionnaire de données
  - 3.4. Architecture globale du système
    - 3.4.1. Architecture logicielle 3-Tiers
    - 3.4.2. Architecture matérielle et diagramme de déploiement
  - 3.5. Conclusion
- **Chapitre 4 — Réalisation du système**
  - 4.1. Introduction
  - 4.2. Environnement de développement et outillage
    - 4.2.1. Environnement matériel
    - 4.2.2. Environnement logiciel et technologies retenues
  - 4.3. Réalisation et présentation des interfaces graphiques
    - 4.3.1. Module d'accès et authentification
    - 4.3.2. Tableau de bord apprenant et suivi des compétences
    - 4.3.3. Module d'entraînement par quiz adaptatif
    - 4.3.4. Espace d'exercices pratiques et évaluation rigoureuse
    - 4.3.5. Modale de génération de cas pratiques par le Tuteur IA
    - 4.3.6. Module de téléchargement et d'exportation PDF
  - 4.4. Tests de validation et recette fonctionnelle
  - 4.5. Conclusion
- **Conclusion générale**
- **Bibliographie et Nétographie**
- **Annexes**
  - Annexe A : Extraits d'algorithmes et de code source représentatifs
  - Annexe B : Configuration Docker Compose pour le déploiement conteneurisé

---

# Liste des figures

— **Figure 1.1 :** Organigramme structurel de la société UQASE NEXT et positionnement du Département Digital  
— **Figure 1.2 :** Cycle itératif de la méthodologie Agile Scrum appliquée au projet TutorAI  
— **Figure 1.3 :** Diagramme de Gantt prévisionnel du projet  
— **Figure 2.1 :** Diagramme global des cas d'utilisation UML de la plateforme TutorAI  
— **Figure 2.2 :** Diagramme de cas d'utilisation détaillé du module d'entraînement et d'évaluation  
— **Figure 3.1 :** Diagramme de séquences UML2 du processus d'authentification sécurisée  
— **Figure 3.2 :** Diagramme de séquences UML2 de l'évaluation rigoureuse d'un exercice pratique avec le Tuteur IA  
— **Figure 3.3 :** Diagramme de collaboration entre les services du sous-système de tutorat  
— **Figure 3.4 :** Diagramme d'états-transitions du cycle de vie d'un exercice pratique  
— **Figure 3.5 :** Diagramme d'activités de l'évaluation adaptative et de l'interception des non-réponses  
— **Figure 3.6 :** Diagramme de classes métier du domaine TutorAI  
— **Figure 3.7 :** Schéma physique et relationnel de la base de données (MLD)  
— **Figure 3.8 :** Diagramme de composants de l'architecture logicielle 3-Tiers  
— **Figure 3.9 :** Diagramme de déploiement matériel et réseau de la plateforme  
— **Figure 4.1 :** Interface de connexion et d'inscription sécurisée  
— **Figure 4.2 :** Tableau de bord de l'apprenant avec indicateurs de progression adaptative  
— **Figure 4.3 :** Interface du test diagnostique initial de positionnement des compétences  
— **Figure 4.4 :** Interface de passation d'un quiz interactif avec rétroaction immédiate  
— **Figure 4.5 :** Espace de travail et éditeur de réponse à un exercice pratique  
— **Figure 4.6 :** Restitution sans complaisance avec sanction 0/100 et corrigé type détaillé  
— **Figure 4.7 :** Modale de génération paramétrée d'un nouveau cas pratique par le Tuteur IA  
— **Figure 4.8 :** Interface de téléchargement et aperçu d'une fiche de cours vectorielle PDF  

---

# Liste des tableaux

— **Tableau 1.1 :** Planning prévisionnel des étapes du projet  
— **Tableau 2.1 :** Description textuelle du cas d'utilisation « Évaluer un exercice pratique »  
— **Tableau 2.2 :** Description textuelle du cas d'utilisation « Générer un nouvel exercice sur mesure »  
— **Tableau 2.3 :** Description textuelle du cas d'utilisation « Passer le test diagnostique initial »  
— **Tableau 3.1 :** Dictionnaire de données du système TutorAI  
— **Tableau 4.1 :** Matrice de recette et validation des cas de tests fonctionnels  

---

# Liste des acronymes

— **API :** Application Programming Interface  
— **CDK :** Component Development Kit  
— **CORS :** Cross-Origin Resource Sharing  
— **CU :** Cas d'Utilisation  
— **DOM :** Document Object Model  
— **EMSI :** École Marocaine des Sciences de l'Ingénieur  
— **GGUF :** GPT-Generated Unified Format  
— **HTTP :** HyperText Transfer Protocol  
— **HTTPS :** HyperText Transfer Protocol Secure  
— **IIR :** Ingénierie Informatique et Réseaux  
— **JSON :** JavaScript Object Notation  
— **JWT :** JSON Web Token  
— **LLM :** Large Language Model (Modèle de Langage Étendu)  
— **MLD :** Modèle Logique de Données  
— **ORM :** Object-Relational Mapping  
— **PFA :** Projet de Fin d'Année  
— **RAG :** Retrieval-Augmented Generation  
— **REST :** Representational State Transfer  
— **SGBD :** Système de Gestion de Base de Données  
— **SPA :** Single Page Application  
— **SQL :** Structured Query Language  
— **UML :** Unified Modeling Language  
— **UUID :** Universally Unique Identifier  
— **WCAG :** Web Content Accessibility Guidelines  
— **XP :** Experience Points (Points d'Expérience)  

---

# Introduction générale

L'avènement des technologies numériques et l'essor des modèles d'intelligence artificielle ouvrent des perspectives prometteuses pour repenser l'accompagnement scolaire et la remédiation pédagogique. Dans les cycles de l'enseignement fondamental et collégial (enfants et adolescents âgés de 6 à 15 ans), de nombreux élèves rencontrent des blocages d'apprentissage précoces : difficultés de lecture ou d'orthographe, hésitations dans le calcul et les fractions, manque d'autonomie ou anxiété de performance face à l'erreur. Dans des classes souvent chargées, l'enseignant ne peut individualiser en continu son étayage pour chaque enfant. À domicile, lors des devoirs, l'absence d'un guidage interactif et bienveillant plonge fréquemment l'enfant en situation de découragement ou d'abandon.

Dans ce contexte, la conception d'un tuteur intelligent interactif et empathique constitue une réponse d'ingénierie éducative de premier plan. Le présent projet de fin d'année, mené au sein de la société de conseil et d'ingénierie logicielle **UQASE NEXT SARL** à Casablanca, s'inscrit au cœur de cette démarche d'innovation solidaire. Notre mission a consisté à concevoir, modéliser et développer une plateforme web complète d'apprentissage adaptatif et de remédiation assistée par intelligence artificielle, baptisée **TutorAI**, spécialement dimensionnée pour les **élèves en difficulté âgés de 6 à 15 ans** (du Primaire au Collège). Cette solution associe une interface réactive stimulante (Angular 16), une couche de services RESTful robuste (Node.js/Express) et un moteur d'inférence d'IA locale (Ollama / Llama 3.2) garantissant la stricte confidentialité des données des mineurs. La plateforme repose sur trois axes fondamentaux : un diagnostic initial bienveillant pour cibler les besoins, un parcours adaptatif progressif par paliers respectant le rythme de l'enfant, et un tuteur conversationnel utilisant le questionnement socratique doux, le renforcement positif et la décomposition pas-à-pas pour débloquer les incompréhensions sans jugement ni complaisance trompeuse.

Pour rendre compte avec rigueur de l'ensemble de notre démarche d'ingénieur, le présent rapport est structuré en quatre chapitres complémentaires :

— Le **Chapitre 1** présente le cadre institutionnel du projet en décrivant l'organisme d'accueil UQASE NEXT SARL et le Département Digital, analyse l'existant des solutions de soutien scolaire pour mineurs, motive la solution novatrice TutorAI et formalise la méthodologie Agile Scrum ainsi que le planning prévisionnel des travaux.  
— Le **Chapitre 2** formalise la spécification exhaustive des besoins fonctionnels et non fonctionnels, caractérise les acteurs (l'élève de 6 à 15 ans, le parent/tuteur légal, le tuteur IA) et modélise les cas d'utilisation selon le formalisme UML.  
— Le **Chapitre 3** aborde la conception architecturale et détaillée du système à travers la modélisation dynamique (diagrammes de séquences avec fragments UML2, collaboration, états-transitions, activités), la modélisation statique (diagramme de classes, modèle relationnel, dictionnaire de données) et la description de l'architecture 3-Tiers et de déploiement.  
— Le **Chapitre 4** retrace la concrétisation logicielle de TutorAI, détaillant l'environnement matériel et logiciel de développement, décrivant les principales interfaces graphiques adaptées aux jeunes apprenants et exposant les résultats de la campagne de tests et de recette.

Enfin, une conclusion générale synthétise le bilan de cette expérience professionnelle et ouvre sur des perspectives d'évolution pédagogique, éthique et technique.

---

# Chapitre 1 — Présentation du cadre de projet

## 1.1. Introduction
Ce premier chapitre a pour vocation de circonscrire l'écosystème contextuel et organisationnel au sein duquel s'est déroulé notre stage de fin d'année. Nous commencerons par présenter la société d'accueil **UQASE NEXT SARL**, ses domaines d'expertise et la structure de son Département Digital. Dans un deuxième temps, nous dresserons un état de l'art des solutions logicielles existantes dans le secteur du e-learning et du soutien scolaire afin de souligner leurs carences méthodologiques. Enfin, nous décrirons la démarche de gestion de projet adoptée, fondée sur la méthodologie Agile Scrum, et nous formaliserons le calendrier prévisionnel ordonnançant nos étapes de travail.

## 1.2. Présentation de la société d'accueil
Notre stage a été réalisé au sein de la société **UQASE NEXT SARL**, entreprise dynamique spécialisée dans l'édition logicielle, le conseil en transformation digitale et l'intégration de technologies avancées au service des entreprises et institutions éducatives.

### 1.2.1. Fiche signalétique et implantation
La société est implantée au cœur du quartier d'affaires du Maarif à Casablanca. Les informations administratives et techniques de l'entreprise sont récapitulées ci-dessous :

— **Dénomination sociale :** UQASE NEXT SARL  
— **Forme juridique :** Société à Responsabilité Limitée (SARL)  
— **Siège social :** 332 Boulevard Brahim Roudani, Étage 5, Appartement 21, Résidence Rayhane, Maarif, Casablanca, Maroc  
— **Encadrante professionnelle (maître de stage) :** Madame Aïcha FADLI, Responsable Digitale  
— **Secteur d'activité :** Conseil en technologies de l'information, édition logicielle, développement web et intelligence artificielle  
— **Domaines d'expertise :** Ingénierie logicielle full-stack, architectures distribuées Cloud, intégration d'agents d'intelligence artificielle, plateformes d'apprentissage e-learning et méthodologies DevOps  
— **Zone géographique de rayonnement :** Maroc et international  

### 1.2.2. Structure et département d'accueil
La structure organisationnelle d'UQASE NEXT SARL est articulée autour de pôles opérationnels hautement interconnectés : la Direction Générale, le Pôle Développement Logiciel, le Pôle Qualité & DevOps, et le **Département Digital**.

Nous avons eu l'opportunité d'intégrer directement le **Département Digital**, placé sous la responsabilité managériale et technique de **Madame Aïcha FADLI**, Responsable Digitale. Ce département constitue le fer de lance de l'entreprise en matière d'innovation numérique, de modernisation servicielle et d'intégration des modèles d'intelligence artificielle générative dans des cas d'usage métiers à forte valeur ajoutée. 

Sous la supervision directe de Madame Aïcha FADLI, nous avons participé aux réunions de cadrage stratégique, à la définition de l'expérience utilisateur (UX/UI) des plateformes d'apprentissage et à la validation des choix d'architecture technique. Le département digital entretient des synergies étroites avec les ingénieurs d'infrastructure et les développeurs front-end/back-end, ce qui nous a permis de progresser dans un écosystème d'ingénierie rigoureux répondant aux meilleurs standards professionnels.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Schéma de l'organigramme structurel de la société      |
| UQASE NEXT SARL avec mise en évidence de la Direction Générale, du   |
| Pôle Développement, du Pôle Qualité/DevOps et du Département Digital |
| dirigé par Madame Aïcha FADLI, Responsable Digitale.                 |
+----------------------------------------------------------------------+
Figure 1.1 : Organigramme structurel de la société UQASE NEXT et positionnement du Département Digital
```

## 1.3. Étude de l'existant
L'analyse de l'écosystème numérique contemporain dédié au soutien scolaire et à l'aide aux devoirs fait ressortir trois grandes familles de dispositifs :
1. **Les exerciseurs scolaires et fiches en ligne traditionnels :** Des sites de révision proposant des cours numérisés et des séries d'exercices standardisés. Ces outils privilégient la restitution passive et confrontent l'élève en difficulté à des séries d'erreurs répétitives sans lui expliquer la cause cognitive de son blocage.
2. **Les applications ludo-éducatives grand public :** Des applications mobiles gamifiées qui captent l'attention des plus jeunes par des récompenses visuelles, mais qui simplifient à l'excès les concepts sans offrir de véritable accompagnement réflexif ni de remédiation ciblée face aux lacunes persistantes.
3. **Les assistants conversationnels IA génériques dans le cloud :** Des modèles distants (type ChatGPT ou Gemini) consultables en texte libre. Ces outils s'avèrent inadaptés pour des enfants et adolescents de 6 à 15 ans : formulations trop abstraites ou verbeuses, risques d'hallucinations, complaisance trompeuse (validation de réponses fausses ou encouragements déplacés), et absence de garanties sur la protection des données personnelles des mineurs.

## 1.4. Critique de l'existant et solution proposée
### Limites de l'existant
L'examen critique de ces solutions révèle plusieurs limites structurelles majeures pour les élèves en difficulté :
— **Statisme et anxiété d'échec :** Les parcours rigides ne s'adaptent pas au rythme d'assimilation de l'enfant. Face à l'accumulation d'erreurs sanctionnées froidement, l'élève en difficulté se décourage et perd confiance en ses capacités.  
— **Complaisance trompeuse ou sanction brutale :** Les assistants IA génériques manquent de cadre pédagogique : soit ils fournissent directement la solution complète sans faire réfléchir l'enfant, soit ils valident des raisonnements faux. À l'inverse, les exerciseurs classiques sanctionnent sans expliquer.  
— **Correction différée et sentiment d'abandon :** L'enfant qui bloque sur un devoir le soir reste sans aide immédiate en l'absence d'un tuteur disponible, ce qui retarde l'assimilation des notions clés.  
— **Confidentialité et vulnérabilité des données des mineurs :** Le transfert des échanges d'enfants vers des plateformes cloud tierces pose d'importants problèmes éthiques et réglementaires quant au profilage et à la sécurité des données des mineurs.

### Solution proposée : La plateforme TutorAI
Pour répondre à ces enjeux, nous avons conçu et réalisé la plateforme **TutorAI**, un environnement web interactif de soutien scolaire et de remédiation individualisée pour les **élèves de 6 à 15 ans**, articulé autour de trois piliers majeurs :
— **Un guidage adaptatif individualisé :** Les activités de quiz et d'exercices s'adaptent dynamiquement au niveau réel de l'élève à travers trois paliers progressifs (Découverte/Débutant, Consolidation/Intermédiaire, Maîtrise/Avancé), échelonnés sur les cycles du Primaire et du Collège.  
— **Une remédiation bienveillante sans complaisance :** Face aux blocages ou aux non-réponses (« jsp », « je ne sais pas »), le tuteur IA ne sanctionne pas punitivement l'enfant mais identifie immédiatement le blocage, active un statut bienveillant (« À consolider avec aide ») et fournit des indices décompressés pas-à-pas avec des encouragements chaleureux pour relancer sa réflexion.  
— **Une souveraineté et sécurité totale par inférence IA locale :** L'intégration locale du modèle Llama 3.2 via Ollama garantit qu'aucune donnée d'enfant ni aucun historique d'apprentissage ne quitte la machine hôte, assurant une conformité exemplaire avec les exigences de protection de l'enfance et un coût d'exploitation maîtrisé.

## 1.5. Méthodologie et démarche de développement
Le développement d'une application combinant des composants réactifs front-end, une API RESTful et des inférences d'IA nécessite une démarche itérative favorisant la validation progressive des briques logicielles. Nous avons adopté la méthodologie **Agile Scrum**.

Cette approche nous a permis de structurer notre travail en cycles courts dénommés *Sprints* d'une durée moyenne de deux à trois semaines, rythmés par les réunions de planification, les points d'avancement avec notre encadrante Madame Aïcha FADLI et les démonstrations de recette :
— **Sprint 0 :** Cadrage, étude de l'existant, spécification des besoins et conception architecturale préliminaire.  
— **Sprint 1 :** Implémentation du socle technique (Express, MySQL, JWT) et développement du module d'authentification et de diagnostic initial.  
— **Sprint 2 :** Conception du moteur d'entraînement par quiz adaptatifs et suivi de la progression par matière.  
— **Sprint 3 :** Réalisation de l'espace d'exercices pratiques, de l'éditeur de réponse et intégration du serveur d'inférence Ollama (Llama 3.2).  
— **Sprint 4 :** Développement de l'algorithme d'interception stricte des non-réponses, génération dynamique d'exercices, export PDF et tests globaux.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Schéma du cycle de vie de la méthodologie Agile Scrum  |
| illustrant le Product Backlog, le Sprint Planning, les itérations de |
| développement (Sprints), le Daily Scrum, la Revue de Sprint et la    |
| Rétrospective.                                                       |
+----------------------------------------------------------------------+
Figure 1.2 : Cycle itératif de la méthodologie Agile Scrum appliquée au projet TutorAI
```

## 1.6. Planning prévisionnel et ordonnancement
Notre stage au sein de la société UQASE NEXT SARL s'est déroulé sur une durée intensive d'un mois, du 1er juillet au 1er août 2026. Le projet a été planifié selon un découpage hebdomadaire rigoureux réparti sur 5 semaines selon la méthodologie Agile Scrum :
— **Semaine 1 (01/07 — 07/07) :** Étude préalable, cadrage du projet et spécification détaillée des besoins fonctionnels.  
— **Semaine 2 (08/07 — 14/07) :** Conception architecturale UML, modélisation statique et dynamique.  
— **Semaine 3 (15/07 — 21/07) :** Implémentation du backend Node.js/Express, de la base de données MySQL et des API sécurisées JWT.  
— **Semaine 4 (22/07 — 28/07) :** Développement des composants Angular 16 et interfaçage avec le moteur d'IA locale Ollama (Llama 3.2).  
— **Semaine 5 (29/07 — 01/08) :** Campagne de tests fonctionnels, recette logicielle, validation et rédaction du rapport.

Le tableau 1.1 synthétise la matrice calendaire de ces réalisations.

**Tableau 1.1 : Planning prévisionnel des étapes du projet**

| Etape / Semaine | S1 (01--07/07) | S2 (08--14/07) | S3 (15--21/07) | S4 (22--28/07) | S5 (29/07--01/08) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Étude préalable & cadrage | [X] | [ ] | [ ] | [ ] | [ ] |
| Spécification des besoins | [X] | [X] | [ ] | [ ] | [ ] |
| Conception architecturale & UML | [ ] | [X] | [ ] | [ ] | [ ] |
| Réalisation Back-End & Base MySQL | [ ] | [X] | [X] | [ ] | [ ] |
| Réalisation Front-End Angular 16 | [ ] | [ ] | [X] | [X] | [ ] |
| Intégration Moteur IA Ollama | [ ] | [ ] | [ ] | [X] | [X] |
| Recette, Tests et Intégration | [ ] | [ ] | [ ] | [X] | [X] |
| Rédaction du rapport et bilan | [ ] | [ ] | [ ] | [X] | [X] |

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de Gantt prévisionnel détaillant le calendrier |
| des tâches, leurs dépendances et les jalons de livraison du projet.  |
+----------------------------------------------------------------------+
Figure 1.3 : Diagramme de Gantt prévisionnel du projet
```

## 1.7. Conclusion
Dans ce premier chapitre, nous avons ancré notre projet au cœur d'UQASE NEXT SARL en mettant en lumière le rôle stratégique de Madame Aïcha FADLI à la direction du Département Digital. L'analyse critique de l'existant a confirmé l'intérêt technique et pédagogique de développer la plateforme TutorAI. Grâce à la démarche Agile Scrum et à un ordonnancement rigoureux de nos travaux sur la période du 01/07 au 01/08, le cadre opérationnel a été parfaitement stabilisé. Le chapitre suivant est consacré à la spécification détaillée des besoins du système.

---

# Chapitre 2 — Spécification des besoins

## 2.1. Introduction
La réussite d'un projet informatique dépend de la rigueur apportée à la définition de ses exigences. Ce deuxième chapitre formalise l'analyse des besoins de la plateforme TutorAI. Nous commencerons par décrire exhaustivement les fonctionnalités attendues réparties en modules métier. Nous aborderons ensuite les exigences non fonctionnelles en termes de robustesse, de temps de réponse, de sécurité et d'ergonomie. Enfin, nous identifierons les acteurs du système et nous modéliserons l'ensemble des cas d'utilisation par le biais de diagrammes UML et de fiches descriptives textuelles.

## 2.2. Spécification des besoins fonctionnels
Les besoins fonctionnels délimitent le champ des actions et traitements que le système doit offrir aux utilisateurs. Nous les avons regroupés en cinq modules clés :

### 2.2.1. Gestion des utilisateurs et profils apprenants (6-15 ans)
— **Sous-besoin 1.1 :** Inscription adaptée d'un jeune apprenant avec recueil de son âge (strictement calibré entre 6 et 15 ans), de son niveau scolaire (Primaire : 1ère à 6ème AP / CP à CM2 ; Collège : 1ère à 3ème AC / 6ème à 3ème), de ses difficultés déclarées (compréhension des consignes, tables de calcul, lecture, mémorisation, stress) et de ses centres d'intérêt pour contextualiser les exemples.  
— **Sous-besoin 1.2 :** Rattachement optionnel d'un compte Parent/Tuteur légal pour le suivi bienveillant de la progression et des compétences consolidées.  
— **Sous-besoin 1.3 :** Authentification sécurisée par jetons d'accès chiffrés (JWT) et contrôle de validité des sessions adaptées aux mineurs.  
— **Sous-besoin 1.4 :** Consultation et mise à jour du profil apprenant, visualisation des points d'expérience (XP) et badges d'encouragement valorisant l'effort et la persévérance.

### 2.2.2. Évaluation diagnostique et progression adaptative
— **Sous-besoin 2.1 :** Questionnaire diagnostique initial bienveillant et non anxiogène, permettant de cartographier sans jugement les prérequis de l'enfant.  
— **Sous-besoin 2.2 :** Calcul automatique d'un indice de maîtrise par discipline pour orienter l'enfant vers un palier de départ stimulant (Palier 1 : Découverte & Consolidation des bases, Palier 2 : Entraînement guidé, Palier 3 : Autonomie et dépassement).  
— **Sous-besoin 2.3 :** Ajustement dynamique continu du palier au fil des réussites et des sessions de remédiation afin de prévenir le découragement.

### 2.2.3. Moteur d'entraînement par quiz interactifs adaptés
— **Sous-besoin 3.1 :** Sélection d'une discipline parmi le socle fondamental de l'enseignement primaire et collégial (Mathématiques, Français, Langue arabe, Éveil scientifique / SVT, Physique-Chimie, Anglais, Histoire-Géographie).  
— **Sous-besoin 3.2 :** Génération de questionnaires à choix unique clairs, dotés d'indices dépliables, d'un vocabulaire accessible et d'un affichage apaisant évitant le stress du compte à rebours punitif.  
— **Sous-besoin 3.3 :** Rétroaction pédagogique immédiate et valorisante, explicitant les notions sous-jacentes à l'aide de métaphores concrètes du quotidien de l'enfant.

### 2.2.4. Espace d'exercices pratiques et remédiation bienveillante par IA
— **Sous-besoin 4.1 :** Présentation d'énoncés concrets ancrés dans des situations réelles (partage d'objets, expériences de sciences, récits illustrés), accompagnés de consignes simplifiées et d'une boîte à outils méthodologique.  
— **Sous-besoin 4.2 :** Zone d'écriture avec mécanisme d'auto-sauvegarde locale en continu pour rassurer l'enfant contre toute perte accidentelle de ses écrits.  
— **Sous-besoin 4.3 :** Remédiation bienveillante sans complaisance : détection immédiate des blocages ou mentions évasives (« jsp », « je ne sais pas », « aide-moi ») pour enclencher un guidage pas-à-pas bienveillant (« Notion à consolider avec aide ») avec indices méthodologiques décompressés et modèle de résolution, sans complaisance trompeuse mais sans sanction punitive démobilisatrice.

### 2.2.5. Génération dynamique de contenus et fiches de révision PDF
— **Sous-besoin 5.1 :** Modale de génération d'exercices sur-mesure permettant de choisir un thème d'école (ex: « les fractions », « le cycle de l'eau », « l'accord sujet-verbe »), une matière et un palier pour obtenir un nouvel exercice généré par le Tuteur IA.  
— **Sous-besoin 5.2 :** Téléchargement vectoriel de fiches mémo synthétiques et aérées au format PDF, imprimables pour réviser hors écran.

## 2.3. Spécification des besoins non fonctionnels
Les exigences non fonctionnelles décrivent les caractéristiques de qualité indispensables à l'exploitabilité du système :

### 2.3.1. Sécurité, intégrité et protection renforcée des données des mineurs
— Hachage à sens unique des mots de passe en base de données par l'algorithme BCrypt avec sel fort (facteur de coût 10).  
— Sécurisation des routes API sensibles par middleware de vérification des jetons JWT.  
— Respect strict de la vie privée des mineurs (Loi 09-08 et RGPD) : aucune donnée d'apprentissage ni production textuelle d'enfant n'est transmise à des tiers externes, grâce au déploiement local exclusif du modèle d'IA sous Ollama.  
— Prévention systématique des injections SQL via l'utilisation rigoureuse de requêtes préparées paramétrées.

### 2.3.2. Performance, temps de réponse et scalabilité
— Temps de rendu des interfaces d'entraînement inférieur à 250 millisecondes grâce à l'architecture SPA d'Angular 16.  
— Temps d'inférence de l'évaluation IA contenu sous la barre des 3 secondes par l'utilisation de modèles quantifiés GGUF 4-bit optimisés pour processeurs multi-cœurs.  
— Pool de connexions asynchrones au serveur MySQL permettant de traiter les requêtes concurrentes sans blocage d'I/O.

### 2.3.3. Ergonomie, réactivité et accessibilité pour jeunes élèves
— Interface colorée, chaleureuse et responsive, conçue pour limiter la charge cognitive des élèves de 6 à 15 ans et adaptée aux tablettes et ordinateurs.  
— Respect des préconisations d'accessibilité numérique WCAG avec des typographies très lisibles (évitant la confusion visuelle des lettres) et des contrastes adaptés.  
— Clarté de la hiérarchie visuelle guidant intuitivement l'enfant vers l'étape suivante avec des feedbacks visuels positifs.

### 2.3.4. Disponibilité, résilience logicielle et mécanismes de repli
— Mécanisme de repli procédural certifié (*fallback*) garantissant la disponibilité continue du générateur d'exercices et des feedbacks même en cas de saturation passagère du démon Ollama.  
— Tolérance aux micro-coupures réseau grâce au stockage local des brouillons d'exercices dans le LocalStorage du navigateur.

## 2.4. Identification et typologie des acteurs
Quatre catégories d'acteurs interagissent avec le système :
— **Élève (6 à 15 ans) :** Acteur primaire au cœur du dispositif. Il s'authentifie, passe le test diagnostique, effectue ses quiz, résout des exercices à son rythme, sollicite les indices du Tuteur IA et suit sa progression par badges et points d'expérience.  
— **Parent / Tuteur légal :** Acteur associé qui supervise le compte de l'enfant, consulte les bilans d'apprentissage et encourage la régularité du travail personnel sans exercer de pression anxiogène.  
— **Tuteur IA (Moteur LLM Ollama / Llama 3.2) :** Acteur interne automatisé incarnant un compagnon d'apprentissage patient, empathique et méthodique. Il formule des rétroactions positives, adapte la difficulté, décompose les notions complexes et guide sans donner directement les réponses.  
— **Administrateur système :** Acteur technique responsable du maintien en condition opérationnelle, de la surveillance de la base de données et de l'intégrité de l'infrastructure locale.

## 2.5. Modélisation des cas d'utilisation
### 2.5.1. Diagramme global des cas d'utilisation
La figure 2.1 expose l'organisation générale des fonctionnalités de TutorAI et les liens qui unissent les acteurs aux cas d'utilisation.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme global des cas d'utilisation UML présentant  |
| les acteurs 'Élève (6-15 ans)', 'Parent' et 'Tuteur IA', ainsi que    |
| les cas : S'authentifier, Passer diagnostic bienveillant, S'entraîner|
| par quiz, Résoudre exercice guidé, Évaluer et remédier (<<include>>   |
| Analyser blocage, <<invoke>> IA bienveillante), Générer exercice sur  |
| mesure et Télécharger fiches de cours PDF.                           |
+----------------------------------------------------------------------+
Figure 2.1 : Diagramme global des cas d'utilisation UML de la plateforme TutorAI
```

### 2.5.2. Description textuelle détaillée des cas d'utilisation majeurs
Nous détaillons ci-après les cas d'utilisation névralgiques du système.

**Tableau 2.1 : Description textuelle du cas d'utilisation « Évaluer et remédier à un exercice pratique »**

| Rubrique | Description |
| :--- | :--- |
| **Cas d'Utilisation N°** | CU-01 |
| **Nom du Cas** | Évaluation bienveillante et remédiation guidée d'un exercice |
| **Acteur(s)** | Élève (initiateur), Tuteur IA (système d'inférence) |
| **Objectif** | Analyser la réponse de l'élève, identifier les points acquis et les blocages, et délivrer un retour constructif avec remédiation pas-à-pas. |
| **Pré-conditions** | L'élève est connecté et a ouvert un exercice dans son espace de travail. |
| **Post-conditions** | Les acquis sont valorisés, les notions à consolider sont explicitées et des indices d'aide sont proposés pour retenter sans honte. |
| **Scénario nominal** | 1. L'élève prend connaissance de l'énoncé illustré et rédige sa réponse.<br>2. L'élève clique sur « Vérifier avec mon Tuteur IA ».<br>3. Le système vérifie la présence d'une réponse textuelle constructive.<br>4. Le système sollicite le Tuteur IA avec le prompt pédagogique bienveillant.<br>5. L'IA analyse le raisonnement, met en valeur les points positifs et relève les erreurs en douceur.<br>6. L'écran de restitution affiche les conseils, la note formative d'encouragement et le corrigé modèle décomposé. |
| **Scénarios d'exception** | **3.a. L'élève a laissé le champ vide ou a écrit un aveu de blocage (« jsp », « je sais pas », « aide ») :**<br>— Le système intercepte immédiatement le blocage sans sanction humiliante.<br>— Le statut « À consolider avec aide » est affecté avec des mots d'encouragement valorisant la démarche.<br>— Le Tuteur IA fournit immédiatement un premier indice simplifié et la méthode pas-à-pas pour débloquer l'enfant et l'inviter à réessayer. |

**Tableau 2.2 : Description textuelle du cas d'utilisation « Générer un nouvel exercice sur mesure »**

| Rubrique | Description |
| :--- | :--- |
| **Cas d'Utilisation N°** | CU-02 |
| **Nom du Cas** | Génération dynamique d'un exercice scolaire par l'IA |
| **Acteur(s)** | Élève, Tuteur IA |
| **Objectif** | Générer un énoncé inédit adapté à l'âge et au cycle de l'élève (Primaire ou Collège) avec indices et corrigé détaillé. |
| **Pré-conditions** | L'élève clique sur « Créer un nouvel exercice avec mon Tuteur IA ». |
| **Post-conditions** | Le nouvel exercice adapté est ajouté à la liste active de la matière sélectionnée. |
| **Scénario nominal** | 1. L'élève ou son parent choisit une notion scolaire (ex : calcul mental, homophones, cycle de l'eau).<br>2. L'élève sélectionne son niveau d'aisance (Découverte, Entraînement, Défi).<br>3. L'élève confirme sa demande.<br>4. Le Tuteur IA conçoit un énoncé vivant avec des exemples adaptés aux 6-15 ans, structure les questions et rédige le corrigé pas-à-pas.<br>5. L'exercice apparaît dans l'espace de résolution, prêt à être exploré. |
| **Scénarios d'exception** | **4.a. Dépassent de délai de réponse du moteur local :**<br>— Le système active le générateur procédural certifié.<br>— Un exercice scolaire conforme au niveau sélectionné est immédiatement délivré. |

**Tableau 2.3 : Description textuelle du cas d'utilisation « Passer le test diagnostique initial »**

| Rubrique | Description |
| :--- | :--- |
| **Cas d'Utilisation N°** | CU-03 |
| **Nom du Cas** | Positionnement diagnostique bienveillant |
| **Acteur(s)** | Élève |
| **Objectif** | Découvrir le profil d'apprentissage de l'élève et ses besoins pour calibrer son parcours de remédiation sans lui faire peur. |
| **Pré-conditions** | L'élève réalise son premier parcours d'accueil ou demande à réajuster son profil. |
| **Post-conditions** | Un bilan valorisant ses forces et identifiant ses axes de progrès est dressé ; le palier de départ est fixé. |
| **Scénario nominal** | 1. L'élève accède au module de positionnement d'accueil.<br>2. Il répond à quelques questions courtes et ludiques dans les matières clés.<br>3. Le système identifie ses acquis et ses fragilités de départ.<br>4. L'algorithme propose un palier initial adapté (Palier 1, 2 ou 3).<br>5. Le profil est mis à jour et l'élève est accueilli sur son tableau de bord personnalisé. |

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de cas d'utilisation détaillé du module      |
| d'entraînement et d'évaluation, montrant les relations d'inclusion   |
| (<<include>>) pour l'analyse de complétude et d'extension (<<extend>>)|
| pour la remédiation et la consultation des indices.                 |
+----------------------------------------------------------------------+
Figure 2.2 : Diagramme de cas d'utilisation détaillé du module d'entraînement et d'évaluation
```

## 2.6. Conclusion
Ce deuxième chapitre a permis d'établir avec exhaustivité l'ensemble des spécifications fonctionnelles et non fonctionnelles régissant la plateforme TutorAI. La modélisation des acteurs et des cas d'utilisation a mis en exergue l'importance de l'évaluation rigoureuse et du traitement algorithmique des non-réponses. Fort de cette grille d'exigences clarifiée, le chapitre suivant aborde la conception architecturale et conceptuelle du système.

---

# Chapitre 3 — Conception du système

## 3.1. Introduction
Alors que l'étape de spécification définissait le périmètre de « ce que doit faire » le système, la phase de conception s'attache à formaliser rigoureusement « comment le réaliser ». Ce troisième chapitre détaille les fondements architecturaux et conceptuels de la plateforme TutorAI. Nous présenterons en premier lieu la modélisation dynamique qui décrit la dimension temporelle et comportementale des échanges logiciels. En second lieu, nous exposerons la modélisation statique comprenant le modèle structurel objet, les règles de dérivation relationnelle, le schéma de base de données et le dictionnaire de données. Enfin, nous expliciterons l'architecture technique 3-Tiers ainsi que l'infrastructure de déploiement conteneurisée.

## 3.2. Modélisation dynamique du système
La modélisation dynamique illustre la collaboration des composants logiciels au fil du temps en réaction aux stimuli des utilisateurs.

### 3.2.1. Diagrammes de séquences système
Les diagrammes de séquences mettent en évidence la chronologie des messages échangés entre les lignes de vie (*lifelines*). Nous exploitons les fragments d'interaction structurés de la norme UML 2 :
— **Fragment `alt` (alternative) :** modélise les bifurcations logiques mutuellement exclusives (condition *if-then-else*).  
— **Fragment `opt` (optionnel) :** isole un bloc de traitement exécuté uniquement sous réserve d'une condition préalable.  
— **Fragment `loop` (boucle) :** réitère une suite d'échanges tant qu'un prédicat demeure vérifié.

#### Diagramme de séquences de l'authentification
La figure 3.1 retrace le processus de connexion d'un étudiant avec contrôle cryptographique du mot de passe et génération d'un jeton JWT.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de séquences UML2 du processus               |
| d'authentification comprenant les lignes de vie Étudiant,            |
| AuthComponent (UI), AuthController (API) et Base MySQL, avec le      |
| fragment alt modélisant les branches [Hash BCrypt valide -> 200 OK + |
| Token JWT] et [Identifiants invalides -> 401 Unauthorized].          |
+----------------------------------------------------------------------+
Figure 3.1 : Diagramme de séquences UML2 du processus d'authentification sécurisée
```

#### Diagramme de séquences de l'évaluation rigoureuse d'un exercice
La figure 3.2 modélise l'enchaînement des requêtes lors de la correction d'une production d'étudiant, matérialisant la détection algorithmique des mentions évasives (« jsp ») pour court-circuiter le modèle de langage et attribuer immédiatement la note de 0/100.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de séquences UML2 de l'évaluation d'un       |
| exercice entre Étudiant, ExercisesComponent, AiLearningRoutes,       |
| AiQuizExerciseService et Ollama (Llama 3.2), incluant le fragment   |
| alt [isNonAnswer == true -> court-circuit, note 0/100, corrigé type] |
| et [réponse rédigée -> inférence LLM locale, calcul pondéré].        |
+----------------------------------------------------------------------+
Figure 3.2 : Diagramme de séquences UML2 de l'évaluation rigoureuse d'un exercice pratique avec le Tuteur IA
```

### 3.2.2. Diagrammes de collaboration
Le diagramme de collaboration (ou diagramme de communication) met l'accent sur l'organisation structurelle des entités logicielles et l'ordonnancement numéroté des messages qui transitent entre elles. Dans TutorAI, l'orchestrateur pédagogique `AiLearningService` coordonne les appels vers le gestionnaire d'état de session, le client HTTP et les modules de persistance locale.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de collaboration UML représentant les liens   |
| et messages numérotés entre ExercisesComponent, AiLearningService,   |
| SessionService, LocalStorageService et le serveur backend Express.   |
+----------------------------------------------------------------------+
Figure 3.3 : Diagramme de collaboration entre les services du sous-système de tutorat
```

### 3.2.3. Diagramme d'états-transitions
Le cycle de vie d'un exercice pratique au cours de la session d'un apprenant obéit à l'automate à états finis représenté sur la figure 3.4. Les états successifs sont : *Non commencé*, *En cours de rédaction*, *En cours d'évaluation*, *Validé (Score >= 50)* ou *Non validé (Score < 50 ou mention « jsp »)*, avec possibilité de réinitialiser la tentative.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme d'états-transitions UML illustrant le cycle  |
| de vie d'un exercice pratique : état initial, Non commencé, En cours |
| de rédaction (avec auto-save), En cours d'évaluation, Validé         |
| (crédit XP), Non validé (réessai possible) et état final.            |
+----------------------------------------------------------------------+
Figure 3.4 : Diagramme d'états-transitions du cycle de vie d'un exercice pratique
```

### 3.2.4. Diagramme d'activités
La figure 3.5 détaille le flot de contrôle algorithmique activé lors de la soumission d'une réponse. L'embranchement décisionnel permet d'isoler immédiatement les copies non traitées pour leur attribuer la note plancher sans surcharger le moteur d'inférence.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme d'activités UML du processus d'évaluation    |
| montrant la collecte des champs de réponse, le test de vacuité/jsp,  |
| la branche sanction directe (0/100 + corrigé officiel) et la branche |
| prompt strict avec inférence LLM et agrégation de la moyenne.        |
+----------------------------------------------------------------------+
Figure 3.5 : Diagramme d'activités de l'évaluation adaptative et de l'interception des non-réponses
```

## 3.3. Modélisation statique du système
La modélisation statique spécifie l'organisation structurelle des données métier et leurs relations d'intégrité référentielle.

### 3.3.1. Diagramme de classes métier
Le diagramme de classes de la figure 3.6 modélise les entités fondamentales du système TutorAI : `Student`, `LearningProfile`, `SubjectProgress`, `QuizSession`, `ExerciseItem` et `EvaluationResult`.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de classes UML montrant les classes métier,  |
| leurs attributs typés, leurs méthodes publiques et privées, ainsi    |
| que leurs multiplicités et relations d'association et de composition|
| (Student 1 -- 1 LearningProfile, Student 1 -- * SubjectProgress, etc.)|
+----------------------------------------------------------------------+
Figure 3.6 : Diagramme de classes métier du domaine TutorAI
```

### 3.3.2. Règles formelles de passage au modèle relationnel
La dérivation du diagramme de classes vers le Modèle Logique de Données (MLD) obéit aux règles de transformation standardisées :
1. **Transformation des classes :** Toute classe d'entité devient une table (relation) dans le schéma relationnel, et ses attributs deviennent les colonnes de cette table.
2. **Identification des clés primaires :** L'identifiant unique de la classe devient la clé primaire soulignée (\underline{clé}) de la relation.
3. **Traduction des associations binaires 1-à-Plusieurs ($1..*$) :** La clé primaire de la table située du côté de la cardinalité 1 migre en tant que clé étrangère précédée d'un dièse (\#clé) dans la table du côté de la cardinalité $N$.
4. **Normalisation :** L'ensemble des relations est conçu pour respecter les critères de la Troisième Forme Normale (3FN), garantissant l'absence de redondances transitives et l'atomicité de chaque attribut.

### 3.3.3. Modèle Logique de Données (MLD) en 3FN
Le schéma relationnel obtenu après normalisation s'énonce comme suit :
— **STUDENTS** (\underline{id}, email, password_hash, first_name, education_level, created_at)  
— **LEARNING_PROFILES** (\underline{id}, \#student_id, current_subject, total_xp, learning_preferences, updated_at)  
— **SUBJECT_PROGRESS** (\underline{id}, \#student_id, subject, quizzes_completed, exercises_completed, average_score, adaptive_difficulty, level_index, updated_at)  
— **DIAGNOSTIC_RESULTS** (\underline{id}, \#student_id, score, strengths, weaknesses, created_at)  
— **SAVED_EXERCISES** (\underline{id}, \#student_id, subject, exercise_data, completed, score, created_at)  

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Schéma physique et relationnel (MLD) de la base de     |
| données MySQL matérialisant les clés primaires soulignées, les clés  |
| étrangères et les liaisons d'intégrité référentielle entre tables.   |
+----------------------------------------------------------------------+
Figure 3.7 : Schéma physique et relationnel de la base de données (MLD)
```

### 3.3.4. Dictionnaire de données
Le tableau 3.1 recense de manière exhaustive les colonnes de la base de données, leurs types de données, tailles, contraintes de nullité, valeurs par défaut et affectations de clés.

**Tableau 3.1 : Dictionnaire de données du système TutorAI**

| Nom colonne | Type | Taille | Oblig. | Défaut | Valeurs autorisées | Clé P. | Clé É. | Table |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| `id` | VARCHAR | 36 | Oui | UUID() | Format UUID v4 alphanumérique | Oui | Non | students |
| `email` | VARCHAR | 255 | Oui | NULL | Chaîne format email valide | Non | Non | students |
| `password_hash` | VARCHAR | 255 | Oui | NULL | Chaîne de 60 caractères (BCrypt) | Non | Non | students |
| `first_name` | VARCHAR | 100 | Non | NULL | Lettres alphabétiques | Non | Non | students |
| `education_level` | VARCHAR | 100 | Non | Collège | Primaire (1ère-6ème AP), Collège (1ère-3ème AC) | Non | Non | students |
| `created_at` | DATETIME | — | Oui | NOW() | Timestamp d'insertion | Non | Non | students |
| `id` | VARCHAR | 36 | Oui | UUID() | Format UUID v4 | Oui | Non | learning_profiles |
| `student_id` | VARCHAR | 36 | Oui | NULL | Référence à `students.id` | Non | Oui | learning_profiles |
| `current_subject` | VARCHAR | 100 | Oui | 'General' | Matière académique active | Non | Non | learning_profiles |
| `total_xp` | INT | — | Oui | 0 | Entier positif >= 0 | Non | Non | learning_profiles |
| `updated_at` | DATETIME | — | Oui | NOW() | Timestamp de mise à jour | Non | Non | learning_profiles |
| `id` | VARCHAR | 36 | Oui | UUID() | Format UUID v4 | Oui | Non | subject_progress |
| `student_id` | VARCHAR | 36 | Oui | NULL | Référence à `students.id` | Non | Oui | subject_progress |
| `subject` | VARCHAR | 100 | Oui | NULL | Intitulé de la matière | Non | Non | subject_progress |
| `quizzes_completed`| INT | — | Oui | 0 | Entier positif >= 0 | Non | Non | subject_progress |
| `exercises_completed`| INT | — | Oui | 0 | Entier positif >= 0 | Non | Non | subject_progress |
| `average_score` | DECIMAL | 5,2 | Oui | 0.00 | Valeur décimale dans [0.00 ; 100.00] | Non | Non | subject_progress |
| `adaptive_difficulty`| VARCHAR | 50 | Oui | Débutant | 'Débutant', 'Intermédiaire', 'Avancé'| Non | Non | subject_progress |
| `level_index` | INT | — | Oui | 1 | Entier valant 1, 2 ou 3 | Non | Non | subject_progress |

## 3.4. Architecture globale du système
### 3.4.1. Architecture logicielle 3-Tiers
L'architecture de TutorAI est construite selon le modèle en trois couches indépendantes (**3-Tiers**) :
— **Couche Présentation (Tier 1 - Front-End) :** Application monopage développée sous Angular 16. Elle gère le rendu dynamique du DOM, la capture des événements utilisateurs, la réactivité via les flux RxJS et la gestion des sessions locales.  
— **Couche Métier et Services (Tier 2 - Back-End) :** Serveur d'application Node.js s'appuyant sur le framework Express 5. Il héberge les contrôleurs REST, les validateurs de requêtes, le service d'interception stricte des non-réponses et l'orchestration des appels vers le moteur IA.  
— **Couche Données et Inférence (Tier 3 - SGBD & LLM) :** Composée du serveur relationnel MySQL 8.0 pour la persistance transactionnelle des états et du démon Ollama hébergeant Llama 3.2 pour l'inférence générative locale.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de composants UML illustrant l'architecture  |
| 3-Tiers : Couche Présentation (Composants Standalone Angular 16),    |
| Couche Métier (API REST Express 5, Services d'évaluation) et Couche  |
| Données (Base MySQL 8.0 et Moteur d'Inférence IA Ollama Llama 3.2).  |
+----------------------------------------------------------------------+
Figure 3.8 : Diagramme de composants de l'architecture logicielle 3-Tiers
```

### 3.4.2. Architecture matérielle et diagramme de déploiement
La figure 3.9 expose le diagramme de déploiement physique précisant les nœuds matériels, les conteneurs logiciels et les canaux de communication inter-réseaux.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Diagramme de déploiement matériel et réseau montrant   |
| le nœud Navigateur Client communiquant en HTTPS avec le Serveur      |
| Applicatif Node.js, relié par socket TCP/IP 3306 au SGBD MySQL et    |
| par socket HTTP 11434 au conteneur du Moteur d'Inférence IA Ollama.  |
+----------------------------------------------------------------------+
Figure 3.9 : Diagramme de déploiement matériel et réseau de la plateforme
```

## 3.5. Conclusion
Au terme de ce troisième chapitre, la conception architecturale, dynamique et statique de la plateforme TutorAI a été entièrement consolidée. Les diagrammes de séquences UML2 ont notamment permis de formaliser les mécanismes de détection stricte des non-réponses. Grâce à un schéma relationnel normalisé en 3FN et à une architecture 3-Tiers découplée, le système est prêt pour sa concrétisation technique, présentée dans le chapitre suivant.

---

# Chapitre 4 — Réalisation du système

## 4.1. Introduction
La phase de réalisation constitue l'aboutissement pratique des étapes antérieures d'analyse et de conception. Ce quatrième chapitre documente l'implémentation effective de la plateforme TutorAI. Dans un premier temps, nous décrivons les configurations matérielles et logicielles mobilisées pour orchestrer l'environnement d'exécution et d'inférence. Dans un deuxième temps, nous passons en revue les interfaces graphiques phares développées sous Angular 16, en explicitant le parcours utilisateur complet de l'apprenant. Enfin, nous dressons le bilan des tests de recette fonctionnelle validant la conformité du système aux exigences de départ.

## 4.2. Environnement de développement et outillage
### 4.2.1. Environnement matériel
L'entraînement et l'inférence des modèles de langage en local imposent des contraintes matérielles substantielles. Notre banc de développement disposait des spécifications suivantes :
— **Processeur (CPU) :** AMD Ryzen 7 / Intel Core i7 8 cœurs / 16 threads cadencé à 3.8 GHz.  
— **Mémoire vive (RAM) :** 32 Go DDR4 à 3200 MHz, indispensable pour charger en mémoire le modèle Llama 3.2 quantifié tout en maintenant l'exécution conjointe des serveurs Node.js et Angular CLI.  
— **Stockage secondaire :** Disque SSD NVMe M.2 de 1 To offrant des débits séquentiels de lecture supérieurs à 3500 Mo/s, réduisant à moins de 2 secondes le chargement des poids du modèle.  
— **Accélération graphique :** Carte graphique dédiée assurant l'accélération matricielle lors des passes d'inférence sous Ollama.

### 4.2.2. Environnement logiciel et technologies retenues
La stack technologique a été sélectionnée pour sa fiabilité industrielle, sa modernité et ses performances :
— **Front-End :** Framework **Angular 16** fondé sur TypeScript 5.1. Nous avons tiré parti des *Standalone Components* pour alléger la structure de modules, d'Angular Material pour les icônes vectorielles et de feuilles de style SCSS modulaires garantissant un design moderne sans dépendances excessives.  
— **Back-End :** Runtime **Node.js 20 LTS** couplé au framework **Express 5**. Le routage asynchrone permet une gestion fluide des requêtes entrantes, tandis que la bibliothèque **mysql2** avec pool de connexions optimise les échanges avec la base de données.  
— **Moteur d'IA Locale :** Démon **Ollama** exécutant le modèle **Llama 3.2 (format quantifié 4-bit GGUF)**. Cette configuration offre une inférence ultra-rapide tout en préservant l'intégrité et la confidentialité des productions des apprenants.  
— **Persistance et Conteneurisation :** Système de gestion de base de données relationnelle **MySQL 8.0** orchestré sous conteneur Docker via **Docker Compose**.  
— **Génération documentaire :** Bibliothèque **PDFKit** pour la synthèse et l'exportation vectorielle en streaming de fiches de révision académiques.  
— **Outillage d'ingénierie :** IDE Visual Studio Code, gestionnaire de versions Git, et client Postman pour le profilage et le test unitaire des API REST.

## 4.3. Réalisation et présentation des interfaces graphiques
Chaque interface est présentée ci-dessous puis assortie d'un commentaire analytique approfondi.

### 4.3.1. Module d'accès et authentification
La figure 4.1 montre l'interface d'authentification et de création de compte de la plateforme.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran de l'interface d'authentification et   |
| d'inscription présentant le formulaire moderne avec validation en    |
| temps réel des champs email, mot de passe, niveau d'études et bouton |
| de soumission sécurisé.                                              |
+----------------------------------------------------------------------+
Figure 4.1 : Interface de connexion et d'inscription sécurisée
```

*Commentaire analytique :* Cette interface épurée met en œuvre une validation réactive des entrées en amont de toute transmission réseau. Dès la soumission, un jeton chiffré JWT est généré et conservé dans la session de l'étudiant, autorisant l'accès transparent aux modules pédagogiques réservés.

### 4.3.2. Tableau de bord apprenant et suivi des compétences
La figure 4.2 présente l'écran d'accueil personnalisé de l'apprenant après connexion.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran du tableau de bord de l'apprenant      |
| affichant le bandeau d'accueil, le compteur de points d'expérience   |
| (XP), le palier adaptatif actif (Palier 2 : Intermédiaire), le       |
| sélecteur de disciplines et le bouton héroïque de génération IA.     |
+----------------------------------------------------------------------+
Figure 4.2 : Tableau de bord de l'apprenant avec indicateurs de progression adaptative
```

*Commentaire analytique :* Le tableau de bord offre une synthèse ergonomique des acquis de l'étudiant. Il met en exergue sa progression globale par discipline, son palier adaptatif calculé dynamiquement ainsi que son solde de points d'expérience (XP). Un sélecteur horizontal permet de basculer instantanément d'une discipline à une autre (Microbiologie, Droit pénal, Pharmacologie, Langue arabe, Mathématiques), tandis qu'un bouton héroïque permet d'ouvrir à tout moment la modale de génération d'exercices personnalisés.

### 4.3.3. Espace de test diagnostique initial
La figure 4.3 illustre la vue de passation du questionnaire diagnostique de positionnement.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran du test diagnostique initial composé de |
| questions d'évaluation ciblées avec jauges d'estimation des forces et |
| faiblesses cognitives de l'étudiant.                                 |
+----------------------------------------------------------------------+
Figure 4.3 : Interface du test diagnostique initial de positionnement des compétences
```

*Commentaire analytique :* Ce composant permet de sonder les connaissances préalables de l'étudiant à travers des questions conceptuelles ciblées. Les résultats obtenus alimentent l'algorithme adaptatif afin d'attribuer d'emblée à l'étudiant le palier d'apprentissage correspondant exactement à ses besoins réels.

### 4.3.4. Module d'entraînement par quiz interactif
La figure 4.4 expose l'interface d'un quiz interactif calibré selon le niveau de l'étudiant.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran d'une session de quiz adaptatif        |
| montrant la question chronométrée, les options de réponses à choix   |
| unique, et le bandeau d'explication conceptuelle affiché dès la      |
| sélection d'une proposition.                                         |
+----------------------------------------------------------------------+
Figure 4.4 : Interface de passation d'un quiz interactif avec rétroaction immédiate
```

*Commentaire analytique :* Le module de quiz offre une interactivité temps réel. Dès la validation d'une option, l'étudiant bénéficie d'une explication conceptuelle immédiate indiquant le fondement théorique de la réponse attendue, favorisant un ancrage mémoriel rapide.

### 4.3.5. Espace de résolution et de saisie d'un exercice pratique
La figure 4.5 présente l'environnement de résolution d'un cas pratique structuré.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran de l'espace de résolution d'exercice   |
| comprenant le texte de mise en situation, les questions ordonnées,   |
| les indices dépliables, la zone d'édition avec indicateur            |
| d'auto-sauvegarde et les boutons d'action d'évaluation.              |
+----------------------------------------------------------------------+
Figure 4.5 : Espace de travail et éditeur de réponse à un exercice pratique
```

*Commentaire analytique :* Cet espace compartimente clairement la situation-problème, les questions ordonnées et le champ de réponse de l'étudiant. Un module d'arrière-plan surveille en temps réel la frappe pour sauvegarder automatiquement les brouillons dans le stockage local du navigateur.

### 4.3.6. Bilan méthodologique et remédiation guidée bienveillante
La figure 4.6 illustre la carte de restitution consécutive à une soumission où l'enfant exprime un blocage ou une mention évasive (« jsp »).

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran de la carte de remédiation bienveillante|
| affichant le statut 'À consolider avec aide' (Badge ambre stimulant), |
| des mots d'encouragement valorisant l'effort, le premier indice       |
| décompressé et la méthode de résolution pas-à-pas.                   |
+----------------------------------------------------------------------+
Figure 4.6 : Restitution bienveillante avec statut 'À consolider avec aide' et remédiation pas-à-pas
```

*Commentaire analytique :* Cette interface incarne la posture pédagogique positive de TutorAI. Loin d'infliger un zéro humiliant qui aggraverait l'anxiété de l'enfant, l'application détecte le désarroi (« jsp ») pour activer un guidage bienveillant (« À consolider avec aide »), tout en fournissant immédiatement une analogie simple et des indices pas-à-pas afin que l'élève puisse comprendre le cheminement et retenter l'exercice en toute confiance.

### 4.3.7. Modale de génération de cas pratiques par le Tuteur IA
La figure 4.7 présente la fenêtre modale permettant de commander un exercice sur-mesure au modèle de langage local.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran de la modale de génération paramétrée  |
| comprenant le champ de saisie du mot-clé thématique, le sélecteur de |
| palier de difficulté (Débutant, Intermédiaire, Avancé) et le bouton  |
| d'action de synthèse par le Tuteur IA.                               |
+----------------------------------------------------------------------+
Figure 4.7 : Modale de génération paramétrée d'un nouveau cas pratique par le Tuteur IA
```

*Commentaire analytique :* Grâce à ce formulaire modal, l'élève ou son parent personnalise sa séance de révision en orientant le modèle Llama 3.2 vers des notions précises. Le générateur crée en quelques secondes un énoncé cohérent, des questions graduées et une solution complète.

### 4.3.8. Module de téléchargement et d'exportation PDF
La figure 4.8 montre l'écran de consultation et de téléchargement de fiches de cours PDF.

```
+----------------------------------------------------------------------+
| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D'ÉCRAN] |
| Description : Capture d'écran du module d'exportation PDF affichant   |
| la liste des synthèses de cours disponibles et le déclenchement du   |
| téléchargement vectoriel généré dynamiquement par le service PDFKit. |
+----------------------------------------------------------------------+
Figure 4.8 : Interface de téléchargement et aperçu d'une fiche de cours vectorielle PDF
```

*Commentaire analytique :* Ce composant permet à l'apprenant d'exporter hors-ligne des documents de révision soignés générés en streaming par le serveur Express via la bibliothèque PDFKit.

## 4.4. Tests de validation et recette fonctionnelle
Afin de garantir la conformité logicielle du système avant son déploiement, une batterie exhaustive de tests de recette a été exécutée. Le tableau 4.1 synthétise les cas de tests représentatifs.

**Tableau 4.1 : Matrice de recette et validation des cas de tests fonctionnels**

| Identifiant | Cas de test vérifié | Données d'entrée | Comportement attendu | Résultat constaté | Statut |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TEST-01** | Authentification valide | Identifiant et mot de passe corrects | Émission du jeton JWT et redirection vers `/dashboard` | Token délivré, redirection immédiate | **CONFORME** |
| **TEST-02** | Authentification erronée | Mot de passe erroné | Refus HTTP 401 et affichage d'un message d'alerte | Alerte affichée, session bloquée | **CONFORME** |
| **TEST-03** | Traitement bienveillant blocage | Saisie de « jsp » dans la question 1 | Détection du blocage, statut « À consolider », indice affiché | Statut remédiation activé sans appel LLM inutile | **CONFORME** |
| **TEST-04** | Évaluation réponse rédigée | Résolution problème de fractions / accord sujet-verbe | Inférence LLM, note formative d'encouragement et conseils | Score formateur et feedback encourageant délivré | **CONFORME** |
| **TEST-05** | Génération exercice IA | Thème 'Fractions simples' niveau Primaire | Création d'un énoncé complet avec questions et corrigé adapté | Exercice inédit généré en 2.4s | **CONFORME** |
| **TEST-06** | Export fiche cours PDF | Clic sur téléchargement Fiche Maths / Fractions | Streaming du document PDF vectoriel de 2 pages | Fichier PDF téléchargé et lisible | **CONFORME** |
| **TEST-07** | Bascule adaptative | Réussite de 3 exercices guidés avec score >= 80% | Promotion automatique au Palier supérieur (Entraînement) | Palier 2 activé, XP et badges crédités | **CONFORME** |

## 4.5. Conclusion
Ce quatrième chapitre a démontré la concrétisation technique rigoureuse de la plateforme TutorAI. L'environnement matériel et logiciel a permis de déployer un modèle de langage performant en local tout en garantissant des temps de réponse rapides. Les interfaces graphiques développées conjuguent modernité ergonomique et bienveillance pédagogique adaptée aux jeunes apprenants, comme l'attestent les résultats exemplaires de la recette fonctionnelle.

---

# Conclusion générale

Le stage de fin d'année que nous avons effectué du 1er juillet au 1er août 2026 au sein de la société **UQASE NEXT SARL** à Casablanca a constitué une étape charnière et hautement formatrice dans notre parcours d'élève-ingénieur en Ingénierie Informatique et Réseaux à l'École Marocaine des Sciences de l'Ingénieur (EMSI). Cette immersion professionnelle nous a offert l'opportunité de mettre en pratique l'ensemble des compétences architecturales, logicielles et algorithmiques acquises durant notre formation, en les mettant au service d'une cause à fort impact éducatif et social : l'aide aux **élèves de 6 à 15 ans en difficulté scolaire**.

Face aux limites des outils d'e-learning conventionnels, nous avons conçu et réalisé la plateforme **TutorAI**. Ce système se singularise par son architecture 3-Tiers réactive (Angular 16, Node.js/Express, MySQL) et son moteur d'inférence d'IA locale sous Ollama (Llama 3.2). En privilégiant le questionnement socratique, la décomposition des consignes et la valorisation systématique des progrès, la plateforme transforme le moment critique des devoirs à la maison en une expérience stimulante et déculpabilisante. L'interception empathique des aveux de blocage (« jsp ») pour engager une remédiation pas-à-pas, conjuguée au respect absolu de la vie privée des mineurs grâce au traitement en vase clos des données, apporte une réponse concrète aux défis de l'inclusion scolaire.

Sur le plan méthodologique, la pratique de la démarche Agile Scrum sous la direction bienveillante de notre encadrante professionnelle, **Madame Aïcha FADLI**, Responsable Digitale, nous a permis de structurer nos livrables en Sprints équilibrés et de surmonter avec succès les contraintes techniques liées à l'optimisation des temps d'inférence en environnement contraint.

Avec un regard critique et constructif, nous identifions plusieurs pistes d'évolution stimulantes :  
1. **Module d'accessibilité DYS et vocalisation :** Intégrer des polices adaptées aux enfants dyslexiques (OpenDyslexic) et des synthèses/reconnaissances vocales (Whisper / Bark) pour assister les élèves non-lecteurs ou dyspraxiques.  
2. **Couche RAG alignée sur le cursus national :** Connecter une base vectorielle locale indexant les manuels scolaires officiels du Ministère de l'Éducation Nationale du Maroc pour calibrer étroitement les exercices aux programmes en vigueur.  
3. **Tableau de bord de co-éducation pour les parents :** Offrir aux familles un espace de suivi valorisant les efforts fournis par l'enfant, avec des conseils de pédagogie positive pour prolonger le soutien à la maison.

En définitive, ce projet de fin d'année conforte notre passion d'ingénieur pour les technologies émergentes et témoigne de notre volonté de concevoir des solutions numériques utiles, éthiques et inclusives.

---

# Bibliographie et Nétographie

## Bibliographie
1. **ROQUES, Pascal.** *UML 2 par la pratique : Études de cas et exercices corrigés*. 5ème édition. Paris : Éditions Eyrolles, 2006. 380 pages. ISBN : 978-2212120141.  
2. **AUDIBERT, Laurent.** *UML 2 : De l'apprentissage à la pratique*. Paris : Éditions Ellipses, 2009. 288 pages. ISBN : 978-2729852696.  
3. **GAMMA, Erich, HELM, Richard, JOHNSON, Ralph, et VLISSIDES, John.** *Design Patterns : Catalogue de modèles de conception réutilisables*. Paris : Vuibert, 1999. 496 pages. ISBN : 978-2711786442.  
4. **CHACON, Scott, et STRAUB, Ben.** *Pro Git*. 2ème édition. New York : Apress, 2014. 456 pages. ISBN : 978-1484200773.  

## Nétographie
1. **Angular Documentation officielle :** *Angular Standalone Components and Reactive Forms Guide*. Disponible sur : <https://angular.io/docs> (consulté en mai 2024).  
2. **Node.js Documentation officielle :** *Node.js v20.x Runtime API and Event Loop Architecture*. Disponible sur : <https://nodejs.org/en/docs/> (consulté en avril 2024).  
3. **Ollama Project :** *Local Large Language Models Deployment and API Reference*. Disponible sur : <https://ollama.ai/> (consulté en mars 2024).  
4. **Express.js Guide :** *Express Routing, Middleware and Error Handling Specification*. Disponible sur : <https://expressjs.com/> (consulté en mars 2024).  
5. **UML Diagrams Reference :** *Unified Modeling Language 2.5 Specification Guidelines*. Disponible sur : <https://www.uml-diagrams.org/> (consulté en février 2024).  

---

# Annexes

## Annexe A : Extraits d'algorithmes et de code source représentatifs

### Fonction algorithmique d'interception des non-réponses et mentions évasives
Le module ci-dessous, extrait de `ai-quiz-exercise.service.js`, neutralise les comportements de désinvolture ou d'abandon (« jsp », « je ne sais pas », « rien ») pour empêcher toute complaisance de l'IA :

```javascript
/**
 * Détecte si la réponse saisie par l'étudiant constitue une non-réponse
 * ou un aveu d'incompréhension devant être sanctionné par 0/100.
 * @param {string} text - Contenu brut saisi par l'apprenant
 * @returns {boolean} - Vrai si non-réponse avérée, faux sinon
 */
function isNonAnswer(text) {
  if (!text) return true;
  const raw = String(text).trim();
  if (raw.length === 0) return true;

  // Normalisation des accents et de la ponctuation
  const clean = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"«»\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean.length === 0) return true;

  const nonAnswerExact = new Set([
    'jsp', 'jsais pas', 'j sais pas', 'je sais pas', 'je ne sais pas', 'sais pas',
    'chepa', 'che pas', 'chpa', 'idk', 'i dont know', 'dont know',
    'rien', 'rien du tout', 'aucun', 'aucune', 'aucune idee', 'pas compris',
    'aide moi', 'help', 'sos', 'bloque', 'bof', 'non', 'null', 'vide', 'test'
  ]);

  if (nonAnswerExact.has(clean)) return true;
  if (/^(.)\1*$/.test(clean) && clean.length < 15) return true;
  if (/^(jsp|idk|rien|aide)\b/i.test(clean) && clean.length <= 15) return true;
  if (/^je\s*(ne\s*)?sais\s*pas/i.test(clean) && clean.length <= 25) return true;

  return false;
}
```

## Annexe B : Configuration Docker Compose pour le déploiement conteneurisé

Le fichier `docker-compose.yml` suivant orchestre conjointement le serveur de données relationnelles MySQL et le démon d'inférence Ollama :

```yaml
version: '3.8'

services:
  database:
    image: mysql:8.0
    container_name: tutorai-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_secure_password
      MYSQL_DATABASE: tutorai
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  ollama-engine:
    image: ollama/ollama:latest
    container_name: tutorai-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

volumes:
  mysql_data:
  ollama_models:
```
