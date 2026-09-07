import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import {
  AgeGroup, AnyEducationLevel, DiagnosticResult,
  getSchoolCategory, getEducationLevelsForAge, getStudyYearsForAge,
  isAgeEducationLevelValid, OnboardingProfileInput
} from '../../core/models/user-profile.model';

interface DiagnosticQuestion {
  question: string;
  subject: string;
  options: string[];
  correctIndex: number;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  step = 0; // 0 = Bienvenue, 1 = Prénom, 2 = Âge, 3 = Niveau, 4 = Filière/Année, 5 = Matières, 6 = Objectifs, 7 = Difficultés, 8 = Préférences, 9 = Diagnostic, 10 = Bilan
  totalSteps = 10;

  // Step 1 : Prénom
  firstName = '';

  get hasFirstName(): boolean {
    return !!(this.firstName && this.firstName.trim().length >= 2);
  }

  get effectiveTotalSteps(): number {
    return this.hasFirstName ? 9 : 10;
  }

  get currentDisplayStep(): number {
    if (this.step === 0) return 0;
    if (this.hasFirstName) {
      return Math.max(1, this.step - 1);
    }
    return this.step;
  }

  // Step 2 : Âge
  age: number | null = null;

  // Step 3 : Niveau
  educationLevel: AnyEducationLevel | '' = '';
  
  get filteredEducationLevels(): AnyEducationLevel[] {
    return getEducationLevelsForAge(this.age);
  }

  get filteredStudyYears(): string[] {
    return getStudyYearsForAge(this.age);
  }

  // Step 4 : Filière / Branche / Établissement (système MAROCAIN)
  fieldOfStudy = '';
  studyYear = '';
  school = '';
  parcours = '';
  country = 'Maroc';
  language = 'Français';

  // Filières supérieures marocaines
  fields = [
    'Informatique & Génie logiciel',
    'Génie industriel & Électronique',
    'Génie civil & BTP',
    'Sciences mathématiques & Physiques',
    'Médecine & Pharmacie',
    'Économie & Gestion',
    'Marketing & Commerce',
    'Droit & Sciences politiques',
    'Lettres & Sciences humaines',
    'Architecture',
    'Agronomie',
    'Autre'
  ];

  // Branches du lycée qualifiant marocain (2ème Bac)
  branchesLyceeOptions: { [niveau: string]: string[] } = {
    'Tronc commun': ['Sciences', 'Lettres & Sciences humaines', 'Arts appliqués', 'Technologie'],
    '1ère année Bac': [
      'Sciences Mathématiques (SM)',
      'Sciences Physiques (SP)',
      'Sciences de la Vie et de la Terre (SVT)',
      'Sciences Économiques et Gestion (SEG)',
      'Lettres & Sciences Humaines (LSH)',
      'Arts appliqués'
    ],
    '2ème année Bac': [
      'Sciences Mathématiques A (SMA)',
      'Sciences Mathématiques B (SMB)',
      'Sciences Physiques-Chimie (SPC)',
      'Sciences de la Vie et de la Terre (SVT)',
      'Sciences Économiques et Gestion (SEG)',
      'Lettres & Sciences Humaines (LSH)',
      'Arts appliqués'
    ]
  };

  get parcoursOptions(): string[] {
    return this.branchesLyceeOptions[this.educationLevel] || [];
  }

  // Step 5 : Matières (NO DEFAULT!)
  selectedSubjects: string[] = [];

  // Step 6 : Objectifs
  selectedObjectives: string[] = [];
  allObjectives = [
    'Comprendre mes cours',
    'Rattraper un cours manqué',
    'Améliorer mes notes',
    'Préparer un examen',
    'Faire mes devoirs',
    'Combler mes lacunes',
    'Réviser',
    'Apprendre à mon rythme'
  ];

  // Step 7 : Difficultés
  selectedDifficulties: string[] = [];
  difficultyExplanation = '';
  allDifficulties = [
    'Je ne comprends pas certains cours',
    'J\'ai des lacunes',
    'J\'ai du mal à suivre le rythme',
    'J\'ai manqué des cours',
    'J\'ai du mal avec les exercices',
    'J\'ai du mal à mémoriser',
    'Je ne sais pas comment réviser',
    'Je manque de confiance',
    'Je ne sais pas exactement où est mon problème',
    'Autre'
  ];

  // Step 8 : Préférences
  selectedLearningStyles: string[] = [];
  allLearningStyles = [
    'Explications simples',
    'Explications détaillées',
    'Exemples',
    'Exercices',
    'Quiz',
    'Résumés',
    'Questions/réponses'
  ];
  studyTime = '';
  studyTimeOptions = ['Moins de 30 min', '30 min – 1 h', '1 – 2 h', 'Plus de 2 h'];

