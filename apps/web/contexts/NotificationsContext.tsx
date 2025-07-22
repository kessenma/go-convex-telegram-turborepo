"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

interface NotificationsContextType {
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const openNotifications = () => setIsOpen(true);
  const closeNotifications = () => setIsOpen(false);

  return (
    <NotificationsContext.Provider
      value={{ isOpen, openNotifications, closeNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    // During prerendering, return a default context instead of throwing
    if (typeof window === 'undefined') {
      return {
        isOpen: false,
        openNotifications: () => {},
        closeNotifications: () => {},
      };
    }
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
