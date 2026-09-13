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

  // Check in-memory profile first
  let profile = profileService.currentProfile;
  if (!profile || !profile.onboardingCompleted || !(profile.firstName || profile.name)) {
    profile = await profileService.loadProfileFromDatabase(user);
  }

  if (profile && profile.onboardingCompleted && (profile.firstName || profile.name)) {
    return true;
  }

  return router.createUrlTree(['/onboarding']);
};

/** Guard that blocks users who already completed onboarding from accessing /onboarding */
export const onboardingPendingGuard: CanMatchFn = async () => {
  const profileService = inject(ProfileService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  if (!user) return router.createUrlTree(['/login']);

  let profile = profileService.currentProfile;
  if (!profile || !profile.onboardingCompleted || !(profile.firstName || profile.name)) {
    profile = await profileService.loadProfileFromDatabase(user);
  }

  if (profile && profile.onboardingCompleted && (profile.firstName || profile.name)) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};