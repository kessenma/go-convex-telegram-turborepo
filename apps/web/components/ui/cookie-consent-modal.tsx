"use client";

import { Cookie, Unplug, Users } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useCookieConsent } from "../../hooks/use-cookie-consent";
import { renderIcon } from "../../lib/icon-utils";
import { Button } from "./button";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "./responsive-modal";

interface CookieConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function CookieConsentModal({
  open,
  onAccept,
  onDecline,
}: CookieConsentModalProps) {
  return (
    <ResponsiveModal open={open}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <ResponsiveModalContent
          side="bottom"
          className="mx-auto max-w-2xl border backdrop-blur-xl bg-slate-950/90 border-curious-cyan-700/30"
        >
          <ResponsiveModalHeader>
            <motion.div
              className="flex gap-3 items-center mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {renderIcon(Cookie, {
                className: "h-6 w-6 text-curious-cyan-400",
              })}
              <ResponsiveModalTitle className="text-xl">
                Cookie and Privacy Notice
              </ResponsiveModalTitle>
            </motion.div>
            <ResponsiveModalDescription className="space-y-4 text-left">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                This website uses cookies to track and store:
              </motion.p>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="flex gap-3 items-start">
                  {renderIcon(Users, {
                    className:
                      "h-5 w-5 text-curious-cyan-500 mt-0.5 flex-shrink-0",
                  })}
                  <div>
                    <h4 className="font-medium text-foreground">
                      Anonymous Analytics
                    </h4>
                    <p className="ml-4 text-sm text-muted-foreground">
                      How many people are on the app simultaneously (viewable in
                      the settings).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  {renderIcon(Unplug, {
                    className:
                      "h-5 w-5 text-curious-cyan-500 mt-0.5 flex-shrink-0",
                  })}
                  <div>
                    <h4 className="font-medium text-foreground">
                      Animation Preferences
                    </h4>
                    <p className="ml-4 text-sm text-muted-foreground">
                      You can toggle your animation preferences on / off in the
                      settings.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="p-4 rounded-lg border bg-curious-cyan-900/20 border-curious-cyan-800/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <h4 className="mb-2 font-medium text-foreground">
                  By agreeing to use this site you consent to cookies stored in
                  your browser.
                </h4>
                <p className="text-sm text-muted-foreground">
                  We do not collect personal information, track individual
                  users, or share data with third parties. All analytics are
                  aggregated and anonymous. If you send a message to the
                  Telegram Bot it will show up here for others to see + reply to
                  your message (you can leave the thread in Telegram to not
                  recieve the messages if you'd like though)
                </p>
              </motion.div>
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          <ResponsiveModalFooter>
            <motion.div
              className="flex flex-col gap-3 w-full sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <Button variant="skewed" onClick={onDecline} className="flex-1">
                Decline & Leave Site
              </Button>
              <Button variant="skewed" onClick={onAccept} className="flex-1">
                Accept Cookies
              </Button>
            </motion.div>
          </ResponsiveModalFooter>
        </ResponsiveModalContent>
      </motion.div>
    </ResponsiveModal>
  );
}

// Main component that handles the cookie consent logic
export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasConsented, showModal, acceptCookies, declineCookies, openModal } =
    useCookieConsent();

  // Don't render children if user has declined cookies
  if (hasConsented === false) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Redirecting...
            </h1>
            <p className="text-muted-foreground">
              You have declined cookies. You will be redirected shortly.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Changed your mind?</p>
            <button
              onClick={openModal}
              className="px-4 py-2 text-sm font-medium rounded-md border transition-colors text-primary bg-primary/10 hover:bg-primary/20 border-primary/20"
            >
              Change Cookie Settings
            </button>
          </div>
        </div>

        <CookieConsentModal
          open={showModal}
          onAccept={acceptCookies}
          onDecline={declineCookies}
        />
      </div>
    );
  }

  return (
    <>
      {children}
      <CookieConsentModal
        open={showModal}
        onAccept={acceptCookies}
        onDecline={declineCookies}
      />
    </>
  );
}
