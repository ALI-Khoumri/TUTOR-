import { Component, OnInit } from '@angular/core';
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
export class DashboardComponent implements OnInit {
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

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user && (!this.profileService.currentProfile || !this.profileService.currentProfile.onboardingCompleted)) {
      this.profileService.loadProfileFromDatabase(user);
    }
  }

  getSubtitle(profile: UserProfile): string {
    if (!profile.educationLevel) return 'Bienvenue sur ton espace d\'apprentissage';
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
    const prog = profile.progress?.globalProgress ?? 0;
    return `${prog}%`;
  }

  hasStyle(profile: UserProfile, style: string): boolean {
    return profile.learningStyles?.includes(style) ?? false;
  }
}
