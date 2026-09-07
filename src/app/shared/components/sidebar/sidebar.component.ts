import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ProfileService } from '../../../core/services/profile.service';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** If set, this item only appears when at least one of these learningStyles is in the user's profile */
  requiresStyle?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatListModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  private profileSub?: Subscription;
  private userLearningStyles: string[] = [];

  /** Full nav item definitions — conditional items have requiresStyle */
  private readonly allNavItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
    { label: 'Tuteur IA', icon: 'smart_toy', route: '/tutor' },
    { label: 'Matières', icon: 'menu_book', route: '/subjects' },
    { label: 'Cours', icon: 'school', route: '/course', requiresStyle: ['Explications simples', 'Explications détaillées', 'Exemples', 'Résumés'] },
    { label: 'Exercices', icon: 'fitness_center', route: '/exercises', requiresStyle: ['Exercices'] },
    { label: 'Quiz', icon: 'quiz', route: '/quiz', requiresStyle: ['Quiz', 'Questions/réponses'] },
    { label: 'Progression', icon: 'trending_up', route: '/progress' },
    { label: 'Profil', icon: 'person', route: '/profile' },
    { label: 'Paramètres', icon: 'settings', route: '/settings' }
  ];

  /** Computed visible nav items */
  navItems: NavItem[] = [];

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.profileSub = this.profileService.active$.subscribe(profile => {
      this.userLearningStyles = profile?.learningStyles || [];
      this.computeNavItems();
    });
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  onLinkClick(): void {
    this.closed.emit();
  }

  private computeNavItems(): void {
    // If onboarding is not complete yet (no styles chosen), show all items
    if (this.userLearningStyles.length === 0) {
      this.navItems = [...this.allNavItems];
      return;
    }

    this.navItems = this.allNavItems.filter(item => {
      // Items without requiresStyle are always visible (core nav)
      if (!item.requiresStyle) return true;
      // Conditional items: show only if at least one required style is in the user's profile
      return item.requiresStyle.some(style => this.userLearningStyles.includes(style));
    });
  }
}
