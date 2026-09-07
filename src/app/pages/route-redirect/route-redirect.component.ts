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

  ngOnInit(): void {
    if (!this.auth.isLoggedIn) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }
    const target = this.profile.isOnboardingComplete() ? '/dashboard' : '/onboarding';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}