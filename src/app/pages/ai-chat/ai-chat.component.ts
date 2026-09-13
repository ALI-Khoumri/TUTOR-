import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AsyncPipe } from '@angular/common';
import { MockSessionService } from '../../core/services/mock-session.service';
import { MockProfileService } from '../../core/services/mock-profile.service';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, firstValueFrom } from 'rxjs';
import { parseQuizFromText, ParsedTutorContent, QuizQuestion, QuizOption } from '../../core/utils/quiz-parser';

interface QuickAction {
  label: string;
  prompt: string;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, MatIconModule],
  template: `
    <section class="ai-chat-shell page-enter" *ngIf="profile$ | async as profile">
      <!-- Header -->
      <header class="chat-header surface">
        <div class="chat-header__info">
          <div class="chat-badge">
            <span class="bot-status-dot" [class.is-online]="ollamaStatus?.available"></span>
            <span class="chat-badge__text">
              {{ ollamaStatus?.available ? 'Ollama AI (' + ollamaStatus?.model + ')' : 'Tuteur IA' }}
            </span>
          </div>
          <h2 class="chat-title">Discussion avec ton Tuteur IA</h2>
          <p class="chat-sub" *ngIf="session$ | async as session">
            Matière active : <strong>{{ session.subject }}</strong> · Niveau : <strong>{{ profile.educationLevel }}</strong>
          </p>
        </div>

        <div class="chat-header__meta" *ngIf="ollamaStatus">
          <span class="badge" [ngClass]="ollamaStatus.available ? 'badge--success' : 'badge--accent'">
            {{ ollamaStatus.available ? '● Ollama Actif' : '● Mode Local' }}
          </span>
        </div>
      </header>

      <!-- Chat Body -->
      <div class="chat-body surface">
        <!-- Message list -->
        <div class="chat-messages" *ngIf="messages$ | async as messages">
          <div *ngFor="let m of messages" class="chat-msg" [ngClass]="m.author">
            <div class="chat-avatar" *ngIf="m.author === 'tutor'">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <div class="chat-bubble" [class.is-arabic-msg]="isArabicText(m.text)">
              <!-- Regular text message -->
              <ng-container *ngIf="m.author === 'student' || !getParsed(m.text).isQuiz">
                <div
                  class="bubble-content"
                  [class.arabic-font]="isArabicText(m.text)"
                  [attr.dir]="isArabicText(m.text) ? 'rtl' : 'ltr'"
                  [innerHTML]="formatText(m.text)"
                ></div>
              </ng-container>

              <!-- Interactive Quiz message -->
              <ng-container *ngIf="m.author === 'tutor' && getParsed(m.text).isQuiz">
                <div class="quiz-container">
                  <p class="quiz-intro" *ngIf="getParsed(m.text).introText">
                    {{ getParsed(m.text).introText }}
                  </p>

                  <div class="quiz-questions-list">
                    <div *ngFor="let q of getParsed(m.text).questions; let qi = index" class="quiz-card">
                      <div class="quiz-card-top">
                        <div class="quiz-badge">
                          <mat-icon>quiz</mat-icon>
                          <span>Question {{ q.questionNumber }}</span>
                        </div>
                        <span class="quiz-counter" *ngIf="getParsed(m.text).questions.length > 1">
                          {{ qi + 1 }} sur {{ getParsed(m.text).questions.length }}
                        </span>
                      </div>

                      <p class="quiz-question-title">{{ q.questionText }}</p>

                      <div class="quiz-options-grid">
                        <button
                          *ngFor="let opt of q.options"
                          type="button"
                          class="quiz-option-btn"
                          (click)="chooseOption(q, opt)"
                        >
                          <span class="opt-letter">{{ opt.letter }}</span>
                          <span class="opt-text">{{ opt.text }}</span>
                          <mat-icon class="opt-arrow">arrow_forward</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p class="quiz-outro" *ngIf="getParsed(m.text).outroText">
                    {{ getParsed(m.text).outroText }}
                  </p>
                </div>
              </ng-container>

              <span class="bubble-time" *ngIf="m.time">{{ m.time | date:'shortTime' }}</span>
            </div>
          </div>

          <div class="chat-msg tutor typing" *ngIf="isTyping">
            <div class="chat-avatar"><mat-icon>smart_toy</mat-icon></div>
            <div class="chat-bubble typing-bubble">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
          <!-- Active Quiz Response Bar -->
          <div class="quiz-helper-bar" *ngIf="activeQuizQuestions.length > 0">
            <div class="quiz-helper-header">
              <div class="helper-badge">
                <mat-icon>touch_app</mat-icon>
                <span>Choisis ta réponse en 1 clic :</span>
              </div>

              <!-- Question selector tabs -->
              <div class="question-tabs" *ngIf="activeQuizQuestions.length > 1">
                <button
                  *ngFor="let q of activeQuizQuestions; let idx = index"
                  type="button"
                  class="q-tab-btn"
                  [class.active]="selectedQuestionIndex === idx"
                  (click)="selectedQuestionIndex = idx"
                >
                  Question {{ q.questionNumber }}
                </button>
              </div>
            </div>

            <div class="active-question-preview" *ngIf="currentQuestion">
              <span class="preview-label">Question {{ currentQuestion.questionNumber }} :</span>
              <span class="preview-text">{{ currentQuestion.questionText }}</span>
            </div>

            <!-- Direct Choice Buttons -->
            <div class="choice-buttons-row" *ngIf="currentQuestion">
              <button
                *ngFor="let opt of currentQuestion.options"
                type="button"
                class="choice-btn"
                (click)="chooseOption(currentQuestion, opt)"
                [disabled]="isTyping"
              >
                <span class="choice-letter">{{ opt.letter }}</span>
                <span class="choice-snippet">{{ opt.text }}</span>
              </button>
            </div>
          </div>

          <div class="quick-chips" [attr.dir]="isArabic ? 'rtl' : 'ltr'">
            <button
              *ngFor="let qa of currentQuickActions"
              type="button"
              class="chip chip--sm"
              [class.arabic-font]="isArabic"
              (click)="sendQuickPrompt(qa.prompt)"
            >
              {{ qa.label }}
            </button>
          </div>

          <div class="input-row">
            <textarea
              [(ngModel)]="userInput"
              [placeholder]="isArabic ? (currentQuestion ? 'أَوْ اكْتُبْ إِجَابَتَكَ هُنَا...' : 'اطْرَحْ سُؤَالَكَ بِاللُّغَةِ العَرَبِيَّةِ عَلَى المُرَبِّي الذَّكِيِّ...') : (currentQuestion ? 'Ou écris ta réponse personnalisée ici...' : 'Pose ta question à ton tuteur IA (Ollama)...')"
              [attr.dir]="isArabic ? 'rtl' : 'ltr'"
              [class.arabic-font]="isArabic"
              rows="2"
              (keydown.enter)="onEnter($event)"
              [disabled]="isTyping"
            ></textarea>
            <button class="btn btn--primary send-btn" (click)="send()" [disabled]="!userInput.trim() || isTyping">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .ai-chat-shell {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      height: calc(100vh - var(--header-height) - 2.5rem);
      min-height: 520px;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-lg);
    }

    .chat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 0.2rem;
    }

    .bot-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #94a3b8;
    }

    .bot-status-dot.is-online {
      background: var(--success);
      box-shadow: 0 0 6px var(--success);
    }

    .chat-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .chat-sub {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0.2rem 0 0 0;
    }

    .chat-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      overflow: hidden;
      min-height: 0;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chat-msg {
      display: flex;
      gap: 0.65rem;
      max-width: 85%;
    }

    .chat-msg.student {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .chat-msg.tutor {
      align-self: flex-start;
    }

    .chat-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .chat-avatar mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #2563eb;
    }

    .chat-bubble {
      padding: 0.95rem 1.25rem;
      border-radius: 16px;
      position: relative;
      font-size: 0.93rem;
      line-height: 1.65;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
    }

    .chat-msg.tutor .chat-bubble {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-top-left-radius: 4px;
    }

    .chat-msg.student .chat-bubble {
      background: linear-gradient(135deg, #2563eb, #0284c7);
      color: white;
      border-top-right-radius: 4px;
    }

    .bubble-content {
      white-space: pre-line;
      word-break: break-word;
    }

    .bubble-time {
      display: block;
      font-size: 0.68rem;
      opacity: 0.65;
      text-align: right;
      margin-top: 0.35rem;
    }

    /* Quiz Styling */
    .quiz-container {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .quiz-intro, .quiz-outro {
      margin: 0;
      font-size: 0.94rem;
      color: #334155;
    }

    .quiz-outro {
      font-style: italic;
      color: #64748b;
    }

    .quiz-questions-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .quiz-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.95rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .quiz-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .quiz-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #1d4ed8;
      background: #dbeafe;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .quiz-badge mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .quiz-counter {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
      background: #ffffff;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
    }

    .quiz-question-title {
      margin: 0;
      font-weight: 700;
      color: #0f172a;
      font-size: 0.98rem;
      line-height: 1.5;
    }

    .quiz-options-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quiz-option-btn {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.65rem 0.95rem;
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      color: #1e293b;
      font-size: 0.91rem;
      text-align: left;
      cursor: pointer;
      transition: all 150ms ease;
      font-family: inherit;
    }

    .quiz-option-btn:hover {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
      transform: translateX(4px);
      box-shadow: 0 3px 8px rgba(37, 99, 235, 0.12);
    }

    .opt-letter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 0.84rem;
      flex-shrink: 0;
      border: 1.5px solid #cbd5e1;
      transition: all 150ms ease;
    }

    .quiz-option-btn:hover .opt-letter {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    .opt-text {
      flex: 1;
      line-height: 1.4;
    }

    .opt-arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
      opacity: 0;
      transition: all 150ms ease;
    }

    .quiz-option-btn:hover .opt-arrow {
      opacity: 1;
      color: #2563eb;
    }

    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.75rem 1rem;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94a3b8;
      animation: typing 1.2s infinite ease-in-out;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    /* Helper Bar in Chat */
    .quiz-helper-bar {
      background: linear-gradient(135deg, #eff6ff, #f0fdf4);
      border: 1.5px solid #93c5fd;
      border-radius: 14px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-bottom: 0.5rem;
    }

    .quiz-helper-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .helper-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: #1d4ed8;
      text-transform: uppercase;
    }

    .helper-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #2563eb;
    }

    .question-tabs {
      display: flex;
      gap: 0.35rem;
    }

    .q-tab-btn {
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
    }

    .q-tab-btn.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }

    .active-question-preview {
      font-size: 0.88rem;
      line-height: 1.4;
      color: #1e293b;
      background: #ffffff;
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .preview-label {
      font-weight: 700;
      color: #2563eb;
      background: #dbeafe;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .preview-text {
      color: #1e293b;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .choice-buttons-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.5rem;
    }

    .choice-btn {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.85rem;
      background: #ffffff;
      border: 1.5px solid #bfdbfe;
      border-radius: 10px;
      color: #1e293b;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .choice-btn:hover:not(:disabled) {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      transform: translateY(-2px);
    }

    .choice-btn:hover:not(:disabled) .choice-letter {
      background: #ffffff;
      color: #2563eb;
    }

    .choice-letter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #eff6ff;
      color: #2563eb;
      font-weight: 800;
      font-size: 0.82rem;
    }

    .choice-snippet {
      flex: 1;
      white-space: normal;
      line-height: 1.3;
    }

    .chat-input-area {
      padding: 0.85rem 1.25rem 1.25rem;
      border-top: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .quick-chips {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    .input-row {
      display: flex;
      gap: 0.65rem;
      align-items: flex-end;
    }

    textarea {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm, 10px);
      border: 1.5px solid var(--border-strong, #cbd5e1);
      background: var(--surface-muted, #f8fafc);
      color: var(--text, #0f172a);
      font-size: 0.92rem;
      resize: none;
      outline: none;
      font-family: inherit;
    }

    textarea:focus {
      border-color: var(--accent, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      background: white;
    }

    .send-btn {
      width: 44px;
      height: 44px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm, 10px);
      flex-shrink: 0;
    }

    .arabic-font {
      font-family: 'Amiri', 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
      direction: rtl;
      text-align: right;
      font-size: 1.05rem;
      line-height: 1.85;
    }
  `]
})
export class AiChatComponent implements OnInit, OnDestroy {
  session$ = this.session.session$;
  profile$ = this.profile.active$;
  messages$ = this.session.messages$;

