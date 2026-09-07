import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockSessionService } from '../../core/services/mock-session.service';
import { AsyncPipe } from '@angular/common';
import { MockProfileService } from '../../core/services/mock-profile.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-context-panel',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <div class="ctx-card" *ngIf="session$ | async as s">
      <div class="ctx-header">
        <mat-icon class="ctx-icon">psychology</mat-icon>
        <span class="ctx-title">Contexte d'apprentissage</span>
      </div>

      <div class="ctx-list">
        <div class="ctx-row">
          <span class="ctx-label">Sujet actuel</span>
          <strong>{{ s.subject }} → {{ s.topic }}</strong>
        </div>
        <div class="ctx-row">
          <span class="ctx-label">Compréhension</span>
          <div class="ctx-bar-wrap">
            <div class="progress-bar">
              <div class="progress-bar__fill" [style.width.%]="s.understanding * 100"></div>
            </div>
            <span class="ctx-pct">{{ s.understanding * 100 | number:'1.0-0' }}%</span>
          </div>
        </div>
        <div class="ctx-row" *ngIf="s.lastDifficulty">
          <span class="ctx-label">Dernière difficulté</span>
          <strong>{{ s.lastDifficulty }}</strong>
        </div>
        <div class="ctx-row" *ngIf="s.nextAction">
          <span class="ctx-label">Prochaine action</span>
          <strong>{{ s.nextAction }}</strong>
        </div>
      </div>

      <!-- Difficulty detection -->
      <div class="ctx-alert" *ngIf="difficulty$ | async as diff">
        <div class="ctx-alert__header">
          <mat-icon>warning_amber</mat-icon>
          <span>Difficulté détectée</span>
        </div>
        <p class="ctx-alert__text">{{ diff.suggestion }}</p>
      </div>
    </div>
  `,
  styles: [`
    .ctx-card {
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background: var(--surface-strong);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-xs);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .ctx-header {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding-bottom: 0.55rem;
      border-bottom: 1px solid var(--border);
    }

    .ctx-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: var(--accent);
    }

    .ctx-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .ctx-list {
      display: grid;
      gap: 0.6rem;
    }

    .ctx-row {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .ctx-label {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .ctx-row strong {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.35;
    }

    .ctx-bar-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ctx-bar-wrap .progress-bar {
      flex: 1;
    }

    .ctx-pct {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent);
      min-width: 32px;
      text-align: right;
    }

    .ctx-alert {
      padding: 0.7rem;
      border-radius: var(--radius-sm);
      background: var(--warning-soft);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .ctx-alert__header {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 0.35rem;
    }

    .ctx-alert__header mat-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #f59e0b;
    }

    .ctx-alert__text {
      margin: 0;
      font-size: 0.82rem;
      color: #78350f;
      line-height: 1.45;
    }
  `]
})
export class ContextPanelComponent {
  session$ = this.mock.session$;
  difficulty$ = this.mock.difficulty$;
  constructor(private mock: MockSessionService) {}
}
