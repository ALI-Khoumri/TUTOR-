import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  showPassword = false;
  loading = signal(false);
  errorMsg = signal('');

  features = [
    { icon: '🤖', text: 'Tuteur IA adapté à ton niveau' },
    { icon: '📚', text: 'Système scolaire marocain (Primaire & Collège • 6 à 15 ans)' },
    { icon: '📊', text: 'Suivi de progression personnalisé' },
    { icon: '🏆', text: 'Quiz, exercices et explications détaillées' },
  ];

  constructor(
    private auth: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn) {
      void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    }
  }

  get canSubmit(): boolean {
    return this.email.trim().length > 0 && this.password.length >= 6 && !this.loading();
  }

  onSubmit() {
    if (!this.canSubmit) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: async (res) => {
        try {
          // Always check the real profile from DB — do NOT trust only the JWT's studentId
          const profile = await this.profileService.loadProfileFromDatabase(res.user);
          this.loading.set(false);

          if (profile && profile.onboardingCompleted && profile.firstName) {
            // Onboarding already done → go straight to dashboard
            void this.router.navigateByUrl('/dashboard');
          } else {
            // First time, no profile yet → go to onboarding
            void this.router.navigateByUrl('/onboarding');
          }
        } catch {
          this.loading.set(false);
          void this.router.navigateByUrl('/onboarding');
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 0) {
          this.errorMsg.set('Impossible de contacter le serveur backend. Vérifiez que le serveur Node.js ("npm run server") est démarré.');
        } else {
          this.errorMsg.set(err?.error?.error ?? 'Erreur de connexion. Veuillez réessayer.');
        }
      }
    });
  }
}