"use client";
import React from "react";
import { cn } from "../../lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

interface HeroProps {
  title: string;
  subtitle?: string;
  subtitleAccordionContent?: string;
  children?: React.ReactNode;
  className?: string;
  whiteText?: boolean;
  textAlign?: "left" | "center" | "right";
}

export const Hero = ({ title, subtitle, subtitleAccordionContent, children, className, whiteText = false, textAlign = "center" }: HeroProps) => {
  return (
    <div className={cn("my-8", `text-${textAlign}`, className)}>
      <h1 className={cn(
        "mb-4 text-2xl font-bold md:text-5xl font-bitcount",
        whiteText ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-br from-cyan-100 to-cyan-500"
      )}>
        {title}
      </h1>
      {subtitle && (
        subtitleAccordionContent ? (
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
        )
      )}
      {children}
    </div>
  );
};