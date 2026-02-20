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
    this.userMenuItems = this.buildUserMenu();
    this.isAuthRoute = this.router.url.startsWith('/auth');
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isAuthRoute = this.router.url.startsWith('/auth');
      if (!this.isAuthRoute && localStorage.getItem('user_id')) {
        this.refreshLanguage();
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
    localStorage.removeItem('preferred_language');
    void this.router.navigateByUrl('/auth/sign-in');
  }

  private refreshLanguage(): void {
    this.usersApi.getMe().subscribe({
      next: (res) => {
        this.selectedLanguage = res.data.preferred_language;
        this.setLanguage(res.data.preferred_language);
        localStorage.setItem('preferred_language', res.data.preferred_language);
        this.userMenuItems = this.buildUserMenu();
      },
    });
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
