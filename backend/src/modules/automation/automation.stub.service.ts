import { Injectable } from '@nestjs/common';
import { AutomationPort } from './automation.port';

@Injectable()
export class AutomationStubService implements AutomationPort {
  async suggestReply(): Promise<string[]> {
    return [];
  }

  async classifyConversation(): Promise<string[]> {
    return [];
  }
}
