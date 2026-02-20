import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { ConnectWhatsappDto } from './dto/connect-whatsapp.dto';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get('summary')
  async summary(@Headers('x-tenant-id') tenantId: string) {
    return {
      message_key: 'channels.summary_loaded',
      message: 'Channels summary loaded',
      data: await this.channelsService.getSummary(tenantId),
    };
  }

  @Get()
  async list(@Headers('x-tenant-id') tenantId: string) {
    return {
      message_key: 'channels.listed',
      message: 'Channels loaded',
      data: await this.channelsService.list(tenantId),
    };
  }

  @Post('whatsapp')
  async connectWhatsapp(@Headers('x-tenant-id') tenantId: string, @Body() body: ConnectWhatsappDto) {
    return {
      message_key: 'channels.whatsapp_connected',
      message: 'WhatsApp channel connected',
      data: await this.channelsService.connectWhatsapp(tenantId, body),
    };
  }

  @Delete(':id')
  async remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    await this.channelsService.remove(tenantId, id);
    return {
      message_key: 'channels.deleted',
      message: 'Channel deleted',
      data: { id },
    };
  }
}
