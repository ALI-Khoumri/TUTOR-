import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MockProfileService, UserProfile, AnyEducationLevel } from '../../core/services/mock-profile.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FormsModule, MatIconModule],
  template: `
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      <header class="learning-page__header">
        <div>
          <p class="learning-page__kicker">Profil personnel</p>
          <h2 class="learning-page__title">Mon profil</h2>
          <p class="learning-page__copy">Ces informations sont utilisées par le tuteur pour adapter ses explications, exercices et recommandations.</p>
        </div>
        <div class="learning-page__actions">
          <button class="btn btn--secondary btn--sm btn--pill" *ngIf="!editing" (click)="startEditing(profile)">
            <mat-icon>edit</mat-icon> Modifier mon profil
          </button>
          <button class="btn btn--primary btn--sm btn--pill" *ngIf="editing" (click)="save()">
            <mat-icon>check</mat-icon> Enregistrer
          </button>
          <button class="btn btn--ghost btn--sm btn--pill" *ngIf="editing" (click)="cancelEdit()">Annuler</button>
        </div>
      </header>

      <!-- View mode -->
      <div *ngIf="!editing" class="profile-grid">
        <div class="profile-card surface">
          <div class="pc-header">
            <div class="pc-avatar">{{ getInitials(profile.firstName || profile.name) }}</div>
            <div class="pc-info">
              <div class="pc-name">{{ profile.firstName || profile.name }}</div>
              <div class="pc-meta">{{ profile.age }} ans · {{ profile.educationLevel }}</div>
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
          <div class="pc-tags">
            <span *ngFor="let s of profile.subjects" class="badge badge--accent">{{ s }}</span>
          </div>
        </div>

        <div class="profile-card surface">
          <div class="pc-title">Objectifs</div>
          <div class="pc-list">
            <div *ngFor="let o of profile.objectives" class="pc-list-item">{{ o }}</div>
          </div>
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

      <!-- Edit mode -->
      <div *ngIf="editing" class="edit-form surface">
        <div class="form-grid">
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" [(ngModel)]="editData.firstName">
          </div>
          <div class="form-group">
            <label>Âge</label>
            <input type="number" [(ngModel)]="editData.age" min="5" max="99">
          </div>
          <div class="form-group">
            <label>Pays</label>
            <input type="text" [(ngModel)]="editData.country">
          </div>
          <div class="form-group">
            <label>Langue</label>
            <input type="text" [(ngModel)]="editData.language">
          </div>
          <div class="form-group form-group--full">
            <label>Niveau scolaire</label>
            <select [(ngModel)]="editData.educationLevel">
              <option *ngFor="let lvl of educationLevels" [value]="lvl">{{ lvl }}</option>
            </select>
          </div>
          <div class="form-group" *ngIf="editData.fieldOfStudy !== undefined">
            <label>Filière</label>
            <input type="text" [(ngModel)]="editData.fieldOfStudy">
          </div>
          <div class="form-group" *ngIf="editData.school !== undefined">
            <label>Établissement</label>
            <input type="text" [(ngModel)]="editData.school">
          </div>
          <div class="form-group" *ngIf="editData.studyYear !== undefined">
            <label>Année d'étude</label>
            <input type="text" [(ngModel)]="editData.studyYear">
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

    /* Edit form */
    .edit-form {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .form-group--full {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-group input,
    .form-group select {
      padding: 0.65rem 0.8rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-muted);
      color: var(--text);
      font-size: 0.9rem;
    }

    .form-group input:focus,
    .form-group select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--focus);
      outline: none;
    }

    @media (max-width: 768px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent {
  profile$ = this.profile.active$;
  editing = false;
  editData: Partial<UserProfile> = {};

  educationLevels: AnyEducationLevel[] = [
    'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale',
    'Université / École supérieure'
  ];

  constructor(private profile: MockProfileService) {}

  getInitials(name?: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  startEditing(profile: UserProfile): void {
    this.editData = {
      firstName: profile.firstName,
      age: profile.age,
      country: profile.country,
      language: profile.language,
      educationLevel: profile.educationLevel,
      fieldOfStudy: profile.fieldOfStudy,
      school: profile.school,
      studyYear: profile.studyYear
    };
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editData = {};
  }

  async save(): Promise<void> {
    await this.profile.updateProfile({
      ...this.editData,
      name: this.editData.firstName || this.profile.currentProfile.name
    });
    this.editing = false;
  }
}
