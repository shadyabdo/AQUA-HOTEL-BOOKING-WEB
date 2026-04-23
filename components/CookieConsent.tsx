import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, X, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[100]"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-[#d6d6e7]/50 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4F46E5]">
                  <Cookie size={32} />
                </div>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-[#151e63] tracking-tighter">نحن نستخدم ملفات تعريف الارتباط</h3>
                <p className="text-[#777aaf] font-bold text-sm leading-relaxed">
                  نحن نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك في الموقع وتخصيص المحتوى المناسب لك. بمتابعتك للتصفح، أنت توافق على سياستنا.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Button 
                  onClick={handleAccept}
                  className="bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-2xl h-14 px-8 font-black flex-1 shadow-lg shadow-indigo-100 transition-all gap-2"
                >
                  <Check size={18} /> موافق
                </Button>
                <Button 
                  onClick={handleDecline}
                  variant="ghost"
                  className="text-gray-500 font-bold hover:bg-gray-100 rounded-2xl h-14 px-8 flex-1"
                >
                  تجاهل
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest pt-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>بياناتك محمية ومشفرة بالكامل</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
