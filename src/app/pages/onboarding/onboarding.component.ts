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
  isCheckingProfile = true;
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

  // Propriétés conservées pour rétro-compatibilité
  fields: string[] = [];

  get parcoursOptions(): string[] {
    return [];
  }

  // Step 5 : Matières (NO DEFAULT!)
  selectedSubjects: string[] = [];

  // Step 6 : Objectifs
  selectedObjectives: string[] = [];
  allObjectives = [
    'Mieux comprendre mes cours',
    'Combler mes lacunes et progresser',
    'Réussir mes devoirs pas à pas',
    'M\'entraîner avec des exercices simples',
    'M\'améliorer en calcul et raisonnement',
    'M\'améliorer en lecture et écriture',
    'Reprendre confiance en moi',
    'Apprendre à mon rythme sans stress'
  ];

  // Step 7 : Difficultés
  selectedDifficulties: string[] = [];
  difficultyExplanation = '';
  allDifficulties = [
    'J\'ai du mal à comprendre les consignes et les énoncés',
    'J\'ai des difficultés avec les calculs et les tables',
    'J\'ai des difficultés en lecture ou en grammaire/orthographe',
    'J\'ai accumulé des lacunes et du retard',
    'J\'ai du mal à mémoriser mes leçons',
    'Je perds vite ma concentration ou je fatigue',
    'J\'ai peur de me tromper devant les exercices',
    'J\'ai du mal à suivre le rythme en classe',
    'Je ne sais pas comment réviser mes contrôles',
    'Autre difficulté'
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
    const user = this.auth.currentUser;
    if (!user) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    // 0. Si le profil est déjà complété en mémoire, rediriger immédiatement
    const currentP = this.profileService.currentProfile;
    if (currentP && currentP.onboardingCompleted && (currentP.firstName || currentP.name)) {
      this.isCheckingProfile = false;
      void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      return;
    }

    // Sinon, vérifier immédiatement en base de données avant d'afficher le questionnaire
    this.isCheckingProfile = true;
    this.profileService.loadProfileFromDatabase(user).then((p) => {
      this.isCheckingProfile = false;
      if (p && p.onboardingCompleted && (p.firstName || p.name)) {
        void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        return;
      }
    }).catch(() => {
      this.isCheckingProfile = false;
    });

    // 1. Initialiser le prénom depuis le compte authentifié (créé lors de l'inscription)
    const authUser = this.auth.currentUser;
    if (authUser?.firstName) {
      this.firstName = authUser.firstName;
    } else if (this.auth.name) {
      this.firstName = this.auth.name;
    }

    // Nettoyage des anciens brouillons orphelins (ex: 'TEST')
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tutorai.onboarding-draft.v2');
      localStorage.removeItem('tutorai.onboarding-draft');
    }

    // 2. Récupérer le brouillon sauvegardé pour cet utilisateur si existant
    const draft = this.profileService.getDraft();
    if (draft) {
      // Priorité absolue au prénom du compte connecté
      if (!this.hasFirstName && draft.firstName) {
        this.firstName = draft.firstName;
      }
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

  get schoolCategory(): 'primaire' | 'collège' | 'unknown' {
    if (!this.educationLevel) return 'unknown';
    return getSchoolCategory(this.educationLevel);
  }

  get availableSubjects(): string[] {
    const cat = this.schoolCategory;

    // ─── Primaire (6 à 11 ans) ────────────────────────────────
    if (cat === 'primaire') {
      return ['Mathématiques', 'Langue française', 'Langue arabe', 'Éveil scientifique', 'Histoire-Géographie', 'Éducation islamique'];
    }

    // ─── Collège (12 à 15 ans) ─────────────────────────────────
    if (cat === 'collège') {
      return ['Mathématiques', 'Français', 'Langue arabe', 'Physique-Chimie', 'Sciences de la vie et de la Terre (SVT)', 'Anglais', 'Histoire-Géographie', 'Informatique', 'Éducation islamique'];
    }

    return ['Mathématiques', 'Langue française', 'Langue arabe', 'Sciences'];
  }

  get progressPercent(): number {
    if (this.step === 0) return 0;
    return Math.min(100, Math.round((this.currentDisplayStep / this.effectiveTotalSteps) * 100));
  }

  get canProceed(): boolean {
    switch (this.step) {
      case 0: return true;
      case 1: return !!this.firstName.trim();
      case 2: return !!this.age && this.age >= 6 && this.age <= 15;
      case 3: return !!this.educationLevel && isAgeEducationLevelValid(this.age, this.educationLevel);
      case 4: return true;
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
    if (!this.age) return '9-11';
    if (this.age <= 8) return '6-8';
    if (this.age <= 11) return '9-11';
    if (this.age <= 13) return '12-13';
    return '14-15';
  }

  start(): void {
    if (this.profileService.isOnboardingComplete()) {
      void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      return;
    }
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

      // ─── ANGLAIS (Primaire / Collège) ──────────────────────────────────────────
      if (sLower.includes('anglais')) {
        if (cat === 'primaire') {
          addQuestion(subj, 'Quel est le pluriel du mot "cat" ?', ['Cats', 'Cates', 'Caties', 'Cat'], 0);
          addQuestion(subj, 'Quelle phrase est correcte ?', ['I has a dog', 'I have a dog', 'I am have a dog', 'I having a dog'], 1);
        } else {
          addQuestion(subj, 'Complète la phrase : "She ______ to school every day at 8 AM."', ['go', 'goes', 'going', 'gone'], 1);
          addQuestion(subj, 'Quel est le contraire du mot "happy" ?', ['Sad', 'Angry', 'Tired', 'Bored'], 0);
        }
      }

      // ─── MATHÉMATIQUES (Primaire / Collège) ────────────────────────────────────
      else if (sLower.includes('math')) {
        if (cat === 'primaire') {
          addQuestion(subj, 'Combien font 7 × 8 ?', ['48', '54', '56', '64'], 2);
          addQuestion(subj, 'Quel est le tiers de 15 ?', ['3', '5', '6', '10'], 1);
        } else {
          addQuestion(subj, 'Résoudre l\'équation : 2x + 6 = 18. Que vaut x ?', ['4', '6', '8', '12'], 1);
          addQuestion(subj, 'Dans un triangle rectangle, quel théorème permet de calculer la longueur de l\'hypoténuse ?', ['Théorème de Thalès', 'Théorème de Pythagore', 'Théorème d\'Al Kashi', 'Règle de trois'], 1);
        }
      }

      // ─── PHYSIQUE / CHIMIE (Collège) ──────────────────────────────────────────
      else if (sLower.includes('physique') || sLower.includes('chimie')) {
        addQuestion(subj, 'Quelle est l\'unité de la tension électrique dans le Système International ?', ['Ampère (A)', 'Volt (V)', 'Watt (W)', 'Ohm (Ω)'], 1);
        addQuestion(subj, 'Quel est le pH d\'une solution aqueuse neutre à 25°C ?', ['0', '7', '14', '5'], 1);
      }

      // ─── SVT / ÉVEIL SCIENTIFIQUE (Primaire / Collège) ────────────────────────
      else if (sLower.includes('svt') || sLower.includes('vie') || sLower.includes('terre') || sLower.includes('éveil') || sLower.includes('science')) {
        if (cat === 'primaire') {
          addQuestion(subj, 'Quels sont les 3 états de l\'eau dans la nature ?', ['Solide, liquide, vapeur', 'Chaud, froid, tiède', 'Air, terre, feu', 'Pluie, neige, vent'], 0);
          addQuestion(subj, 'Quel organe permet aux poissons de respirer sous l\'eau ?', ['Les poumons', 'Les ouïes (branchies)', 'La peau', 'La bouche'], 1);
        } else {
          addQuestion(subj, 'Où s\'effectuent principalement les échanges gazeux respiratoires chez l\'Homme ?', ['Dans l\'estomac', 'Dans les alvéoles pulmonaires', 'Dans le foie', 'Dans les reins'], 1);
          addQuestion(subj, 'Quel rôle jouent les globules rouges dans le sang ?', ['Transporter le dioxygène', 'Fabriquer des vitamines', 'Digérer les aliments', 'Réguler le sommeil'], 0);
        }
      }

      // ─── INFORMATIQUE (Collège) ───────────────────────────────────────────────
      else if (sLower.includes('info')) {
        addQuestion(subj, 'Quel composant sert de mémoire temporaire rapide à un ordinateur ?', ['La mémoire RAM', 'Le clavier', 'L\'écran', 'La souris'], 0);
        addQuestion(subj, 'En algorithmique, que signifie une boucle « Répéter 5 fois » ?', ['Exécuter les instructions 5 fois de suite', 'Effacer le programme', 'Éteindre l\'ordinateur', 'Diviser par 5'], 0);
      }

      // ─── HISTOIRE & GÉOGRAPHIE (Primaire / Collège) ───────────────────────────
      else if (sLower.includes('histoire') || sLower.includes('géo')) {
        addQuestion(subj, 'En quelle année le Maroc a-t-il célébré la Marche Verte ?', ['1956', '1975', '1982', '1999'], 1);
        addQuestion(subj, 'Quelle est la capitale administrative du Royaume du Maroc ?', ['Casablanca', 'Rabat', 'Fès', 'Marrakech'], 1);
      }

      // ─── FRANÇAIS (Primaire / Collège) ─────────────────────────────────────────
      else if (sLower.includes('français')) {
        if (cat === 'primaire') {
          addQuestion(subj, 'Dans la phrase "Le chat dort sur le tapis", quel est le verbe ?', ['chat', 'dort', 'tapis', 'sur'], 1);
          addQuestion(subj, 'Quel est le pluriel du mot "cheval" ?', ['Chevals', 'Chevaux', 'Chevales', 'Cheveaux'], 1);
        } else {
          addQuestion(subj, 'Dans la phrase "Ses yeux brillaient comme des étoiles", quelle figure de style est utilisée ?', ['Une métaphore', 'Une comparaison', 'Une hyperbole', 'Un oxymore'], 1);
          addQuestion(subj, 'Quel temps est utilisé dans la phrase : "Demain, nous irons au musée" ?', ['Présent', 'Passé composé', 'Futur simple', 'Imparfait'], 2);
        }
      }

      // ─── ARABE & ÉDUCATION ISLAMIQUE (Primaire / Collège) ─────────────────────
      else if (sLower.includes('arabe') || sLower.includes('islamique') || sLower.includes('عرب')) {
        if (sLower.includes('islam')) {
          addQuestion(subj, 'كَمْ عَدَدُ أَرْكَانِ الإِسْلاَمِ الخَمْسَةِ ؟', ['3 أركان', '5 أركان', '6 أركان', '7 أركان'], 1);
          addQuestion(subj, 'مَا هِيَ أُولَى سُوَرِ القُرْآنِ الكَرِيمِ فِي المِصْحَفِ الشَّرِيفِ ؟', ['سُورَةُ البَقَرَةِ', 'سُورَةُ الفَاتِحَةِ', 'سُورَةُ الإِخْلاَصِ', 'سُورَةُ النَّاسِ'], 1);
        } else {
          addQuestion(subj, 'فِي اللُّغَةِ العَرَبِيَّةِ، مَا هُوَ إِعْرَابُ الفَاعِلِ فِي الجُمْلَةِ الفِعْلِيَّةِ ؟', ['مَرْفُوعٌ', 'مَنْصُوبٌ', 'مَجْرُورٌ', 'مَجْزُومٌ'], 0);
          addQuestion(subj, 'مَا هُوَ ضِدُّ كَلِمَةِ « سَعِيدٌ » ؟', ['حَزِينٌ', 'قَوِيٌّ', 'كَبِيرٌ', 'سَرِيعٌ'], 0);
        }
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