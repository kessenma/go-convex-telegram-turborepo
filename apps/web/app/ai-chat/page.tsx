"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { ChatPageWithHistory } from '../../components/chat/ChatPageWithHistory';
import { ParticlesBackground } from "../../components/ui/backgrounds/particles-background";
import { Hero, TextAnimationType } from "../../components/ui/hero";
import { useAnimationSettings } from "../../hooks/use-animation-settings";

export default function AIChat() {
  const [selectedCount, setSelectedCount] = useState(0);
  const [hasMessages, setHasMessages] = useState(false);

  // Get animation settings
  const { animationEnabled } = useAnimationSettings();

  return (
    <>
      <div className="relative min-h-screen">
        <ParticlesBackground
          className="fixed z-0"
          animationEnabled={animationEnabled}
          meshCount={50}
          selectedCount={selectedCount}
          errorMode={false}
        />
        <div className="container relative z-10 px-4 py-8 mx-auto mt-12 mb-8">
          <Hero
            title="AI Chat Assistant"
            subtitle="Have conversations with AI or chat with your documents using intelligent retrieval"
            titleAnimation={TextAnimationType.TextRoll}
            subtitleAnimation={TextAnimationType.Shimmer}
            animationSpeed={75}
          />

          <div className="px-4 mx-auto mt-20 max-w-6xl">
            <ChatPageWithHistory
              onDocumentCountChange={setSelectedCount}
              onMessageCountChange={setHasMessages}
            />
          </div>
        </div>
      </div>
    </>
  );
}
