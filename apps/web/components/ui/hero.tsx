"use client";
import React from "react";
import { cn } from "../../lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import DecryptedText from "./text-animations/decrypted-text";
import GlitchText from "./text-animations/glitch-text";
import { GradientText } from "./text-animations/gradient-text";
import ShinyText from "./text-animations/shiny-text";
import TrueFocus from "./text-animations/true-focus";
import { TextRoll } from "./text-animations/text-roll";
import { useAnimationSettings } from "../../hooks/use-animation-settings";

export enum TextAnimationType {
  None = "none",
  Decrypt = "decrypt",
  Glitch = "glitch",
  Gradient = "gradient",
  Shiny = "shiny",
  TrueFocus = "trueFocus",
  TextRoll = "textRoll"
}

interface HeroProps {
  title: string;
  subtitle?: string;
  subtitleAccordionContent?: string;
  children?: React.ReactNode;
  className?: string;
  whiteText?: boolean;
  textAlign?: "left" | "center" | "right";
  titleAnimation?: TextAnimationType;
  subtitleAnimation?: TextAnimationType;
  animationSpeed?: number;
  glitchSpeed?: number;
  gradientColors?: string[];
  trueFocusBlurAmount?: number;
  trueFocusBorderColor?: string;
  trueFocusGlowColor?: string;
}

export const Hero = ({ 
  title, 
  subtitle, 
  subtitleAccordionContent, 
  children, 
  className, 
  whiteText = false, 
  textAlign = "center", 
  titleAnimation = TextAnimationType.None, 
  subtitleAnimation = TextAnimationType.None,
  animationSpeed = 50, 
  glitchSpeed = 0.5,
  gradientColors = ["#ffaa40", "#9c40ff", "#ffaa40"],
  trueFocusBlurAmount = 5,
  trueFocusBorderColor = "green",
  trueFocusGlowColor = "rgba(0, 255, 0, 0.6)"
}: HeroProps) => {
  const { animationLightMode } = useAnimationSettings();
  return (
    <div className={cn("my-8", `text-${textAlign}`, className)}>
      <h1 className={cn(
        "mb-4 text-2xl font-bold md:text-5xl font-bitcount",
        whiteText ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-br from-cyan-100 to-cyan-500"
      )}>
        {(() => {
          const textStyle = whiteText ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-br from-cyan-100 to-cyan-500";
          if (animationLightMode) return title;
          
          switch (titleAnimation) {
            case TextAnimationType.Glitch:
              return (
                <GlitchText
                  speed={glitchSpeed}
                  enableShadows={true}
                  enableOnHover={false}
                  className={textStyle}
                >
                  {title}
                </GlitchText>
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
                <GradientText
                  colors={gradientColors}
                  animationSpeed={animationSpeed / 1000}
                  className={textStyle}
                >
                  {title}
                </GradientText>
              );
            case TextAnimationType.Shiny:
              return (
                <ShinyText
                  text={title}
                  speed={animationSpeed / 10}
                  className={textStyle}
                />
              );
            case TextAnimationType.TrueFocus:
              return (
                <TrueFocus
                  sentence={title}
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
                  {title}
                </TextRoll>
              );
            default:
              return title;
          }
        })()}
      </h1>
      {subtitle && (() => {
          const textStyle = whiteText ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-br from-cyan-100 to-cyan-500";
          const subtitleContent = subtitleAccordionContent ? (
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="subtitle-info">
                <AccordionTrigger className="text-xl text-gray-600 dark:text-gray-300">
                  {subtitle}
                </AccordionTrigger>
                <AccordionContent className="mx-auto max-w-3xl text-gray-300">
                  {subtitleAccordionContent}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <p className="mb-6 text-xl text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
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