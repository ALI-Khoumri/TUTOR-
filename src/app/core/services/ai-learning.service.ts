import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { ProfileService } from './profile.service';

export interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizGenerateResponse {
  topic: string;
  questions: QuizItem[];
  difficulty?: string;
  adaptiveDifficulty?: string;
  levelIndex?: number;
  generatedBy?: string;
  stats?: any;
}

export interface QuizFeedbackResponse {
  feedback: string;
  recommendations: string[];
  nextStep?: string;
  updatedProgress?: {
    quizzesCompleted: number;
    exercisesCompleted: number;
    score: number;
    mastery: string;
    adaptiveDifficulty: string;
    levelIndex: number;
    leveledUp?: boolean;
    message?: string;
  };
}

export interface DetailedCorrectionItem {
  questionIndex: number;
  question: string;
  studentAnswer: string;
  status: 'correct' | 'partiel' | 'incorrect' | 'non_repondu';
  score: number;
  feedback: string;
  expectedSolution: string;
}

export interface ExerciseEvaluationResponse {
  score: number;
  passed?: boolean;
  appreciation: string;
  feedback: string;
  strengths: string[];
  areasToImprove: string[];
  encouragement: string;
  detailedCorrection?: DetailedCorrectionItem[];
  updatedProgress?: {
    quizzesCompleted: number;
    exercisesCompleted: number;
    score: number;
    mastery: string;
    adaptiveDifficulty: string;
    levelIndex: number;
    leveledUp?: boolean;
    message?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiLearningService {
  private seenQuestions = new Set<string>();

  constructor(
    private http: HttpClient,
    private profileService: ProfileService
  ) {}

  private getHeaders(): HttpHeaders {
    const student = this.profileService.currentProfile;
    const studentId = student?.id || 'default-student';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-student-id': studentId
    });
  }