  // Step 9 : Diagnostic
  diagnosticQuestions: DiagnosticQuestion[] = [];
  diagnosticAnswers: (number | null)[] = [];
  diagnosticGenerated = false;

  // Step 10 : Bilan
  diagnosticResult: DiagnosticResult | null = null;

  constructor(
    private profileService: ProfileService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Initialiser le prénom depuis le compte authentifié (créé lors de l'inscription)
    const authUser = this.auth.currentUser;
    if (authUser?.firstName) {
      this.firstName = authUser.firstName;
    } else if (this.auth.name) {
      this.firstName = this.auth.name;
    }

    // 2. Récupérer le brouillon sauvegardé si existant
    const draft = this.profileService.getDraft();
    if (draft) {
      if (draft.firstName) this.firstName = draft.firstName;
      if (draft.age) this.age = draft.age;
      if (draft.educationLevel) this.educationLevel = draft.educationLevel;
      if (draft.fieldOfStudy) this.fieldOfStudy = draft.fieldOfStudy;
      if (draft.studyYear) this.studyYear = draft.studyYear;
      if (draft.school) this.school = draft.school;
      if (draft.subjects) this.selectedSubjects = draft.subjects;
      if (draft.objectives) this.selectedObjectives = draft.objectives;
      if (draft.difficulties) this.selectedDifficulties = draft.difficulties;
      if (draft.difficultyExplanation) this.difficultyExplanation = draft.difficultyExplanation;
      if (draft.learningStyles) this.selectedLearningStyles = draft.learningStyles;
      if (draft.studyTime) this.studyTime = draft.studyTime;
      if (typeof draft.currentStep === 'number') this.step = draft.currentStep;
    }

    // Si l'utilisateur a déjà un prénom et qu'il arrive directement sur l'étape 1, le passer directement à l'étape 2 (âge)
    if (this.step === 1 && this.hasFirstName) {
      this.step = 2;
    }
  }

  get schoolCategory(): 'primaire' | 'collège' | 'lycée' | 'supérieur' | 'unknown' {
    if (!this.educationLevel) return 'unknown';
    return getSchoolCategory(this.educationLevel);
  }

  get availableSubjects(): string[] {
    const cat = this.schoolCategory;
    const fieldLower = (this.fieldOfStudy || '').toLowerCase();
    const branche = (this.parcours || '').toLowerCase();

    // ─── Primaire (système marocain) ────────────────────────────────
    if (cat === 'primaire') {
      return ['Mathématiques', 'Langue arabe', 'Langue française', 'Éducation islamique', 'Éveil scientifique', 'Géographie & Histoire', 'Éducation physique'];
    }

    // ─── Collège (système marocain) ─────────────────────────────────
    if (cat === 'collège') {
      return ['Mathématiques', 'Physique-Chimie', 'Sciences de la vie et de la Terre (SVT)', 'Langue arabe', 'Langue française', 'Anglais', 'Histoire-Géographie', 'Éducation islamique', 'Informatique'];
    }

    // ─── Lycée qualifiant (système marocain) ─────────────────────────
    if (cat === 'lycée') {
      // Sciences maths / physiques
      if (branche.includes('mathématiques') || branche.includes('physiques') || branche.includes('sma') || branche.includes('smb') || branche.includes('spc')) {
        return ['Mathématiques', 'Physique-Chimie', 'Sciences de la vie et de la Terre (SVT)', 'Informatique & algorithmique', 'Anglais', 'Langue française', 'Langue arabe'];
      }
      // SVT
      if (branche.includes('svt') || branche.includes('vie')) {
        return ['Sciences de la vie et de la Terre (SVT)', 'Physique-Chimie', 'Mathématiques', 'Anglais', 'Langue française', 'Langue arabe'];
      }
      // SEG
      if (branche.includes('économique') || branche.includes('gestion') || branche.includes('seg')) {
        return ['Économie générale', 'Mathématiques', 'Gestion comptable', 'Histoire-Géographie', 'Anglais', 'Langue française', 'Langue arabe'];
      }
      // LSH
      if (branche.includes('lettres') || branche.includes('humaines') || branche.includes('lsh')) {
        return ['Langue arabe', 'Langue française', 'Philosophie', 'Histoire-Géographie', 'Anglais', 'Éducation islamique'];
      }
      // Tronc commun général
      return ['Mathématiques', 'Physique-Chimie', 'Sciences de la vie et de la Terre', 'Langue arabe', 'Langue française', 'Anglais', 'Histoire-Géographie', 'Informatique'];
    }

    // ─── Supérieur (système marocain) ────────────────────────────────
    if (cat === 'supérieur') {
      if (fieldLower.includes('info') || fieldLower.includes('logiciel')) {
        return ['Algorithmique & Programmation', 'Structures de données', 'Bases de données', 'Réseaux & Systèmes', 'Mathématiques appliquées', 'Génie logiciel', 'Intelligence artificielle', 'Anglais technique'];
      }
      if (fieldLower.includes('industriel') || fieldLower.includes('électronique')) {
        return ['Mathématiques pour l\'ingénieur', 'Électronique analogique & numérique', 'Automatique', 'Physique appliquée', 'Mécanique', 'Thermodynamique', 'Résistance des matériaux'];
      }
      if (fieldLower.includes('civil') || fieldLower.includes('btp') || fieldLower.includes('architecture')) {
        return ['Béton armé', 'Résistance des matériaux', 'Topographie', 'Géotechnique', 'Hydraulique', 'Mathématiques', 'Dessin technique'];
      }
      if (fieldLower.includes('médecine') || fieldLower.includes('pharmacie')) {
        return ['Anatomie', 'Biologie cellulaire', 'Physiologie', 'Biochimie', 'Pharmacologie', 'Sémiologie médicale', 'Microbiologie'];
      }
      if (fieldLower.includes('économie') || fieldLower.includes('gestion') || fieldLower.includes('marketing') || fieldLower.includes('commerce')) {
        return ['Économie générale', 'Comptabilité analytique', 'Finance d\'entreprise', 'Marketing', 'Management', 'Statistiques appliquées', 'Droit des affaires'];
      }
      if (fieldLower.includes('droit') || fieldLower.includes('politique')) {
        return ['Droit civil', 'Droit constitutionnel', 'Droit pénal', 'Droit administratif', 'Droit des obligations', 'Procédure judiciaire', 'Droit international'];
      }
      if (fieldLower.includes('lettres') || fieldLower.includes('humaines')) {
        return ['Littérature arabe', 'Littérature française', 'Philosophie', 'Histoire', 'Géographie', 'Linguistique', 'Anglais'];
      }
      return ['Mathématiques', 'Informatique', 'Physique', 'Économie', 'Droit', 'Langues', 'Méthodologie'];
    }

    return ['Mathématiques', 'Langue française', 'Langue arabe', 'Anglais', 'Sciences'];
  }

  get progressPercent(): number {
    if (this.step === 0) return 0;
    return Math.min(100, Math.round((this.currentDisplayStep / this.effectiveTotalSteps) * 100));
  }

  get canProceed(): boolean {
    switch (this.step) {
      case 0: return true;
      case 1: return !!this.firstName.trim();
      case 2: return !!this.age && this.age >= 5 && this.age <= 99;
      case 3: return !!this.educationLevel && isAgeEducationLevelValid(this.age, this.educationLevel);
      case 4:
        if (this.schoolCategory === 'supérieur') return !!this.fieldOfStudy;
        return true;
      case 5: return this.selectedSubjects.length > 0;
      case 6: return this.selectedObjectives.length > 0;
      case 7: return this.selectedDifficulties.length > 0;
      case 8: return this.selectedLearningStyles.length > 0 && !!this.studyTime;
      case 9: return this.allDiagnosticAnswered;
      case 10: return true;
      default: return false;
    }
  }

  get allDiagnosticAnswered(): boolean {
    return this.diagnosticQuestions.length > 0 &&
      this.diagnosticAnswers.length === this.diagnosticQuestions.length &&
      this.diagnosticAnswers.every(a => a !== null);
  }

  toggleItem(arr: string[], item: string): void {
    const idx = arr.indexOf(item);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(item);
    this.persistDraft();
  }

  isSelected(arr: string[], item: string): boolean {
    return arr.includes(item);
  }

  getAgeGroup(): AgeGroup {
    if (!this.age) return '17-20';
    if (this.age <= 12) return '6-12';
    if (this.age <= 16) return '13-16';
    if (this.age <= 20) return '17-20';
    if (this.age <= 30) return '21-30';
    return '31+';
  }

  start(): void {
    // Si le prénom a déjà été renseigné (à l'inscription), passer directement à l'âge (étape 2)
    if (this.hasFirstName) {
      this.step = 2;
    } else {
      this.step = 1;
    }
    this.persistDraft();
  }

  next(): void {
    if (!this.canProceed) return;

    // Validate level on leaving step 2
    if (this.step === 2 && this.educationLevel) {
      if (!isAgeEducationLevelValid(this.age, this.educationLevel)) {
        this.educationLevel = '';
      }
    }

    // Skip step 4 if primary school
    if (this.step === 3 && this.schoolCategory === 'primaire') {
      this.step = 5;
      this.persistDraft();
      return;
    }

    if (this.step === 8) {
      this.generateAdaptiveDiagnostic();
      this.step = 9;
      this.persistDraft();
      return;
    }

    if (this.step < this.totalSteps) {
      this.step++;
      this.persistDraft();
    }
  }

  prev(): void {
    if (this.step === 5 && this.schoolCategory === 'primaire') {
      this.step = 3;
      this.persistDraft();
      return;
    }
    // Si on est à l'étape 2 (âge) et que le prénom était déjà connu, retourner à l'accueil
    if (this.step === 2 && this.hasFirstName) {
      this.step = 0;
      this.persistDraft();
      return;
    }
    if (this.step > 0) {
      this.step--;
      this.persistDraft();
    }
  }

  persistDraft(): void {
    this.profileService.saveDraft({
      firstName: this.firstName,
      age: this.age || undefined,
      ageGroup: this.getAgeGroup(),
      educationLevel: this.educationLevel,
      fieldOfStudy: this.fieldOfStudy,
      studyYear: this.studyYear,
      school: this.school,
      subjects: this.selectedSubjects,
      objectives: this.selectedObjectives,
      difficulties: this.selectedDifficulties,
      difficultyExplanation: this.difficultyExplanation,
      learningStyles: this.selectedLearningStyles,
      studyTime: this.studyTime,
      currentStep: this.step
    });
  }

  generateAdaptiveDiagnostic(): void {
    const questions: DiagnosticQuestion[] = [];
    const cat = this.schoolCategory;
    const subjects = this.selectedSubjects;
    const branch = (this.parcours || this.fieldOfStudy || '').toLowerCase();

    const addQuestion = (subj: string, q: string, opts: string[], correctIdx: number) => {
      questions.push({ subject: subj, question: q, options: opts, correctIndex: correctIdx });
    };

    subjects.forEach((subj) => {
      const sLower = subj.toLowerCase();

      // ─── ANGLAIS ─────────────────────────────────────────────────────────────
      if (sLower.includes('anglais')) {
        if (cat === 'primaire') {
          addQuestion(subj, 'Quel est le pluriel du mot "cat" ?', ['Cats', 'Cates', 'Caties', 'Cat'], 0);
          addQuestion(subj, 'Quelle phrase est correcte ?', ['I has a dog', 'I have a dog', 'I am have a dog', 'I having a dog'], 1);
        } else if (cat === 'collège') {
          addQuestion(subj, 'Complète la phrase : "She ______ to school every day at 8 AM."', ['go', 'goes', 'going', 'gone'], 1);
          addQuestion(subj, 'Quel est le contraire du mot "happy" ?', ['Sad', 'Angry', 'Tired', 'Bored'], 0);
        } else if (cat === 'lycée') {
          addQuestion(subj, 'Complète avec la bonne forme : "If I ______ more time, I would travel more."', ['had', 'have', 'would have', 'will have'], 0);
          addQuestion(subj, 'Quelle est la forme passive de : "They built this house in 1990" ?', ['This house is built in 1990', 'This house was built in 1990', 'This house was building in 1990', 'This house had built in 1990'], 1);
        } else {
          addQuestion(subj, 'Choose the synonym of "mitigate":', ['Aggravate', 'Alleviate', 'Increase', 'Ignore'], 1);
          addQuestion(subj, 'Complete: "The company aims to ______ its international operations."', ['expand', 'expands', 'expanding', 'expanded'], 0);
        }
      }

      // ─── MATHÉMATIQUES ───────────────────────────────────────────────────────
      else if (sLower.includes('math')) {
        if (cat === 'primaire') {
          addQuestion(subj, 'Combien font 7 × 8 ?', ['48', '54', '56', '64'], 2);
          addQuestion(subj, 'Quel est le tiers de 15 ?', ['3', '5', '6', '10'], 1);
        } else if (cat === 'collège') {
          addQuestion(subj, 'Résoudre l\'équation : 2x + 6 = 18. Que vaut x ?', ['4', '6', '8', '12'], 1);
          addQuestion(subj, 'Dans un triangle rectangle, quel théorème permet de calculer la longueur de l\'hypoténuse ?', ['Théorème de Thalès', 'Théorème de Pythagore', 'Théorème d\'Al Kashi', 'Règle de trois'], 1);
        } else if (cat === 'lycée') {
          if (branch.includes('math') || branch.includes('sma') || branch.includes('smb')) {
            addQuestion(subj, 'Quelle est la limite de sin(x) / x lorsque x tend vers 0 ?', ['0', '1', '+∞', 'N\'existe pas'], 1);
            addQuestion(subj, 'Quelle est la dérivée de f(x) = ln(x² + 1) ?', ['2x / (x² + 1)', '1 / (x² + 1)', '2x', 'x / (x² + 1)'], 0);
          } else {
            addQuestion(subj, 'Quelle est la dérivée de la fonction f(x) = 2x² - 3x + 1 ?', ['4x - 3', '2x - 3', '4x + 1', 'x² - 3'], 0);
            addQuestion(subj, 'Que vaut e^0 ?', ['0', '1', 'e', '-1'], 1);
          }
        } else {
          addQuestion(subj, 'Quel est le résultat de l\'intégrale ∫ 2x dx ?', ['x² + C', '2x² + C', 'x + C', '2 + C'], 0);
          addQuestion(subj, 'Si une matrice A est inversible, que vaut det(A⁻¹) ?', ['det(A)', '1 / det(A)', '-det(A)', '0'], 1);
        }
      }

      // ─── PHYSIQUE / CHIMIE ───────────────────────────────────────────────────
      else if (sLower.includes('physique') || sLower.includes('chimie')) {
        if (cat === 'collège') {
          addQuestion(subj, 'Quelle est l\'unité de la tension électrique dans le Système International ?', ['Ampère (A)', 'Volt (V)', 'Watt (W)', 'Ohm (Ω)'], 1);
          addQuestion(subj, 'Quel est le pH d\'une solution aqueuse neutre à 25°C ?', ['0', '7', '14', '5'], 1);
        } else if (cat === 'lycée') {
          if (branch.includes('spc') || branch.includes('physique') || branch.includes('sma') || branch.includes('smb')) {
            addQuestion(subj, 'Dans un circuit RC série, quelle est l\'expression de la constante de temps τ ?', ['R / C', 'R × C', 'C / R', '1 / (R × C)'], 1);
            addQuestion(subj, 'Selon la 2ème loi de Newton (PFD) en référentiel galiléen, Σ F_ext est égale à :', ['m × v', 'm × a', '1/2 m v²', 'm × g'], 1);
          } else {
            addQuestion(subj, 'Quelle est l\'unité de la force dans le Système International ?', ['Joule (J)', 'Watt (W)', 'Newton (N)', 'Pascal (Pa)'], 2);
            addQuestion(subj, 'Une réaction chimique est dite d\'oxydoréduction s\'il y a transfert de :', ['Protons', 'Électrons', 'Neutrons', 'Atomes'], 1);
          }
        } else {
          addQuestion(subj, 'En thermodynamique, le premier principe exprime la conservation de :', ['L\'entropie', 'L\'énergie', 'La pression', 'La température'], 1);
          addQuestion(subj, 'Dans un AOP idéal en régime linéaire, la différence de potentiel v+ - v- est égale à :', ['15 V', '0 V', '-15 V', '1 V'], 1);
        }
      }

      // ─── SVT / BIOLOGIE ──────────────────────────────────────────────────────
      else if (sLower.includes('svt') || sLower.includes('vie') || sLower.includes('biologie') || sLower.includes('anatomie') || sLower.includes('physiologie')) {
        if (cat === 'collège') {
          addQuestion(subj, 'Où s\'effectuent principalement les échanges gazeux respiratoires chez l\'Homme ?', ['Dans l\'estomac', 'Dans les alvéoles pulmonaires', 'Dans le foie', 'Dans les reins'], 1);
          addQuestion(subj, 'Quel organe produit la bile essentielle à la digestion des lipides ?', ['Le pancréas', 'Le foie', 'L\'estomac', 'L\'intestin grêle'], 1);
        } else if (cat === 'lycée') {
          addQuestion(subj, 'Quelle est la première étape de la respiration cellulaire se déroulant dans le hyaloplasme ?', ['Le cycle de Krebs', 'La glycolyse', 'La phosphorylation oxydative', 'La fermentation lactique'], 1);
          addQuestion(subj, 'Combien de molécules d\'ATP sont produites directement par la glycolyse à partir d\'un glucose ?', ['2 ATP', '36 ATP', '38 ATP', '4 ATP'], 0);
        } else {
          addQuestion(subj, 'Quel organite cellulaire est le siège principal de la synthèse d\'ATP par respiration ?', ['Le réticulum endoplasmique', 'La mitochondrie', 'L\'appareil de Golgi', 'Le noyau'], 1);
          addQuestion(subj, 'Quelle est la fonction principale des hématies (globules rouges) ?', ['L\'immunité', 'Le transport du dioxygène (O2)', 'La coagulation', 'La digestion'], 1);
        }
      }

      // ─── INFORMATIQUE / PROGRAMMATION / ALGORITHMIQUE ─────────────────────
      else if (sLower.includes('info') || sLower.includes('algo') || sLower.includes('programmation') || sLower.includes('structure') || sLower.includes('logiciel')) {
        if (cat === 'collège' || cat === 'lycée') {
          addQuestion(subj, 'Que permet de faire une boucle "for" dans un programme ?', ['Déclarer une variable', 'Répéter un bloc d\'instructions un nombre connu de fois', 'Arrêter l\'ordinateur', 'Créer un dossier'], 1);
          addQuestion(subj, 'Quel type de données sert à stocker une séquence de caractères en informatique ?', ['Integer (Entier)', 'String (Chaîne de caractères)', 'Boolean', 'Float'], 1);
        } else {
          addQuestion(subj, 'Quelle structure de données fonctionne selon le principe LIFO (Last In First Out) ?', ['File (Queue)', 'Pile (Stack)', 'Tableau (Array)', 'Arbre (Tree)'], 1);
          addQuestion(subj, 'Quelle est la complexité asymptotique moyenne de la recherche dichotomique ?', ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], 2);
        }
      }

      // ─── BASES DE DONNÉES ────────────────────────────────────────────────────
      else if (sLower.includes('base') || sLower.includes('données') || sLower.includes('sql')) {
        addQuestion(subj, 'Quelle clause SQL permet de filtrer les résultats d\'une requête ?', ['ORDER BY', 'GROUP BY', 'WHERE', 'SELECT'], 2);
        addQuestion(subj, 'Quelle commande SQL sert à insérer une nouvelle ligne dans une table ?', ['UPDATE', 'INSERT INTO', 'CREATE TABLE', 'ADD ROW'], 1);
      }

      // ─── ÉCONOMIE / GESTION / COMPTABILITÉ / FINANCE ───────────────────────
      else if (sLower.includes('écono') || sLower.includes('gestion') || sLower.includes('compta') || sLower.includes('finance') || sLower.includes('marketing')) {
        if (cat === 'lycée') {
          addQuestion(subj, 'Selon la loi de l\'offre et de la demande, si la demande augmente et l\'offre reste constante, le prix a tendance à :', ['Diminuer', 'Augmenter', 'Rester identique', 'Devenir nul'], 1);
          addQuestion(subj, 'Dans le bilan comptable d\'une entreprise, les créances clients figurent dans :', ['L\'actif immobilisé', 'L\'actif circulant', 'Le passif circulant', 'Les capitaux propres'], 1);
        } else {
          addQuestion(subj, 'Quel critère d\'évaluation financière mesure le gain net actualisé généré par un projet ?', ['Le BFR', 'La Valeur Actuelle Nette (VAN)', 'Le chiffre d\'affaires', 'La marge brute'], 1);
          addQuestion(subj, 'Dans l\'analyse stratégique SWOT, que désignent les lettres "S" et "W" ?', ['Services & Workers', 'Strengths & Weaknesses (Forces & Faiblesses)', 'Sales & Wastes', 'Strategy & Workflow'], 1);
        }
      }

      // ─── DROIT & SCIENCES POLITIQUES ─────────────────────────────────────────
      else if (sLower.includes('droit') || sLower.includes('juridique') || sLower.includes('procédure')) {
        addQuestion(subj, 'Quel principe juridique énonce que nul n\'est censé ignorer la loi ?', ['Principe de précaution', 'Nemo censetur ignorare legem', 'Présomption d\'innocence', 'Chose jugée'], 1);
        addQuestion(subj, 'Au Maroc, quel texte constitue la norme juridique suprême de l\'État ?', ['Le Code civil', 'La Constitution', 'Le Code du travail', 'Le Dahir des obligations'], 1);
      }

      // ─── PHILOSOPHIE ─────────────────────────────────────────────────────────
      else if (sLower.includes('philo')) {
        if (cat === 'lycée') {
          addQuestion(subj, 'Dans le programme de philosophie de 2ème Bac, laquelle de ces notions relève du grand axe "La Connaissance" ?', ['L\'État', 'La Vérité', 'La Société', 'Le Devoir'], 1);
          addQuestion(subj, 'Quel philosophe est l\'auteur de la célebre formule "Je pense, donc je suis" ?', ['Immanuel Kant', 'René Descartes', 'Jean-Paul Sartre', 'Aristote'], 1);
        } else {
          addQuestion(subj, 'Quelle démarche philosophique consiste à questionner les certitudes par le dialogue argumenté ?', ['L\'empirisme', 'La dialectique', 'Le dogmatisme', 'Le scepticisme radical'], 1);
        }
      }

      // ─── HISTOIRE & GÉOGRAPHIE ───────────────────────────────────────────────
      else if (sLower.includes('histoire') || sLower.includes('géo')) {
        if (cat === 'collège') {
          addQuestion(subj, 'En quelle année le Maroc a-t-il accédé à l\'indépendance ?', ['1944', '1956', '1961', '1975'], 1);
          addQuestion(subj, 'Quel est le fleuve le plus long au monde ?', ['L\'Amazone', 'Le Nil', 'Le Mississippi', 'Le Danube'], 1);
        } else if (cat === 'lycée') {
          addQuestion(subj, 'Quel événement a déclenché le début de la Première Guerre mondiale en 1914 ?', ['Le traité de Versailles', 'L\'attentat de Sarajevo', 'La crise de 1929', 'La Révolution russe'], 1);
          addQuestion(subj, 'Que désigne la notion de "Mondialisation" en géographie ?', ['La fermeture des frontières', 'L\'intensification des flux et interconnexions à l\'échelle globale', 'La baisse démographique', 'L\'isolement des marchés'], 1);
        } else {
          addQuestion(subj, 'Quel concept désigne l\'organisation de l\'espace mondial entre métropoles dominantes et espaces dépendants ?', ['Le modèle Centre-Périphérie', 'La transition démographique', 'L\'exode rural', 'La métropolisation locale'], 0);
        }
      }

      // ─── FRANÇAIS / LITTÉRATURE FRANÇAISE ─────────────────────────────────────
      else if (sLower.includes('français') || sLower.includes('littérature')) {
        if (cat === 'primaire') {
          addQuestion(subj, 'Dans la phrase "Le petit chat boit du lait", quel est le verbe ?', ['petit', 'chat', 'boit', 'lait'], 2);
          addQuestion(subj, 'Quel est le féminin du mot "directeur" ?', ['Directeuse', 'Directrice', 'Directe', 'Directore'], 1);
        } else if (cat === 'collège') {
          addQuestion(subj, 'Dans la phrase "Ses yeux brillaient comme des étoiles", quelle figure de style est utilisée ?', ['Une métaphore', 'Une comparaison', 'Une hyperbole', 'Un oxymore'], 1);
          addQuestion(subj, 'Quel mode verbal exprime l\'ordre ou la prière ?', ['L\'indicatif', 'Le subjonctif', 'L\'impératif', 'Le conditionnel'], 2);
        } else if (cat === 'lycée') {
          addQuestion(subj, 'Dans l\'œuvre "La Boîte à Merveilles" d\'Ahmed Sefrioui, quel est le nom du narrateur enfant ?', ['Sidi Mohammed', 'Sidi Abdeslam', 'Maâlem Brik', 'Abdellah'], 0);
          addQuestion(subj, 'Quelle figure de style consiste à désigner un être ou une chose par un groupe de mots (ex: "La Ville Lumière" pour Paris) ?', ['Une antonomase', 'Une périphrase', 'Une litote', 'Une anaphore'], 1);
        } else {
          addQuestion(subj, 'Quel courant littéraire du XIXe siècle vise à peindre la réalité avec une précision quasi scientifique ?', ['Le Romantisme', 'Le Naturalisme', 'Le Symbolisme', 'Le Surréalisme'], 1);
        }
      }

      // ─── ARABE / LITTÉRATURE ARABE / ÉDUCATION ISLAMIQUE ─────────────────────
      else if (sLower.includes('arabe') || sLower.includes('islamique') || sLower.includes('عرب')) {
        if (sLower.includes('islam')) {
          addQuestion(subj, 'Combien y a-t-il de piliers dans l\'Islam (أركان الإسلام) ?', ['3', '5', '6', '7'], 1);
          addQuestion(subj, 'Quelle est la première sourate du Saint Coran ?', ['Al-Baqara', 'Al-Fatiha', 'Al-Ikhlas', 'An-Nas'], 1);
        } else {
          addQuestion(subj, 'في اللغة العربية، ما هو إعراب الفاعل في الجملة الفعلية ؟', ['مرفوع', 'منصوب', 'مجرور', 'مجزوم'], 0);
          addQuestion(subj, 'من هو الشاعر العربي الملقب بـ "أمير الشعراء" ؟', ['المتنبي', 'أحمد شوقي', 'محمود درويش', 'جبران خليل جبران'], 1);
        }
      }

      // ─── ÉVEIL SCIENTIFIQUE / SCIENCES GÉNÉRALES ─────────────────────────────
      else if (sLower.includes('éveil') || sLower.includes('science')) {
        addQuestion(subj, 'Quels sont les 3 états physiques fondamentaux de la matière ?', ['Solide, liquide, gaz', 'Chaud, froid, tiède', 'Air, terre, feu', 'Lumière, ombre, eau'], 0);
        addQuestion(subj, 'Quel organe permet aux poissons de respirer sous l\'eau ?', ['Les poumons', 'Les ouïes (branchies)', 'La peau', 'Les nageoires'], 1);
      }
    });

    // ─── FALLBACK SI AUCUNE QUESTION SPÉCIFIQUE DÉTECTÉE ────────────────────
    if (questions.length === 0) {
      const primarySubject = subjects[0] || 'Méthodologie';
      addQuestion(
        primarySubject,
        `Face à un exercice complexe en ${this.fieldOfStudy || this.parcours || primarySubject}, quelle démarche privilégies-tu ?`,
        ['Décomposer le problème en sous-étapes simples', 'Essayer au hasard jusqu\'à trouver', 'Demander immédiatement la réponse', 'Passer à un autre sujet'],
        0
      );
      addQuestion(
        primarySubject,
        'Lorsque tu révises une leçon, quelle méthode te semble la plus efficace ?',
        ['Refaire des exercices pratiques et des quiz', 'Relire le cours de manière passive', 'Mémoriser sans chercher à comprendre', 'Attendre la veille des examens'],
        0
      );
    }

    // Proposer entre 4 et 6 questions équilibrées
    this.diagnosticQuestions = questions.slice(0, 6);
    this.diagnosticAnswers = new Array(this.diagnosticQuestions.length).fill(null);
    this.diagnosticGenerated = true;
  }

