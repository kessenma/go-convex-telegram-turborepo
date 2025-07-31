"use client";
import type React from "react";
import { useAnimationSettings } from "../../hooks/use-animation-settings";
import { useIntersectionObserver } from "../../hooks/use-intersection-observer";
import { cn } from "../../lib/utils";
import { Audiowide } from "next/font/google";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import BlurText from "./text-animations/blur-text";
import DecryptedText from "./text-animations/decrypted-text";
import GlitchText from "./text-animations/glitch-text";
import { GradientText } from "./text-animations/gradient-text";
import ShinyText from "./text-animations/shiny-text";
import { TextRoll } from "./text-animations/text-roll";
import { TextShimmer } from "./text-animations/text-shimmer";
import TrueFocus from "./text-animations/true-focus";

// Initialize the Audiowide font
const audiowide = Audiowide({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-audiowide",
});

export enum TextAnimationType {
  None = "none",
  Blur = "blur",
  Decrypt = "decrypt",
  Glitch = "glitch",
  Gradient = "gradient",
  Shiny = "shiny",
  Shimmer = "shimmer",
  TrueFocus = "trueFocus",
  TextRoll = "textRoll",
}

interface HeroProps {
  title: string;
  subtitle?: string;
  subtitleAccordionContent?: string;
  children?: React.ReactNode;
  className?: string;
  textAlign?: "left" | "center" | "right";
  headerColor?: string;
  subheaderColor?: string;
  accordionColor?: string;
  titleAnimation?: TextAnimationType;
  subtitleAnimation?: TextAnimationType;
  animationSpeed?: number;
  glitchSpeed?: number;
  gradientColors?: string[];
  trueFocusBlurAmount?: number;
  trueFocusBorderColor?: string;
  whiteText?: boolean;
  trueFocusGlowColor?: string;
}

