"use client";

import { useEffect, useState } from "react";

interface CookieConsentState {
  hasConsented: boolean | null; // null = not decided, true = accepted, false = declined
  showModal: boolean;
}

export function useCookieConsent() {
  const [consentState, setConsentState] = useState<CookieConsentState>({
    hasConsented: null,
    showModal: false,
  });

  // Check for existing consent on mount
  useEffect(() => {
    const existingConsent = localStorage.getItem("cookie-consent");

    if (existingConsent === null) {
      // No consent decision made yet, show modal
      setConsentState({
        hasConsented: null,
        showModal: true,
      });
    } else {
      // Consent decision exists
      const hasConsented = existingConsent === "true";
      setConsentState({
        hasConsented,
        showModal: false,
      });
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setConsentState({
      hasConsented: true,
      showModal: false,
    });
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "false");
    setConsentState({
      hasConsented: false,
      showModal: false,
    });

    // Optional: Set a timeout to redirect after showing the message
    // Users can click "Change Cookie Settings" before this happens
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 10000); // 10 seconds delay
  };

  const resetConsent = () => {
    localStorage.removeItem("cookie-consent");
    setConsentState({
      hasConsented: null,
      showModal: true,
    });
  };

  const openModal = () => {
    setConsentState((prev) => ({
      ...prev,
      showModal: true,
    }));
  };

  return {
    hasConsented: consentState.hasConsented,
    showModal: consentState.showModal,
    acceptCookies,
    declineCookies,
    resetConsent,
    openModal,
  };
}
