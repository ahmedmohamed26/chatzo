import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TranslationService } from './core/services/translation.service';
import { UsersApiService } from './core/services/users-api.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ButtonModule, MenuModule, AvatarModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isAuthRoute = true;
  isDark = false;
  selectedLanguage: 'en' | 'ar' = 'en';
  currentUser = {
    fullName: 'User',
    position: '',
    role: '',
    initials: 'U',
  };
  readonly sideLinks = [
    { labelKey: 'nav_dashboard', icon: 'pi pi-th-large', route: '/dashboard' },
    { labelKey: 'nav_channels', icon: 'pi pi-share-alt', route: '/channels' },
    { labelKey: 'nav_inbox', icon: 'pi pi-inbox', route: '/inbox' },
    { labelKey: 'nav_ai_conversation', icon: 'pi pi-cog', route: '/ai-conversation', soon: true, disabled: true },
    { labelKey: 'nav_quick_replies', icon: 'pi pi-bolt', route: '/quick-replies' },
    { labelKey: 'nav_team', icon: 'pi pi-users', route: '/team' },
    { labelKey: 'nav_settings', icon: 'pi pi-cog', route: '/settings' },
  ];
  userMenuItems: MenuItem[] = [];

  constructor(
    public i18n: TranslationService,
    private readonly router: Router,
    private readonly usersApi: UsersApiService,
  ) {
    const storedLang = (localStorage.getItem('preferred_language') as 'en' | 'ar' | null) ?? 'en';
    this.selectedLanguage = storedLang;
    this.setLanguage(storedLang);
    this.restoreUserFromStorage();
    this.userMenuItems = this.buildUserMenu();
    this.isAuthRoute = this.router.url.startsWith('/auth');
    if (!this.isAuthRoute && localStorage.getItem('user_id')) {
      this.refreshProfile();
    }
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isAuthRoute = this.router.url.startsWith('/auth');
      if (!this.isAuthRoute && localStorage.getItem('user_id')) {
        this.refreshProfile();
      }
    });
  }

  setLanguage(next: 'en' | 'ar'): void {
    this.i18n.setLanguage(next);
    localStorage.setItem('lang', next);
  }

  onLanguageChange(value: 'en' | 'ar'): void {
    this.selectedLanguage = value;
    this.setLanguage(value);
    localStorage.setItem('preferred_language', value);
    if (localStorage.getItem('user_id')) {
      this.usersApi.updateLanguage(value).subscribe({
        error: () => {
          // Keep local selection even if server fails; will retry on next change.
        },
      });
    }
    this.userMenuItems = this.buildUserMenu();
  }

  toggleDarkMode(): void {
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('dark-theme', this.isDark);
  }

  signOut(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('full_name');
    localStorage.removeItem('position');
    localStorage.removeItem('role');
    localStorage.removeItem('preferred_language');
    this.currentUser = { fullName: 'User', position: '', role: '', initials: 'U' };
    void this.router.navigateByUrl('/auth/sign-in');
  }

  get userSubtitle(): string {
    if (this.currentUser.position && this.currentUser.position.trim()) {
      return this.currentUser.position;
    }
    const dict = this.i18n.dict()[this.i18n.language];
    if (this.currentUser.role === 'company_admin') {
      return dict.team_role_admin ?? 'Company Admin';
    }
    if (this.currentUser.role === 'agent') {
      return dict.team_role_agent ?? 'Agent';
    }
    return dict.team_role_agent ?? 'Agent';
  }

  private refreshProfile(): void {
    this.usersApi.getMe().subscribe({
      next: (res) => {
        this.selectedLanguage = res.data.preferred_language;
        this.setLanguage(res.data.preferred_language);
        localStorage.setItem('preferred_language', res.data.preferred_language);
        localStorage.setItem('full_name', res.data.full_name || '');
        localStorage.setItem('position', res.data.position || '');
        localStorage.setItem('role', res.data.role || '');
        this.currentUser = {
          fullName: res.data.full_name || 'User',
          position: res.data.position || '',
          role: res.data.role || '',
          initials: this.buildInitials(res.data.full_name || 'User'),
        };
        this.userMenuItems = this.buildUserMenu();
      },
    });
  }

  private restoreUserFromStorage(): void {
    const fullName = localStorage.getItem('full_name') || 'User';
    const position = localStorage.getItem('position') || '';
    const role = localStorage.getItem('role') || '';
    this.currentUser = {
      fullName,
      position,
      role,
      initials: this.buildInitials(fullName),
    };
  }

  private buildInitials(fullName: string): string {
    const names = fullName.trim().split(/\s+/).filter(Boolean);
    if (!names.length) return 'U';
    if (names.length === 1) return names[0].slice(0, 1).toUpperCase();
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }

  private buildUserMenu(): MenuItem[] {
    const isEnglish = this.selectedLanguage === 'en';
    const toggleLabel = isEnglish ? 'Arabic' : 'English';
    const toggleIcon = isEnglish ? 'pi pi-globe' : 'pi pi-globe';
    return [
      {
        label: toggleLabel,
        icon: toggleIcon,
        command: () => this.onLanguageChange(isEnglish ? 'ar' : 'en'),
      },
      { separator: true },
      {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        command: () => this.signOut(),
      },
    ];
  }
}
