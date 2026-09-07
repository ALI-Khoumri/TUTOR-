import { inject } from '@angular/core';
import { CanMatchFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks access to protected routes if user is not authenticated. */
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? true : router.createUrlTree(['/login']);
};

/** CanActivate version for individual routes */
export const authActivateGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? true : router.createUrlTree(['/login']);
};

/** Redirect to dashboard if already logged in (for login/register pages) */
export const alreadyLoggedInGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? router.createUrlTree(['/dashboard']) : true;
};