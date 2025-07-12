"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationsContextType {
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openNotifications = () => setIsOpen(true);
  const closeNotifications = () => setIsOpen(false);

  return (
    <NotificationsContext.Provider value={{ isOpen, openNotifications, closeNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}