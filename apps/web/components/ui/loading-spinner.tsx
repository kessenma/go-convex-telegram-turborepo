"use client";

import { motion } from "framer-motion";
import type React from "react";
import { LoadingCube } from "./loading-cube";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
    errorMode?: boolean;
    use3D?: boolean;
}

export function LoadingSpinner({
    size = "md",
    className = "",
    text,
    errorMode = false,
    use3D = true
}: LoadingSpinnerProps): React.ReactElement {
    const textSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base"
    };

    // Fallback 2D spinner for cases where 3D might not work
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    return (
        <div className={`flex flex-col items-center gap-2 ${className}`}>
            {use3D ? (
                <LoadingCube size={size} errorMode={errorMode} />
            ) : (
                <motion.div
                    className={`${sizeClasses[size]} border-2 border-cyan-500/30 border-t-cyan-500 rounded-full`}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            )}
            {text && (
                <motion.p
                    className={`${textSizeClasses[size]} text-cyan-400/80 font-medium`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
}

export function PageLoadingOverlay({
    isVisible,
    message = "Loading page...",
    errorMode = false
}: {
    isVisible: boolean;
    message?: string;
    errorMode?: boolean;
}): React.ReactElement {
    if (!isVisible) return <></>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-slate-900/90 border border-slate-700/50 shadow-2xl backdrop-blur-md"
            >
                {/* 3D Cube Loader */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
                >
                    <LoadingCube size="lg" errorMode={errorMode} />
                </motion.div>

                {/* Loading Message */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <motion.p
                        className={`text-lg font-medium mb-2 ${errorMode ? "text-red-400/90" : "text-cyan-400/90"
                            }`}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {message}
                    </motion.p>

                    {/* Animated dots */}
                    <motion.div className="flex justify-center gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${errorMode ? "bg-red-500/60" : "bg-cyan-500/60"
                                    }`}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}