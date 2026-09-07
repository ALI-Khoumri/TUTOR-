import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { AuthService, AuthUser } from './auth.service';
import {
  AnyEducationLevel, DiagnosticResult, getSchoolCategory,
  OnboardingProfileInput, UserProfile
} from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly draftStorageKey = 'tutorai.onboarding-draft.v2';
  private readonly activeProfile$ = new BehaviorSubject<UserProfile>(this.createEmptyProfile());

  constructor(private auth: AuthService, private http: HttpClient) {
    this.auth.user$.subscribe((user) => {
      if (user) {
        this.loadProfileFromDatabase(user);
      } else {
        this.activeProfile$.next(this.createEmptyProfile());
      }
    });
  }

  get active$(): Observable<UserProfile> {
    return this.activeProfile$.asObservable();
  }

  get currentProfile(): UserProfile {
    return this.activeProfile$.value;
  }

  isOnboardingComplete(): boolean {
    return !!this.currentProfile && this.currentProfile.onboardingCompleted === true && !!this.currentProfile.firstName;
  }

  /** Loads the student profile from the MySQL backend using JWT. */
  async loadProfileFromDatabase(user: AuthUser | null): Promise<UserProfile> {
    if (!user) {
      const empty = this.createEmptyProfile();
      this.activeProfile$.next(empty);
      return empty;
    }
    try {
      // Use studentId if available, else use user.id as fallback
      const studentId = user.studentId || user.id;
      const profile = await firstValueFrom(this.http.get<UserProfile>('/api/profile', {
        headers: {
          'x-student-id': studentId,
          ...this.auth.getAuthHeaders()
        }
      }));
      if (profile && profile.onboardingCompleted && profile.firstName) {
        this.activeProfile$.next(profile);
        return profile;
      }
    } catch (err) {
      console.warn('[ProfileService] Could not reach backend:', err);
    }
    const empty = this.createEmptyProfile();
    this.activeProfile$.next(empty);
    return empty;
  }

  /** Completes onboarding by saving to MySQL via REST API. Returns the new studentId. */
  async completeOnboarding(input: OnboardingProfileInput): Promise<{ profile: UserProfile; studentId: string | null }> {
    const user = this.auth.currentUser;
    let createdStudentId: string | null = null;

    try {
      const response: any = await firstValueFrom(this.http.post('/api/onboarding/complete', input, {
        headers: {
          'x-student-id': user?.studentId || user?.id || 'default-student',
          ...this.auth.getAuthHeaders()
        }
      }));
      // Backend may return the studentId that was created
      createdStudentId = response?.studentId || response?.id || user?.studentId || null;
    } catch (err) {
      console.error('[ProfileService] Failed to complete onboarding in MySQL backend:', err);
    }

    const updated = await this.loadProfileFromDatabase(user);
    this.clearDraft();
    return { profile: updated, studentId: createdStudentId };
  }

  /** Updates profile fields in MySQL. */
  async updateProfile(partial: Partial<UserProfile>): Promise<UserProfile> {
    const user = this.auth.currentUser;
    const studentId = user?.studentId || user?.id || 'default-student';

    try {
      await firstValueFrom(this.http.put('/api/profile', partial, {
        headers: {
          'x-student-id': studentId,
          ...this.auth.getAuthHeaders()
        }
      }));
    } catch (err) {
      console.error('[ProfileService] Failed to update profile in MySQL:', err);
    }

    return this.loadProfileFromDatabase(user);
  }

  saveDraft(draft: Partial<OnboardingProfileInput> & { currentStep?: number }): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.draftStorageKey, JSON.stringify(draft));
  }

  getDraft(): (Partial<OnboardingProfileInput> & { currentStep?: number }) | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.draftStorageKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  clearDraft(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.draftStorageKey);
  }

  async resetCurrentProfile(): Promise<UserProfile> {
    const user = this.auth.currentUser;
    const studentId = user?.studentId || user?.id || 'default-student';

    try {
      await firstValueFrom(this.http.post('/api/profile/reset', {}, {
        headers: {
          'x-student-id': studentId,
          ...this.auth.getAuthHeaders()
        }
      }));
    } catch (err) {
      console.error('[ProfileService] Failed to reset profile in MySQL:', err);
    }

    this.clearDraft();
    const empty = this.createEmptyProfile();
    this.activeProfile$.next(empty);
    return empty;
  }

  private createEmptyProfile(): UserProfile {
    return {
      id: '',
      name: '',
      firstName: '',
      age: 0,
      ageGroup: '17-20',
      educationLevel: '',
      country: 'Maroc',
      language: 'Français',
      field: '',
      branch: '',
      school: '',
      fieldOfStudy: '',
      studyYear: '',
      onboardingCompleted: false,
      subjects: [],
      objectives: [],
      difficulties: [],
      difficultyExplanation: '',
      learningStyles: [],
      studyTime: '',
      currentLevels: {},
      diagnosticResults: undefined,
      learningPreferences: undefined,
      progress: undefined,
      weakTopics: [],
      strongTopics: []
    };
  }
}