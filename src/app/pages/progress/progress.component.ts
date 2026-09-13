import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { MockProfileService } from '../../core/services/mock-profile.service';
import { MockSessionService } from '../../core/services/mock-session.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      <header class="learning-page__header">
        <div>
          <p class="learning-page__kicker">Progression</p>
          <h2 class="learning-page__title">Mon évolution</h2>
          <p class="learning-page__copy">Suis ta progression, identifie tes points forts et les domaines à travailler.</p>
        </div>
      </header>

      <!-- Global progress -->
      <div class="progress-overview">
        <div class="stat-card">
          <span class="stat-card__label">Progression globale</span>
          <span class="stat-card__value">{{ profile.progress?.globalProgress || 0 }}%</span>
          <div class="progress-bar" style="margin-top: 0.4rem;">
            <div class="progress-bar__fill" [style.width.%]="profile.progress?.globalProgress || 0"></div>
          </div>
          <span class="stat-card__sub">Évolue au fil de tes cours, exercices et quiz</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Exercices réalisés</span>
          <span class="stat-card__value">{{ profile.progress?.exercisesCompleted || 0 }}</span>
          <span class="stat-card__sub">exercices complétés</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Quiz passés</span>
          <span class="stat-card__value">{{ profile.progress?.quizCompleted || 0 }}</span>
          <span class="stat-card__sub">quiz terminés</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Temps d'étude</span>
          <span class="stat-card__value">{{ profile.progress?.studyTimeTotal || '0m' }}</span>
          <span class="stat-card__sub">au total</span>
        </div>
      </div>

      <!-- Per subject -->
      <div class="surface section-card" *ngIf="profile.subjects && profile.subjects.length > 0">
        <div class="sc-title">Progression par matière</div>
        <div class="subject-list">
          <div *ngFor="let subject of profile.subjects" class="subject-row">
            <div class="sr-head">
              <span class="sr-name">{{ subject }}</span>
              <span class="sr-pct">{{ getSubjectLevel(profile, subject) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar__fill" [style.width.%]="getSubjectLevel(profile, subject)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Strengths & Weaknesses -->
      <div class="sw-grid">
        <div class="surface section-card">
          <div class="sc-title">
            <mat-icon class="sc-icon sc-icon--success">check_circle</mat-icon>
            Points forts
          </div>
          <div class="tag-list">
            <span *ngFor="let s of profile.strongTopics" class="badge badge--success">✓ {{ s }}</span>
            <span *ngIf="!profile.strongTopics || profile.strongTopics.length === 0" class="muted-text">Identifiés au fil de tes réponses et exercices avec le tuteur.</span>
          </div>
        </div>

        <div class="surface section-card">
          <div class="sc-title">
            <mat-icon class="sc-icon sc-icon--warning">flag</mat-icon>
            Points à renforcer
          </div>
          <div class="tag-list">
            <span *ngFor="let w of profile.weakTopics" class="badge badge--warning">⚡ {{ w }}</span>
            <span *ngIf="!profile.weakTopics || profile.weakTopics.length === 0" class="muted-text">Aucune lacune spécifique pour le moment.</span>
          </div>
        </div>
      </div>

      <!-- Detected difficulties -->
      <div class="surface section-card" *ngIf="profile.difficulties && profile.difficulties.length > 0">
        <div class="sc-title">
          <mat-icon class="sc-icon sc-icon--danger">psychology_alt</mat-icon>
          Difficultés déclarées
        </div>
        <div class="difficulty-list">
          <div *ngFor="let d of profile.difficulties" class="diff-item">
            <mat-icon class="diff-icon">arrow_right</mat-icon>
            <span>{{ d }}</span>
          </div>
        </div>
      </div>

      <!-- Tutor recommendations -->
      <div class="surface section-card reco-card">
        <div class="sc-title">
          <mat-icon class="sc-icon sc-icon--accent">auto_awesome</mat-icon>
          Recommandations du tuteur
        </div>
        <div class="reco-list" *ngIf="profile.diagnosticResults?.recommendations as recs">
          <div *ngFor="let r of recs; let i = index" class="reco-item">
            <span class="reco-num">{{ i + 1 }}</span>
            <span>{{ r }}</span>
          </div>
        </div>
        <div *ngIf="!profile.diagnosticResults?.recommendations" class="reco-list">
          <div class="reco-item">
            <span class="reco-num">1</span>
            <span>Démarre ta première séance avec le tuteur en {{ profile.subjects[0] || 'ta matière principale' }}.</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .progress-overview {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .stat-card__value--small {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .section-card {
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .sc-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .sc-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }
    .sc-icon--success { color: var(--success); }
    .sc-icon--warning { color: var(--warning); }
    .sc-icon--danger { color: var(--danger); }
    .sc-icon--accent { color: var(--accent); }

    .subject-list {
      display: grid;
      gap: 0.65rem;
    }

    .subject-row {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .sr-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sr-name {
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--text);
    }

    .sr-pct {
      font-weight: 700;
      font-size: 0.82rem;
      color: var(--accent);
    }

    .sw-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .muted-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .difficulty-list {
      display: grid;
      gap: 0.35rem;
    }

    .diff-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.88rem;
      color: var(--text);
    }

    .diff-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: var(--text-muted);
    }

    .reco-card {
      background: var(--accent-surface);
      border-color: rgba(37, 99, 235, 0.12);
    }

    .reco-list {
      display: grid;
      gap: 0.5rem;
    }

    .reco-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.9rem;
      color: var(--text);
    }

    .reco-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent);
      color: white;
      font-size: 0.72rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .sw-grid {
        grid-template-columns: 1fr;
      }

      .progress-overview {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 480px) {
      .progress-overview {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProgressComponent {
  profile$ = this.profile.active$;

  constructor(private profile: MockProfileService, private session: MockSessionService) {}

  getSubjectLevel(profile: any, subject: string): number {
    if (profile.currentLevels?.[subject] !== undefined) {
      return Math.round(profile.currentLevels[subject] * 100);
    }
    return 0;
  }
}
