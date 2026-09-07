import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  studentId: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  message?: string;
}

const TOKEN_KEY = 'tutorai.auth.token.v2';
const API = 'http://localhost:3000/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = new BehaviorSubject<AuthUser | null>(this.decodeStoredToken());
  readonly user$: Observable<AuthUser | null> = this._user.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): AuthUser | null { return this._user.value; }
  get isLoggedIn(): boolean { return !!this._user.value; }
  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }
  get studentId(): string | null { return this._user.value?.studentId ?? null; }
  get name(): string { return this._user.value?.firstName ?? ''; }

  register(email: string, password: string, firstName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/register`, { email, password, firstName }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/login`, { email, password }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this._user.next(null);
    void this.router.navigateByUrl('/login');
  }

  linkStudent(studentId: string): Observable<{ token: string; studentId: string; firstName: string }> {
    return this.http.post<{ token: string; studentId: string; firstName: string }>(
      `${API}/link-student`,
      { studentId },
      { headers: { Authorization: `Bearer ${this.token}` } }
    ).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        const decoded = this.decodeJwt(res.token);
        if (decoded) this._user.next(decoded);
      })
    );
  }

  refreshMe(): Observable<AuthUser | null> {
    if (!this.token) return of(null);
    return this.http.get<AuthUser>(`${API}/me`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(
      tap(user => this._user.next(user)),
      catchError(() => { this.logout(); return of(null); })
    );
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private handleAuthResponse(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    this._user.next(res.user);
  }

  private decodeStoredToken(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? this.decodeJwt(token) : null;
  }

  private decodeJwt(token: string): AuthUser | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || !payload.id) return null;
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return {
        id: payload.id,
        email: payload.email ?? '',
        firstName: payload.firstName ?? '',
        studentId: payload.studentId ?? null
      };
    } catch {
      return null;
    }
  }
}