export interface TelegramThread {
  _id: string;
  threadId: number;
  chatId: number;
  title?: string;
  creatorUserId?: number;
  creatorUsername?: string;
  creatorFirstName?: string;
  creatorLastName?: string;
  firstMessageId?: number;
  lastMessageId?: number;
  lastMessageText?: string;
  lastMessageTimestamp?: number;
  messageCount: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
