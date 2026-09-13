import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockSessionService } from '../../core/services/mock-session.service';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { parseQuizFromText, ParsedTutorContent, QuizQuestion, QuizOption } from '../../core/utils/quiz-parser';

@Component({
  selector: 'app-tutor-message-list',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <div class="messages" *ngIf="messages$ | async as msgs">
      <div *ngFor="let m of msgs" class="msg" [ngClass]="m.author">
        <div class="msg-avatar" *ngIf="m.author === 'tutor'">
          <mat-icon>smart_toy</mat-icon>
        </div>
        
        <div class="bubble" [class.is-arabic-msg]="isArabicText(m.text)">
          <!-- Normal Conversation Message -->
          <ng-container *ngIf="m.author === 'student' || !getParsed(m.text).isQuiz">
            <div
              class="plain-text"
              [class.arabic-font]="isArabicText(m.text)"
              [attr.dir]="isArabicText(m.text) ? 'rtl' : 'ltr'"
              [innerHTML]="formatText(m.text)"
            ></div>
          </ng-container>

          <!-- Interactive Quiz Card -->
          <ng-container *ngIf="m.author === 'tutor' && getParsed(m.text).isQuiz">
            <div class="quiz-container">
              <!-- Intro greeting -->
              <p
                class="quiz-intro"
                *ngIf="getParsed(m.text).introText"
                [class.arabic-font]="isArabicText(getParsed(m.text).introText)"
                [attr.dir]="isArabicText(getParsed(m.text).introText) ? 'rtl' : 'ltr'"
              >
                {{ getParsed(m.text).introText }}
              </p>

              <!-- List of Questions -->
              <div class="quiz-questions-list">
                <div
                  *ngFor="let q of getParsed(m.text).questions; let qi = index"
                  class="quiz-card"
                  [attr.dir]="isArabicText(q.questionText) ? 'rtl' : 'ltr'"
                >
                  <div class="quiz-card-top">
                    <div class="quiz-badge">
                      <mat-icon>quiz</mat-icon>
                      <span>{{ isArabicText(q.questionText) ? ('السؤال ' + q.questionNumber) : ('Question ' + q.questionNumber) }}</span>
                    </div>
                    <span class="quiz-counter" *ngIf="getParsed(m.text).questions.length > 1">
                      {{ qi + 1 }} {{ isArabicText(q.questionText) ? 'من' : 'sur' }} {{ getParsed(m.text).questions.length }}
                    </span>
                  </div>

                  <p class="quiz-question-title" [class.arabic-font]="isArabicText(q.questionText)">{{ q.questionText }}</p>

                  <div class="quiz-options-grid">
                    <button
                      *ngFor="let opt of q.options"
                      type="button"
                      class="quiz-option-btn"
                      [class.is-selected]="q.selectedLetter === opt.letter"
                      [class.arabic-font]="isArabicText(opt.text)"
                      (click)="chooseOption(q, opt)"
                    >
                      <span class="opt-letter">{{ opt.letter }}</span>
                      <span class="opt-text">{{ opt.text }}</span>
                      <mat-icon class="opt-arrow">arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Outro instructions -->
              <p class="quiz-outro" *ngIf="getParsed(m.text).outroText">
                {{ getParsed(m.text).outroText }}
              </p>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messages {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      padding: 0.85rem 0.5rem;
      flex: 1;
      overflow-y: auto;
      min-height: 220px;
      max-height: 520px;
    }

    .msg {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .msg.tutor {
      justify-content: flex-start;
    }

    .msg.student {
      justify-content: flex-end;
    }

    .msg-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 1.5px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
    }

    .msg-avatar mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #2563eb;
    }

    .bubble {
      max-width: min(94%, 680px);
      padding: 0.95rem 1.25rem;
      border-radius: 16px;
      line-height: 1.65;
      font-size: 0.93rem;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
      animation: msgIn 200ms ease-out both;
    }

    .msg.tutor .bubble {
      background: #ffffff;
      color: #1e293b;
      border-top-left-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .msg.student .bubble {
      background: linear-gradient(135deg, #2563eb, #0284c7);
      color: white;
      border-top-right-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .plain-text {
      white-space: pre-line;
      word-break: break-word;
    }

    /* Quiz Card Styling */
    .quiz-container {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .quiz-intro {
      margin: 0;
      font-size: 0.94rem;
      color: #334155;
      line-height: 1.5;
    }

    .quiz-outro {
      margin: 0.35rem 0 0;
      font-size: 0.86rem;
      color: #64748b;
      font-style: italic;
    }

    .quiz-questions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .quiz-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 1rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 180ms ease;
    }

    .quiz-card:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
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
      text-transform: uppercase;
      letter-spacing: 0.04em;
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
      position: relative;
    }

    .quiz-option-btn:hover {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
      transform: translateX(4px);
      box-shadow: 0 3px 8px rgba(37, 99, 235, 0.14);
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
      transform: scale(1.05);
    }

    .opt-text {
      flex: 1;
      line-height: 1.4;
      font-weight: 500;
    }

    .opt-arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
      opacity: 0;
      transition: all 150ms ease;
      transform: translateX(-4px);
    }

    .quiz-option-btn:hover .opt-arrow {
      opacity: 1;
      color: #2563eb;
      transform: translateX(0);
    }

    .quiz-option-btn.is-selected {
      border-color: #16a34a;
      background: #f0fdf4;
      color: #15803d;
    }

    .quiz-option-btn.is-selected .opt-letter {
      background: #16a34a;
      color: white;
      border-color: #16a34a;
    }

    .arabic-font {
      font-family: 'Amiri', 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
      direction: rtl;
      text-align: right;
      font-size: 1.05rem;
      line-height: 1.85;
    }

    @keyframes msgIn {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class TutorMessageListComponent {
  messages$ = this.mock.messages$;
  private parsedCache = new Map<string, ParsedTutorContent>();

  constructor(private mock: MockSessionService) {}

  isArabicText(text?: string): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF]/.test(text);
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

  async chooseOption(q: QuizQuestion, opt: QuizOption): Promise<void> {
    q.selectedLetter = opt.letter;
    const formattedAnswer = `Question ${q.questionNumber} : Réponse ${opt.letter} - ${opt.text}`;
    await this.mock.pushMessage({
      id: Date.now().toString(),
      author: 'student',
      text: formattedAnswer
    });
  }
}
