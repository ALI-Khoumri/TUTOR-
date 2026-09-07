import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorMessageListComponent } from './tutor-message-list.component';
import { TutorPromptInputComponent } from './tutor-prompt-input.component';

@Component({
  selector: 'app-tutor-canvas',
  standalone: true,
  imports: [CommonModule, TutorMessageListComponent, TutorPromptInputComponent],
  template: `
    <div class="canvas-card">
      <app-tutor-message-list></app-tutor-message-list>
      <app-tutor-prompt-input></app-tutor-prompt-input>
    </div>
  `,
  styles: [`
    .canvas-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: var(--radius-lg);
      background: var(--surface-strong);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      min-height: 480px;
    }
  `]
})
export class TutorCanvasComponent {}
