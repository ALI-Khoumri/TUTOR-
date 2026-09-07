import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { MockSessionService } from '../../../core/services/mock-session.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();

  user$: Observable<AuthUser | null>;
  profile$ = this.profile.active$;
  session$ = this.session.session$;

  constructor(private auth: AuthService, private profile: ProfileService, private session: MockSessionService) {
    this.user$ = this.auth.user$;
  }

  getInitials(name?: string) {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  logout(): void {
    this.auth.logout();
  }
}
