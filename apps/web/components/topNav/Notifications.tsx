"use client";

import { useMutation, useQuery } from "convex/react";
import type { GenericId as Id } from "convex/values";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Database,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ExpandableCard } from "../../components/ui/expandable-card-reusable";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tool-tip";
import { useNotifications } from "../../contexts/NotificationsContext";
import { api } from "../../generated-convex";
import { useOutsideClick } from "../../hooks/use-outside-clicks";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { DocumentViewer } from "../rag/DocumentViewer";

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

export function Notifications({
  className,
}: NotificationsProps): React.ReactElement {
  const { isOpen, openNotifications, closeNotifications } = useNotifications();
  const [buttonPosition, setButtonPosition] = useState<{
    top: number | "auto";
    bottom?: number;
    right: number;
  }>({ top: 0, right: 0 });
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"rag_documents"> | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Convex queries and mutations
  const notifications = useQuery(api.notifications.getAllNotifications, {
    limit: 20,
  });
  

  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  
  // Handle opening document viewer
  const handleOpenDocument = (documentId: Id<"rag_documents">) => {
    // First set the document ID to trigger the query
    setSelectedDocumentId(documentId);
    setIsDocumentViewerOpen(true);
    closeNotifications();
  };
  
  // Handle closing document viewer
  const handleCloseViewer = () => {
    setIsDocumentViewerOpen(false);
    setSelectedDocumentId(null);
  };

  // Track previous notifications to detect new ones
  const [previousNotifications, setPreviousNotifications] = useState<
    Notification[]
  >([]);

  // Show toast for new notifications
  useEffect(() => {
    console.log("🔔 Notifications updated:", notifications?.length || 0);
    
    if (!notifications || notifications.length === 0) {
      setPreviousNotifications([]);
      return;
    }

    // If we have previous notifications, check for new ones
    if (previousNotifications.length > 0) {
      const newNotifications = notifications.filter(
        (notification: Notification) =>
          !previousNotifications.some((prev) => prev._id === notification._id)
      );

      console.log("🆕 New notifications found:", newNotifications.length);
      
      // Show toast for each new notification
      newNotifications.forEach((notification: Notification) => {
        console.log("🔔 Processing notification:", notification.type, notification.message);
        
        if (notification.type === "document_embedded") {
          toast.success(notification.message, {
            description: "Embedding completed successfully",
            duration: 5000,
          });
        } else if (notification.type === "document_uploaded") {
          toast.success(notification.message, {
            description: "Document uploaded successfully",
            duration: 5000,
          });
        } else if (notification.type === "document_deleted") {
          console.log("🗑️ Showing deletion notification toast");
          toast.success(notification.message, {
            description: "Document deleted successfully",
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
  }, [notifications, previousNotifications.length, previousNotifications.some]);

  // Update button position when opening, with mobile responsiveness
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640; // sm breakpoint

      // Calculate available space below button
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      // Use top positioning if there's enough space, otherwise position from bottom
      const useTopPositioning = spaceBelow >= 300; // Minimum height needed

      if (isMobile) {
        // Center horizontally on mobile
        if (useTopPositioning) {
          setButtonPosition({
            top: rect.bottom + 8,
            right: Math.max(
              8,
              Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
            ), // Center with min margin
          });
        } else {
          // Position from bottom of screen if not enough space below
          setButtonPosition({
            top: "auto",
            bottom: 16,
            right: Math.max(
              8,
              Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
            ),
          });
        }
      } else {
        // Regular positioning for larger screens
        setButtonPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeNotifications();
      }
    }

    function handleResize() {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 640; // sm breakpoint

        // Calculate available space below button
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        // Use top positioning if there's enough space, otherwise position from bottom
        const useTopPositioning = spaceBelow >= 300; // Minimum height needed

        if (isMobile) {
          // Center horizontally on mobile
          if (useTopPositioning) {
            setButtonPosition({
              top: rect.bottom + 8,
              right: Math.max(
                8,
                Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
              ),
            });
          } else {
            // Position from bottom of screen if not enough space below
            setButtonPosition({
              top: "auto",
              bottom: 16,
              right: Math.max(
                8,
                Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
              ),
            });
          }
        } else {
          // Regular positioning for larger screens
          setButtonPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", handleResize);
    };
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
      case "document_deleted":
        return X;
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
      case "document_deleted":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  useOutsideClick(ref, (_event: MouseEvent | TouchEvent) =>
    closeNotifications()
  );

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={openNotifications}
        className="relative p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {renderIcon(Bell, {
          className: "w-5 h-5 text-gray-600 dark:text-gray-400",
        })}
        {(unreadCount || 0) > 0 && (
          <span className="flex absolute -top-1 -right-1 justify-center items-center w-5 h-5 text-xs bg-cyan-400 rounded-full text-slate-950">
            {unreadCount! > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <ExpandableCard
        isOpen={isOpen}
        onClose={closeNotifications}
        buttonPosition={buttonPosition}
        liquidGlass={true}
        layoutId={`notifications-card-${id}`}
      >
        <ScrollArea className="h-[calc(min(60vh,500px))] overflow-y-auto">
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
                  {renderIcon(X, {
                    className: "w-5 h-5 text-gray-500 dark:text-gray-400",
                  })}
                </button>
              </div>
            </div>

            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {!notifications || notifications.length === 0 ? (
                <motion.div
                  className="py-8 text-center text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="mb-2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {renderIcon(Bell, { className: "w-8 h-8 mx-auto" })}
                  </motion.div>
                  <motion.p
                    className="text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    No notifications yet
                  </motion.p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {notifications.map(
                    (notification: Notification, _index: number) => {
                      const IconComponent = getNotificationIcon(
                        notification.type
                      );
                      const iconColor = getNotificationColor(notification.type);

                      return (
                        <motion.div
                          key={notification._id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors cursor-pointer relative",
                            notification.isRead
                              ? "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700"
                              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                            notification.type === "document_deleted" && "opacity-70"
                          )}
                          onClick={() => {
                            // Mark as read if unread
                            if (!notification.isRead) {
                              handleMarkAsRead(notification._id);
                            }
                            
                            // Open document viewer if it's a document-related notification
                            if (
                              notification.documentId && 
                              (notification.type === "document_embedded" || 
                               notification.type === "document_uploaded")
                            ) {
                              handleOpenDocument(notification.documentId);
                            }
                            
                            // Show toast for deleted documents
                            if (notification.type === "document_deleted") {
                              toast.error("This document has been deleted");
                            }
                          }}
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          whileHover={{
                            scale: 1.01,
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                          }}
                          whileTap={{ scale: 0.99 }}
                          layout
                        >
                          <div className="flex gap-3 items-start">
                            <motion.div
                              className={cn("mt-0.5", iconColor)}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                              }}
                            >
                              {notification.type === "document_deleted" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      {renderIcon(IconComponent, {
                                        className: "w-4 h-4",
                                      })}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Document has been deleted
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                renderIcon(IconComponent, {
                                  className: "w-4 h-4",
                                })
                              )}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <h4
                                  className={cn(
                                    "text-sm font-medium truncate",
                                    notification.isRead
                                      ? "text-gray-700 dark:text-gray-300"
                                      : "text-gray-900 dark:text-white"
                                  )}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <motion.div
                                    className="flex-shrink-0 ml-2 w-2 h-2 bg-blue-500 rounded-full"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                  />
                                )}
                              </div>
                              <p
                                className={cn(
                                  "text-xs mb-2",
                                  notification.isRead
                                    ? "text-gray-500 dark:text-gray-400"
                                    : "text-gray-600 dark:text-gray-300"
                                )}
                              >
                                {notification.message}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="flex gap-1 items-center text-xs text-gray-400 dark:text-gray-500">
                                  {renderIcon(Clock, { className: "w-3 h-3" })}
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                {notification.isRead && (
                                  <motion.span
                                    className="flex gap-1 items-center text-xs text-gray-400 dark:text-gray-500"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                  >
                                    {renderIcon(Check, {
                                      className: "w-3 h-3",
                                    })}
                                    Read
                                  </motion.span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          </div>
        </ScrollArea>
      </ExpandableCard>
      {/* Document Viewer */}
      {selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId}
          isOpen={isDocumentViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
