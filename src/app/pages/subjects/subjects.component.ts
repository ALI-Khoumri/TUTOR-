import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { MockProfileService } from '../../core/services/mock-profile.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      <header class="learning-page__header">
        <div>
          <p class="learning-page__kicker">Carte d'apprentissage</p>
          <h2 class="learning-page__title">Mes matières</h2>
          <p class="learning-page__copy">Les matières sont adaptées à ton profil et à tes objectifs. Le tuteur les utilise pour cibler ses recommandations.</p>
        </div>
      </header>

      <div class="subjects-grid">
        <div *ngFor="let subject of profile.subjects; let i = index" class="surface subject-card">
          <div class="sc-top">
            <mat-icon class="sc-subject-icon">{{ subjectIcons[i % subjectIcons.length] }}</mat-icon>
            <div class="sc-subject-name">{{ subject }}</div>
          </div>
          <div class="sc-level">
            <div class="progress-bar">
              <div class="progress-bar__fill" [style.width.%]="getLevel(profile, subject)"></div>
            </div>
            <span class="sc-pct">{{ getLevel(profile, subject) }}%</span>
          </div>
          <div class="sc-status">
            <span class="badge badge--accent">{{ profile.objectives[0] || 'En cours' }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.75rem;
    }

    .subject-card {
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .sc-top {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .sc-subject-icon {
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
      color: var(--accent);
    }

    .sc-subject-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text);
    }

    .sc-level {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sc-level .progress-bar { flex: 1; }

    .sc-pct {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--accent);
      min-width: 32px;
      text-align: right;
    }

    .sc-status {
      display: flex;
      gap: 0.35rem;
    }
  `]
})
export class SubjectsComponent {
  profile$ = this.profile.active$;
  subjectIcons = ['calculate', 'science', 'code', 'language', 'psychology', 'engineering', 'menu_book', 'analytics'];

  constructor(private profile: MockProfileService) {}

  getLevel(profile: any, subject: string): number {
    if (profile.currentLevels?.[subject] !== undefined) {
      return Math.round(profile.currentLevels[subject] * 100);
    }
    return 0;
  }
}
