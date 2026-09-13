import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-route-redirect',
  standalone: true,
  template: ''
})
export class RouteRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private profile: ProfileService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.isLoggedIn) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    try {
      // Check in-memory profile first
      let isComplete = this.profile.isOnboardingComplete();
      if (!isComplete && this.auth.currentUser) {
        // Await fresh profile from backend
        const p = await this.profile.loadProfileFromDatabase(this.auth.currentUser);
        isComplete = !!(p && p.onboardingCompleted && (p.firstName || p.name));
      }

      const target = isComplete ? '/dashboard' : '/onboarding';
      void this.router.navigateByUrl(target, { replaceUrl: true });
    } catch {
      void this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    }
  }
}