import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ProfileService } from './profile.service';
import { UserProfile } from '../models/user-profile.model';

export interface TutorMessage {
  id: string;
  author: 'tutor' | 'student' | 'system';
  text: string;
  time?: string;
}

export interface SessionContext {
  id?: string;
  subject: string;
  topic: string;
  understanding: number; // 0..1
  lastDifficulty?: string;
  nextAction?: string;
}

export interface DifficultyDetection {
  topic: string;
  cause: string;
  suggestion: string;
}

export interface MemoryEntry {
  title: string;
  note: string;
  date: string;
  type?: 'progress' | 'review' | 'difficulty';
  delta?: string;
  confidence?: 'Faible' | 'Moyen' | 'Bon';
}

@Injectable({ providedIn: 'root' })
export class MockSessionService {
  private _session = new BehaviorSubject<SessionContext | null>(null);
  private _messages = new BehaviorSubject<TutorMessage[]>([]);
  private _memory = new BehaviorSubject<MemoryEntry[]>([]);
  private _difficulty = new BehaviorSubject<DifficultyDetection | null>(null);
  private currentConversationId: string | null = null;

  constructor(private profileService: ProfileService, private http: HttpClient) {
    this.profileService.active$.subscribe((profile) => {
      this.initSessionFromDatabase(profile);
    });
  }

  get session$(): Observable<SessionContext | null> {
    return this._session.asObservable();
  }

  get messages$(): Observable<TutorMessage[]> {
    return this._messages.asObservable();
  }

  get memory$(): Observable<MemoryEntry[]> {
    return this._memory.asObservable();
  }

  get difficulty$(): Observable<DifficultyDetection | null> {
    return this._difficulty.asObservable();
  }

