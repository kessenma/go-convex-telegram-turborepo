export interface TelegramMessage {
  _id: string;
  messageId: number;
  chatId: number;
  userId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
  messageType: string;
  timestamp: number;
  createdAt: number;
  messageThreadId?: number;
  replyToMessageId?: number;
}