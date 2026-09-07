import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { MockProfileService } from '../../core/services/mock-profile.service';
import { MockSessionService } from '../../core/services/mock-session.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      <header class="learning-page__header">
        <div>
          <p class="learning-page__kicker">Parcours d'apprentissage</p>
          <h2 class="learning-page__title">Mon parcours</h2>
          <p class="learning-page__copy">Le parcours suit ta progression et s'adapte à tes difficultés détectées.</p>
        </div>
      </header>

      <div class="surface learning-page__surface">
        <div class="learning-list">
          <div class="learning-item">
            <div class="learning-item__title">
              <mat-icon class="li-icon">menu_book</mat-icon>
              Matière actuelle
            </div>
            <div class="learning-item__copy">{{ profile.subjects[0] || 'Non définie' }}</div>
          </div>
          <div class="learning-item" *ngIf="session$ | async as session">
            <div class="learning-item__title">
              <mat-icon class="li-icon">topic</mat-icon>
              Sujet en cours
            </div>
            <div class="learning-item__copy">{{ session.topic }}</div>
          </div>
          <div class="learning-item">
            <div class="learning-item__title">
              <mat-icon class="li-icon">flag</mat-icon>
              Objectif du parcours
            </div>
            <div class="learning-item__copy">{{ profile.objectives[0] || 'Aucun objectif défini' }}</div>
          </div>
          <div class="learning-item">
            <div class="learning-item__title">
              <mat-icon class="li-icon">next_plan</mat-icon>
              Mouvement suggéré
            </div>
            <div class="learning-item__copy">Continue avec le prochain concept, puis reviens à une boucle de pratique pour renforcer ce que tu viens d'apprendre.</div>
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
export class CourseComponent {
  profile$ = this.profile.active$;
  session$ = this.session.session$;

  constructor(private profile: MockProfileService, private session: MockSessionService) {}
}
