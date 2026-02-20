import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  readonly metrics = [
    { titleKey: 'dashboard_total_conversations', value: '0', subtitleKey: 'dashboard_delta_zero', icon: 'pi pi-comments' },
    { titleKey: 'dashboard_active_agents', value: '0', subtitleKey: 'dashboard_online', icon: 'pi pi-users' },
    { titleKey: 'dashboard_pending_messages', value: '0', subtitleKey: 'dashboard_unread', icon: 'pi pi-clock' },
    { titleKey: 'dashboard_response_rate', value: '0%', subtitleKey: 'dashboard_dash', icon: 'pi pi-arrow-up-right' },
  ];

  constructor(public i18n: TranslationService) {}
}
