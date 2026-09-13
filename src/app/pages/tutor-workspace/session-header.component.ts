import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockSessionService } from '../../core/services/mock-session.service';
import { AsyncPipe } from '@angular/common';
import { MockProfileService } from '../../core/services/mock-profile.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-session-header',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
  <div
    class="session-header surface--flat"
    *ngIf="session$ | async as s"
    [class.arabic-header]="isArabicSubject(s.subject)"
    [attr.dir]="isArabicSubject(s.subject) ? 'rtl' : 'ltr'"
  >
    <div class="session-info">
      <div class="session-meta">
        <mat-icon class="session-icon">auto_awesome</mat-icon>
        <span class="session-kicker">{{ isArabicSubject(s.subject) ? 'المُرَبِّي الذَّكِيُّ • AI Personal Tutor' : 'AI Personal Tutor' }}</span>
      </div>
      <div class="session-topic" [class.arabic-font]="isArabicSubject(s.subject)">
        {{ isArabicSubject(s.subject) ? (s.subject + ' ← ' + s.topic) : (s.subject + ' → ' + s.topic) }}
      </div>
      <div class="session-summary" *ngIf="profile$ | async as p" [class.arabic-font]="isArabicSubject(s.subject)">
        <ng-container *ngIf="isArabicSubject(s.subject)">
          تَتَعَلَّمُ الآنَ مَادَّةَ <strong>{{ s.subject }}</strong>.
          <span *ngIf="s.understanding > 0">
            نِسْبَةُ الاِسْتِيعَابِ التَّقْدِيرِيَّةُ : {{ s.understanding * 100 | number:'1.0-0' }}%.
          </span>
          <span *ngIf="s.understanding === 0">
            المُسْتَوَى الأَوَّلِيُّ : قَيْدَ التَّقْيِيمِ التَّشْخِيصِيِّ.
          </span>
          <span *ngIf="s.nextAction"> الخُطْوَةُ المُقْتَرَحَةُ : {{ s.nextAction }}.</span>
        </ng-container>
        <ng-container *ngIf="!isArabicSubject(s.subject)">
          Tu travailles sur <strong>{{ s.subject }}</strong>.
          <span *ngIf="s.understanding > 0">
            Niveau estimé : {{ s.understanding * 100 | number:'1.0-0' }}%.
          </span>
          <span *ngIf="s.understanding === 0">
            Niveau initial : en cours d'évaluation.
          </span>
          <span *ngIf="s.nextAction">Prochaine étape recommandée : {{ s.nextAction }}.</span>
        </ng-container>
      </div>
    </div>
    <div class="session-progress">
      <div class="sp-head">
        <span class="sp-label">{{ isArabicSubject(s.subject) ? 'نِسْبَةُ الاِسْتِيعَابِ' : 'Compréhension' }}</span>
        <span class="sp-pct" *ngIf="s.understanding > 0">{{ s.understanding * 100 | number:'1.0-0' }}%</span>
        <span class="sp-pct" *ngIf="s.understanding === 0">{{ isArabicSubject(s.subject) ? 'أَوَّلِي' : 'Initial' }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill" [style.width.%]="s.understanding > 0 ? (s.understanding * 100) : 10"></div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      background: var(--surface-strong);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-xs);
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .session-meta {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .session-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: var(--accent);
    }

    .session-kicker {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .session-topic {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.3;
    }

    .session-summary {
      max-width: 54ch;
      font-size: 0.85rem;
      line-height: 1.45;
      color: var(--text-muted);
    }

    .session-progress {
      width: min(240px, 100%);
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--surface-muted);
      border: 1px solid var(--border);
      flex-shrink: 0;
    }

    .sp-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }

    .sp-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .sp-pct {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent);
    }

    .arabic-header {
      direction: rtl;
      text-align: right;
    }

    .arabic-font {
      font-family: 'Amiri', 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
      direction: rtl;
    }

    @media (max-width: 768px) {
      .session-header {
        flex-direction: column;
        align-items: stretch;
      }

      .session-progress {
        width: 100%;
      }
    }
  `]
})
export class SessionHeaderComponent {
  session$ = this.mock.session$;
  profile$ = this.profile.active$;

  constructor(private mock: MockSessionService, private profile: MockProfileService) {}

  isArabicSubject(subj?: string): boolean {
    return this.mock.isArabicSubject(subj);
  }
}