export const Hero = ({
  title,
  subtitle,
  subtitleAccordionContent,
  children,
  className,
  textAlign = "center",
  headerColor,
  subheaderColor = "text-gray-600 dark:text-gray-300",
  accordionColor = "text-gray-300",
  titleAnimation = TextAnimationType.None,
  subtitleAnimation = TextAnimationType.None,
  animationSpeed = 50,
  glitchSpeed = 0.5,
  gradientColors = ["#a2f4fd", "#a2f4fd", "#a2f4fd"],
  trueFocusBlurAmount = 5,
  trueFocusBorderColor = "green",
  trueFocusGlowColor = "rgba(0, 255, 0, 0.6)",
}: HeroProps) => {
  const { animationLightMode } = useAnimationSettings();

  // Call all intersection observer hooks at the top level
  const titleIntersection = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.2,
  });

  const _subtitleIntersection = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.2,
  });
  return (
    <div className={cn("my-8", `text-${textAlign}`, className, audiowide.variable)}>
      <h1
        className={cn(
          "mb-4 text-2xl font-bold md:text-5xl font-bitcount",
          headerColor
        )}
      >
        {(() => {
          const textStyle = headerColor;
          if (animationLightMode) return title;

          switch (titleAnimation) {
            case TextAnimationType.Glitch:
              return (
                <div ref={titleIntersection.ref}>
                  <GlitchText
                    speed={glitchSpeed}
                    enableShadows={true}
                    enableOnHover={false}
                    className={textStyle}
                    isInView={titleIntersection.isIntersecting}
                  >
                    {title}
                  </GlitchText>
                </div>
              );
            case TextAnimationType.Blur:
              return (
                <div ref={titleIntersection.ref}>
                  <BlurText
                    text={title}
                    speed={animationSpeed}
                    className={textStyle}
                    isInView={titleIntersection.isIntersecting}
                  />
                </div>
              );
            case TextAnimationType.Decrypt:
              return (
                <DecryptedText
                  text={title}
                  speed={animationSpeed}
                  animateOn="view"
                  sequential={true}
                  className={textStyle}
                  encryptedClassName="text-gray-400"
                />
              );
            case TextAnimationType.Gradient:
              return (
                <div ref={titleIntersection.ref}>
                  <GradientText
                    colors={gradientColors}
                    animationSpeed={animationSpeed / 1000}
                    className={textStyle}
                    isInView={titleIntersection.isIntersecting}
                  >
                    {title}
                  </GradientText>
                </div>
              );
            case TextAnimationType.Shiny:
              return (
                <div ref={titleIntersection.ref}>
                  <ShinyText
                    text={title}
                    speed={animationSpeed / 10}
                    className={textStyle}
                    isInView={titleIntersection.isIntersecting}
                  />
                </div>
              );
            case TextAnimationType.Shimmer:
              return (
                <div ref={titleIntersection.ref}>
                  <TextShimmer
                    className={textStyle}
                    duration={animationSpeed / 10}
                    isInView={titleIntersection.isIntersecting}
                  >
                    {title}
                  </TextShimmer>
                </div>
              );
            case TextAnimationType.TrueFocus:
              return (
                <div ref={titleIntersection.ref}>
                  <TrueFocus
                    sentence={title}
                    blurAmount={trueFocusBlurAmount}
                    borderColor={trueFocusBorderColor}
                    glowColor={trueFocusGlowColor}
                    animationDuration={animationSpeed / 100}
                    playOnce={true}
                    isInView={titleIntersection.isIntersecting}
                  />
                </div>
              );
            case TextAnimationType.TextRoll:
              return (
                <div ref={titleIntersection.ref}>
                  <TextRoll
                    duration={animationSpeed / 1000}
                    className={textStyle}
                    isInView={titleIntersection.isIntersecting}
                  >
                    {title}
                  </TextRoll>
                </div>
              );
            default:
              return title;
          }
        })()}
      </h1>
      {subtitle &&
        (() => {
          const textStyle = headerColor;
          const subtitleContent = subtitleAccordionContent ? (
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="subtitle-info">
                <AccordionTrigger className={cn("text-xl", subheaderColor)}>
                  {subtitle}
                </AccordionTrigger>
                <AccordionContent
                  className={cn("mx-auto max-w-3xl", accordionColor)}
                >
                  {subtitleAccordionContent}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <p className={cn("mb-6 text-xl", subheaderColor)}>{subtitle}</p>
          );

          if (animationLightMode) return subtitleContent;

          switch (subtitleAnimation) {
            case TextAnimationType.Glitch:
              return (
                <GlitchText
                  speed={glitchSpeed}
                  enableShadows={true}
                  enableOnHover={false}
                  className={textStyle}
                >
                  {subtitle}
                </GlitchText>
              );
            case TextAnimationType.Blur:
              return (
                <BlurText
                  text={subtitle}
                  speed={animationSpeed}
                  className={textStyle}
                />
              );
            case TextAnimationType.Decrypt:
              return (
                <DecryptedText
                  text={subtitle}
                  speed={animationSpeed}
                  animateOn="view"
                  sequential={true}
                  className={textStyle}
                  encryptedClassName="text-gray-400"
                />
              );
            case TextAnimationType.Gradient:
              return (
                <GradientText
                  colors={gradientColors}
                  animationSpeed={animationSpeed / 1000}
                  className={textStyle}
                >
                  {subtitle}
                </GradientText>
              );
            case TextAnimationType.Shiny:
              return (
                <ShinyText
                  text={subtitle}
                  speed={animationSpeed / 10}
                  className={textStyle}
                />
              );
            case TextAnimationType.Shimmer:
              return (
                <TextShimmer
                  className={textStyle}
                  duration={animationSpeed / 10}
                >
                  {subtitle}
                </TextShimmer>
              );
            case TextAnimationType.TrueFocus:
              return (
                <TrueFocus
                  sentence={subtitle}
                  blurAmount={trueFocusBlurAmount}
                  borderColor={trueFocusBorderColor}
                  glowColor={trueFocusGlowColor}
                  animationDuration={animationSpeed / 100}
                  playOnce={true}
                />
              );
            case TextAnimationType.TextRoll:
              return (
                <TextRoll
                  duration={animationSpeed / 1000}
                  className={textStyle}
                >
                  {subtitle}
                </TextRoll>
              );
            default:
              return subtitleContent;
          }
        })()}

      {children}
    </div>
  );
};
