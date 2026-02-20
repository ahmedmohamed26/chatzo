import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthShellComponent } from './auth-shell.component';
import { AuthApiService } from '../../core/services/auth-api.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, AuthShellComponent],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {
  loading = false;
  errorMessage = '';
  form!: FormGroup<{
    first_name: FormControl<string>;
    last_name: FormControl<string>;
    organization_name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    public readonly i18n: TranslationService,
  ) {
    this.form = this.fb.nonNullable.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      organization_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      this.toastr.error(this.i18n.dict()[this.i18n.language].signup_validation_error);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authApi.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.toastr.success(this.i18n.dict()[this.i18n.language].signup_success);
        void this.router.navigateByUrl('/auth/sign-in');
      },
      error: (error: { error?: { message?: string | string[] } }) => {
        this.errorMessage = this.getBackendError(error);
        this.toastr.error(this.errorMessage);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private getBackendError(error: { error?: { message?: string | string[] } }): string {
    const msg = error?.error?.message;
    if (Array.isArray(msg) && msg.length > 0) return this.mapBackendKey(msg[0]);
    if (typeof msg === 'string' && msg.trim()) return this.mapBackendKey(msg);
    return this.i18n.dict()[this.i18n.language].auth_error_generic;
  }

  private mapBackendKey(message: string): string {
    if (message === 'auth.invalid_credentials') {
      return this.i18n.dict()[this.i18n.language].invalid_credentials;
    }
    if (message === 'auth.email_already_exists') {
      return this.i18n.dict()[this.i18n.language].email_exists;
    }
    return message;
  }
}
