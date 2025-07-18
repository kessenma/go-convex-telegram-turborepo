import { useEffect, useRef, useState, ReactElement } from "react";
import { motion } from "framer-motion";
import { useIntersectionObserver } from "./../../../hooks/use-intersection-observer";

interface TrueFocusProps {
    sentence?: string;
    manualMode?: boolean;
    blurAmount?: number;
    borderColor?: string;
    glowColor?: string;
    animationDuration?: number;
    pauseBetweenAnimations?: number;
    playOnce?: boolean;
    className?: string;
    duration?: number; // For backward compatibility
    children?: React.ReactNode;
    isInView?: boolean; // Added to control animation from parent
}

interface FocusRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

function TrueFocus({
    sentence,
    manualMode = false,
    blurAmount = 5,
    borderColor = "green",
    glowColor = "rgba(0, 255, 0, 0.6)",
    animationDuration = 0.5,
    pauseBetweenAnimations = 1,
    playOnce = false,
    className = "",
    duration, // For backward compatibility
    children,
    isInView, // Added to control animation from parent
}: TrueFocusProps): ReactElement {
    // Use children content if provided, otherwise use sentence prop
    const content = children ? String(children).trim() : sentence || "True Focus";
    const words = content.split(" ");
    const [currentIndex, setCurrentIndex] = useState<number>(-1); // Start with -1 to not show any word initially
    const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
    const [animationComplete, setAnimationComplete] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });
    
    // Use intersection observer to detect when component is in view
    const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
        threshold: 0.1,
        triggerOnce: true
    });

    // Start animation when component comes into view
    useEffect(() => {
        // Use provided isInView prop if available, otherwise use intersection observer
        const shouldStartAnimation = isInView !== undefined ? isInView : isIntersecting;
        
        if (shouldStartAnimation && currentIndex === -1) {
            setCurrentIndex(0);
        }
    }, [isIntersecting, currentIndex, isInView]);

    useEffect(() => {
        if (!manualMode && !animationComplete && currentIndex >= 0) {
            // Use duration prop if provided (for backward compatibility)
            const effectiveAnimationDuration = duration ? duration / words.length : animationDuration;
            
            const interval = setInterval(() => {
                setCurrentIndex((prev) => {
                    const nextIndex = (prev + 1) % words.length;
                    if (playOnce && nextIndex === 0 && prev === words.length - 1) {
                        setAnimationComplete(true);
                        return words.length - 1; // Stay on last word
                    }
                    return nextIndex;
                });
            }, (effectiveAnimationDuration + pauseBetweenAnimations) * 1000);

            return () => clearInterval(interval);
        }
    }, [manualMode, animationDuration, pauseBetweenAnimations, words.length, playOnce, animationComplete, currentIndex, duration]);

    useEffect(() => {
        if (currentIndex === null || currentIndex === -1) return;
        if (!wordRefs.current[currentIndex] || !containerRef.current) return;

        const parentRect = containerRef.current.getBoundingClientRect();
        
        if (animationComplete && playOnce) {
            // Show borders around entire text when animation is complete
            const firstWord = wordRefs.current[0];
            const lastWord = wordRefs.current[words.length - 1];
            if (firstWord && lastWord) {
                const firstRect = firstWord.getBoundingClientRect();
                const lastRect = lastWord.getBoundingClientRect();
                setFocusRect({
                    x: firstRect.left - parentRect.left,
                    y: firstRect.top - parentRect.top,
                    width: (lastRect.right - firstRect.left),
                    height: firstRect.height,
                });
            }
        } else {
            const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();
            setFocusRect({
                x: activeRect.left - parentRect.left,
                y: activeRect.top - parentRect.top,
                width: activeRect.width,
                height: activeRect.height,
            });
        }
    }, [currentIndex, words.length, animationComplete, playOnce]);

    const handleMouseEnter = (index: number) => {
        if (manualMode) {
            setLastActiveIndex(index);
            setCurrentIndex(index);
        }
    };

    const handleMouseLeave = () => {
        if (manualMode) {
            setCurrentIndex(lastActiveIndex!);
        }
    };

    return (
        <div
            className={`flex relative flex-wrap gap-4 justify-center items-center ${className}`}
            ref={(el) => {
                containerRef.current = el;
                if (intersectionRef && typeof intersectionRef === 'object') {
                    // @ts-ignore - This is a valid way to assign to a ref
                    intersectionRef.current = el;
                }
            }}
        >
            {words.map((word, index) => {
                const isActive = index === currentIndex;
                return (
                    <span
                        key={index}
                        ref={(el: HTMLSpanElement | null): void => { wordRefs.current[index] = el }}
                        className="relative text-lg font-semibold text-white cursor-pointer"
                        style={{
                            filter: (animationComplete && playOnce) 
                                ? `blur(0px)` // All text clear when animation complete
                                : manualMode
                                    ? isActive
                                        ? `blur(0px)`
                                        : `blur(${blurAmount}px)`
                                    : isActive
                                        ? `blur(0px)`
                                        : `blur(${blurAmount}px)`,
                            transition: `filter ${animationDuration}s ease`,
                        } as React.CSSProperties}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {word}
                    </span>
                );
            })}

            <motion.div
                className="box-border absolute top-0 left-0 border-0 pointer-events-none"
                animate={{
                    x: focusRect.x,
                    y: focusRect.y,
                    width: focusRect.width,
                    height: focusRect.height,
                    opacity: currentIndex >= 0 ? 1 : 0,
                }}
                transition={{
                    duration: animationDuration,
                }}
                style={{
                    "--border-color": borderColor,
                    "--glow-color": glowColor,
                } as React.CSSProperties}
            >
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] left-[-10px] border-r-0 border-b-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] right-[-10px] border-l-0 border-b-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] left-[-10px] border-r-0 border-t-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] right-[-10px] border-l-0 border-t-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
            </motion.div>
        </div>
    );
}

export default TrueFocus;