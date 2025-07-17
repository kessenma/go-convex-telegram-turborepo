"use client"

import React, { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { renderIcon } from "../../lib/icon-utils"

interface HoverExpandProps {
  images: string[]
  captions?: string[]
  initialSelectedIndex?: number
  thumbnailHeight?: number
  maxThumbnails?: number
  modalImageSize?: number
}

export function HoverExpand({
  images,
  captions = [],
  initialSelectedIndex = 0,
  thumbnailHeight = 200,
  maxThumbnails = 11,
}: HoverExpandProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }[]>([])
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  useEffect(() => {
    images.forEach((url, index) => {
      const img = new Image()
      img.src = url
      img.onload = () => {
        setImageDimensions(prev => {
          const newDimensions = [...prev]
          newDimensions[index] = { width: img.naturalWidth, height: img.naturalHeight }
          return newDimensions
        })
      }
    })
  }, [images])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false)
      } else if (isModalOpen) {
        if (event.key === "ArrowLeft") {
          handlePrevious()
        } else if (event.key === "ArrowRight") {
          handleNext()
        }
      }
    }

    if (isModalOpen) {
      document.body.classList.add("overflow-hidden")
      document.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.classList.remove("overflow-hidden")
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("overflow-hidden")
    }
  }, [isModalOpen])

  const getModalDimensions = () => {
    const dimensions = imageDimensions[selectedIndex]
    if (!dimensions) return { width: viewportSize.width * 0.9, height: viewportSize.height * 0.9 }

    const maxWidth = viewportSize.width * 0.9
    const maxHeight = viewportSize.height * 0.9
    const aspectRatio = dimensions.width / dimensions.height

    if (maxWidth / maxHeight > aspectRatio) {
      // Height limited
      return {
        width: maxHeight * aspectRatio,
        height: maxHeight
      }
    } else {
      // Width limited
      return {
        width: maxWidth,
        height: maxWidth / aspectRatio
      }
    }
  }

  const modalSize = getModalDimensions()

  return (
    <div className="relative">
      <div className="flex gap-1 pt-10 pb-20 mx-auto rounded-md w-fit md:gap-2">
        {images.slice(0, maxThumbnails).map((imageUrl, i) => (
          <div
            key={`image-container-${i}`}
            className={`group relative h-52 overflow-hidden rounded-2xl transition-all duration-300 ${
              selectedIndex === i ? "w-64" : "w-4 sm:w-5 md:w-8 xl:w-12"
            }`}
            onMouseEnter={() => setSelectedIndex(i)}
            onMouseLeave={() => setSelectedIndex(i)}
            onClick={() => {
              setSelectedIndex(i)
              setIsModalOpen(true)
            }}
          >
            <motion.div
              layoutId={`image-${i}`}
              className="absolute inset-0 size-full"
            >
              <img
                src={imageUrl}
                alt={`Image ${i + 1}`}
                className="object-cover transition-transform duration-300 size-full"
              />
            </motion.div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-white/40 dark:bg-black/40"
            onClick={() => setIsModalOpen(false)}
          >
            <div className="flex relative justify-center items-center px-20 w-full h-full">
              <div
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="overflow-hidden bg-black rounded-2xl"
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    layoutId={`image-${selectedIndex}`}
                    className="relative"
                    style={{
                      width: `${modalSize.width}px`,
                      height: `${modalSize.height}px`
                    }}
                  >
                    <img
                      src={images[selectedIndex]}
                      alt={`Image ${selectedIndex + 1}`}
                      className="object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-full"
                    />
                  </motion.div>
                  {captions[selectedIndex] && (
                    <div className="p-4 text-center text-white">
                      {captions[selectedIndex]}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevious()
                }}
                className="absolute left-4 p-2 rounded-full transition-colors bg-black/50 hover:bg-black/70"
              >
                {renderIcon(ChevronLeft, { className: "w-8 h-8 text-white" })}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-4 p-2 rounded-full transition-colors bg-black/50 hover:bg-black/70"
              >
                {renderIcon(ChevronRight, { className: "w-8 h-8 text-white" })}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