  private async initSessionFromDatabase(profile: UserProfile): Promise<void> {
    if (!profile || !profile.onboardingCompleted || !profile.firstName) {
      this._session.next(null);
      this._messages.next([]);
      this._memory.next([]);
      this._difficulty.next(null);
      this.currentConversationId = null;
      return;
    }

    const firstSubject = profile.subjects?.[0] || 'Général';
    const isAr = this.isArabicSubject(firstSubject);
    const diagScore = profile.diagnosticResults?.overallScore;
    const understanding = diagScore !== undefined ? diagScore / 100 : 0;
    const nextAction = profile.diagnosticResults?.recommendations?.[0] || (isAr ? `تَعَمُّقٌ فِي مَفَاهِيمِ ${this.getArabicSubjectName(firstSubject)}` : `Découvrir les fondamentaux en ${firstSubject}`);

    const headers = { 'x-student-id': profile.id || 'default-student' };

    try {
      // 1. Get or Create conversation in SQLite
      const conversations = await firstValueFrom(this.http.get<any[]>('/api/conversations', { headers }));
      let activeConv = conversations?.[0];

      if (!activeConv) {
        activeConv = await firstValueFrom(this.http.post<any>('/api/conversations', {
          subjectName: firstSubject,
          topic: isAr ? `مَدْخَلٌ إِلَى ${this.getArabicSubjectName(firstSubject)}` : `Introduction à ${firstSubject}`
        }, { headers }));
      }

      this.currentConversationId = activeConv?.id || null;

      // 2. Fetch messages from SQLite
      if (this.currentConversationId) {
        const msgs = await firstValueFrom(this.http.get<any[]>(`/api/conversations/${this.currentConversationId}/messages`, { headers }));
        if (msgs && msgs.length > 0) {
          this._messages.next(msgs.map(m => ({
            id: m.id,
            author: m.role === 'assistant' ? 'tutor' : m.role === 'user' ? 'student' : 'system',
            text: m.content,
            time: m.created_at
          })));
        } else {
          // Send initial personalized welcome message
          const isAr = this.isArabicSubject(firstSubject);
          const welcomeMsg = isAr
            ? `مَرْحَباً بِكَ يَا ${profile.firstName} ! 👋 أَنَا مُرَبِّيكَ الذَّكِيُّ الشَّخْصِيُّ لِمَادَّةِ ${this.getArabicSubjectName(firstSubject)}. يَسُرُّنِي جِدّاً مُرَافَقَتُكَ لِنَتَعَلَّمَ خُطْوَةً بِخُطْوَةٍ وَبِكُلِّ هُدُوءٍ. بِأَيِّ مَفْهُومٍ أَوْ سُؤَالٍ تَرْغَبُ أَنْ نَبْدَأَ اليَوْمَ ؟`
            : `Bonjour ${profile.firstName} ! 👋 Je suis ton tuteur IA personnel. Je suis ravi de t'accompagner en ${profile.educationLevel || 'cette année'}. Ici, on avance à ton rythme et sans stress. Par quelle notion en ${firstSubject} souhaites-tu qu'on commence aujourd'hui ?`;
          this._messages.next([
            { id: 'welcome-1', author: 'tutor', text: welcomeMsg }
          ]);
        }
      }

      // 3. Fetch learning memory from SQLite
      const memories = await firstValueFrom(this.http.get<any[]>('/api/learning-memory', { headers }));
      if (memories && memories.length > 0) {
        this._memory.next(memories.map(m => ({
          title: m.memory_type === 'strong_topic' ? 'Point fort' : m.memory_type === 'weak_topic' ? 'À travailler' : m.topic,
          note: m.content,
          date: new Date(m.created_at).toLocaleDateString('fr-FR'),
          type: m.memory_type === 'weak_topic' ? 'difficulty' : 'progress',
          confidence: m.confidence
        })));
      } else {
        this._memory.next([]);
      }

    } catch (e) {
      console.warn('[SessionService] Backend not reachable, using profile fallback:', e);
      const isAr = this.isArabicSubject(firstSubject);
      this._messages.next([
        {
          id: 'welcome-1',
          author: 'tutor',
          text: isAr
            ? `مَرْحَباً بِكَ يَا ${profile.firstName} ! 👋 أَنَا مُرَبِّيكَ الذَّكِيُّ فِي مَادَّةِ ${this.getArabicSubjectName(firstSubject)}. أَنَا هُنَا لأَشْرَحَ لَكَ خُطْوَةً بِخُطْوَةٍ وَأُجِيبَ عَنْ جَمِيعِ أَسْئِلَتِكَ. مَاذَا تَرْغَبُ أَنْ نَتَعَلَّمَ مَعاً اليَوْمَ ؟`
            : `Bonjour ${profile.firstName} ! 👋 Je suis ton tuteur IA. Je suis là pour t'expliquer pas à pas et répondre à toutes tes questions en ${firstSubject}. Que souhaites-tu découvrir aujourd'hui ?`
        }
      ]);
      this._memory.next([]);
    }

    this._session.next({
      id: this.currentConversationId || undefined,
      subject: firstSubject,
      topic: isAr ? `مَدْخَلٌ إِلَى ${this.getArabicSubjectName(firstSubject)}` : `Introduction à ${firstSubject}`,
      understanding,
      lastDifficulty: profile.difficulties?.[0],
      nextAction: isAr ? `تَعَمُّقٌ فِي مَفَاهِيمِ ${this.getArabicSubjectName(firstSubject)}` : nextAction
    });

    if (profile.difficulties?.length > 0) {
      this._difficulty.next({
        topic: isAr ? this.getArabicSubjectName(firstSubject) : firstSubject,
        cause: profile.difficulties[0],
        suggestion: isAr
          ? 'سَنَتَعَاوَنُ مَعاً خُطْوَةً بِخُطْوَةٍ وَبِأَمْثِلَةٍ وَاضِحَةٍ لِتَجَاوُزِ كُلِّ صُعُوبَةٍ وَتَحْقِيقِ التَّفَوُّقِ.'
          : (profile.difficultyExplanation
            ? `Tu as mentionné : « ${profile.difficultyExplanation} ». Nous allons aborder cela pas à pas avec des exemples clairs.`
            : `Tu as indiqué : « ${profile.difficulties[0]} ». Je vais adapter mon rythme et mes explications pour t'aider à surmonter cela.`)
      });
    } else {
      this._difficulty.next(null);
    }
  }

  async pushMessage(msg: TutorMessage): Promise<void> {
    const cur = this._messages.value.slice();
    cur.push(msg);
    this._messages.next(cur);

    if (this.currentConversationId && msg.author === 'student') {
      const studentId = this.profileService.currentProfile.id || 'default-student';
      try {
        const res = await firstValueFrom(this.http.post<{ userMessage: any; assistantMessage: any }>(
          `/api/conversations/${this.currentConversationId}/messages`,
          { role: 'user', content: msg.text },
          { headers: { 'x-student-id': studentId } }
        ));

        if (res?.assistantMessage) {
          const updated = this._messages.value.slice();
          updated.push({
            id: res.assistantMessage.id,
            author: 'tutor',
            text: res.assistantMessage.content
          });
          this._messages.next(updated);
        }
      } catch (err) {
        console.error('[SessionService] Failed to persist message to SQLite:', err);
      }
    }
  }

