import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ChipsModule } from 'primeng/chips';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ChannelService } from '../../core/services/channel.service';
import { ConnectedAccount, ConnectWhatsappPayload } from '../../shared/models/channel.models';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-connect-whatsapp-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ChipsModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './connect-whatsapp-dialog.component.html',
  styleUrls: ['./connect-whatsapp-dialog.component.scss'],
})
export class ConnectWhatsappDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() connected = new EventEmitter<ConnectedAccount>();

  loading = false;
  readonly webhookFields = ['messages'];

  readonly form: FormGroup<{
    channelType: FormControl<string>;
    displayName: FormControl<string>;
    phoneNumberId: FormControl<string>;
    wabaId: FormControl<string>;
    accessToken: FormControl<string>;
    verifyToken: FormControl<string>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly channelService: ChannelService,
    private readonly messageService: MessageService,
    public readonly i18n: TranslationService,
  ) {
    this.form = this.fb.nonNullable.group({
      channelType: ['whatsapp'],
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumberId: ['', [Validators.required, Validators.minLength(4)]],
      wabaId: [''],
      accessToken: ['', [Validators.required, Validators.minLength(6)]],
      verifyToken: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get channelTypeOptions(): Array<{ label: string; value: 'whatsapp' }> {
    return [{ label: this.i18n.dict()[this.i18n.language].channels_whatsapp, value: 'whatsapp' }];
  }

  get webhookUrl(): string {
    return 'http://localhost:3000/api/v1/webhooks/whatsapp';
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  generateVerifyToken(): void {
    const token = this.createToken(24);
    this.form.patchValue({ verifyToken: token });
  }

  copyWebhookUrl(): void {
    void navigator.clipboard.writeText(this.webhookUrl);
    this.messageService.add({
      severity: 'success',
      summary: this.i18n.dict()[this.i18n.language].channels_copied_title,
      detail: this.i18n.dict()[this.i18n.language].channels_copied_desc,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const payload = this.form.getRawValue();
    const apiPayload: ConnectWhatsappPayload = {
      displayName: payload.displayName.trim(),
      phoneNumberId: payload.phoneNumberId.trim(),
      wabaId: payload.wabaId.trim() || undefined,
      accessToken: payload.accessToken.trim(),
      verifyToken: payload.verifyToken.trim(),
    };

    this.channelService.connectWhatsapp(apiPayload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.dict()[this.i18n.language].channels_connected_title,
          detail: this.i18n.dict()[this.i18n.language].channels_connected_desc,
        });
        this.connected.emit(res.data);
        this.close();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.dict()[this.i18n.language].channels_error_title,
          detail: this.i18n.dict()[this.i18n.language].channels_connect_error,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private createToken(length: number): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const random = crypto?.getRandomValues?.(new Uint8Array(length));
    if (!random) {
      return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    }
    return Array.from(random).map((value) => alphabet[value % alphabet.length]).join('');
  }
}
