import { Routes } from '@angular/router';
import { onboardingCompleteGuard } from './core/guards/onboarding.guard';
import { authGuard, alreadyLoggedInGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Root redirect
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/route-redirect/route-redirect.component').then(m => m.RouteRedirectComponent) },

  // Public auth pages (redirect to dashboard if already logged in)
  { path: 'login',    canMatch: [alreadyLoggedInGuard], loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', canMatch: [alreadyLoggedInGuard], loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },

  // Onboarding: must be logged in but onboarding not done yet
  { path: 'onboarding', canMatch: [authGuard], loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent) },

  // Protected app routes: must be logged in + onboarding done
  {
    path: '',
    canMatch: [authGuard, onboardingCompleteGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'tutor',     loadComponent: () => import('./pages/tutor-workspace/tutor-workspace.component').then(m => m.TutorWorkspaceComponent) },
      { path: 'profile',   loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'subjects',  loadComponent: () => import('./pages/subjects/subjects.component').then(m => m.SubjectsComponent) },
      { path: 'course',    loadComponent: () => import('./pages/course/course.component').then(m => m.CourseComponent) },
      { path: 'exercises', loadComponent: () => import('./pages/exercises/exercises.component').then(m => m.ExercisesComponent) },
      { path: 'quiz',      loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent) },
      { path: 'progress',  loadComponent: () => import('./pages/progress/progress.component').then(m => m.ProgressComponent) },
      { path: 'settings',  loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) }
    ]
  },

  { path: '404', loadComponent: () => import('./pages/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent) },
  { path: '**', redirectTo: '404' }
];