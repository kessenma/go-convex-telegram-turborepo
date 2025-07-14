"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "../hooks/use-outside-clicks";
import { useNotifications } from "../contexts/NotificationsContext";
import { Bell, X, Check, CheckCheck, Clock, Upload, Database } from "lucide-react";
import { cn } from "../lib/utils";
import { renderIcon } from "../lib/icon-utils";
import { ScrollArea } from "../components/ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface NotificationsProps {
  className?: string;
}

interface Notification {
  _id: Id<"notifications">;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  documentId?: Id<"rag_documents">;
  metadata?: string;
  source?: string;
}

export function Notifications({ className }: NotificationsProps) {
  const { isOpen, openNotifications, closeNotifications } = useNotifications();
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Convex queries and mutations
  const notifications = useQuery(api.notifications.getAllNotifications, { limit: 20 });
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Track previous notifications to detect new ones
  const [previousNotifications, setPreviousNotifications] = useState<Notification[]>([]);

  // Show toast for new notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setPreviousNotifications([]);
      return;
    }

    // If we have previous notifications, check for new ones
    if (previousNotifications.length > 0) {
      const newNotifications = notifications.filter(
        (notification: Notification) => 
          !previousNotifications.some(prev => prev._id === notification._id)
      );

      // Show toast for each new notification
      newNotifications.forEach((notification: Notification) => {
        if (notification.type === 'document_embedded') {
          toast.success(notification.message, {
            description: `Embedding completed successfully`,
            duration: 5000,
          });
        } else if (notification.type === 'document_uploaded') {
          toast.success(notification.message, {
            description: `Document uploaded successfully`,
            duration: 5000,
          });
        } else {
          toast.info(notification.message, {
            description: notification.title,
            duration: 5000,
          });
        }
      });
    }

    // Update previous notifications
    setPreviousNotifications(notifications);
  }, [notifications, previousNotifications]);

  // Update button position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeNotifications();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeNotifications]);

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "document_uploaded":
        return Upload;
      case "document_embedded":
        return Database;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "document_uploaded":
        return "text-blue-500";
      case "document_embedded":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  useOutsideClick(ref, (event: MouseEvent | TouchEvent) => closeNotifications());

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={openNotifications}
        className="relative p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {renderIcon(Bell, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" })}
        {(unreadCount || 0) > 0 && (
          <span className="flex absolute -top-1 -right-1 justify-center items-center w-5 h-5 text-xs bg-cyan-400 rounded-full text-slate-950">
            {unreadCount! > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 backdrop-blur-sm bg-black/20"
            />
            <motion.div
              ref={ref}
              layoutId={`card-${id}`}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              style={{
                position: 'fixed',
                top: buttonPosition.top,
                right: buttonPosition.right,
                zIndex: 60
              }}
              className="w-96 bg-white rounded-xl border border-gray-200 shadow-2xl dark:bg-gray-900 dark:border-gray-700"
            >
              <ScrollArea className="h-[calc(60vh)]">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h2>
                    <div className="flex gap-2 items-center">
                      {(unreadCount || 0) > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="p-1 text-xs text-gray-500 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                          title="Mark all as read"
                        >
                          {renderIcon(CheckCheck, { className: "w-4 h-4" })}
                        </button>
                      )}
                      <button
                        onClick={closeNotifications}
                        className="p-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {renderIcon(X, { className: "w-5 h-5 text-gray-500 dark:text-gray-400" })}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!notifications || notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="mb-2">
                          {renderIcon(Bell, { className: "w-8 h-8 mx-auto opacity-50" })}
                        </div>
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification: Notification) => {
                        const IconComponent = getNotificationIcon(notification.type);
                        const iconColor = getNotificationColor(notification.type);
                        
                        return (
                          <div
                            key={notification._id}
                            className={cn(
                              "p-3 rounded-lg border transition-colors cursor-pointer",
                              notification.isRead
                                ? "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700"
                                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            )}
                            onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                          >
                            <div className="flex gap-3 items-start">
                              <div className={cn("mt-0.5", iconColor)}>
                                {renderIcon(IconComponent, { className: "w-4 h-4" })}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className={cn(
                                    "text-sm font-medium truncate",
                                    notification.isRead
                                      ? "text-gray-700 dark:text-gray-300"
                                      : "text-gray-900 dark:text-white"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  {!notification.isRead && (
                                    <div className="flex-shrink-0 ml-2 w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                                <p className={cn(
                                  "text-xs mb-2",
                                  notification.isRead
                                    ? "text-gray-500 dark:text-gray-400"
                                    : "text-gray-600 dark:text-gray-300"
                                )}>
                                  {notification.message}
                                </p>
                                <div className="flex justify-between items-center">
                                  <span className="flex gap-1 items-center text-xs text-gray-400 dark:text-gray-500">
                                    {renderIcon(Clock, { className: "w-3 h-3" })}
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  {notification.isRead && (
                                    <span className="flex gap-1 items-center text-xs text-gray-400 dark:text-gray-500">
                                      {renderIcon(Check, { className: "w-3 h-3" })}
                                      Read
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
