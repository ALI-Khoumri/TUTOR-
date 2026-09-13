import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      <header class="learning-page__header">
        <div>
          <p class="learning-page__kicker">Profil personnel</p>
          <h2 class="learning-page__title">Mon profil</h2>
          <p class="learning-page__copy">Ces informations sont utilisées par le tuteur pour adapter ses explications, exercices et recommandations.</p>
        </div>
      </header>

      <!-- Consultation exclusive du profil (lecture seule) -->
      <div class="profile-grid">
        <div class="profile-card surface">
          <div class="pc-header">
            <div class="pc-avatar">{{ getInitials(profile.firstName || profile.name) }}</div>
            <div class="pc-info">
              <div class="pc-name">{{ profile.firstName || profile.name }}</div>
              <div class="pc-meta">{{ profile.age ? profile.age + ' ans · ' : '' }}{{ profile.educationLevel }}</div>
            </div>
          </div>
          <div class="pc-fields">
            <div class="pc-field">
              <span class="pc-label">Pays</span>
              <span class="pc-value">{{ profile.country || 'Non renseigné' }}</span>
            </div>
            <div class="pc-field">
              <span class="pc-label">Langue</span>
              <span class="pc-value">{{ profile.language || 'Non renseigné' }}</span>
            </div>
            <div class="pc-field" *ngIf="profile.fieldOfStudy">
              <span class="pc-label">Filière</span>
              <span class="pc-value">{{ profile.fieldOfStudy }}</span>
            </div>
            <div class="pc-field" *ngIf="profile.school">
              <span class="pc-label">Établissement</span>
              <span class="pc-value">{{ profile.school }}</span>
            </div>
            <div class="pc-field" *ngIf="profile.studyYear">
              <span class="pc-label">Année d'étude</span>
              <span class="pc-value">{{ profile.studyYear }}</span>
            </div>
          </div>
        </div>

        <div class="profile-card surface">
          <div class="pc-title">Matières</div>
          <div class="pc-tags" *ngIf="profile.subjects && profile.subjects.length > 0; else noSubjects">
            <span *ngFor="let s of profile.subjects" class="badge badge--accent">{{ s }}</span>
          </div>
          <ng-template #noSubjects>
            <span class="pc-empty">Aucune matière sélectionnée</span>
          </ng-template>
        </div>

        <div class="profile-card surface">
          <div class="pc-title">Objectifs</div>
          <div class="pc-list" *ngIf="profile.objectives && profile.objectives.length > 0; else noObjectives">
            <div *ngFor="let o of profile.objectives" class="pc-list-item">{{ o }}</div>
          </div>
          <ng-template #noObjectives>
            <span class="pc-empty">Aucun objectif défini</span>
          </ng-template>
        </div>

        <div class="profile-card surface" *ngIf="profile.difficulties && profile.difficulties.length > 0">
          <div class="pc-title">Difficultés déclarées</div>
          <div class="pc-tags">
            <span *ngFor="let d of profile.difficulties" class="badge badge--warning">{{ d }}</span>
          </div>
          <p class="pc-explanation" *ngIf="profile.difficultyExplanation">« {{ profile.difficultyExplanation }} »</p>
        </div>

        <div class="profile-card surface">
          <div class="pc-title">Préférences d'apprentissage</div>
          <div class="pc-tags" *ngIf="profile.learningStyles && profile.learningStyles.length > 0">
            <span *ngFor="let ls of profile.learningStyles" class="badge badge--accent">{{ ls }}</span>
          </div>
          <div class="pc-field" *ngIf="profile.studyTime">
            <span class="pc-label">Temps d'étude / jour</span>
            <span class="pc-value">{{ profile.studyTime }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .profile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 0.75rem;
    }

    .profile-card {
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pc-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .pc-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #0ea5e9);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }

    .pc-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .pc-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text);
    }

    .pc-meta {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .pc-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .pc-fields {
      display: grid;
      gap: 0.5rem;
    }

    .pc-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--border);
    }

    .pc-field:last-child {
      border-bottom: none;
    }

    .pc-label {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .pc-value {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text);
    }

    .pc-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .pc-list {
      display: grid;
      gap: 0.3rem;
    }

    .pc-list-item {
      padding: 0.4rem 0;
      font-size: 0.88rem;
      color: var(--text);
      border-bottom: 1px solid var(--border);
    }

    .pc-list-item:last-child { border-bottom: none; }

    .pc-explanation {
      font-style: italic;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }

    .pc-empty {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-style: italic;
    }

    @media (max-width: 768px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile$ = this.profileService.active$;

  constructor(
    private profileService: ProfileService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user && (!this.profileService.currentProfile || !this.profileService.currentProfile.onboardingCompleted)) {
      this.profileService.loadProfileFromDatabase(user);
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
