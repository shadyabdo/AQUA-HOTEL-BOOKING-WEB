import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Maximize2 } from "lucide-react";

interface LightboxProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function Lightbox({ images, isOpen, onClose, initialIndex = 0 }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handlePrev();
      if (e.key === "ArrowLeft") handleNext();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, currentIndex]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 text-white/70 hover:text-white transition-colors z-[110]"
        >
          <X size={40} />
        </button>

        {/* Counter */}
        <div className="absolute top-10 left-10 text-white/50 font-black text-xl z-[110]">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Navigation Buttons */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-[110]">
          <button 
            onClick={handlePrev}
            className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10"
          >
            <ChevronRight size={32} />
          </button>
          <button 
            onClick={handleNext}
            className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10"
          >
            <ChevronLeft size={32} />
          </button>
        </div>

        {/* Main Image */}
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              alt={`Gallery image ${currentIndex + 1}`}
            />
          </AnimatePresence>
        </div>

        {/* Thumbnails Bar */}
        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-3 overflow-x-auto px-10 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                currentIndex === idx ? "border-[#4F46E5] scale-110 opacity-100" : "border-transparent opacity-40 hover:opacity-100"
              )}
            >
              <img src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Utility for classes (since I'm using it in the component)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