  selectDiagnosticAnswer(qIndex: number, optIndex: number): void {
    this.diagnosticAnswers[qIndex] = optIndex;
    this.persistDraft();
  }

  submitDiagnostic(): void {
    let correct = 0;
    const subjectScores: Record<string, number> = {};
    const subjectCounts: Record<string, { correct: number; total: number }> = {};

    this.diagnosticQuestions.forEach((q, i) => {
      const isRight = this.diagnosticAnswers[i] === q.correctIndex;
      if (isRight) correct++;

      if (!subjectCounts[q.subject]) subjectCounts[q.subject] = { correct: 0, total: 0 };
      subjectCounts[q.subject].total++;
      if (isRight) subjectCounts[q.subject].correct++;
    });

    const overall = Math.round((correct / this.diagnosticQuestions.length) * 100);

    // Compute real scores per selected subject
    this.selectedSubjects.forEach((s) => {
      if (subjectCounts[s] && subjectCounts[s].total > 0) {
        subjectScores[s] = Math.round((subjectCounts[s].correct / subjectCounts[s].total) * 100);
      } else {
        subjectScores[s] = overall;
      }
    });

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (overall >= 75) {
      strengths.push('Excellente maîtrise des fondamentaux');
      strengths.push('Bonne capacité d\'analyse');
    } else if (overall >= 50) {
      strengths.push('Bases solides');
      weaknesses.push('Certaines notions spécifiques à consolider');
    } else {
      weaknesses.push('Fondamentaux à reprendre avec des exemples simples');
    }

    if (this.selectedDifficulties.includes('J\'ai du mal avec les exercices')) {
      weaknesses.push('Application pratique par les exercices');
    }
    if (this.selectedDifficulties.includes('J\'ai du mal à mémoriser')) {
      weaknesses.push('Méthode de mémorisation active');
    }

    const recommendations: string[] = [];
    if (overall < 60) {
      recommendations.push(`Reprendre les bases de ${this.selectedSubjects[0] || 'ta matière principale'} avec des explications guidées.`);
    } else {
      recommendations.push(`Approfondir les concepts clés en ${this.selectedSubjects[0] || 'ta matière'}.`);
    }
    recommendations.push('Faire des exercices progressifs avec indices du tuteur.');
    recommendations.push('Valider tes acquis par un mini-quiz à la fin de chaque séance.');

    this.diagnosticResult = {
      overallScore: overall,
      subjectScores,
      strengths,
      weaknesses,
      recommendations
    };

    this.step = 10;
    this.persistDraft();
  }

