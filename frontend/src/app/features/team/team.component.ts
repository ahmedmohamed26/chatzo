import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TeamApiService } from '../../core/services/team-api.service';
import { TranslationService } from '../../core/services/translation.service';
import { UsersApiService } from '../../core/services/users-api.service';
import { TeamMember, TeamRole } from '../../shared/models/team.models';
import en from '../../../assets/i18n/en.json';

type TranslationKey = keyof typeof en;

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    PasswordModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
})
export class TeamComponent implements OnInit {
  members: TeamMember[] = [];
  loading = false;
  dialogVisible = false;
  isEditMode = false;
  editingId: string | null = null;
  filter = '';
  currentUserRole: TeamRole | '' = '';

  readonly roleOptions: Array<{ labelKey: TranslationKey; value: TeamRole }> = [
    { labelKey: 'team_role_admin', value: 'company_admin' },
    { labelKey: 'team_role_agent', value: 'agent' },
  ];

  readonly positionOptions: Array<{ labelKey: TranslationKey; value: string }> = [
    { labelKey: 'team_position_support', value: 'support' },
    { labelKey: 'team_position_sales', value: 'sales' },
    { labelKey: 'team_position_operations', value: 'operations' },
    { labelKey: 'team_position_manager', value: 'manager' },
  ];

  readonly form: FormGroup<{
    fullName: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    role: FormControl<string>;
    position: FormControl<string>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly teamApi: TeamApiService,
    private readonly usersApi: UsersApiService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    public readonly i18n: TranslationService,
  ) {
    this.form = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['agent'],
      position: ['support'],
    });
  }

  ngOnInit(): void {
    this.syncCurrentUserRole();
    this.usersApi.getMe().subscribe({
      next: (res) => {
        this.currentUserRole = res.data.role === 'company_admin' ? 'company_admin' : 'agent';
        localStorage.setItem('role', this.currentUserRole);
      },
    });
    this.fetchMembers();
  }

  get canAddPerson(): boolean {
    return this.currentUserRole === 'company_admin';
  }

  get filteredMembers(): TeamMember[] {
    const text = this.filter.trim().toLowerCase();
    if (!text) return this.members;
    return this.members.filter(
      (item) =>
        item.fullName.toLowerCase().includes(text) ||
        item.email.toLowerCase().includes(text) ||
        item.position.toLowerCase().includes(text),
    );
  }

  get translatedRoles(): Array<{ label: string; value: TeamRole }> {
    const dict = this.i18n.dict()[this.i18n.language];
    return this.roleOptions.map((item) => ({ label: dict[item.labelKey], value: item.value }));
  }

  get translatedPositions(): Array<{ label: string; value: string }> {
    const dict = this.i18n.dict()[this.i18n.language];
    return this.positionOptions.map((item) => ({ label: dict[item.labelKey], value: item.value }));
  }

  openCreate(): void {
    if (!this.canAddPerson) {
      return;
    }
    this.isEditMode = false;
    this.editingId = null;
    this.form.reset({
      fullName: '',
      email: '',
      password: '',
      role: 'agent',
      position: 'support',
    });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.dialogVisible = true;
  }

  openEdit(member: TeamMember): void {
    this.isEditMode = true;
    this.editingId = member.id;
    this.form.reset({
      fullName: member.fullName,
      email: member.email,
      password: '',
      role: member.role,
      position: member.position || 'support',
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    if (this.isEditMode && this.editingId) {
      this.teamApi
        .update(this.editingId, {
          full_name: value.fullName.trim(),
          email: value.email.trim(),
          role: value.role as TeamRole,
          position: value.position,
          password: value.password.trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.dialogVisible = false;
            this.fetchMembers();
            this.messageService.add({
              severity: 'success',
              summary: this.i18n.dict()[this.i18n.language].team_updated_title,
              detail: this.i18n.dict()[this.i18n.language].team_updated_desc,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: this.i18n.dict()[this.i18n.language].team_error_title,
              detail: this.i18n.dict()[this.i18n.language].team_save_error,
            });
          },
        });
      return;
    }

    this.teamApi
      .create({
        full_name: value.fullName.trim(),
        email: value.email.trim(),
        password: value.password.trim(),
        role: value.role as TeamRole,
        position: value.position,
      })
      .subscribe({
        next: () => {
          this.dialogVisible = false;
          this.fetchMembers();
          this.messageService.add({
            severity: 'success',
            summary: this.i18n.dict()[this.i18n.language].team_created_title,
            detail: this.i18n.dict()[this.i18n.language].team_created_desc,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.dict()[this.i18n.language].team_error_title,
            detail: this.i18n.dict()[this.i18n.language].team_save_error,
          });
        },
      });
  }

  confirmDelete(member: TeamMember): void {
    this.confirmationService.confirm({
      header: this.i18n.dict()[this.i18n.language].team_delete_header,
      message: this.i18n.dict()[this.i18n.language].team_delete_message.replace('{name}', member.fullName),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.dict()[this.i18n.language].team_delete_confirm,
      rejectLabel: this.i18n.dict()[this.i18n.language].team_cancel,
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.teamApi.remove(member.id).subscribe({
          next: () => {
            this.fetchMembers();
            this.messageService.add({
              severity: 'success',
              summary: this.i18n.dict()[this.i18n.language].team_deleted_title,
              detail: this.i18n.dict()[this.i18n.language].team_deleted_desc,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: this.i18n.dict()[this.i18n.language].team_error_title,
              detail: this.i18n.dict()[this.i18n.language].team_delete_error,
            });
          },
        });
      },
    });
  }

  roleLabel(role: TeamRole): string {
    const dict = this.i18n.dict()[this.i18n.language];
    return role === 'company_admin' ? dict.team_role_admin : dict.team_role_agent;
  }

  private fetchMembers(): void {
    this.loading = true;
    this.teamApi.list().subscribe({
      next: (res) => {
        this.members = res.data;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.dict()[this.i18n.language].team_error_title,
          detail: this.i18n.dict()[this.i18n.language].team_load_error,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private syncCurrentUserRole(): void {
    const role = localStorage.getItem('role');
    if (role === 'company_admin' || role === 'agent') {
      this.currentUserRole = role;
      return;
    }
    this.currentUserRole = '';
  }
}
