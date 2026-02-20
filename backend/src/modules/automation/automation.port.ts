export interface AutomationPort {
  suggestReply(input: { tenantId: string; conversationId: string }): Promise<string[]>;
  classifyConversation(input: { tenantId: string; conversationId: string }): Promise<string[]>;
}