  setUnderstanding(v: number) {
    const s = this._session.value;
    if (s) {
      this._session.next({ ...s, understanding: v });
    }
  }

  async switchToSubject(subjectName: string): Promise<void> {
    const profile = this.profileService.currentProfile;
    if (!profile || !profile.id) return;

    const headers = { 'x-student-id': profile.id };

    try {
      // 1. Find existing conversation for this subject or create a new one
      const conversations = await firstValueFrom(this.http.get<any[]>('/api/conversations', { headers }));
      let conv = conversations?.find(c =>
        c.subject_name === subjectName || (c.topic && c.topic.includes(subjectName))
      );

      if (!conv) {
        conv = await firstValueFrom(this.http.post<any>('/api/conversations', {
          subjectName,
          topic: `Introduction à ${subjectName}`
        }, { headers }));
      }

      this.currentConversationId = conv?.id || null;

      // 2. Load messages from this conversation
      if (this.currentConversationId) {
        const msgs = await firstValueFrom(this.http.get<any[]>(
          `/api/conversations/${this.currentConversationId}/messages`, { headers }
        ));

        if (msgs && msgs.length > 0) {
          this._messages.next(msgs.map(m => ({
            id: m.id,
            author: m.role === 'assistant' ? 'tutor' as const : m.role === 'user' ? 'student' as const : 'system' as const,
            text: m.content,
            time: m.created_at
          })));
        } else {
          // Welcome message for the new subject
          const isAr = this.isArabicSubject(subjectName);
          const welcomeMsg = isAr
            ? `لَقَدِ انْتَقَلْتَ الآنَ إِلَى مَادَّةِ **${this.getArabicSubjectName(subjectName)}** 📚. أَنَا جَاهِزٌ لِمُسَاعَدَتِكَ بِاللُّغَةِ العَرَبِيَّةِ الفُصْحَى ! مَا هُوَ المَفْهُومُ أَوِ الدَّرْسُ الَّذِي تَوَدُّ أَنْ نَبْدَأَ بِهِ ؟`
            : `Tu viens de passer à la matière **${subjectName}**. 📚 Je suis prêt à t'aider ! Quelle notion de ${subjectName} souhaites-tu que je t'explique ?`;
          this._messages.next([
            { id: `welcome-${Date.now()}`, author: 'tutor', text: welcomeMsg }
          ]);
        }
      }

      // 3. Update session context
      const diagScore = profile.diagnosticResults?.overallScore;
      const understanding = diagScore !== undefined ? diagScore / 100 : 0;
      const isArSubject = this.isArabicSubject(subjectName);
      this._session.next({
        id: this.currentConversationId || undefined,
        subject: subjectName,
        topic: isArSubject ? `مَدْخَلٌ إِلَى ${this.getArabicSubjectName(subjectName)}` : `Introduction à ${subjectName}`,
        understanding,
        lastDifficulty: profile.difficulties?.[0],
        nextAction: isArSubject ? `تَعَمُّقٌ فِي مَفَاهِيمِ ${this.getArabicSubjectName(subjectName)}` : `Approfondir les notions en ${subjectName}`
      });

    } catch (err) {
      console.error('[SessionService] Failed to switch subject:', err);
    }
  }

  isArabicSubject(subj?: string): boolean {
    if (!subj) return false;
    const s = subj.toLowerCase();
    return s.includes('arabe') || s.includes('islam') || s.includes('دين') || s.includes('عرب') || s.includes('coran') || s.includes('tarbiya') || s.includes('إسلام');
  }

  getArabicSubjectName(subj?: string): string {
    if (!subj) return 'اللُّغَةِ العَرَبِيَّةِ';
    const s = subj.toLowerCase();
    if (s.includes('islam') || s.includes('دين') || s.includes('coran') || s.includes('إسلام')) {
      return 'التَّرْبِيَةِ الإِسْلاَمِيَّةِ';
    }
    return 'اللُّغَةِ العَرَبِيَّةِ';
  }
}
