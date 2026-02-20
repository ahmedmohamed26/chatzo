import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { UsersApiService } from '../../core/services/users-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  firstName = 'User';

  readonly metrics = [
    { titleKey: 'dashboard_total_conversations', value: '0', subtitleKey: 'dashboard_delta_zero', icon: 'pi pi-comments' },
    { titleKey: 'dashboard_active_agents', value: '0', subtitleKey: 'dashboard_online', icon: 'pi pi-users' },
    { titleKey: 'dashboard_pending_messages', value: '0', subtitleKey: 'dashboard_unread', icon: 'pi pi-clock' },
    { titleKey: 'dashboard_response_rate', value: '0%', subtitleKey: 'dashboard_dash', icon: 'pi pi-arrow-up-right' },
  ];

  constructor(
    public i18n: TranslationService,
    private readonly usersApi: UsersApiService,
  ) {}

  ngOnInit(): void {
    this.firstName = this.extractFirstName(localStorage.getItem('full_name') || 'User');
    if (localStorage.getItem('user_id')) {
      this.usersApi.getMe().subscribe({
        next: (res) => {
          localStorage.setItem('full_name', res.data.full_name || '');
          localStorage.setItem('position', res.data.position || '');
          localStorage.setItem('role', res.data.role || '');
          this.firstName = this.extractFirstName(res.data.full_name || 'User');
        },
      });
    }
  }

  get welcomeTitle(): string {
    const dict = this.i18n.dict()[this.i18n.language];
    return dict.dashboard_welcome_generic ?? 'Welcome back';
  }

  get welcomeText(): string {
    return `${this.welcomeTitle}, ${this.firstName}`;
  }

  private extractFirstName(fullName: string): string {
    const [first] = fullName.trim().split(/\s+/);
    return first || 'User';
  }
}
