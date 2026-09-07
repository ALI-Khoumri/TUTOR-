import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  firstName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  get passwordStrength(): 'weak' | 'medium' | 'strong' | '' {
    if (this.password.length === 0) return '';
    if (this.password.length < 6) return 'weak';
    if (this.password.length < 10 || !/[0-9]/.test(this.password)) return 'medium';
    return 'strong';
  }

  get canSubmit(): boolean {
    return (
      this.firstName.trim().length >= 2 &&
      this.email.trim().includes('@') &&
      this.password.length >= 6 &&
      this.password === this.confirmPassword &&
      !this.loading()
    );
  }

  onSubmit() {
    if (!this.canSubmit) return;

    if (this.password !== this.confirmPassword) {
      this.errorMsg.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.register(this.email.trim(), this.password, this.firstName.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/onboarding');
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 0) {
          this.errorMsg.set('Impossible de contacter le serveur backend. Vérifiez que le serveur Node.js ("npm run server") est démarré.');
        } else {
          this.errorMsg.set(err?.error?.error ?? 'Erreur lors de la création du compte. Veuillez réessayer.');
        }
      }
    });
  }
}