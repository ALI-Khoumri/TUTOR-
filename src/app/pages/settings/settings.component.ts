import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { MockProfileService } from '../../core/services/mock-profile.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      <header class="learning-page__header">
        <div>
          <p class="learning-page__kicker">Configuration</p>
          <h2 class="learning-page__title">Paramètres d'apprentissage</h2>
          <p class="learning-page__copy">Ajuste les préférences pédagogiques et l'accompagnement de ton tuteur IA.</p>
        </div>
      </header>

      <div class="surface learning-page__surface">
        <div class="learning-list">
          <div class="learning-item">
            <div class="learning-item__title">
              <mat-icon class="li-icon">tune</mat-icon>
              Rythme pédagogique
            </div>
            <div class="learning-item__copy">
              {{ profile.learningPreferences?.pace === 'slow' ? 'Progressif et détaillé' : 'Modéré avec exemples guidés' }}
            </div>
          </div>
          <div class="learning-item">
            <div class="learning-item__title">
              <mat-icon class="li-icon">record_voice_over</mat-icon>
              Style du tuteur
            </div>
            <div class="learning-item__copy">Bienveillant, clair, stimulant et centré sur la compréhension active.</div>
          </div>
          <div class="learning-item">
            <div class="learning-item__title">
              <mat-icon class="li-icon">schedule</mat-icon>
              Temps d'étude quotidien visé
            </div>
            <div class="learning-item__copy">{{ profile.studyTime || '30 min – 1 h' }}</div>
          </div>
          <div class="learning-item">
            <div class="learning-item__title">
              <mat-icon class="li-icon">restart_alt</mat-icon>
              Réinitialiser mon profil
            </div>
            <div class="learning-item__copy" style="margin-top: 0.5rem;">
              <button class="btn btn--secondary btn--sm btn--pill" (click)="reset()">
                Refaire l'onboarding complet
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .li-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: var(--accent);
      vertical-align: text-bottom;
      margin-right: 0.3rem;
    }

    .learning-item__title {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
  `]
})
export class SettingsComponent {
  profile$ = this.profile.active$;

  constructor(private profile: MockProfileService, private router: Router) {}

  async reset(): Promise<void> {
    if (confirm('Souhaites-tu réinitialiser ton profil et recommencer l\'onboarding ?')) {
      await this.profile.resetCurrentProfile();
      void this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    }
  }
}
