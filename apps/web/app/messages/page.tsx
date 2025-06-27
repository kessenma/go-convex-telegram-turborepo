"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import styles from "./messages.module.css";

interface TelegramMessage {
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
}

export default function MessagesPage() {
  const messages = useQuery(api.telegram.getAllMessages, { limit: 100 }) as TelegramMessage[] | undefined;

  if (messages === undefined) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading messages...</div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUserDisplay = (message: TelegramMessage) => {
    if (message.username) return `@${message.username}`;
    if (message.firstName || message.lastName) {
      return `${message.firstName || ''} ${message.lastName || ''}`.trim();
    }
    return `User ${message.userId || 'Unknown'}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Telegram Messages</h1>
        <p>Total messages: {messages.length}</p>
      </header>

      <div className={styles.messagesList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No messages found.</p>
            <p>Send a message to your Telegram bot to see it here!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message._id} className={styles.messageCard}>
              <div className={styles.messageHeader}>
                <span className={styles.user}>{getUserDisplay(message)}</span>
                <span className={styles.chatId}>Chat: {message.chatId}</span>
                <span className={styles.timestamp}>
                  {formatDate(message.timestamp)}
                </span>
              </div>
              <div className={styles.messageContent}>
                <p>{message.text}</p>
              </div>
              <div className={styles.messageFooter}>
                <span className={styles.messageType}>{message.messageType}</span>
                <span className={styles.messageId}>ID: {message.messageId}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}