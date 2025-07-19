"use client";

import React from 'react';
import { useCookieConsent } from '../../hooks/use-cookie-consent';
import { useAnimationSettings } from '../../hooks/use-animation-settings';

export default function CookieTestPage() {
  const { hasConsented, showModal, resetConsent, openModal } = useCookieConsent();
  const { animationLightMode, animationEnabled, isLoaded } = useAnimationSettings();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Cookie Consent Test Page
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Cookie Consent Status</h2>
            <div className="space-y-2">
              <p><strong>Has Consented:</strong> {hasConsented === null ? 'Not decided' : hasConsented ? 'Yes' : 'No'}</p>
              <p><strong>Show Modal:</strong> {showModal ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Animation Settings</h2>
            <div className="space-y-2">
              <p><strong>Settings Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
              <p><strong>Light Mode:</strong> {animationLightMode ? 'Yes' : 'No'}</p>
              <p><strong>Animations Enabled:</strong> {animationEnabled ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Test Actions</h2>
            <div className="space-y-3">
              <button
                onClick={openModal}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mr-3"
              >
                Open Cookie Modal
              </button>
              <button
                onClick={resetConsent}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reset Cookie Consent (Clear Storage)
              </button>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Expected Behavior</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>On first visit: Cookie consent modal should appear</li>
              <li>If you accept: Animation settings will be saved and respected</li>
              <li>If you decline: You should see redirect page with 'Change Cookie Settings' button</li>
              <li>Clicking 'Change Cookie Settings' reopens the modal</li>
              <li>Animation settings only work if cookies are accepted</li>
              <li>User session tracking only works if cookies are accepted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}