  userInput = '';
  isTyping = false;
  ollamaStatus: { available: boolean; model: string; installedModels?: string[] } | null = null;
  activeQuizQuestions: QuizQuestion[] = [];
  selectedQuestionIndex = 0;
  currentSubject = '';

  quickActions: QuickAction[] = [
    { label: '💡 Expliquer simplement', prompt: 'Explique-moi les concepts clés avec un exemple simple.' },
    { label: '💻 Exemple concret', prompt: 'Donne-moi un exemple d\'application concrète.' },
    { label: '❓ Me poser une question', prompt: 'Pose-moi une question pour tester ma compréhension.' },
    { label: '📝 Méthode pas à pas', prompt: 'Comment résoudre ce type d\'exercice étape par étape ?' }
  ];

  arabicQuickActions: QuickAction[] = [
    { label: '💡 شرح مبسط', prompt: 'اشْرَحْ لِي هَذَا المَفْهُومَ بِمِثَالٍ سَهْلٍ وَمُبَسَّطٍ.' },
    { label: '📘 مثال تطبيقي', prompt: 'أَعْطِنِي مِثَالاً تَطْبِيقِيّاً وَاضِحاً مِنْ صُلْبِ هَذَا الدَّرْسِ.' },
    { label: '❓ اطرح علي سؤالاً', prompt: 'اطْرَحْ عَلَيَّ سُؤَالاً لِتَخْتَبِرَ مَدَى اسْتِيعَابِي لِلدَّرْسِ.' },
    { label: '📝 منهجية خطوة بخطوة', prompt: 'كَيْفَ أُجِيبُ عَنْ هَذَا النَّوْعِ مِنَ الأَسْئِلَةِ خُطْوَةً بِخُطْوَةٍ ؟' }
  ];

