import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ChannelService } from '../../core/services/channel.service';
import { ChannelSummary, ConnectedAccount, ChannelType } from '../../shared/models/channel.models';
import { TranslationService } from '../../core/services/translation.service';
import { ConnectWhatsappDialogComponent } from './connect-whatsapp-dialog.component';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    TagModule,
    ConnectWhatsappDialogComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.scss'],
})
export class ChannelsPageComponent implements OnInit {
  summary: ChannelSummary = { whatsapp: 0, instagram: 0, messenger: 0, telegram: 0 };
  accounts: ConnectedAccount[] = [];
  loading = false;
  dialogVisible = false;

  readonly cards: Array<{
    type: ChannelType;
    titleKey: string;
    descKey: string;
    icon: string;
    theme: string;
    comingSoon?: boolean;
    connectable?: boolean;
  }> = [
    {
      type: 'whatsapp',
      titleKey: 'channels_whatsapp',
      descKey: 'channels_desc_whatsapp',
      icon: 'pi pi-whatsapp',
      theme: 'whatsapp',
      connectable: true,
    },
    {
      type: 'instagram',
      titleKey: 'channels_instagram',
      descKey: 'channels_desc_instagram',
      icon: 'pi pi-instagram',
      theme: 'instagram',
      comingSoon: true,
    },
    {
      type: 'messenger',
      titleKey: 'channels_messenger',
      descKey: 'channels_desc_messenger',
      icon: 'pi pi-facebook',
      theme: 'messenger',
      comingSoon: true,
    },
    {
      type: 'telegram',
      titleKey: 'channels_telegram',
      descKey: 'channels_desc_telegram',
      icon: 'pi pi-send',
      theme: 'telegram',
      comingSoon: true,
    },
  ];

  constructor(
    private readonly channelService: ChannelService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    public readonly i18n: TranslationService,
  ) {}

  ngOnInit(): void {
    this.refreshData();
  }

  openWhatsappDialog(): void {
    this.dialogVisible = true;
  }

  onWhatsappConnected(_: ConnectedAccount): void {
    this.refreshData();
  }

  confirmDelete(account: ConnectedAccount): void {
    this.confirmationService.confirm({
      header: this.i18n.dict()[this.i18n.language].channels_delete_header,
      message: this.i18n
        .dict()[this.i18n.language]
        .channels_delete_message.replace('{name}', account.displayName),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.dict()[this.i18n.language].channels_delete_confirm,
      rejectLabel: this.i18n.dict()[this.i18n.language].channels_cancel,
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.channelService.deleteChannel(account.id).subscribe({
          next: () => {
            this.accounts = this.accounts.filter((item) => item.id !== account.id);
            this.refreshData();
            this.messageService.add({
              severity: 'success',
              summary: this.i18n.dict()[this.i18n.language].channels_deleted_title,
              detail: this.i18n.dict()[this.i18n.language].channels_deleted_desc,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: this.i18n.dict()[this.i18n.language].channels_error_title,
              detail: this.i18n.dict()[this.i18n.language].channels_delete_error,
            });
          },
        });
      },
    });
  }

  getCount(type: ChannelType): number {
    return this.summary[type];
  }

  getStatusSeverity(status: ConnectedAccount['status']): 'success' | 'warning' {
    return status === 'connected' ? 'success' : 'warning';
  }

  getChannelIcon(type: ChannelType): string {
    switch (type) {
      case 'whatsapp':
        return 'pi pi-whatsapp';
      case 'instagram':
        return 'pi pi-instagram';
      case 'messenger':
        return 'pi pi-facebook';
      case 'telegram':
        return 'pi pi-send';
      default:
        return 'pi pi-share-alt';
    }
  }

  private refreshData(): void {
    this.loading = true;
    this.channelService.getChannelSummary().subscribe({
      next: (res) => {
        this.summary = res.data;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.dict()[this.i18n.language].channels_error_title,
          detail: this.i18n.dict()[this.i18n.language].channels_load_error,
        });
      },
    });

    this.channelService.listConnectedAccounts().subscribe({
      next: (res) => {
        this.accounts = res.data;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.dict()[this.i18n.language].channels_error_title,
          detail: this.i18n.dict()[this.i18n.language].channels_load_error,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

}
