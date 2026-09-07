import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockSessionService, MemoryEntry } from '../../core/services/mock-session.service';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-memory-panel',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatIconModule],
  template: `
    <div class="mem-card">
      <div class="mem-header">
        <mat-icon class="mem-icon">history</mat-icon>
        <span class="mem-title">Ce que ton tuteur a retenu</span>
      </div>

      <ng-container *ngIf="memory$ | async as mem">
        <div *ngIf="mem.length > 0; else emptyMem" class="mem-list">
          <div *ngFor="let m of mem" class="mem-item" [ngClass]="'mem-item--' + (m.type || 'progress')">
            <div class="mem-item__head">
              <span class="mem-item__title">{{ m.title }}</span>
              <span class="mem-item__delta badge" *ngIf="m.delta"
                [ngClass]="m.type === 'difficulty' ? 'badge--danger' : 'badge--success'">{{ m.delta }}</span>
            </div>
            <div class="mem-item__note">{{ m.note }}</div>
            <div class="mem-item__footer">
              <span class="mem-item__date">{{ m.date }}</span>
              <span class="mem-item__confidence" *ngIf="m.confidence">
                Confiance : <strong>{{ m.confidence }}</strong>
              </span>
            </div>
          </div>
        </div>

        <ng-template #emptyMem>
          <div class="empty-mem">
            <p class="empty-mem__lead">Pas encore de données</p>
            <p class="empty-mem__text">Ton tuteur construira progressivement ton profil d'apprentissage à partir de tes sessions.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .mem-card {
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background: var(--surface-strong);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-xs);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .mem-header {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding-bottom: 0.55rem;
      border-bottom: 1px solid var(--border);
    }

    .mem-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: var(--accent);
    }

    .mem-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .mem-list {
      display: grid;
      gap: 0.5rem;
    }

    .mem-item {
      padding: 0.6rem 0.7rem;
      border-radius: var(--radius-sm);
      background: var(--surface-muted);
      border: 1px solid var(--border);
    }

    .mem-item--difficulty {
      background: var(--warning-soft);
      border-color: rgba(245, 158, 11, 0.15);
    }

    .mem-item__head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.2rem;
    }

    .mem-item__title {
      font-weight: 600;
      font-size: 0.82rem;
      color: var(--text);
    }

    .mem-item__note {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .mem-item__footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.35rem;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .mem-item__confidence strong {
      font-weight: 700;
    }

    .empty-mem {
      padding: 1rem 0.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .empty-mem__lead {
      margin: 0;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .empty-mem__text {
      margin: 0;
      font-size: 0.76rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
  `]
})
export class MemoryPanelComponent {
  memory$ = this.mock.memory$;
  constructor(private mock: MockSessionService) {}
}
