import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface FolderProps {
  color?: string;
  size?: number;
  items?: React.ReactNode[];
  className?: string;
  fileName?: string;
  onPaperClick?: (paperIndex: number) => void;
  onFolderClick?: () => void;
  expandingPaper?: number | null;
  keepOpen?: boolean;
  deleting?: boolean;
  flyingPaper?: boolean;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

const Folder: React.FC<FolderProps> = ({
  color = "#1e293b", // slate-800
  size = 1,
  items = [],
  className = "",
  fileName = "",
  onPaperClick,
  onFolderClick,
  expandingPaper = null,
  keepOpen = false,
  deleting = false,
  flyingPaper = false,
}) => {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) {
    papers.push(null);
  }

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 }))
  );
  const [showFlyingPaper, setShowFlyingPaper] = useState(false);

  const folderBackColor = darkenColor(color, 0.08);
  // Changed paper colors to darker shades to match DocumentViewer
  const paper1 = "#374151"; // gray-700
  const paper2 = "#4B5563"; // gray-600
  const paper3 = "#6B7280"; // gray-500

  const handleClick = () => {
    if (onFolderClick) {
      // Trigger flying paper animation
      setShowFlyingPaper(true);
      
      // Call the folder click handler after a short delay
      setTimeout(() => {
        onFolderClick();
      }, 300);
      
      // Reset flying paper after animation
      setTimeout(() => {
        setShowFlyingPaper(false);
      }, 800);
    } else if (!keepOpen) {
      setOpen((prev) => !prev);
      if (open) {
        setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
      }
    }
  };

  // Keep folder open when expanding or when keepOpen is true
  const isOpen = open || keepOpen;

  const handlePaperClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onPaperClick) {
      onPaperClick(index);
    }
  };

  const handlePaperMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handlePaperMouseLeave = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
  };

  const folderStyle: React.CSSProperties = {
    "--folder-color": color,
    "--folder-back-color": folderBackColor,
    "--paper-1": paper1,
    "--paper-2": paper2,
    "--paper-3": paper3,
  } as React.CSSProperties;

  const scaleStyle = { transform: `scale(${size})` };

  const getOpenTransform = (index: number) => {
    if (index === 0) return "translate(-120%, -70%) rotate(-15deg)";
    if (index === 1) return "translate(10%, -70%) rotate(15deg)";
    if (index === 2) return "translate(-50%, -100%) rotate(5deg)";
    return "";
  };

  // Truncate filename if too long
  const displayFileName = fileName.length > 10 ? fileName.substring(0, 10) + '...' : fileName;

  return (
    <div style={scaleStyle} className={className}>
      <motion.div
        className={`group relative cursor-pointer ${
          !deleting && !isOpen 
            ? "transition-all duration-200 ease-in hover:-translate-y-2" 
            : !deleting
            ? "transition-all duration-200 ease-in"
            : ""
        }`}
        style={{
          ...folderStyle,
          transform: !deleting && isOpen ? "translateY(-8px)" : undefined,
        }}
        animate={{
          rotate: deleting ? [0, 360, 720, 1080] : 0,
          scale: deleting ? [1, 0.8, 0.6, 0.2] : 1,
          opacity: deleting ? [1, 0.8, 0.4, 0] : 1,
        }}
        transition={{
          duration: deleting ? 1.5 : 0,
          ease: deleting ? [0.25, 0.46, 0.45, 0.94] : "easeOut",
          rotate: deleting ? { duration: 1.5, ease: "easeIn" } : undefined,
        }}
        onClick={handleClick}
      >
        <div
          className="relative w-[100px] h-[80px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
          style={{ backgroundColor: folderBackColor }}
        >
          <span
            className="absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0"
            style={{ backgroundColor: folderBackColor }}
          ></span>
          
          {/* Filename text on folder */}
          {fileName && (
            <div 
              className={`absolute z-40 inset-0 flex items-center justify-center text-white text-xs font-medium text-center px-2 transition-all duration-200 ease-in ${
                !isOpen ? "group-hover:-translate-y-12" : ""}`}
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                transform: isOpen ? "translateY(-8px)" : undefined,
                lineHeight: "1.1",
                wordBreak: "break-word"
              }}
            >
              {displayFileName}
            </div>
          )}
          
          {papers.map((item, i) => {
            let sizeClasses = "";
            if (i === 0) sizeClasses = isOpen ? "w-[70%] h-[80%]" : "w-[70%] h-[80%]";
            if (i === 1) sizeClasses = isOpen ? "w-[80%] h-[80%]" : "w-[80%] h-[70%]" ;
            if (i === 2) sizeClasses = isOpen ? "w-[90%] h-[80%]" : "w-[90%] h-[60%]";

            // Special handling for expanding paper
            const isExpanding = expandingPaper === i;
            let transformStyle;
            
            if (isExpanding) {
              // Move expanding paper to center of screen and scale up
              const viewportCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
              const viewportCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
              transformStyle = `translate(${viewportCenterX - 50}px, ${viewportCenterY - 40}px) scale(8) rotate(0deg)`;
            } else if (isOpen) {
              transformStyle = `${getOpenTransform(i)} translate(${paperOffsets[i]?.x ?? 0}px, ${paperOffsets[i]?.y ?? 0}px)`;
            }

            return (
              <div
                key={i}
                onMouseMove={(e) => handlePaperMouseMove(e, i)}
                onMouseLeave={(e) => handlePaperMouseLeave(e, i)}
                onClick={(e) => handlePaperClick(e, i)}
                className={`absolute bottom-[10%] left-1/2 transition-all cursor-pointer ${
                  isExpanding 
                    ? "z-[200] duration-700 ease-out fixed" 
                    : !isOpen
                    ? "z-20 duration-300 ease-in-out transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0"
                    : "z-20 duration-300 ease-in-out hover:scale-110"
                } ${sizeClasses}`}
                style={{
                  ...(!isOpen && !isExpanding ? {} : { transform: transformStyle }),
                  backgroundColor: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                  borderRadius: "10px",
                  opacity: isExpanding ? 0.9 : 1,
                }}
                data-paper-index={i}
              >
                {item}
              </div>
            );
          })}
          <div
            className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !isOpen ? "group-hover:[transform:skew(15deg)_scaleY(0.6)]" : ""
            }`}
            style={{
              backgroundColor: color,
              borderRadius: "5px 10px 10px 10px",
              ...(isOpen && { transform: "skew(15deg) scaleY(0.6)" }),
            }}
          ></div>
          <div
            className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !isOpen ? "group-hover:[transform:skew(-15deg)_scaleY(0.6)]" : ""
            }`}
            style={{
              backgroundColor: color,
              borderRadius: "5px 10px 10px 10px",
              ...(isOpen && { transform: "skew(-15deg) scaleY(0.6)" }),
            }}
          ></div>
        </div>
      </motion.div>
      
      {/* Flying paper animation */}
      <AnimatePresence>
        {showFlyingPaper && (
          <motion.div
            className="absolute z-[300] w-[70px] h-[56px] pointer-events-none"
            style={{
              backgroundColor: paper1,
              borderRadius: "10px",
              left: "50%",
              top: "50%",
              marginLeft: "-35px",
              marginTop: "-28px",
            }}
            initial={{
              scale: 0.8,
              opacity: 0.9,
              x: 0,
              y: 0,
              rotate: 0,
            }}
            animate={{
              scale: [0.8, 1.2, 6],
              opacity: [0.9, 0.7, 0],
              x: [0, 50, 200],
              y: [0, -100, -300],
              rotate: [0, 15, 45],
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <div className="flex flex-col justify-center items-center p-2 h-full text-center">
              <div className="mb-1">
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="w-full text-xs font-medium text-gray-200 truncate">
                {displayFileName}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Folder;
