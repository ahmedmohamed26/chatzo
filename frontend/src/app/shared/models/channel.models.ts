export type ChannelType = 'whatsapp' | 'instagram' | 'messenger' | 'telegram';

export type ChannelStatus = 'connected' | 'disconnected';

export type ConnectedAccount = {
  id: string;
  channelType: ChannelType;
  displayName: string;
  externalId: string;
  status: ChannelStatus;
  createdAt: string;
};

export type ChannelSummary = {
  whatsapp: number;
  instagram: number;
  messenger: number;
  telegram: number;
};

export type ConnectWhatsappPayload = {
  displayName: string;
  phoneNumberId: string;
  wabaId?: string;
  accessToken: string;
  verifyToken: string;
};