  private parsedCache = new Map<string, ParsedTutorContent>();
  private sub?: Subscription;
  private sessionSub?: Subscription;

  constructor(
    private session: MockSessionService,
    private profile: MockProfileService,
    private http: HttpClient
  ) {}

  async ngOnInit(): Promise<void> {
    this.sessionSub = this.session.session$.subscribe(s => {
      this.currentSubject = s?.subject || '';
    });

    try {
      this.ollamaStatus = await firstValueFrom(this.http.get<any>('/api/conversations/ollama/status'));
    } catch (e) {
      this.ollamaStatus = { available: false, model: 'mistral' };
    }

    this.sub = this.session.messages$.subscribe(msgs => {
      if (!msgs || msgs.length === 0) {
        this.activeQuizQuestions = [];
        return;
      }

      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg.author === 'tutor') {
        const parsed = this.getParsed(lastMsg.text);
        if (parsed.isQuiz && parsed.questions.length > 0) {
          this.activeQuizQuestions = parsed.questions;
          this.selectedQuestionIndex = 0;
          return;
        }
      }
      this.activeQuizQuestions = [];
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sessionSub?.unsubscribe();
  }

  isArabicText(text?: string): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF]/.test(text);
  }

  get isArabic(): boolean {
    return this.session.isArabicSubject(this.currentSubject);
  }

  get currentQuickActions(): QuickAction[] {
    return this.isArabic ? this.arabicQuickActions : this.quickActions;
  }

  get currentQuestion(): QuizQuestion | null {
    if (this.activeQuizQuestions.length === 0) return null;
    return this.activeQuizQuestions[this.selectedQuestionIndex] || this.activeQuizQuestions[0];
  }

  getParsed(text: string): ParsedTutorContent {
    if (!this.parsedCache.has(text)) {
      this.parsedCache.set(text, parseQuizFromText(text));
    }
    return this.parsedCache.get(text)!;
  }

  formatText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.send();
  }

  async send(): Promise<void> {
    if (!this.userInput.trim() || this.isTyping) return;
    const text = this.userInput.trim();
    this.userInput = '';

    this.isTyping = true;
    try {
      await this.session.pushMessage({
        id: Date.now().toString(),
        author: 'student',
        text
      });
    } finally {
      this.isTyping = false;
    }
  }

  sendQuickPrompt(promptText: string): void {
    this.userInput = promptText;
    this.send();
  }

  async chooseOption(q: QuizQuestion, opt: QuizOption): Promise<void> {
    const formattedAnswer = `Question ${q.questionNumber} : Réponse ${opt.letter} - ${opt.text}`;
    this.userInput = '';
    this.isTyping = true;
    try {
      await this.session.pushMessage({
        id: Date.now().toString(),
        author: 'student',
        text: formattedAnswer
      });
    } finally {
      this.isTyping = false;
    }
  }
}