  /**
   * Fetches adaptive difficulty and mastery statistics for a subject.
   */
  getAdaptiveDifficulty(subject: string): Observable<any> {
    return this.http.get<any>(`/api/ai/adaptive-difficulty/${encodeURIComponent(subject)}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(() => of({ difficulty: 'Débutant', levelIndex: 1, quizzesCompleted: 0, exercisesCompleted: 0, score: 0 }))
    );
  }

  /**
   * Generates dynamic, varied quiz questions via AI Tutor with adaptive difficulty.
   */
  generateQuiz(
    subject: string,
    topic?: string,
    difficulty?: string,
    count: number = 10
  ): Observable<QuizGenerateResponse> {
    const avoidQuestions = Array.from(this.seenQuestions).slice(-20);
    const student = this.profileService.currentProfile;
    const level = student?.educationLevel || '1ère année primaire';
    const body = {
      subject,
      topic,
      level,
      difficulty: difficulty || 'auto',
      count,
      avoidQuestions
    };

    return this.http.post<QuizGenerateResponse>('/api/ai/quiz/generate', body, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.questions) {
          res.questions.forEach(q => this.seenQuestions.add(q.question));
        }
      }),
      catchError(err => {
        console.warn('[AiLearningService] Quiz generation error, returning fallback:', err);
        const fallbackQuestions = this.generateEmergencyQuestions(subject, difficulty || 'Débutant', count);
        return of({
          topic: topic || `Validation et consolidation en ${subject}`,
          questions: fallbackQuestions,
          difficulty: difficulty || 'Débutant',
          adaptiveDifficulty: difficulty || 'Débutant',
          levelIndex: difficulty === 'Avancé' ? 3 : difficulty === 'Intermédiaire' ? 2 : 1,
          generatedBy: 'Tuteur IA (Banque certifiée de secours)'
        });
      })
    );
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private randomizeOptions(item: QuizItem): QuizItem {
    const correctOpt = item.options[item.correctIndex];
    const shuffled = this.shuffleArray(item.options);
    const newIdx = shuffled.indexOf(correctOpt);
    return {
      ...item,
      options: shuffled,
      correctIndex: newIdx >= 0 ? newIdx : 0
    };
  }

  private finalizeEmergencyBatch(bank: QuizItem[], count: number): QuizItem[] {
    return this.shuffleArray(bank)
      .slice(0, count)
      .map(q => this.randomizeOptions(q));
  }

  private generateCPQuestions(subjectLower: string, count: number): QuizItem[] {
    const s = subjectLower;
    // Math CP (1-10, additions simples <= 10, formes)
    if (s.includes('math') || s.includes('calcul') || s.includes('geom') || s.includes('géom')) {
      const cpMath: QuizItem[] = [
        { question: 'Combien font 2 + 1 ?', options: ['3', '4', '2', '5'], correctIndex: 0, explanation: '2 et encore 1, cela fait 3.' },
        { question: 'Quel nombre vient juste après 4 ?', options: ['5', '3', '6', '2'], correctIndex: 0, explanation: 'Après 4, vient le nombre 5.' },
        { question: 'Quelle est la forme d\'un ballon de football ?', options: ['Un rond (cercle)', 'Un carré', 'Un triangle', 'Un rectangle'], correctIndex: 0, explanation: 'Un ballon est tout rond comme un cercle.' },
        { question: 'Combien de doigts avons-nous sur une main ?', options: ['5 doigts', '2 doigts', '10 doigts', '3 doigts'], correctIndex: 0, explanation: 'Une main possède 5 doigts.' },
        { question: 'Combien font 3 + 2 ?', options: ['5', '4', '6', '3'], correctIndex: 0, explanation: '3 + 2 = 5.' },
        { question: 'Quel est le plus grand nombre entre 2 et 8 ?', options: ['8', '2', '1', '3'], correctIndex: 0, explanation: '8 est plus grand que 2.' },
        { question: 'Combien de côtés possède un triangle ?', options: ['3 côtés', '4 côtés', '2 côtés', '5 côtés'], correctIndex: 0, explanation: 'Un triangle a 3 côtés.' },
        { question: 'Combien font 4 + 1 ?', options: ['5', '6', '3', '4'], correctIndex: 0, explanation: '4 + 1 = 5.' },
        { question: 'J\'ai 3 bonbons, j\'en mange 1, combien m\'en reste-t-il ?', options: ['2', '1', '3', '4'], correctIndex: 0, explanation: '3 - 1 = 2 bonbons.' },
        { question: 'Quel nombre vient juste avant 7 ?', options: ['6', '8', '5', '7'], correctIndex: 0, explanation: 'Avant 7, on compte le nombre 6.' }
      ];
      return this.finalizeEmergencyBatch(cpMath, count);
    }

    // Français CP (alphabet, voyelles, mots familiers, articles)
    if (s.includes('franc') || s.includes('franç')) {
      const cpFr: QuizItem[] = [
        { question: 'Quelle lettre est une voyelle ?', options: ['A', 'B', 'T', 'M'], correctIndex: 0, explanation: 'La lettre A est une voyelle.' },
        { question: 'Quel mot commence par la lettre P ?', options: ['Pomme', 'Chat', 'Vélo', 'Table'], correctIndex: 0, explanation: 'Pomme commence par le son [p] et la lettre P.' },
        { question: 'On dit : un ballon ou une ballon ?', options: ['Un ballon', 'Une ballon', 'Des ballon', 'La ballon'], correctIndex: 0, explanation: 'On dit « un ballon » car c\'est un mot masculin.' },
        { question: 'On dit : le soleil ou la soleil ?', options: ['Le soleil', 'La soleil', 'Une soleil', 'Les soleil'], correctIndex: 0, explanation: 'On dit « le soleil ».' },
        { question: 'Quel animal aboie et remue la queue ?', options: ['Le chien', 'Le chat', 'Le poisson', 'La tortue'], correctIndex: 0, explanation: 'Le chien aboie.' },
        { question: 'Quel objet sert à gommer une erreur ?', options: ['La gomme', 'La règle', 'Le cartable', 'Le crayon'], correctIndex: 0, explanation: 'La gomme sert à effacer.' },
        { question: 'Que dit-on le matin en arrivant à l\'école ?', options: ['Bonjour', 'Bonne nuit', 'Au revoir', 'Dors bien'], correctIndex: 0, explanation: 'Le matin, on salue en disant « Bonjour ».' },
        { question: 'Quel est le contraire du mot « grand » ?', options: ['Petit', 'Beau', 'Chaud', 'Gentil'], correctIndex: 0, explanation: 'Le contraire de grand est petit.' },
        { question: 'De quelle couleur est une banane mûre ?', options: ['Jaune', 'Bleue', 'Rouge', 'Noire'], correctIndex: 0, explanation: 'Une banane mûre est jaune.' },
        { question: 'Combien de syllabes entend-on dans « ba-na-ne » ?', options: ['3 syllabes', '1 syllabe', '5 syllabes', '2 syllabes'], correctIndex: 0, explanation: 'Ba-na-ne compte 3 syllabes orales.' }
      ];
      return this.finalizeEmergencyBatch(cpFr, count);
    }

    // Arabe CP (حروف، حركات، هذا/هذه، أدوات المدرسة)
    if (s.includes('arab') || s.includes('عرب')) {
      const cpAr: QuizItem[] = [
        { question: 'مَا هُوَ الحَرْفُ الأَوَّلُ فِي كَلِمَةِ «بَاب» ؟', options: ['حَرْفُ البَاءِ', 'حَرْفُ المِيمِ', 'حَرْفُ الرَّاءِ', 'حَرْفُ الدَّالِ'], correctIndex: 0, explanation: 'تبدأ كلمة باب بحرف الباء.' },
        { question: 'نَقُولُ لِلْوَلَدِ :', options: ['هَذَا وَلَدٌ', 'هَذِهِ وَلَدٌ', 'تِلْكَ وَلَدٌ', 'هُنَاكَ وَلَدٌ'], correctIndex: 0, explanation: 'هذا اسم إشارة للمذكر: هذا ولد.' },
        { question: 'نَقُولُ لِلْبِنْتِ :', options: ['هَذِهِ بِنْتٌ', 'هَذَا بِنْتٌ', 'ذَلِكَ بِنْتٌ', 'هُوَ بِنْتٌ'], correctIndex: 0, explanation: 'هذه اسم إشارة للمؤنث: هذه بنت.' },
        { question: 'بِمَاذَا نَكْتُبُ الدَّرْسَ فِي الدَّفْتَرِ ؟', options: ['بِالقَلَمِ', 'بِالمِمْحَاةِ', 'بِالمِسْطَرَةِ', 'بِالمِحْفَظَةِ'], correctIndex: 0, explanation: 'نكتب بالقلم.' },
        { question: 'مَا هُوَ الحَيَوَانُ الَّذِي يَقُولُ «مِيَاو» ؟', options: ['القِطُّ', 'الكَلْبُ', 'الحِصَانُ', 'الخَرُوفُ'], correctIndex: 0, explanation: 'القط هو الذي يموء.' },
        { question: 'مَا هُوَ لَوْنُ الشَّمْسِ ؟', options: ['أَصْفَر', 'أَزْرَق', 'أَخْضَر', 'أَسْوَد'], correctIndex: 0, explanation: 'الشمس لونها أصفر.' },
        { question: 'الحَرَكَةُ فَوْقَ حَرْفِ الدَّالِ فِي كَلِمَةِ «دَار» هِيَ :', options: ['الفَتْحَة', 'الضَّمَّة', 'الكَسْرَة', 'السُّكُون'], correctIndex: 0, explanation: 'فوق الدال فتحة: دَ.' },
        { question: 'بِمَاذَا نَمْسَحُ الخَطَأَ فِي الدَّفْتَرِ ؟', options: ['بِالمِمْحَاةِ', 'بِالقَلَمِ', 'بِالمِسْطَرَةِ', 'بِالمِقَصِّ'], correctIndex: 0, explanation: 'نمسح الخطأ بالممحاة.' },
        { question: 'كَمْ عَدَدُ حُرُوفِ كَلِمَةِ «دَار» ؟', options: ['3 حُرُوف', 'حَرْفَانِ', '4 حُرُوف', '5 حُرُوف'], correctIndex: 0, explanation: 'د - ا - ر : 3 حروف.' },
        { question: 'عِنْدَمَا نَلْتَقِي بِأَصْدِقَائِنَا نَقُولُ :', options: ['السَّلَامُ عَلَيْكُمْ', 'مَعَ السَّلَامَة', 'إِلَى اللِّقَاء', 'تَصْبَحُ عَلَى خَيْر'], correctIndex: 0, explanation: 'تحية الإسلام هي السلام عليكم.' }
      ];
      return this.finalizeEmergencyBatch(cpAr, count);
    }

    // Éducation islamique CP
    if (s.includes('islam') || s.includes('تربية')) {
      const cpIslam: QuizItem[] = [
        { question: 'كَمْ عَدَدُ أَرْكَانِ الإِسْلَامِ ؟', options: ['5 أَرْكَان', '3 أَرْكَان', '7 أَرْكَان', '10 أَرْكَان'], correctIndex: 0, explanation: 'أركان الإسلام خمسة.' },
        { question: 'مَاذَا نَقُولُ قَبْلَ أَنْ نَأْكُلَ الطَّعَامَ ؟', options: ['بِسْمِ اللَّهِ', 'الحَمْدُ لِلَّهِ', 'أَسْتَغْفِرُ اللَّه', 'سُبْحَانَ اللَّه'], correctIndex: 0, explanation: 'نسمي الله ونقول باسم الله.' },
        { question: 'مَاذَا نَقُولُ بَعْدَ الاِنْتِهَاءِ مِنَ الأَكْلِ ؟', options: ['الحَمْدُ لِلَّهِ', 'بِسْمِ اللَّهِ', 'لاَ إِلَهَ إِلاَّ اللَّه', 'مَعَ السَّلَامَة'], correctIndex: 0, explanation: 'نحمد الله ونقول الحمد لله.' },
        { question: 'الرُّكْنُ الأَوَّلُ مِنْ أَرْكَانِ الإِسْلَامِ هُوَ :', options: ['الشَّهَادَتَانِ', 'الصَّوْمُ', 'الحَجُّ', 'الزَّكَاةُ'], correctIndex: 0, explanation: 'الركن الأول هو الشهادتان.' },
        { question: 'مَا هِيَ السُّورَةُ الَّتِي نَقْرَؤُهَا فِي كُلِّ رَكْعَةٍ ؟', options: ['سُورَةُ الفَاتِحَة', 'سُورَةُ الإِخْلَاص', 'سُورَةُ النَّاس', 'سُورَةُ الفَلَق'], correctIndex: 0, explanation: 'سورة الفاتحة نقرؤها في كل ركعة.' },
        { question: 'مَنْ هُوَ نَبِيُّنَا الكَرِيمُ ؟', options: ['مُحَمَّدٌ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّم', 'إِبْرَاهِيم عَلَيْهِ السَّلَام', 'مُوسَى عَلَيْهِ السَّلَام', 'عِيسَى عَلَيْهِ السَّلَام'], correctIndex: 0, explanation: 'نبينا هو محمد صلى الله عليه وسلم.' },
        { question: 'كَيْفَ نُعَامِلُ أُمَّنَا وَأَبَانَا ؟', options: ['بِالإِحْسَانِ وَالاحْتِرَامِ', 'بِالغَضَبِ', 'بِالصُّرَاخِ', 'بِالإِهْمَالِ'], correctIndex: 0, explanation: 'بر الوالدين واجب بالإحسان والاحترام.' }
      ];
      return this.finalizeEmergencyBatch(cpIslam, count);
    }

    // Éveil scientifique CP (5 sens, corps, hygiène, animaux)
    if (s.includes('bio') || s.includes('svt') || s.includes('scien')) {
      const cpScience: QuizItem[] = [
        { question: 'Avec quel organe de notre corps pouvons-nous voir les couleurs ?', options: ['Les yeux', 'Les oreilles', 'Le nez', 'La bouche'], correctIndex: 0, explanation: 'La vue se fait avec les deux yeux.' },
        { question: 'Avec quoi écoutons-nous une belle musique ?', options: ['Les oreilles', 'Les yeux', 'Les mains', 'Le nez'], correctIndex: 0, explanation: 'L\'ouïe se fait avec les oreilles.' },
        { question: 'Comment s\'appelle le bébé de la poule ?', options: ['Le poussin', 'Le chiot', 'Le chaton', 'L\'agneau'], correctIndex: 0, explanation: 'Le bébé de la poule est le poussin.' },
        { question: 'Que faut-il faire avant de passer à table pour manger ?', options: ['Se laver les mains avec du savon', 'Courir dehors', 'Dormir', 'Dessiner'], correctIndex: 0, explanation: 'Une bonne hygiène commence par se laver les mains.' },
        { question: 'De quoi a besoin une petite plante pour bien grandir ?', options: ['D\'eau et de soleil', 'De bonbons', 'De jouets', 'De soda'], correctIndex: 0, explanation: 'La plante a besoin d\'eau et de lumière.' },
        { question: 'Quand le soleil se couche et qu\'il fait nuit, que voit-on dans le ciel ?', options: ['La lune et les étoiles', 'Le grand soleil', 'Un arc-en-ciel', 'Des nuages de pluie'], correctIndex: 0, explanation: 'La nuit, on aperçoit la lune et les étoiles.' }
      ];
      return this.finalizeEmergencyBatch(cpScience, count);
    }

    // Anglais CP
    if (s.includes('anglais') || s.includes('engl')) {
      const cpEn: QuizItem[] = [
        { question: 'What do you say in the morning to say hello?', options: ['Good morning', 'Good night', 'Goodbye', 'Sleep well'], correctIndex: 0, explanation: 'In the morning, we say Good morning!' },
        { question: 'What color is the sun?', options: ['Yellow', 'Blue', 'Black', 'Purple'], correctIndex: 0, explanation: 'The sun is yellow.' },
        { question: 'Which number comes after One (1)?', options: ['Two (2)', 'Three (3)', 'Zero (0)', 'Five (5)'], correctIndex: 0, explanation: 'After 1 comes 2.' },
        { question: 'Which animal says "Meow"?', options: ['Cat', 'Dog', 'Bird', 'Fish'], correctIndex: 0, explanation: 'The cat says meow.' },
        { question: 'How many hands do you have?', options: ['Two (2)', 'One (1)', 'Four (4)', 'Ten (10)'], correctIndex: 0, explanation: 'We have two hands.' }
      ];
      return this.finalizeEmergencyBatch(cpEn, count);
    }

    // Default CP fallback
    const cpDef: QuizItem[] = [
      { question: 'Combien font 1 + 1 ?', options: ['2', '3', '1', '4'], correctIndex: 0, explanation: '1 + 1 = 2.' },
      { question: 'Quelle est la première lettre de l\'alphabet ?', options: ['A', 'B', 'C', 'Z'], correctIndex: 0, explanation: 'L\'alphabet commence par la lettre A.' },
      { question: 'Quel animal est le meilleur ami de l\'homme ?', options: ['Le chien', 'Le lion', 'Le requin', 'Le serpent'], correctIndex: 0, explanation: 'Le chien est fidèle et affectueux.' }
    ];
    return this.finalizeEmergencyBatch(cpDef, count);
  }

  /**
   * Generates a calibrated multi-question fallback set so students never see a truncated quiz.
   */
  generateEmergencyQuestions(subject: string, difficulty: string, targetCount: number = 10): QuizItem[] {
    const s = (subject || '').toLowerCase();
    const count = Math.max(3, Math.min(15, targetCount || 10));

    const student = this.profileService.currentProfile;
    const lvl = (student?.educationLevel || '').toLowerCase();
    const isCP = lvl.includes('1ère année primaire') || lvl.includes('1ere annee primaire') || lvl.includes('1ère primaire') || lvl.includes('cp') || lvl.includes('1 ap') || lvl.includes('première primaire');

    if (isCP) {
      return this.generateCPQuestions(s, count);
    }

    // Specific bank for Islamic Education (in authentic Arabic with Tashkeel)
    if (s.includes('islam') || s.includes('coran') || s.includes('tarbiya') || s.includes('dîn') || s.includes('din') || s.includes('إسلام')) {
      const islamBank: QuizItem[] = [
        {
          question: 'كَمْ عَدَدُ أَرْكَانِ الإِسْلاَمِ ؟',
          options: ['خَمْسَةُ أَرْكَانٍ', 'سِتَّةُ أَرْكَانٍ', 'أَرْبَعَةُ أَرْكَانٍ', 'ثَلاَثَةُ أَرْكَانٍ'],
          correctIndex: 0,
          explanation: 'أركان الإسلام خمسة : الشهادتان، الصلاة، الزكاة، الصوم، وحج البيت.'
        },
        {
          question: 'مَا هُوَ الرُّكْنُ الأَوَّلُ مِنْ أَرْكَانِ الإِسْلاَمِ ؟',
          options: ['شَهَادَةُ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ', 'إِقَامُ الصَّلاَةِ', 'إِيتَاءُ الزَّكَاةِ', 'صَوْمُ رَمَضَانَ'],
          correctIndex: 0,
          explanation: 'الركن الأساسي الذي يدخل به المرء في الإسلام هو الشهادتان.'
        },
        {
          question: 'كَمْ عَدَدُ الصَّلَوَاتِ المَفْرُوضَةِ فِي اليَوْمِ وَاللَّيْلَةِ ؟',
          options: ['خَمْسُ صَلَوَاتٍ', 'أَرْبَعُ صَلَوَاتٍ', 'ثَلاَثُ صَلَوَاتٍ', 'سَبْعُ صَلَوَاتٍ'],
          correctIndex: 0,
          explanation: 'الصلوات المفروضة خمس : الصبح، الظهر، العصر، المغرب، والعشاء.'
        },
        {
          question: 'مَا هُوَ الشَّهْرُ الَّذِي يَصُومُهُ المُسْلِمُونَ فَرِيضَةً ؟',
          options: ['شَهْرُ رَمَضَانَ', 'شَهْرُ شَعْبَانَ', 'شَهْرُ رَجَبٍ', 'شَهْرُ شَوَّالٍ'],
          correctIndex: 0,
          explanation: 'صيام شهر رمضان هو الركن الرابع من أركان الإسلام.'
        },
        {
          question: 'مَنْ هُوَ خَاتَمُ الأَنْبِيَاءِ وَالمُرْسَلِينَ عَلَيْهِمُ السَّلاَمُ ؟',
          options: ['مُحَمَّدٌ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ', 'إِبْرَاهِيمُ عَلَيْهِ السَّلاَمُ', 'مُوسَى عَلَيْهِ السَّلاَمُ', 'عِيسَى عَلَيْهِ السَّلاَمُ'],
          correctIndex: 0,
          explanation: 'سيدنا محمد صلى الله عليه وسلم هو خاتم الأنبياء والمرسلين.'
        },
        {
          question: 'مَا هُوَ الكِتَابُ السَّمَاوِيُّ الَّذِي أُنْزِلَ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ ؟',
          options: ['القُرْآنُ الكَرِيمُ', 'التَّوْرَاةُ', 'الإِنْجِيلُ', 'الزَّبُورُ'],
          correctIndex: 0,
          explanation: 'أنزل الله تعالى القرآن الكريم على رسوله محمد هدى للناس.'
        },
        {
          question: 'مَا هِيَ القِبْلَةُ الَّتِي يَتَّجِهُ إِلَيْهَا المُسْلِمُونَ فِي صَلاَتِهِمْ ؟',
          options: ['الكَعْبَةُ المُشَرَّفَةُ بِمَكَّةَ المُكَرَّمَةِ', 'المَسْجِدُ الأَقْصَى', 'المَسْجِدُ النَّبَوِيُّ', 'جَبَلُ عَرَفَاتٍ'],
          correctIndex: 0,
          explanation: 'الكعبة المشرفة في المسجد الحرام هي قبلة المسلمين في الصلاة.'
        },
        {
          question: 'مَا هُوَ شَرْطُ صِحَّةِ الصَّلاَةِ الَّذِي يَكُونُ بِالتَّطَهُّرِ بِالمَاءِ ؟',
          options: ['الوُضُوءُ وَالطَّهَارَةُ', 'تَنَاوُلُ الطَّعَامِ', 'قِرَاءَةُ كِتَابٍ', 'النَّوْمُ قَبْلَ الصَّلاَةِ'],
          correctIndex: 0,
          explanation: 'الوضوء والطهارة شرط أساسي لصحة الصلاة.'
        },
        {
          question: 'مَا هِيَ السُّورَةُ الَّتِي نَقْرَؤُهَا فِي كُلِّ رَكْعَةٍ مِنَ الصَّلاَةِ ؟',
          options: ['سُورَةُ الفَاتِحَةِ', 'سُورَةُ الإِخْلاَصِ', 'سُورَةُ النَّاسِ', 'سُورَةُ الفَلَقِ'],
          correctIndex: 0,
          explanation: 'سورة الفاتحة ركن أساسي في كل ركعة من ركعات الصلاة.'
        },
        {
          question: 'كَمْ عَدَدُ أَرْكَانِ الإِيمَانِ ؟',
          options: ['سِتَّةُ أَرْكَانٍ', 'خَمْسَةُ أَرْكَانٍ', 'أَرْبَعَةُ أَرْكَانٍ', 'سَبْعَةُ أَرْكَانٍ'],
          correctIndex: 0,
          explanation: 'أركان الإيمان ستة (الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره).'
        },
        {
          question: 'مَا هُوَ اسْمُ المَلَكِ المُوَكَّلِ بِإِنْزَالِ الوَحْيِ عَلَى الأَنْبِيَاءِ ؟',
          options: ['جِبْرِيلُ عَلَيْهِ السَّلاَمُ', 'مِيكَائِيلُ عَلَيْهِ السَّلاَمُ', 'إِسْرَافِيلُ عَلَيْهِ السَّلاَمُ', 'مَلَكُ المَوْتِ'],
          correctIndex: 0,
          explanation: 'سيدنا جبريل عليه السلام هو الروح الأمين المكلف بالوحي.'
        },
        {
          question: 'مَا هُوَ الخُلُقُ العَظِيمُ الَّذِي كَانَ يُلَقَّبُ بِهِ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَبْلَ البِعْثَةِ ؟',
          options: ['الصَّادِقُ الأَمِينُ', 'الشَّاعِرُ الفَصِيحُ', 'التَّاجِرُ الغَنِيُّ', 'المُحَارِبُ الشُّجَاعُ'],
          correctIndex: 0,
          explanation: 'لقب صلى الله عليه وسلم بين قومه بالصادق الأمين لأمانته وصدقه.'
        },
        {
          question: 'مَاذَا نَقُولُ قَبْلَ البَدْءِ فِي تَنَاوُلِ الطَّعَامِ أَوْ أَيِّ عَمَلٍ صَالِحٍ ؟',
          options: ['بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ', 'الحَمْدُ للهِ', 'أَسْتَغْفِرُ اللهَ', 'سُبْحَانَ اللهِ'],
          correctIndex: 0,
          explanation: 'تسن التسمية « بسم الله » في بداية كل عمل مبارك.'
        },
        {
          question: 'مَاذَا نَقُولُ عِنْدَ الفَرَاغِ مِنَ الأَكْلِ وَالشُّرْبِ شُكْرًا للهِ تَعَالَى ؟',
          options: ['الحَمْدُ للهِ', 'بِسْمِ اللهِ', 'لاَ إِلَهَ إِلاَّ اللهُ', 'اللهُ أَكْبَرُ'],
          correctIndex: 0,
          explanation: 'حمد الله والثناء عليه بعد الطعام والشراب من السنن المستحبة.'
        },
        {
          question: 'مَا هُوَ حُكْمُ الصِّدْقِ فِي الإِسْلاَمِ ؟',
          options: ['وَاجِبٌ وَخُلُقٌ عَظِيمٌ', 'مُسْتَحْسَنٌ فَقَطْ', 'غَيْرُ ضَرُورِيٍّ', 'مَكْرُوهٌ'],
          correctIndex: 0,
          explanation: 'الصدق واجب إسلامي أصيل ويهدي إلى البر والجنة.'
        }
      ];
      return this.finalizeEmergencyBatch(islamBank, count);
    }

    // Specific bank for Arabic Language (in authentic Arabic with Tashkeel)
    if (s.includes('arab') || s.includes('عرب')) {
      const arabicBank: QuizItem[] = [
        {
          question: 'مَا هُوَ ضِدُّ كَلِمَةِ « كَبِيرٌ » فِي اللُّغَةِ العَرَبِيَّةِ ؟',
          options: ['صَغِيرٌ', 'جَمِيلٌ', 'قَصِيرٌ', 'سَرِيعٌ'],
          correctIndex: 0,
          explanation: 'ضدّ « كَبِيرٌ » هو « صَغِيرٌ ».'
        },
        {
          question: 'فِي جُمْلَةِ « قَرَأَ التِّلْمِيذُ كِتَابًا »، أَيْنَ هُوَ الفَاعِلُ ؟',
          options: ['التِّلْمِيذُ', 'قَرَأَ', 'كِتَابًا', 'مَحْذُوفٌ'],
          correctIndex: 0,
          explanation: '« التِّلْمِيذُ » هو الفاعل المرفوع بالضمة الظاهرة.'
        },
        {
          question: 'مَا هُوَ جَمْعُ كَلِمَةِ « كِتَاب » ؟',
          options: ['كُتُبٌ', 'كِتَابَاتٌ', 'كَاتِبُونَ', 'مَكْتَبَاتٌ'],
          correctIndex: 0,
          explanation: 'جمع تكسير لكلمة « كِتَاب » هو « كُتُبٌ ».'
        },
        {
          question: 'أَيٌّ مِنَ الحُرُوفِ التَّالِيَةِ يُعَدُّ حَرْفَ جَرٍّ ؟',
          options: ['فِي', 'إِنَّ', 'لَكِنَّ', 'سَوْفَ'],
          correctIndex: 0,
          explanation: '« فِي » من حروف الجر التي تجر الاسم بعدها.'
        },
        {
          question: 'مَا هُوَ مُؤَنَّثُ كَلِمَةِ « مُعَلِّمٌ » ؟',
          options: ['مُعَلِّمَةٌ', 'مُعَلِّمَاتٌ', 'مُعَلِّمُونَ', 'مُعَلِّمَتَانِ'],
          correctIndex: 0,
          explanation: 'يصاغ المؤنث بزيادة التاء المربوطة في آخره : مُعَلِّمَةٌ.'
        },
        {
          question: 'كَمْ عَدَدُ حُرُوفِ الهِجَاءِ فِي اللُّغَةِ العَرَبِيَّةِ ؟',
          options: ['28 حَرْفًا', '24 حَرْفًا', '30 حَرْفًا', '26 حَرْفًا'],
          correctIndex: 0,
          explanation: 'عدد الحروف الهجائية هو 28 حرفاً تبدأ بالألف وتنتهي بالياء.'
        },
        {
          question: 'مَا هُوَ نَوْعُ الكَلِمَةِ « يَكْتُبُ » ؟',
          options: ['فِعْلٌ مُضَارِعٌ', 'اسْمٌ', 'فِعْلٌ مَاضٍ', 'حَرْفٌ'],
          correctIndex: 0,
          explanation: '« يَكْتُبُ » فعل مضارع يدل على حدث يقع في الحاضر.'
        },
        {
          question: 'مَا هِيَ الكَلِمَةُ الَّتِي تُعْتَبَرُ اسْمًا مِمَّا يَلِي ؟',
          options: ['مَدْرَسَةٌ', 'يَذْهَبُ', 'عَلَى', 'ثُمَّ'],
          correctIndex: 0,
          explanation: '« مَدْرَسَةٌ » اسم يقبل التنوين والتاء المربوطة.'
        },
        {
          question: 'مَا هُوَ ضِدُّ كَلِمَةِ « النُّورُ » ؟',
          options: ['الظَّلاَمُ', 'الشَّمْسُ', 'القَمَرُ', 'النَّهَارُ'],
          correctIndex: 0,
          explanation: 'ضد النور هو الظلام.'
        },
        {
          question: 'أَيٌّ مِنَ الكَلِمَاتِ التَّالِيَةِ كُتِبَتْ فِيهَا التَّاءُ مَرْبُوطَةً ؟',
          options: ['فَرَاشَةٌ', 'بِنْتٌ', 'بَيْتٌ', 'سَافَرَتْ'],
          correctIndex: 0,
          explanation: '« فَرَاشَةٌ » تنتهي بتاء مربوطة.'
        },
        {
          question: 'فِي جُمْلَةِ « السَّمَاءُ صَافِيَةٌ »، مَا هُوَ إِعْرَابُ « السَّمَاءُ » ؟',
          options: ['مُبْتَدَأٌ مَرْفُوعٌ', 'خَبَرٌ مَرْفُوعٌ', 'فَاعِلٌ مَرْفُوعٌ', 'مَفْعُولٌ بِهِ'],
          correctIndex: 0,
          explanation: '« السَّمَاءُ » اسم تبدأ به الجملة الاسمية فهو مبتدأ.'
        },
        {
          question: 'مَا هُوَ مُثَنَّى كَلِمَةِ « قَلَمٌ » فِي حَالَةِ الرَّفْعِ ؟',
          options: ['قَلَمَانِ', 'أَقْلاَمٌ', 'قَلَمَيْنِ', 'قَلَمَاتٌ'],
          correctIndex: 0,
          explanation: 'يرفع المثنى بالألف والنون : قَلَمَانِ.'
        },
        {
          question: 'أَيٌّ مِنَ التَّرَاكِيبِ التَّالِيَةِ يُمَثِّلُ جُمْلَةً فِعْلِيَّةً ؟',
          options: ['نَجَحَ التِّلْمِيذُ فِي الاِمْتِحَانِ', 'الوَلَدُ مُؤَدَّبٌ', 'البَيْتُ نَظِيفٌ', 'الشَّمْسُ مُشْرِقَةٌ'],
          correctIndex: 0,
          explanation: 'الجملة الفعلية هي التي تبدأ بفعل : « نَجَحَ التِّلْمِيذُ ».'
        },
        {
          question: 'مَا هُوَ الفِعْلُ المَاضِي مِنْ « يَجْلِسُ » ؟',
          options: ['جَلَسَ', 'اِجْلِسْ', 'جَالِسٌ', 'جُلُوسٌ'],
          correctIndex: 0,
          explanation: '« جَلَسَ » فعل ماضٍ مبني على الفتح.'
        },
        {
          question: 'مَا هُوَ حَرْفُ العَطْفِ الَّذِي يُفِيدُ التَّرْتِيبَ مَعَ التَّرَاخِي ؟',
          options: ['ثُمَّ', 'الوَاوُ', 'الفَاءُ', 'أَوْ'],
          correctIndex: 0,
          explanation: '« ثُمَّ » حرف عطف يفيد الترتيب مع التراخي والمهلة.'
        }
      ];
      return this.finalizeEmergencyBatch(arabicBank, count);
    }

    // Specific bank for English Language (100% in authentic school English)
    if (s.includes('anglais') || s.includes('engl') || s.includes('english')) {
      const englishBank: QuizItem[] = [
        {
          question: 'Choose the correct sentence in the Present Simple:',
          options: [
            'She plays basketball every Tuesday.',
            'She play basketball every Tuesday.',
            'She is play basketball every Tuesday.',
            'She playing basketball every Tuesday.'
          ],
          correctIndex: 0,
          explanation: 'In the Present Simple with he/she/it, the verb takes an "-s" ending.'
        },
        {
          question: 'What is the past simple form of the irregular verb "to go"?',
          options: ['went', 'goed', 'gone', 'going'],
          correctIndex: 0,
          explanation: 'The past simple of the irregular verb "go" is "went".'
        },
        {
          question: 'Complete the sentence: "Yesterday, I ______ my homework before dinner."',
          options: ['finished', 'finish', 'finishing', 'will finish'],
          correctIndex: 0,
          explanation: '"Yesterday" indicates past time, so we use the Past Simple "finished".'
        },
        {
          question: 'What is the opposite of the adjective "noisy"?',
          options: ['quiet', 'crowded', 'funny', 'difficult'],
          correctIndex: 0,
          explanation: '"Quiet" means with very little noise (the opposite of noisy).'
        },
        {
          question: 'Which preposition correctly completes: "The school bus arrives ______ 8:00 AM"?',
          options: ['at', 'on', 'in', 'under'],
          correctIndex: 0,
          explanation: 'We use the preposition "at" with clock times (at 8:00 AM).'
        },
        {
          question: 'What is the plural form of the noun "child"?',
          options: ['children', 'childs', 'childes', 'childrens'],
          correctIndex: 0,
          explanation: '"Children" is the irregular plural form of "child".'
        },
        {
          question: 'Which modal verb expresses a strong obligation in: "Students ______ arrive on time for exams"?',
          options: ['must', 'might', 'can', 'could'],
          correctIndex: 0,
          explanation: '"Must" expresses a mandatory obligation or requirement.'
        },
        {
          question: 'Choose the correct comparative form: "A cheetah is ______ than a lion."',
          options: ['faster', 'more fast', 'fastest', 'as fast'],
          correctIndex: 0,
          explanation: 'For short adjectives like "fast", we add "-er": faster than.'
        },
        {
          question: 'Complete the sentence: "Look! It ______ outside right now."',
          options: ['is raining', 'rains', 'rained', 'rain'],
          correctIndex: 0,
          explanation: '"Right now" and "Look!" indicate an action happening at the moment: Present Continuous (is raining).'
        },
        {
          question: 'How do you say "demain" in English?',
          options: ['Tomorrow', 'Yesterday', 'Today', 'Always'],
          correctIndex: 0,
          explanation: '"Tomorrow" means the day after today.'
        },
        {
          question: 'Complete with the correct question word: "______ is your English teacher? — Mr. Davis."',
          options: ['Who', 'Where', 'When', 'Why'],
          correctIndex: 0,
          explanation: '"Who" is used to ask about a person.'
        },
        {
          question: 'What is the past simple of the irregular verb "to see"?',
          options: ['saw', 'seen', 'seed', 'sawed'],
          correctIndex: 0,
          explanation: 'The past simple of "see" is "saw".'
        },
        {
          question: 'Choose the correct sentence:',
          options: [
            'There are three books on the table.',
            'There is three books on the table.',
            'There be three books on the table.',
            'There have three books on the table.'
          ],
          correctIndex: 0,
          explanation: 'With plural nouns ("three books"), we use "There are".'
        },
        {
          question: 'What is the opposite of the adjective "difficult"?',
          options: ['easy', 'heavy', 'boring', 'dark'],
          correctIndex: 0,
          explanation: '"Easy" means not hard to do (the opposite of difficult).'
        },
        {
          question: 'Complete with the correct pronoun: "My sister and I love reading; ______ go to the library every week."',
          options: ['we', 'they', 'you', 'she'],
          correctIndex: 0,
          explanation: '"My sister and I" is replaced by the first-person plural subject pronoun "we".'
        }
      ];
      return this.finalizeEmergencyBatch(englishBank, count);
    }

    // Specific bank for Computer Science (School level: Scratch, algorithms, computer parts, Internet safety)
    if (s.includes('info') || s.includes('ordinateur') || s.includes('algo') || s.includes('numérique')) {
      const infoBank: QuizItem[] = [
        {
          question: "Dans le logiciel Scratch, que permet de faire le bloc jaune « Quand le drapeau vert est cliqué » ?",
          options: [
            "Démarrer le programme et lancer l'animation des lutins",
            "Éteindre l'ordinateur",
            "Effacer tout le projet sans sauvegarde",
            "Changer la couleur de l'écran en vert"
          ],
          correctIndex: 0,
          explanation: "Le drapeau vert dans Scratch est le déclencheur principal qui initialise et lance le programme."
        },
        {
          question: "Quel composant de l'unité centrale est considéré comme le « cerveau » qui exécute les calculs et instructions ?",
          options: [
            "Le Processeur (CPU)",
            "La souris",
            "Le tapis de souris",
            "Le boîtier en plastique"
          ],
          correctIndex: 0,
          explanation: "Le processeur (CPU) effectue les calculs et traite toutes les instructions des programmes."
        },
        {
          question: "Quelle bonne pratique permet de créer un mot de passe robuste et sécurisé ?",
          options: [
            "Mélanger au moins 10 caractères avec majuscules, minuscules, chiffres et caractères spéciaux",
            "Utiliser sa date de naissance ou « 123456 »",
            "Donner son mot de passe à tous ses camarades",
            "Utiliser le même mot de passe très court partout"
          ],
          correctIndex: 0,
          explanation: "Un mot de passe long et varié (majuscules, minuscules, chiffres, symboles) est difficile à pirater."
        },
        {
          question: "En algorithmique, qu'appelle-t-on une « boucle » (ex: Répéter 10 fois) ?",
          options: [
            "Une instruction qui réexécute plusieurs fois la même série d'actions",
            "Un fil électrique emmêlé derrière l'écran",
            "Une erreur qui détruit le disque dur",
            "Une image ronde dessinée sur l'ordinateur"
          ],
          correctIndex: 0,
          explanation: "Une boucle permet de répéter automatiquement un bloc d'instructions un certain nombre de fois."
        },
        {
          question: "Quel périphérique permet de saisir du texte et des chiffres dans un ordinateur ?",
          options: ["Le clavier", "L'imprimante", "Les haut-parleurs", "Le scanner"],
          correctIndex: 0,
          explanation: "Le clavier est le périphérique d'entrée principal pour la saisie textuelle."
        },
        {
          question: "Quelle extension de fichier correspond généralement à un document de traitement de texte standard ?",
          options: [".docx (ou .odt)", ".mp3", ".jpg", ".mp4"],
          correctIndex: 0,
          explanation: ".docx et .odt sont les formats courants pour les documents texte (Word, LibreOffice Writer)."
        },
        {
          question: "Face à un message suspect sur Internet promettant un cadeau en échange de ses coordonnées, que faut-il faire ?",
          options: [
            "Ne pas cliquer, ne donner aucune information et en parler à un adulte responsable",
            "Donner immédiatement son adresse et son mot de passe",
            "Transférer le message à tous ses contacts",
            "Cliquer sur tous les liens inconnus"
          ],
          correctIndex: 0,
          explanation: "C'est une tentative d'hameçonnage (phishing) : il faut être vigilant et ne jamais divulguer d'informations personnelles."
        },
        {
          question: "Dans Scratch, comment appelle-t-on le personnage que l'on déplace et anime avec du code ?",
          options: ["Un lutin (ou Sprite)", "Un robot physique", "Une icône système", "Un pilote d'imprimante"],
          correctIndex: 0,
          explanation: "Dans Scratch, les personnages ou objets interactifs sont appelés des lutins (Sprites)."
        },
        {
          question: "Quel raccourci clavier permet de copier un texte sélectionné sur la plupart des ordinateurs ?",
          options: ["Ctrl + C", "Ctrl + P", "Ctrl + Z", "Alt + F4"],
          correctIndex: 0,
          explanation: "Ctrl + C copie la sélection dans le presse-papiers, et Ctrl + V permet de la coller."
        },
        {
          question: "Quelle mémoire de l'ordinateur stocke temporairement les données des applications en cours d'exécution ?",
          options: [
            "La mémoire vive (RAM)",
            "La clé USB débranchée",
            "Le câble réseau",
            "La carte son"
          ],
          correctIndex: 0,
          explanation: "La RAM (mémoire vive) permet un accès ultra-rapide aux données des programmes en cours d'exécution."
        }
      ];
      return this.finalizeEmergencyBatch(infoBank, count);
    }

    // ── MATHÉMATIQUES (Primaire & Collège) ──
    if (s.includes('math') || s.includes('calcul') || s.includes('géom') || s.includes('geom') || s.includes('algèb') || s.includes('algeb')) {
      const mathBank: QuizItem[] = [
        {
          question: "Combien font 7 × 8 ?",
          options: ["56", "54", "48", "64"],
          correctIndex: 0,
          explanation: "D'après la table de multiplication de 7 : 7 × 8 = 56."
        },
        {
          question: "Quelle est la valeur simplifiée de la fraction 12 / 16 ?",
          options: ["3 / 4", "2 / 3", "1 / 2", "6 / 7"],
          correctIndex: 0,
          explanation: "En divisant le numérateur et le dénominateur par 4 : 12÷4 = 3 et 16÷4 = 4, soit 3/4."
        },
        {
          question: "Quelle est la somme des angles dans n'importe quel triangle ?",
          options: ["180°", "360°", "90°", "270°"],
          correctIndex: 0,
          explanation: "Dans tout triangle du plan, la somme des trois angles mesure toujours 180°."
        },
        {
          question: "Quelle est la solution de l'équation 3x + 5 = 20 ?",
          options: ["x = 5", "x = 6", "x = 4", "x = 15"],
          correctIndex: 0,
          explanation: "3x = 20 - 5 = 15, donc x = 15 / 3 = 5."
        },
        {
          question: "Quelle est la formule du périmètre d'un rectangle de longueur L et de largeur l ?",
          options: ["2 × (L + l)", "L × l", "L + l", "4 × L"],
          correctIndex: 0,
          explanation: "Le périmètre est la somme des 4 côtés : 2 longueurs + 2 largeurs = 2 × (L + l)."
        },
        {
          question: "Dans un triangle rectangle, quel côté est opposé à l'angle droit et est le plus long ?",
          options: ["L'hypoténuse", "Le côté adjacent", "La médiane", "La hauteur"],
          correctIndex: 0,
          explanation: "L'hypoténuse est toujours le côté le plus long situé en face de l'angle droit."
        },
        {
          question: "Quelle est l'aire d'un carré dont le côté mesure 6 cm ?",
          options: ["36 cm²", "24 cm²", "12 cm²", "30 cm²"],
          correctIndex: 0,
          explanation: "Aire du carré = côté × côté = 6 × 6 = 36 cm²."
        },
        {
          question: "Quel est le résultat de (-4) + (-7) ?",
          options: ["-11", "-3", "11", "28"],
          correctIndex: 0,
          explanation: "On additionne deux nombres négatifs : (-4) + (-7) = -11."
        },
        {
          question: "Quelle est la racine carrée positive de 81 (notée √81) ?",
          options: ["9", "8", "7", "8,1"],
          correctIndex: 0,
          explanation: "9 × 9 = 81, donc √81 = 9."
        },
        {
          question: "Un pantalon à 200 DH bénéficie d'une remise de 20%. Quel est son nouveau prix ?",
          options: ["160 DH", "180 DH", "140 DH", "170 DH"],
          correctIndex: 0,
          explanation: "Remise = 200 × 0,20 = 40 DH. Nouveau prix = 200 - 40 = 160 DH."
        }
      ];
      return this.finalizeEmergencyBatch(mathBank, count);
    }

    // ── FRANÇAIS (Primaire & Collège) ──
    if (s.includes('franc') || s.includes('franç') || s.includes('litt')) {
      const frBank: QuizItem[] = [
        {
          question: "Dans la phrase « Le jeune chat dort sur le coussin », quelle est la nature grammaticale du mot « dort » ?",
          options: ["Un verbe conjugué", "Un nom commun", "Un adjectif qualificatif", "Un adverbe"],
          correctIndex: 0,
          explanation: "« dort » est la forme conjuguée du verbe dormir au présent de l'indicatif."
        },
        {
          question: "Quelle est la forme correcte au futur simple : « Demain, nous ______ à la bibliothèque. » ?",
          options: ["irons", "ironsons", "allons", "irions"],
          correctIndex: 0,
          explanation: "Le verbe aller au futur simple avec « nous » donne « irons »."
        },
        {
          question: "Dans la phrase « Les filles sont ______ à l'heure », comment s'accorde le participe passé ?",
          options: ["arrivées", "arrivé", "arrivée", "arrivés"],
          correctIndex: 0,
          explanation: "Avec l'auxiliaire être, le participe passé s'accorde en genre et en nombre avec le sujet « Les filles » (féminin pluriel : -ées)."
        },
        {
          question: "Quel est le pluriel régulier du mot « animal » ?",
          options: ["animaux", "animals", "animales", "animauxs"],
          correctIndex: 0,
          explanation: "Les noms masculins en -al font généralement leur pluriel en -aux."
        },
        {
          question: "Complétez la phrase avec l'homophone correct : « Youssef donne ______ livre ______ son ami. »",
          options: ["son / à", "sont / a", "son / a", "sont / à"],
          correctIndex: 0,
          explanation: "« son » est l'adjectif possessif, et « à » est la préposition avec accent."
        },
        {
          question: "Quelle est la fonction du groupe de mots « une pomme » dans la phrase « Sara mange une pomme » ?",
          options: ["Complément d'Objet Direct (COD)", "Sujet du verbe", "Complément Circonstanciel de Lieu", "Attribut du sujet"],
          correctIndex: 0,
          explanation: "Sara mange quoi ? « une pomme », c'est le Complément d'Objet Direct (COD)."
        },
        {
          question: "Quel temps de l'indicatif exprime une action passée ponctuelle et achevée dans un récit ?",
          options: ["Le passé simple", "L'imparfait", "Le présent", "Le futur simple"],
          correctIndex: 0,
          explanation: "Dans un récit au passé, le passé simple exprime les actions de premier plan ponctuelles."
        },
        {
          question: "Quelle figure de style rapproche deux éléments avec un outil de comparaison (« comme », « tel que ») ?",
          options: ["Une comparaison", "Une métaphore", "Une hyperbole", "Une personnification"],
          correctIndex: 0,
          explanation: "La comparaison relie le comparé et le comparant à l'aide d'un mot-outil."
        },
        {
          question: "Quel est l'antonyme (terme de sens opposé) du mot « courageux » ?",
          options: ["Lâche", "Fort", "Gentil", "Intelligent"],
          correctIndex: 0,
          explanation: "L'antonyme de courageux est peureux ou lâche."
        },
        {
          question: "Quel signe de ponctuation doit-on placer à la fin d'une phrase qui pose une question directe ?",
          options: ["Un point d'interrogation (?)", "Un point d'exclamation (!)", "Un point simple (.)", "Une virgule (,)"],
          correctIndex: 0,
          explanation: "La phrase interrogative directe se termine obligatoirement par un point d'interrogation (?)."
        }
      ];
      return this.finalizeEmergencyBatch(frBank, count);
    }

    // ── PHYSIQUE-CHIMIE (Collège) ──
    if (s.includes('phys') || s.includes('chim')) {
      const pcBank: QuizItem[] = [
        {
          question: "Comment appelle-t-on le passage de l'eau de l'état liquide à l'état gazeux (vapeur d'eau) ?",
          options: ["La vaporisation", "La solidification", "La fusion", "La condensation liquide"],
          correctIndex: 0,
          explanation: "Le passage du liquide au gaz s'appelle la vaporisation (ou évaporation)."
        },
        {
          question: "Quelle relation permet de calculer la vitesse moyenne v d'un mobile parcourant une distance d en un temps t ?",
          options: ["v = d / t", "v = d × t", "v = t / d", "v = d + t"],
          correctIndex: 0,
          explanation: "La vitesse est le quotient de la distance par le temps : v = d / t."
        },
        {
          question: "Quelle est la relation entre le poids P d'un objet et sa masse m à la surface de la Terre (avec g l'intensité de la pesanteur) ?",
          options: ["P = m × g", "P = m / g", "P = m + g", "P = g / m"],
          correctIndex: 0,
          explanation: "Le poids P (en Newtons) est proportionnel à la masse m (en kg) : P = m × g."
        },
        {
          question: "Quelle est l'unité légale de mesure de la masse dans le Système International ?",
          options: ["Le kilogramme (kg)", "Le Newton (N)", "Le gramme (g)", "Le mètre (m)"],
          correctIndex: 0,
          explanation: "Dans le système international d'unités, la masse se mesure en kilogrammes (kg)."
        },
        {
          question: "Dans un circuit électrique fermé, comment appelle-t-on les matériaux qui laissent facilement passer le courant électrique ?",
          options: ["Les conducteurs (ex: le cuivre)", "Les isolants (ex: le plastique)", "Les résistances pures", "Les générateurs"],
          correctIndex: 0,
          explanation: "Les métaux comme le cuivre ou l'aluminium sont d'excellents conducteurs électriques."
        },
        {
          question: "Quel gaz présent dans l'air (environ 21%) est indispensable aux combustions et à la respiration ?",
          options: ["Le dioxygène (O₂)", "Le diazote (N₂)", "L'hélium", "Le dioxyde de carbone (CO₂)"],
          correctIndex: 0,
          explanation: "Le dioxygène (O₂) est le comburant naturel indispensable pour brûler et respirer."
        },
        {
          question: "Quel test chimique permet de confirmer la présence de dioxyde de carbone (CO₂) ?",
          options: [
            "Il trouble l'eau de chaux",
            "Il fait exploser une allumette avec un bruit sec",
            "Il change l'eau en bleu",
            "Il n'existe aucun test"
          ],
          correctIndex: 0,
          explanation: "Le dioxyde de carbone trouble l'eau de chaux incolore en formant un précipité blanc."
        },
        {
          question: "À 25°C, quelle est la valeur du pH d'une solution neutre (comme l'eau pure) ?",
          options: ["pH = 7", "pH = 0", "pH = 14", "pH = 1"],
          correctIndex: 0,
          explanation: "Un pH égal à 7 indique une solution neutre. Inférieur à 7 c'est acide, supérieur à 7 c'est basique."
        },
        {
          question: "Dans un atome neutre, les électrons qui gravitent autour du noyau portent quelle charge électrique ?",
          options: ["Une charge négative (-)", "Une charge positive (+)", "Aucune charge (neutre)", "Une charge variable"],
          correctIndex: 0,
          explanation: "Les électrons portent une charge négative (-), compensée par les protons positifs du noyau."
        },
        {
          question: "Quelle est la formule de la loi d'Ohm pour un dipôle ohmique de résistance R traversé par un courant d'intensité I ?",
          options: ["U = R × I", "U = R / I", "U = I / R", "U = R + I"],
          correctIndex: 0,
          explanation: "La tension U aux bornes d'un conducteur ohmique vaut U = R × I."
        }
      ];
      return this.finalizeEmergencyBatch(pcBank, count);
    }

    // ── SVT / BIOLOGIE / ÉVEIL SCIENTIFIQUE (Primaire & Collège) ──
    if (s.includes('bio') || s.includes('svt') || s.includes('sant') || s.includes('éveil') || s.includes('eveil') || s.includes('terre') || s.includes('vie')) {
      const svtBank: QuizItem[] = [
        {
          question: "Quel organe du corps humain pompe le sang pour alimenter tous nos organes en oxygène et nutriments ?",
          options: ["Le cœur", "Le foie", "L'estomac", "Le pancréas"],
          correctIndex: 0,
          explanation: "Le cœur est un muscle creux qui fonctionne comme une pompe automatique infatigable."
        },
        {
          question: "De quoi une plante verte a-t-elle besoin pour réaliser la photosynthèse et fabriquer sa matière vivante ?",
          options: ["De lumière, d'eau et de dioxyde de carbone (CO₂)", "D'obscurité totale et de sel", "D'électricité et d'huile", "De froid polaire uniquement"],
          correctIndex: 0,
          explanation: "Les plantes vertes utilisent la lumière solaire, l'eau et le CO₂ grâce à leur chlorophylle."
        },
        {
          question: "Au niveau de quel organe a lieu le passage de l'oxygène de l'air inspiré vers les globules rouges du sang ?",
          options: ["Les alvéoles pulmonaires", "L'estomac", "Le gros intestin", "Les reins"],
          correctIndex: 0,
          explanation: "Les alvéoles pulmonaires sont des millions de petits sacs richement vascularisés où s'effectuent les échanges gazeux."
        },
        {
          question: "Où s'effectue principalement l'absorption des nutriments issus de la digestion vers la circulation sanguine ?",
          options: ["Dans l'intestin grêle (grâce aux villosités)", "Dans la bouche", "Dans l'œsophage", "Dans la vésicule biliaire"],
          correctIndex: 0,
          explanation: "Les villosités de l'intestin grêle offrent une immense surface d'échange permettant l'absorption des nutriments."
        },
        {
          question: "Qu'est-ce qu'une « chaîne alimentaire » dans la nature ?",
          options: [
            "Une suite d'êtres vivants dans laquelle chacun mange celui qui le précède",
            "Une chaîne en métal pour attacher les animaux",
            "Un magasin d'alimentation",
            "Un regroupement d'arbres dans une forêt"
          ],
          correctIndex: 0,
          explanation: "La chaîne alimentaire illustre les relations trophiques entre producteurs végétaux, herbivores et carnivores."
        },
        {
          question: "Comment appelle-t-on le point situé en surface de la Terre, à la verticale du foyer d'un tremblement de terre ?",
          options: ["L'épicentre", "Le cratère", "La faille", "Le magma"],
          correctIndex: 0,
          explanation: "L'épicentre est l'endroit de la surface terrestre où les secousses sont ressenties avec la plus forte intensité."
        },
        {
          question: "Quelle théorie explique que la surface de la Terre est découpée en plusieurs grands blocs rigides en mouvement ?",
          options: ["La tectonique des plaques", "La gravité terrestre", "La rotation lunaire", "Le cycle de l'eau"],
          correctIndex: 0,
          explanation: "La tectonique des plaques décrit les mouvements des plaques lithosphériques à la surface du globe."
        },
        {
          question: "Quel rôle jouent les globules blancs (leucocytes) dans notre organisme ?",
          options: ["Défendre l'organisme contre les microbes et les infections", "Transporter l'oxygène", "Coaguler le sang", "Digérer les graisses"],
          correctIndex: 0,
          explanation: "Les globules blancs sont les cellules clés de notre système immunitaire."
        },
        {
          question: "Parmi ces structures, laquelle est présente UNIQUEMENT dans la cellule végétale et absente de la cellule animale ?",
          options: ["La paroi rigide pectocellulosique et les chloroplastes", "Le noyau", "La membrane plasmique", "Le cytoplasme"],
          correctIndex: 0,
          explanation: "La cellule végétale possède une paroi rigide et des chloroplastes verts, absents chez la cellule animale."
        },
        {
          question: "Quelle bonne pratique d'hygiène alimentaire permet de préserver la santé et d'éviter les carences ?",
          options: ["Manger varié et équilibré en consommant des fruits, des légumes et en buvant de l'eau", "Ne manger que des sucreries", "Sauter tous les repas", "Boire uniquement des sodas gazeux"],
          correctIndex: 0,
          explanation: "Une alimentation diversifiée apporte les vitamines, minéraux, protéines et glucides nécessaires à la croissance."
        }
      ];
      return this.finalizeEmergencyBatch(svtBank, count);
    }

    // ── HISTOIRE-GÉOGRAPHIE (Primaire & Collège) ──
    if (s.includes('hist') || s.includes('géo') || s.includes('geo') || s.includes('civ') || s.includes('citoyen')) {
      const hgBank: QuizItem[] = [
        {
          question: "Quelle est la capitale officielle et administrative du Royaume du Maroc ?",
          options: ["Rabat", "Casablanca", "Marrakech", "Tanger"],
          correctIndex: 0,
          explanation: "Rabat est la capitale administrative du Royaume du Maroc."
        },
        {
          question: "Quel est le point culminant du Maroc et de toute l'Afrique du Nord (4 167 mètres d'altitude) ?",
          options: ["Le Djebel Toubkal (Haut Atlas)", "Le Djebel Sirwa", "Le Mont Blanc", "Le Djebel Tidirhine (Rif)"],
          correctIndex: 0,
          explanation: "Le Djebel Toubkal dans le Haut Atlas s'élève à 4 167 mètres d'altitude."
        },
        {
          question: "Qui a fondé la ville impériale de Fès en 808 sous la dynastie idrisside ?",
          options: ["Moulay Idriss II", "Youssef Ibn Tachfin", "Tariq Ibn Ziyad", "Ahmed Al-Mansour"],
          correctIndex: 0,
          explanation: "Moulay Idriss II a fondé la ville de Fès qui est devenue le centre spirituel et culturel du Maroc."
        },
        {
          question: "Quelle illustre université marocaine, reconnue comme la plus ancienne en activité au monde, a été fondée à Fès en 859 ?",
          options: ["L'Université Al-Qarawiyyin", "L'Université de la Sorbonne", "L'Université d'Oxford", "L'Université Al-Azhar"],
          correctIndex: 0,
          explanation: "L'Université Al-Qarawiyyin a été fondée par Fatima Al-Fihriya en 859 à Fès."
        },
        {
          question: "Combien de grandes mers et océans bordent les côtes du Maroc ?",
          options: [
            "Deux façades maritimes : l'Océan Atlantique à l'ouest et la Mer Méditerranée au nord",
            "Une seule mer au sud",
            "Trois océans",
            "Le Maroc n'a aucune côte maritime"
          ],
          correctIndex: 0,
          explanation: "Le Maroc dispose d'une double façade maritime : Méditerranée au nord et Atlantique à l'ouest."
        },
        {
          question: "Quel souverain almoravide a fondé la ville impériale de Marrakech vers 1070 ?",
          options: ["Youssef Ibn Tachfin", "Moulay Ismaïl", "Abdelmoumen", "Idriss Ier"],
          correctIndex: 0,
          explanation: "Youssef Ibn Tachfin a fondé Marrakech, capitale du grand empire almoravide."
        },
        {
          question: "Comment appelle-t-on la ligne imaginaire de latitude 0° qui sépare la Terre en deux hémisphères (Nord et Sud) ?",
          options: ["L'Équateur", "Le méridien de Greenwich", "Le tropique du Capricorne", "Le pôle Sud"],
          correctIndex: 0,
          explanation: "L'Équateur est le parallèle central partageant la Terre entre hémisphère Nord et hémisphère Sud."
        },
        {
          question: "Combien de continents compte traditionnellement notre planète Terre ?",
          options: ["5 (ou 6 avec l'Antarctique)", "2 continents", "12 continents", "50 continents"],
          correctIndex: 0,
          explanation: "Les 5 continents habités sont l'Afrique, l'Amérique, l'Asie, l'Europe et l'Océanie (plus l'Antarctique)."
        },
        {
          question: "Quel fleuve est le plus long du continent africain ?",
          options: ["Le Nil", "Le Congo", "Le Niger", "Le Zambèze"],
          correctIndex: 0,
          explanation: "Le Nil s'étend sur plus de 6 600 km à travers l'Afrique orientale."
        },
        {
          question: "En éducation à la citoyenneté, quel texte international adopté en 1989 protège spécifiquement les droits des enfants ?",
          options: [
            "La Convention Internationale des Droits de l'Enfant (CIDE)",
            "Le code de la route",
            "Le règlement du football",
            "La charte des commerçants"
          ],
          correctIndex: 0,
          explanation: "La CIDE adoptée par l'ONU garantit à tous les enfants le droit à l'éducation, aux soins et à la protection."
        }
      ];
      return this.finalizeEmergencyBatch(hgBank, count);
    }

    // ── ÉDUCATION PHYSIQUE ET SPORTIVE (EPS) ──
    if (s.includes('sport') || s.includes('eps') || s.includes('physique et sportive')) {
      const epsBank: QuizItem[] = [
        {
          question: "Pourquoi est-il indispensable de débuter toute séance d'EPS par un échauffement progressif ?",
          options: [
            "Pour préparer le cœur, chauffer les muscles et éviter les risques de blessures",
            "Pour se fatiguer avant même de commencer",
            "Pour terminer le cours plus vite",
            "Pour tester ses chaussures"
          ],
          correctIndex: 0,
          explanation: "L'échauffement élève la température du corps, lubrifie les articulations et accélère l'oxygénation."
        },
        {
          question: "Pendant une séance d'activité physique, quelle est la bonne attitude pour s'hydrater ?",
          options: [
            "Boire régulièrement de petites gorgées d'eau fraîche sans attendre d'avoir très soif",
            "Ne jamais boire d'eau même en cas de forte chaleur",
            "Boire 2 litres de soda d'un seul coup juste avant de courir",
            "Attendre d'avoir des vertiges pour boire"
          ],
          correctIndex: 0,
          explanation: "Il faut boire régulièrement de petites gorgées d'eau pour compenser les pertes par transpiration."
        },
        {
          question: "Que signifie la valeur de la « Fréquence Cardiaque » mesurée en battements par minute (bpm) ?",
          options: [
            "Le nombre de battements que le cœur effectue en une minute",
            "La vitesse maximale de course en km/h",
            "Le poids des muscles en kilogrammes",
            "Le volume des poumons en litres"
          ],
          correctIndex: 0,
          explanation: "La fréquence cardiaque est le rythme auquel le cœur bat chaque minute pour propulser le sang."
        },
        {
          question: "Dans les sports collectifs (basketball, handball, football), quelle valeur fondamentale traduit le respect des adversaires et de l'arbitre ?",
          options: ["Le Fair-play et l'esprit sportif", "L'agressivité verbale", "La triche discrète", "Le refus de serrer la main"],
          correctIndex: 0,
          explanation: "Le fair-play garantit le plaisir du jeu, la sécurité de chacun et le respect mutuel."
        },
        {
          question: "Quelle allure de course permet de courir longtemps sans s'épuiser (aisance respiratoire) ?",
          options: [
            "L'endurance fondamentale où l'on est capable de parler sans être essoufflé",
            "Un sprint maximal de 100 mètres dès le départ",
            "Courir en retenant sa respiration",
            "Marcher les yeux fermés"
          ],
          correctIndex: 0,
          explanation: "En endurance fondamentale (aérobie), le coureur oxygène parfaitement ses muscles et préserve son énergie."
        }
      ];
      return this.finalizeEmergencyBatch(epsBank, count);
    }

    // ── MÉTHODOLOGIE & SOUTIEN SCOLAIRE ──
    if (s.includes('méthod') || s.includes('method') || s.includes('soutien')) {
      const methodeBank: QuizItem[] = [
        {
          question: "En quoi consiste la méthode Pomodoro pour bien réviser ses leçons ?",
          options: [
            "Travailler avec une concentration totale pendant 25 minutes puis faire une pause de 5 minutes",
            "Travailler 6 heures d'affilée sans aucune pause",
            "Regarder la télévision tout en révisant",
            "Attendre le matin de l'évaluation pour ouvrir son cahier"
          ],
          correctIndex: 0,
          explanation: "La méthode Pomodoro évite la fatigue mentale en alternant effort focalisé (25 min) et pause (5 min)."
        },
        {
          question: "Qu'est-ce qui caractérise une bonne fiche de révision ?",
          options: [
            "Elle est courte, claire, avec des titres, des couleurs et résume les formules et définitions clés",
            "Elle recopie tout le livre mot pour mot sur 50 pages sans titre",
            "Elle est écrite au crayon effacé illisible",
            "Elle ne contient aucun exemple"
          ],
          correctIndex: 0,
          explanation: "Une bonne fiche synthétise l'essentiel et permet de se tester rapidement."
        },
        {
          question: "Quelle technique de mémorisation active est la plus efficace pour retenir durablement une leçon ?",
          options: [
            "Fermer son cahier et tenter d'expliquer la leçon avec ses propres mots ou répondre à un quiz",
            "Relire passivement son cahier les yeux à moitié fermés",
            "Dormir sur son livre de cours",
            "Surligner toute la page avec du jaune fluo"
          ],
          correctIndex: 0,
          explanation: "L'effort de se remémorer activement l'information ancre puissamment les connaissances dans le cerveau."
        },
        {
          question: "Lors d'un contrôle ou examen, que faut-il faire dès que le sujet est distribué ?",
          options: [
            "Lire attentivement l'ensemble des questions et souligner les mots-clés de la consigne",
            "Commencer à écrire au hasard sans lire la suite",
            "Rendre sa copie immédiatement",
            "Paniquer dès la première difficulté"
          ],
          correctIndex: 0,
          explanation: "Une lecture d'ensemble permet de bien comprendre les consignes et de planifier son temps."
        },
        {
          question: "Pourquoi est-il indispensable de garder 5 minutes à la fin d'un devoir pour se relire ?",
          options: [
            "Pour corriger les fautes d'étourderie, vérifier les calculs et s'assurer de n'avoir rien oublié",
            "Pour dessiner dans la marge",
            "Pour recopier la copie de son voisin",
            "Pour attendre la sonnerie sans rien faire"
          ],
          correctIndex: 0,
          explanation: "La relecture finale permet souvent de rattraper des points précieux sur des erreurs d'inattention."
        }
      ];
      return this.finalizeEmergencyBatch(methodeBank, count);
    }

    // ── POOL MÉTHODOLOGIQUE GÉNÉRAL POUR LE COLLÈGE & PRIMAIRE ──
    const genericPool: QuizItem[] = [
      {
        question: `Pour bien réussir un devoir ou un exercice en ${subject}, quelle est la première étape essentielle ?`,
        options: [
          `Lire attentivement l'énoncé en entier et repérer les données clés et ce qui est demandé`,
          `Écrire une réponse au hasard sans lire la consigne`,
          `Ignorer les informations fournies dans le texte`,
          `Recopier l'énoncé sans chercher à le comprendre`
        ],
        correctIndex: 0,
        explanation: `Une bonne lecture de la consigne évite les hors-sujets et permet de bien identifier le travail demandé.`
      },
      {
        question: `Face à une question difficile en ${subject}, quelle attitude aide le plus à progresser ?`,
        options: [
          `Décomposer le problème en étapes simples et s'appuyer sur les exemples vus en classe`,
          `Abandonner tout de suite et laisser la feuille blanche`,
          `Inventer des définitions fantaisistes`,
          `S'énerver sans relire son cours`
        ],
        correctIndex: 0,
        explanation: `En coupant une grande difficulté en petites étapes, on trouve plus facilement la solution.`
      },
      {
        question: `Comment vérifier qu'une réponse trouvée en ${subject} a du sens ?`,
        options: [
          `Prendre du recul et vérifier si le résultat est logique et cohérent avec la situation`,
          `Penser que le premier chiffre écrit est forcément juste sans vérifier`,
          `Effacer sa réponse dès le moindre doute sans réfléchir`,
          `Ne jamais relire son travail`
        ],
        correctIndex: 0,
        explanation: `Vérifier la cohérence de son résultat permet d'intercepter soi-même les petites erreurs.`
      },
      {
        question: `Pourquoi est-il important d'utiliser les mots de vocabulaire précis appris en ${subject} ?`,
        options: [
          `Pour exprimer ses idées clairement et montrer au professeur qu'on a bien compris le cours`,
          `Pour compliquer les phrases sans raison`,
          `Pour remplacer les explications par des mots compliqués inconnus`,
          `Cela n'a aucune importance`
        ],
        correctIndex: 0,
        explanation: `Le vocabulaire précis permet de se faire comprendre exactement et d'avoir des points complets.`
      },
      {
        question: `Après avoir fait une erreur dans un exercice de ${subject}, que convient-il de faire ?`,
        options: [
          `Comprendre pourquoi on s'est trompé avec l'aide du corrigé pour ne plus refaire la même erreur`,
          `Déchirer sa feuille de travail`,
          `Oublier l'exercice et ne jamais reposer la question`,
          `Se décourager définitivement`
        ],
        correctIndex: 0,
        explanation: `L'erreur est normale dans l'apprentissage : c'est en la comprenant qu'on devient plus fort !`
      }
    ];

    return this.finalizeEmergencyBatch(genericPool, count);
  }

  /**
   * Generates pedagogical feedback and records progress for adaptive level increase.
   */
  getQuizFeedback(
    subject: string,
    score: number,
    total: number,
    userAnswers: any[]
  ): Observable<QuizFeedbackResponse> {
    const body = { subject, score, total, userAnswers };
    return this.http.post<QuizFeedbackResponse>('/api/ai/quiz/feedback', body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(err => {
        console.warn('[AiLearningService] Feedback error, returning standard response:', err);
        const percent = total > 0 ? Math.round((score / total) * 100) : 0;
        return of({
          feedback: percent >= 75
            ? `Excellent score de ${score}/${total} (${percent}%) ! Tes bases en ${subject} sont très solides.`
            : `Score de ${score}/${total} (${percent}%). Revois les notions où tu as hésité pour renforcer tes acquis.`,
          recommendations: [
            'Revois les explications fournies pour chaque question.',
            'Entraîne-toi sur un cas pratique dans les exercices.'
          ],
          nextStep: 'Tenter un nouveau quiz inédit pour consolider la méthode !'
        });
      })
    );
  }

  /**
   * Generates a tailored practical exercise matching the student's adaptive level.
   */
  generateExercise(
    subject: string,
    topic?: string,
    difficulty?: string
  ): Observable<any> {
    const student = this.profileService.currentProfile;
    const level = student?.educationLevel || '1ère année primaire';
    const body = { subject, topic, level, difficulty: difficulty || 'auto' };
    return this.http.post<any>('/api/ai/exercises/generate', body, {
      headers: this.getHeaders()
    });
  }

  /**
   * Evaluates student drafted solution in the exercise workspace and updates progress.
   */
  evaluateExerciseDraft(
    exercise: any,
    studentDraft: string,
    questionAnswers?: Record<number, string>
  ): Observable<ExerciseEvaluationResponse> {
    const body = { exercise, studentDraft, questionAnswers };
    return this.http.post<ExerciseEvaluationResponse>('/api/ai/exercises/evaluate', body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(err => {
        console.warn('[AiLearningService] Evaluation error, returning heuristic feedback:', err);
        const questions = Array.isArray(exercise?.questions) ? exercise.questions : [];
        const isGibberish = (txt: string) => {
          if (!txt || typeof txt !== 'string') return true;
          const t = txt.trim().toLowerCase();
          if (t.length < 3) return true;
          if (/^(aucune?|rien|non|jsp|je sais pas|sais pas|idk|pas compris|bof|asdf|azerty|sdadad)/i.test(t)) return true;
          if (/(.)\1{3,}/.test(t)) return true;
          const words = t.split(/[\s,;.!?'"()\-]+/).filter(w => w.length >= 2);
          const validWords = words.filter(w => !/^(sdad|asdf|qwerty|zerty|dada|dsad|sada|jsp|idk)$/i.test(w));
          return validWords.length === 0;
        };

        const clean = (studentDraft || '').trim();
        const isInvalidDraft = isGibberish(clean);

        const targetSub = (exercise?.subject || '').toLowerCase();
        const isArabic = targetSub.includes('arabe') || targetSub.includes('islam') || exercise?.contextType === 'arabic' || /[\u0600-\u06FF]/.test(exercise?.title || '');

        const detailedCorrection: DetailedCorrectionItem[] = questions.map((q: any, idx: number) => {
          const step = exercise?.solutionSteps?.[idx];
          const stepDetail = (step?.detail || '').toString().replace(/<[^>]*>/g, ' ');
          const expected = step
            ? (step.label ? `${step.label} :\n${stepDetail}` : stepDetail)
            : (exercise?.solutionSummary || (isArabic ? 'انظر عناصر الإجابة والحل المفصل أدناه' : 'Voir corrigé type'));
          const ans = questionAnswers?.[idx] || (idx === 0 ? studentDraft : '');
          const isAnsInvalid = !ans || isGibberish(ans);
          return {
            questionIndex: idx + 1,
            question: typeof q === 'string' ? q : (q?.question || (isArabic ? `السؤال ${idx + 1}` : `Question ${idx + 1}`)),
            studentAnswer: ans || (isArabic ? '(لا توجد إجابة)' : '(Aucune saisie)'),
            status: isAnsInvalid ? 'incorrect' : 'partiel',
            score: isAnsInvalid ? 0 : 35,
            feedback: isAnsInvalid
              ? (isArabic ? 'إجابة غير مقبولة أو غير مفهومة.' : 'Réponse non recevable (incompréhensible, vide ou « jsp »).')
              : (isArabic ? 'تم تسجيل إجابتك. قارنها مع عناصر الإجابة الرسمية أسفله.' : 'Réponse enregistrée. Compare avec les attendus officiels ci-dessous.'),
            expectedSolution: expected
          };
        });

        const score = isInvalidDraft ? 0 : 35;
        return of({
          score,
          appreciation: isArabic
            ? (score === 0 ? 'مسودة غير مكتملة أو غير قابلة للتقييم' : 'محاولة تحتاج إلى إتمام ومراجعة')
            : (score === 0 ? 'Brouillon non recevable ou incomplet' : 'Brouillon partiel à retravailler'),
          feedback: score === 0
            ? (isArabic
                ? 'لا تتضمن المسودة إجابات كافية أو قابلة للاستثمار. لتحقيق نتيجة جيدة، اقرأ السند والأسئلة واستعن بعناصر الإجابة أدناه :'
                : 'Ton brouillon ne contient pas d\'éléments de réponse exploitables (mots incompréhensibles ou réponses vides). Pour réussir cet exercice, lis attentivement la consigne et aide-toi du corrigé officiel ci-dessous :')
            : (isArabic
                ? 'تم تسجيل بعض الإجابات لكنها تحتاج إلى تعميق وتدقيق. قارن عملك مع عناصر الإجابة والحل المفصل أسفله.'
                : 'Certaines réponses ont été enregistrées mais nécessitent d\'être approfondies. Compare ton travail avec le corrigé officiel pas-à-pas ci-dessous.'),
          strengths: [],
          areasToImprove: isArabic ? [
            'صياغة جمل تامة ومضبوطة بالشكل',
            'قراءة كل سؤال بعناية قبل الإجابة',
            'الاطلاع على عناصر الإجابة والحل المفصل'
          ] : [
            'Rédiger des phrases complètes avec les notions clés du cours',
            'Relire attentivement chaque question posée',
            'Consulter le corrigé officiel pas-à-pas ci-dessous'
          ],
          detailedCorrection,
          encouragement: isArabic
            ? 'المثابرة سر النجاح. اكتشف الحل المفصل أدناه وأعد المحاولة !'
            : 'La persévérance est la clé. Découvre la correction détaillée ci-dessous et réessaie !'
        });
      })
    );
  }
}
