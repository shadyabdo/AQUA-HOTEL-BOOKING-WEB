import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Zap, Heart, Headset, Star, ArrowLeft } from "lucide-react";

export default function Hero() {
  const features = [
    { 
      icon: <Zap className="text-amber-500" />, 
      title: "تأكيد فوري", 
      desc: "احجز غرفتك في ثوانٍ معدودة",
      delay: 0.1,
      pos: "top-0 left-10"
    },
    { 
      icon: <ShieldCheck className="text-emerald-500" />, 
      title: "أمان تام", 
      desc: "بياناتك ومدفوعاتك في أيدٍ أمينة",
      delay: 0.3,
      pos: "top-40 left-40"
    },
    { 
      icon: <Star className="text-[#2d2040]" />, 
      title: "أفضل العروض", 
      desc: "خصومات حصرية للأعضاء فقط",
      delay: 0.5,
      pos: "bottom-20 left-0"
    },
    { 
      icon: <Headset className="text-rose-500" />, 
      title: "دعم 24/7", 
      desc: "فريقنا معك في كل خطوة",
      delay: 0.7,
      pos: "bottom-0 left-32"
    }
  ];

  return (
    <section className="relative pt-24 pb-48 overflow-hidden bg-white">
      {/* Abstract Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#f8faff] rounded-bl-[240px] z-0" />
      <div className="absolute top-20 right-40 w-64 h-64 bg-[#4F46E5]/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#4F46E5]/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Right Side: Content (Text) */}
          <div className="lg:col-span-6 text-right space-y-10 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-[#d6d6e7] shadow-sm"
            >
              <span className="w-2 h-2 bg-[#4F46E5] rounded-full animate-bounce" />
              <span className="text-xs font-black text-[#4F46E5] uppercase tracking-widest">أفضل تجربة حجز في 2026</span>
            </motion.div>
            
            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl lg:text-7xl font-black text-[#151e63] leading-[1.2] tracking-tighter"
              >
                استكشف <br />
                <span className="text-[#4F46E5] relative">
                  وجهتك القادمة
                  <svg className="absolute -bottom-4 right-0 w-full h-4 text-[#4F46E5]/10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </span> <br />
                بلمسة عصرية
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base md:text-lg text-[#777aaf] font-medium max-w-2xl mr-0 ml-auto leading-[1.8]"
              >
                اكتشف مجموعة مختارة من أفخم الفنادق والمنتجعات حول مصر. حجز سهل، أمان تام، وعروض حصرية لأعضاء أكوا بوك.
              </motion.p>
            </div>

            {/* Social Proof Section Removed as requested */}
          </div>

          {/* Left Side: Visual Features (Icons) */}
          <div className="hidden lg:block lg:col-span-6 relative h-[500px] lg:order-2">
            <AnimatePresence>
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    delay: f.delay,
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                  className={`absolute ${f.pos} bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[#d6d6e7]/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-64 group hover:shadow-[#e3dff0] hover:border-[#d0cae5] transition-all cursor-default`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="font-black text-[#151e63] mb-1">{f.title}</h3>
                  <p className="text-xs text-[#777aaf] font-medium leading-relaxed text-right">{f.desc}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Central Decorative Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-dashed border-[#d6d6e7] rounded-full animate-[spin_20s_linear_infinite] opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#4F46E5] rounded-full shadow-[0_0_20px_#4F46E5]" />
          </div>

        </div>
      </div>
    </section>
  );
}
