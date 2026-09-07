import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { MockProfileService, UserProfile } from '../../core/services/mock-profile.service';
import { MockSessionService, SessionContext } from '../../core/services/mock-session.service';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  user$: Observable<AuthUser | null>;
  profile$: Observable<UserProfile>;
  session$: Observable<SessionContext | null>;

  constructor(
    private auth: AuthService,
    private profileService: MockProfileService,
    private sessionService: MockSessionService
  ) {
    this.user$ = this.auth.user$;
    this.profile$ = this.profileService.active$;
    this.session$ = this.sessionService.session$;
  }

  getSubtitle(profile: UserProfile): string {
    if (!profile.educationLevel) return 'Bienvenue sur ton espace';
    if (profile.educationLevel === 'Université / École supérieure') {
      const parts = [];
      if (profile.fieldOfStudy) parts.push(`Étudiant en ${profile.fieldOfStudy}`);
      if (profile.studyYear) parts.push(profile.studyYear);
      if (profile.school) parts.push(`(${profile.school})`);
      return parts.length > 0 ? parts.join(' — ') : 'Étudiant dans l\'enseignement supérieur';
    }
    return `Élève en ${profile.educationLevel}`;
  }

  getRecommendation(profile: UserProfile): string {
    if (profile.diagnosticResults?.recommendations?.[0]) {
      return profile.diagnosticResults.recommendations[0];
    }
    if (profile.subjects?.length > 0) {
      return `Découvrir les fondamentaux en ${profile.subjects[0]}`;
    }
    return 'Démarrer une première séance avec ton tuteur.';
  }

  getGlobalProgress(profile: UserProfile): string {
    if (profile.diagnosticResults?.overallScore !== undefined) {
      return `${profile.diagnosticResults.overallScore}%`;
    }
    return 'Diagnostic à effectuer';
  }

  hasStyle(profile: UserProfile, style: string): boolean {
    return profile.learningStyles?.includes(style) ?? false;
  }
}
