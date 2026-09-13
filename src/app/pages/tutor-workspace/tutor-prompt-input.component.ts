import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockSessionService } from '../../core/services/mock-session.service';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { parseQuizFromText, QuizQuestion, QuizOption } from '../../core/utils/quiz-parser';

@Component({
  selector: 'app-tutor-prompt-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="prompt-area">
      <!-- Active Quiz Quick Answer Panel -->
      <div class="quiz-helper-panel" *ngIf="activeQuizQuestions.length > 0">
        <div class="helper-top">
          <div class="helper-badge">
            <mat-icon>touch_app</mat-icon>
            <span>{{ isArabic ? 'اخْتَرْ إِجَابَتَكَ بِنَقْرَةٍ وَاحِدَةٍ :' : 'Choisis ta réponse en 1 clic :' }}</span>
          </div>

          <!-- Question Switcher Tabs (if multi-questions) -->
          <div class="question-switcher" *ngIf="activeQuizQuestions.length > 1">
            <button
              *ngFor="let q of activeQuizQuestions; let idx = index"
              type="button"
              class="tab-btn"
              [class.is-active]="selectedQuestionIndex === idx"
              (click)="selectedQuestionIndex = idx"
            >
              {{ isArabic ? ('السؤال ' + q.questionNumber) : ('Question ' + q.questionNumber) }}
            </button>
          </div>
        </div>

        <!-- Current Question Statement -->
        <div class="question-preview" *ngIf="currentQuestion">
          <span class="preview-badge">{{ isArabic ? ('السؤال ' + currentQuestion.questionNumber) : ('Question ' + currentQuestion.questionNumber) }}</span>
          <span class="preview-title" [class.arabic-font]="isArabic">{{ currentQuestion.questionText }}</span>
        </div>

        <!-- Choice Buttons Grid -->
        <div class="choices-container" *ngIf="currentQuestion">
          <button
            *ngFor="let opt of currentQuestion.options"
            type="button"
            class="choice-card-btn"
            (click)="quickChoose(currentQuestion, opt)"
            [disabled]="isSending"
          >
            <span class="choice-circle">{{ opt.letter }}</span>
            <span class="choice-label" [class.arabic-font]="isArabic">{{ opt.text }}</span>
          </button>
        </div>
      </div>

      <!-- Main Input Bar -->
      <div class="input-row">
        <textarea
          [(ngModel)]="text"
          [placeholder]="isArabic ? (currentQuestion ? 'أَوْ اكْتُبْ إِجَابَتَكَ هُنَا...' : 'اطْرَحْ سُؤَالَكَ بِاللُّغَةِ العَرَبِيَّةِ عَلَى المُرَبِّي الذَّكِيِّ...') : (currentQuestion ? 'Ou écris ta réponse personnalisée ici...' : 'Pose ta question au tuteur IA...')"
          [attr.dir]="isArabic ? 'rtl' : 'ltr'"
          [class.arabic-font]="isArabic"
          rows="2"
          (keydown.enter)="onEnter($event)"
          [disabled]="isSending"
        ></textarea>
        <button class="send-btn" (click)="send()" [disabled]="!text.trim() || isSending" title="Envoyer">
          <mat-icon>send</mat-icon>
        </button>
      </div>

      <!-- Quick Action Pills -->
      <div class="quick-actions" [attr.dir]="isArabic ? 'rtl' : 'ltr'">
        <button
          *ngFor="let a of currentQuickActions"
          type="button"
          class="btn btn--sm btn--secondary btn--pill"
          [class.arabic-font]="isArabic"
          (click)="quick(a.text)"
          [disabled]="isSending"
        >
          <mat-icon>{{ a.icon }}</mat-icon>
          {{ a.label }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .prompt-area {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    /* Helper Panel */
    .quiz-helper-panel {
      background: linear-gradient(135deg, #eff6ff, #f0fdf4);
      border: 1.5px solid #93c5fd;
      border-radius: 14px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
      animation: slideUp 200ms ease-out;
    }

    .helper-top {
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
      letter-spacing: 0.02em;
    }

    .helper-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #2563eb;
    }

    .question-switcher {
      display: flex;
      gap: 0.35rem;
    }

    .tab-btn {
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
      transition: all 120ms ease;
    }

    .tab-btn.is-active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 2px 5px rgba(37, 99, 235, 0.25);
    }

    .question-preview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-size: 0.88rem;
      line-height: 1.4;
    }

    .preview-badge {
      font-weight: 700;
      color: #2563eb;
      background: #dbeafe;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .preview-title {
      color: #1e293b;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .choices-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.5rem;
    }

    .choice-card-btn {
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
      text-align: left;
      transition: all 150ms ease;
      font-family: inherit;
    }

    .choice-card-btn:hover:not(:disabled) {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
      transform: translateY(-2px);
    }

    .choice-circle {
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
      flex-shrink: 0;
      border: 1px solid #93c5fd;
      transition: all 150ms ease;
    }

    .choice-card-btn:hover:not(:disabled) .choice-circle {
      background: #ffffff;
      color: #2563eb;
      border-color: #ffffff;
    }

    .choice-label {
      flex: 1;
      white-space: normal;
      line-height: 1.3;
    }

    /* Main Textarea Row */
    .input-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    textarea {
      flex: 1;
      padding: 0.75rem 0.95rem;
      border-radius: var(--radius-sm, 10px);
      border: 1.5px solid var(--border, #cbd5e1);
      resize: none;
      background: var(--surface-muted, #f8fafc);
      color: var(--text, #0f172a);
      font-size: 0.92rem;
      outline: none;
      font-family: inherit;
      line-height: 1.45;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }

    textarea::placeholder {
      color: var(--text-muted, #94a3b8);
    }

    textarea:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      background: #ffffff;
    }

    .send-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm, 10px);
      border: none;
      background: #2563eb;
      color: white;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 150ms ease;
    }

    .send-btn:hover:not(:disabled) {
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      transform: translateY(-1px);
    }

    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .send-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Quick Action Pills */
    .quick-actions {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .quick-actions .btn mat-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .arabic-font {
      font-family: 'Amiri', 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
      direction: rtl;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TutorPromptInputComponent implements OnInit, OnDestroy {
  text = '';
  isSending = false;
  activeQuizQuestions: QuizQuestion[] = [];
  selectedQuestionIndex = 0;
  currentSubject = '';

  quickActions = [
    { label: 'Expliquer autrement', text: 'Peux-tu m\'expliquer cette notion différemment avec une analogie simple ?', icon: 'lightbulb' },
    { label: 'Un exemple', text: 'Donne-moi un exemple concret d\'application.', icon: 'code' },
    { label: 'Résumer', text: 'Peux-tu me résumer la leçon en quelques points clés ?', icon: 'summarize' },
    { label: 'Mon erreur', text: 'Aide-moi à trouver où se situe mon erreur.', icon: 'search' },
    { label: 'J\'avance bien ?', text: 'Est-ce que j\'avance bien ? Fais-moi un bilan de ma progression.', icon: 'trending_up' }
  ];

  arabicQuickActions = [
    { label: '💡 شرح مبسط', text: 'هَلْ يُمْكِنُكَ شَرْحُ هَذَا المَفْهُومِ بِأُسْلُوبٍ مُبَسَّطٍ وَأَمْثِلَةٍ سَهْلَةٍ ؟', icon: 'lightbulb' },
    { label: '📘 مثال تطبيقي', text: 'أَعْطِنِي مِثَالاً وَاضِحاً وَتَطْبِيقاً عَمَلِيّاً مِنْ هَذَا الدَّرْسِ.', icon: 'code' },
    { label: '📝 تلخيص الدرس', text: 'هَلْ يُمْكِنُكَ تَلْخِيصُ النِّقَاطِ الأَسَاسِيَّةِ لِهَذَا الدَّرْسِ فِي سُطُورٍ مُوجَزَةٍ ؟', icon: 'summarize' },
    { label: '🔍 أين خطئي ؟', text: 'سَاعِدْنِي فِي مَعْرِفَةِ مَوْضِعِ الخَطَأِ فِي إِجَابَتِي وَكَيْفَ أُصَحِّحُهُ.', icon: 'search' },
    { label: '📈 حصيلة تقدمي', text: 'كَيْفَ تَرَى مُسْتَوَايَ وَتَقَدُّمِي فِي هَذِهِ المَادَّةِ ؟', icon: 'trending_up' }
  ];

  private sub?: Subscription;
  private sessionSub?: Subscription;

  constructor(private mock: MockSessionService) {}

  ngOnInit(): void {
    this.sessionSub = this.mock.session$.subscribe(s => {
      this.currentSubject = s?.subject || '';
    });

    this.sub = this.mock.messages$.subscribe(msgs => {
      if (!msgs || msgs.length === 0) {
        this.activeQuizQuestions = [];
        return;
      }

      // Check the latest message
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg.author === 'tutor') {
        const parsed = parseQuizFromText(lastMsg.text);
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

  get isArabic(): boolean {
    return this.mock.isArabicSubject(this.currentSubject);
  }

  get currentQuickActions() {
    return this.isArabic ? this.arabicQuickActions : this.quickActions;
  }

  get currentQuestion(): QuizQuestion | null {
    if (this.activeQuizQuestions.length === 0) return null;
    return this.activeQuizQuestions[this.selectedQuestionIndex] || this.activeQuizQuestions[0];
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.send();
  }

  async send(): Promise<void> {
    if (!this.text.trim() || this.isSending) return;
    const content = this.text.trim();
    this.text = '';
    this.isSending = true;

    try {
      await this.mock.pushMessage({
        id: Date.now().toString(),
        author: 'student',
        text: content
      });
    } finally {
      this.isSending = false;
    }
  }

  quick(actionText: string): void {
    this.text = actionText;
    this.send();
  }

  async quickChoose(q: QuizQuestion, opt: QuizOption): Promise<void> {
    const formattedAnswer = `Question ${q.questionNumber} : Réponse ${opt.letter} - ${opt.text}`;
    this.text = '';
    this.isSending = true;

    try {
      await this.mock.pushMessage({
        id: Date.now().toString(),
        author: 'student',
        text: formattedAnswer
      });
    } finally {
      this.isSending = false;
    }
  }
}
