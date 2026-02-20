import { Injectable, signal } from '@angular/core';
import en from '../../../assets/i18n/en.json';
import ar from '../../../assets/i18n/ar.json';

export type AppLang = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly lang = signal<AppLang>('en');
  readonly dict = signal({ en, ar });

  setLanguage(next: AppLang): void {
    this.lang.set(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  }

  get language(): AppLang {
    return this.lang();
  }
}