  async finishOnboarding(): Promise<void> {
    const input: OnboardingProfileInput = {
      firstName: this.firstName.trim(),
      age: this.age || 18,
      ageGroup: this.getAgeGroup(),
      educationLevel: this.educationLevel,
      country: this.country,
      language: this.language,
      field: this.fieldOfStudy || this.parcours || '',
      branch: this.parcours || '',
      school: this.school,
      fieldOfStudy: this.fieldOfStudy,
      studyYear: this.studyYear,
      subjects: this.selectedSubjects,
      objectives: this.selectedObjectives,
      difficulties: this.selectedDifficulties,
      difficultyExplanation: this.difficultyExplanation,
      learningStyles: this.selectedLearningStyles,
      studyTime: this.studyTime,
      diagnosticResults: this.diagnosticResult || undefined
    };

    try {
      const { profile, studentId } = await this.profileService.completeOnboarding(input);

      // Determine the studentId to link (backend response, or fallback to user.id)
      const effectiveStudentId = studentId || this.auth.currentUser?.studentId || this.auth.currentUser?.id;

      // Link the created student profile to the authenticated account
      if (effectiveStudentId && this.auth.isLoggedIn) {
        this.auth.linkStudent(effectiveStudentId).subscribe({
          next: () => void this.router.navigateByUrl('/dashboard', { replaceUrl: true }),
          error: () => void this.router.navigateByUrl('/dashboard', { replaceUrl: true })
        });
      } else {
        void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      }
    } catch (err) {
      console.error('[Onboarding] finishOnboarding error:', err);
      // Even on error, try to navigate — the guard will re-check
      void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    }
  }
}