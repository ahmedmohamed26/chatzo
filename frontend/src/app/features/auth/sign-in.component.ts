import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthShellComponent } from './auth-shell.component';
import { AuthApiService } from '../../core/services/auth-api.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, AuthShellComponent],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent {
  loading = false;
  errorMessage = '';
  form!: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toastr: ToastrService,
    public readonly i18n: TranslationService,
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      this.toastr.error(this.i18n.dict()[this.i18n.language].signin_validation_error);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('tenant_id', res.data.user.tenant_id);
        localStorage.setItem('user_id', res.data.user.id);
        localStorage.setItem('full_name', res.data.user.full_name);
        localStorage.setItem('position', res.data.user.position || '');
        localStorage.setItem('role', res.data.user.role || '');
        localStorage.setItem('preferred_language', res.data.user.preferred_language || 'en');
        this.toastr.success(this.i18n.dict()[this.i18n.language].signin_success);
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        void this.router.navigateByUrl(redirect || '/dashboard');
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

  hasError(control: 'email' | 'password', error: string): boolean {
    const c = this.form.controls[control];
    return c.touched && c.hasError(error);
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
