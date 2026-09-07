import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../core/services/profile.service';
import { MockSessionService } from '../../core/services/mock-session.service';
import { SessionHeaderComponent } from './session-header.component';
import { TutorCanvasComponent } from './tutor-canvas.component';
import { MemoryPanelComponent } from './memory-panel.component';
import { ContextPanelComponent } from './context-panel.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tutor-workspace',
  standalone: true,
  imports: [CommonModule, MatIconModule, SessionHeaderComponent, TutorCanvasComponent, MemoryPanelComponent, ContextPanelComponent],
  templateUrl: './tutor-workspace.component.html',
  styleUrls: ['./tutor-workspace.component.scss']
})
export class TutorWorkspaceComponent implements OnInit, OnDestroy {
  profile$ = this.profile.active$;
  session$ = this.session.session$;

  subjects: string[] = [];
  activeSubject = '';
  isSwitching = false;

  private sub?: Subscription;

  constructor(private profile: ProfileService, private session: MockSessionService) {}

  ngOnInit(): void {
    this.sub = this.profile.active$.subscribe(p => {
      if (p && p.subjects && p.subjects.length > 0) {
        this.subjects = p.subjects;
      }
    });

    this.session.session$.subscribe(s => {
      if (s) {
        this.activeSubject = s.subject;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async switchSubject(subject: string): Promise<void> {
    if (subject === this.activeSubject || this.isSwitching) return;
    this.isSwitching = true;
    this.activeSubject = subject;

    try {
      await this.session.switchToSubject(subject);
    } finally {
      this.isSwitching = false;
    }
  }
}
