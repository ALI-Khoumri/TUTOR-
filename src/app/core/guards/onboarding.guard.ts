import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { filter, firstValueFrom } from 'rxjs';

export const onboardingCompleteGuard: CanMatchFn = async () => {
  const profileService = inject(ProfileService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  if (!user) return router.createUrlTree(['/login']);

  // Force a fresh load from the database to get the real onboarding status
  const profile = await profileService.loadProfileFromDatabase(user);

  if (profile && profile.onboardingCompleted && profile.firstName) {
    return true;
  }

  return router.createUrlTree(['/onboarding']);
};