import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { QuickReply, QuickReplyCategory, QuickRepliesApiService } from '../../core/services/quick-replies-api.service';
import { TranslationService } from '../../core/services/translation.service';
import en from '../../../assets/i18n/en.json';

type TranslationKey = keyof typeof en;

@Component({
  selector: 'app-quick-replies-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    InputTextareaModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './quick-replies-page.component.html',
  styleUrls: ['./quick-replies-page.component.scss'],
})
export class QuickRepliesPageComponent implements OnInit {
  readonly categories: Array<{ labelKey: TranslationKey; value: QuickReplyCategory }> = [
    { labelKey: 'quick_cat_general', value: 'general' },
    { labelKey: 'quick_cat_sales', value: 'sales' },
    { labelKey: 'quick_cat_support', value: 'support' },
    { labelKey: 'quick_cat_follow', value: 'follow-up' },
  ];

  get categoryOptions(): Array<{ label: string; value: QuickReplyCategory }> {
    const langDict = this.i18n.dict()[this.i18n.language];
    return this.categories.map((cat) => ({
      label: langDict[cat.labelKey],
      value: cat.value,
    }));
  }

  selectedCategory: 'all' | QuickReplyCategory = 'all';
  search = '';
  dialogVisible = false;
  isEditMode = false;
  editingId: string | null = null;
  loading = false;

  readonly form: FormGroup<{
    title: FormControl<string>;
    category: FormControl<QuickReplyCategory>;
    content: FormControl<string>;
  }>;

  replies: QuickReply[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    private readonly quickRepliesApi: QuickRepliesApiService,
    public readonly i18n: TranslationService,
  ) {
    this.form = this.fb.nonNullable.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      category: ['general' as QuickReplyCategory, [Validators.required]],
      content: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.fetchReplies();
  }

  get filteredReplies(): QuickReply[] {
    const searchText = this.search.trim().toLowerCase();
    return this.replies.filter((reply) => {
      const categoryMatch = this.selectedCategory === 'all' || reply.category === this.selectedCategory;
      const searchMatch =
        searchText.length === 0 ||
        reply.title.toLowerCase().includes(searchText) ||
        reply.content.toLowerCase().includes(searchText);
      return categoryMatch && searchMatch;
    });
  }

  openCreateDialog(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.form.reset({ title: '', category: 'general', content: '' });
    this.dialogVisible = true;
  }

  openEditDialog(item: QuickReply): void {
    this.isEditMode = true;
    this.editingId = item.id;
    this.form.reset({
      title: item.title,
      category: item.category,
      content: item.content,
    });
    this.dialogVisible = true;
  }

  saveReply(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    if (this.isEditMode && this.editingId) {
      this.quickRepliesApi
        .update(this.editingId, {
          title: payload.title.trim(),
          category: payload.category,
          content: payload.content.trim(),
        })
        .subscribe({
          next: (res) => {
            this.replies = this.replies.map((r) => (r.id === this.editingId ? res.data : r));
            this.dialogVisible = false;
            this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Quick reply updated.' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update quick reply.' });
          },
        });
    } else {
      this.quickRepliesApi
        .create({
          title: payload.title.trim(),
          category: payload.category,
          content: payload.content.trim(),
        })
        .subscribe({
          next: (res) => {
            this.replies = [res.data, ...this.replies];
            this.dialogVisible = false;
            this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Quick reply created.' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create quick reply.' });
          },
        });
    }
  }

  confirmDelete(item: QuickReply): void {
    this.confirmationService.confirm({
      header: this.i18n.dict()[this.i18n.language].quick_delete_header,
      message: this.i18n
        .dict()[this.i18n.language]
        .quick_delete_message.replace('{title}', item.title),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.dict()[this.i18n.language].quick_delete_confirm,
      rejectLabel: this.i18n.dict()[this.i18n.language].quick_cancel,
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.quickRepliesApi.remove(item.id).subscribe({
          next: () => {
            this.replies = this.replies.filter((r) => r.id !== item.id);
            this.messageService.add({
              severity: 'success',
              summary: this.i18n.dict()[this.i18n.language].quick_deleted_title,
              detail: this.i18n.dict()[this.i18n.language].quick_deleted_desc,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: this.i18n.dict()[this.i18n.language].quick_error_title,
              detail: this.i18n.dict()[this.i18n.language].quick_delete_error,
            });
          },
        });
      },
    });
  }

  private fetchReplies(): void {
    this.loading = true;
    this.quickRepliesApi.list().subscribe({
      next: (res) => {
        this.replies = res.data;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load quick replies.' });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
