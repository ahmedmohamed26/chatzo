import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './auth-shell.component.html',
  styleUrls: ['./auth-shell.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthShellComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) subtitle = '';

  constructor(public readonly i18n: TranslationService) {}

  setLanguage(next: 'en' | 'ar'): void {
    this.i18n.setLanguage(next);
    localStorage.setItem('lang', next);
  }
}
