import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-404 page-enter">
      <div class="surface page-404__card">
        <p class="learning-page__kicker">Page introuvable</p>
        <h2 class="page-404__title">Cette page ne fait pas partie de l'espace d'apprentissage.</h2>
        <p class="page-404__copy">Tu peux revenir à l'espace tuteur pour poursuivre ta session.</p>
        <a routerLink="/tutor" class="btn btn--primary btn--pill page-404__link">Retourner au tuteur</a>
      </div>
    </section>
  `
})
export class PageNotFoundComponent {}
