"use client";

import React from 'react';
import { Cookie, Shield, Users } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from './responsive-modal';
import { renderIcon } from '../../lib/icon-utils';
import { useCookieConsent } from '../../hooks/use-cookie-consent';

interface CookieConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function CookieConsentModal({ open, onAccept, onDecline }: CookieConsentModalProps) {
  return (
    <ResponsiveModal open={open}>
      <ResponsiveModalContent side="bottom" className="max-w-2xl mx-auto">
        <ResponsiveModalHeader>
          <div className="flex items-center gap-3 mb-4">
            {renderIcon(Cookie, { className: "h-6 w-6 text-orange-500" })}
            <ResponsiveModalTitle className="text-xl">
              Cookie & Privacy Notice
            </ResponsiveModalTitle>
          </div>
          <ResponsiveModalDescription className="text-left space-y-4">
            <p>
              This website uses cookies and similar technologies to enhance your browsing experience and provide personalized content.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {renderIcon(Shield, { className: "h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" })}
                <div>
                  <h4 className="font-medium text-foreground">Animation Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    We store your animation preferences locally to remember your settings across visits.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                {renderIcon(Users, { className: "h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" })}
                <div>
                  <h4 className="font-medium text-foreground">Anonymous Usage Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    We anonymously track how many people are using the site at once to monitor performance. No personal information is collected.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Your Privacy Matters</h4>
              <p className="text-sm text-muted-foreground">
                We do not collect personal information, track individual users, or share data with third parties. 
                All analytics are aggregated and anonymous.
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              By clicking "Accept", you consent to our use of cookies for the purposes described above. 
              If you decline, you will be redirected away from this site.
            </p>
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        
        <ResponsiveModalFooter>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Decline & Leave Site
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Accept Cookies
            </button>
          </div>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}

// Main component that handles the cookie consent logic
export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const { hasConsented, showModal, acceptCookies, declineCookies, openModal } = useCookieConsent();
  
  // Don't render children if user has declined cookies
  if (hasConsented === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Redirecting...</h1>
            <p className="text-muted-foreground">
              You have declined cookies. You will be redirected shortly.
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Changed your mind?
            </p>
            <button
              onClick={openModal}
              className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors border border-primary/20"
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