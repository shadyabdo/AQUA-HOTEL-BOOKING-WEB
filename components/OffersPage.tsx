import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Gift, 
  Wallet, 
  ArrowRight,
  Copy,
  CheckCircle2,
  Sparkles,
  Percent,
  Ticket,
  X,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, Toast } from "@/src/lib/swal";
import { cn } from "@/lib/utils";
import { getCouponsListener } from "@/src/lib/firebase";

export default function OffersPage() {
  const navigate = useNavigate();
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [dynamicOffers, setDynamicOffers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = getCouponsListener((coupons) => {
      // Filter only active coupons
      const activeCoupons = coupons.filter(c => c.isActive === true);
      
      // Map Firestore coupons to the UI format
      const mappedOffers = activeCoupons.map((coupon, idx) => {
        // Choose colors/icons based on index for aesthetics
        const styles = [
          { icon: <Wallet size={32} className="text-[#4F46E5]" />, bg: "from-blue-50 to-indigo-50", border: "border-[#e3dff0]", textColor: "text-[#4F46E5]" },
          { icon: <Gift size={32} className="text-pink-500" />, bg: "from-pink-50 to-rose-50", border: "border-pink-100", textColor: "text-pink-600" },
          { icon: <Sparkles size={32} className="text-amber-500" />, bg: "from-amber-50 to-orange-50", border: "border-amber-100", textColor: "text-amber-600" },
          { icon: <Percent size={32} className="text-emerald-500" />, bg: "from-emerald-50 to-teal-50", border: "border-emerald-100", textColor: "text-emerald-600" }
        ];
        const style = styles[idx % styles.length];

        return {
          id: coupon.id,
          title: coupon.title || `خصم ${coupon.discountPercentage || 0}%`,
          description: coupon.description || `استمتع بخصم ${coupon.discountPercentage}% عند الحجز واستخدام الكود الموضح.`,
          code: coupon.code,
          ...style
        };
      });
      setDynamicOffers(mappedOffers);
    });
    return () => unsub();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    Toast.fire({
      icon: 'success',
      title: `تم نسخ الكوبون: ${code}`
    });
    setTimeout(() => setCopiedCoupon(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32">
      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden bg-[#151e63] pt-24 pb-32 border-b-8 border-[#4F46E5]">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#4F46E5]/40 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#818CF8]/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

        <div className="container-custom relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-3xl lg:w-1/2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
                 <span className="px-4 py-2 bg-[#4F46E5] text-white font-black uppercase tracking-widest text-xs rounded-full">حصرياً في AQUA</span>
                 <span className="text-white/60 font-bold text-sm">كوبونات متجددة</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-6 leading-[1.1] md:leading-tight">
                كوبونات حصرية، <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] to-[#C7D2FE]">توفر لك الكثير.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base md:text-xl lg:text-2xl text-[#b6b7d5] font-medium leading-relaxed mb-10 max-w-2xl">
                استكشف مجموعة مختارة من أفضل كوبونات الخصم المتاحة لعملاء أكوا. وفر في رحلتك القادمة مع عروضنا المتجددة باستمرار والمصممة لتناسب احتياجاتك.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
                <Button onClick={() => {
                  document.getElementById('coupons-grid')?.scrollIntoView({ behavior: 'smooth' });
                }} className="bg-[#4F46E5] hover:bg-[#0f0b18] text-white h-14 md:h-16 px-10 rounded-2xl text-lg md:text-xl font-black shadow-2xl shadow-[#4F46E5]/30">
                   عرض الكوبونات
                </Button>
                <Button 
                  onClick={() => setShowHowToUse(true)}
                  variant="outline" 
                  className="h-14 md:h-16 px-10 rounded-2xl text-lg md:text-xl font-black text-white border-white/20 hover:bg-white/10 backdrop-blur-md"
                >
                   كيفية الاستخدام
                </Button>
              </motion.div>
            </div>

            {/* Animated Graphic (Left Side in RTL) */}
            <div className="hidden lg:flex w-full lg:w-1/2 justify-center items-center relative h-[400px]">
              <motion.div 
                animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-[20%] top-[10%] bg-gradient-to-tr from-pink-500 to-rose-400 p-8 rounded-3xl shadow-2xl flex items-center justify-center text-white border-4 border-white/20 backdrop-blur-sm z-20"
              >
                <Percent size={64} />
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0], rotate: [0, 10, 0] }} 
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute left-[20%] bottom-[10%] bg-gradient-to-tr from-emerald-400 to-teal-400 p-10 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-white border-4 border-white/20 backdrop-blur-sm z-10"
              >
                <Ticket size={80} />
                <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#151e63] rounded-full shadow-inner" />
                <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#151e63] rounded-full shadow-inner" />
              </motion.div>
              
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 p-6 rounded-full backdrop-blur-md border border-white/20 shadow-2xl text-amber-400 z-30"
              >
                <Sparkles size={48} />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Offers & Coupons Section */}
      <section id="coupons-grid" className="py-24 -mt-16 relative z-20">
        <div className="container-custom">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-white shadow-xl rounded-2xl flex items-center justify-center text-[#4F46E5]">
               <Ticket size={32} />
            </div>
            <div>
               <h2 className="text-2xl md:text-4xl font-black text-[#151e63] tracking-tighter">كوبونات الخصم الفعالة</h2>
               <p className="text-[#777aaf] font-bold">انسخ الكود واستخدمه عند إتمام الحجز.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-6 md:gap-8">
            {dynamicOffers.length === 0 && (
              <div className="col-span-3 text-center py-12 text-[#777aaf] font-bold">لا توجد كوبونات متاحة حالياً.</div>
            )}
            {dynamicOffers.map((offer, idx) => (
              <motion.div 
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn("relative bg-gradient-to-br rounded-[2.5rem] p-8 border shadow-lg hover:shadow-2xl transition-all group overflow-hidden", offer.bg, offer.border)}
              >
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <div className={cn("w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-sm", offer.textColor)}>
                       {offer.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="badge-indigo bg-white/80 backdrop-blur-sm text-[#151e63] shadow-sm text-[10px]">عرض نشط</span>
                      <span className="text-[8px] font-black text-[#777aaf] uppercase tracking-tighter opacity-40">AQUA EXCLUSIVE</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-black text-[#151e63] mb-3 leading-tight group-hover:text-[#4F46E5] transition-colors">{offer.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed mb-8 flex-grow opacity-80">
                    {offer.description}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-2 flex flex-col items-stretch border-2 border-white shadow-inner transition-all overflow-hidden gap-3">
                       {/* Code Field */}
                       <div className="flex-grow px-6 py-4 font-black tracking-[0.2em] text-xl md:text-2xl text-[#151e63] text-center bg-gray-50/50 rounded-2xl">
                          {offer.code}
                       </div>
                       
                       {/* Copy Button */}
                       <button 
                         onClick={() => copyToClipboard(offer.code)}
                         className={cn(
                           "h-14 md:h-16 w-full px-8 rounded-2xl flex items-center justify-center gap-3 font-black transition-all shrink-0 active:scale-95 shadow-lg",
                           copiedCoupon === offer.code 
                             ? "bg-green-500 text-white" 
                             : "bg-[#151e63] text-white hover:bg-[#4F46E5] hover:shadow-indigo-200"
                         )}
                       >
                         {copiedCoupon === offer.code ? (
                           <><CheckCircle2 size={20} /> تم النسخ!</>
                         ) : (
                           <><Copy size={20} /> نسخ الكود</>
                         )}
                       </button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[#777aaf] uppercase tracking-widest opacity-60">
                       <Sparkles size={12} className="text-amber-500" />
                       <span>استخدم الكود عند الدفع للحصول على الخصم</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use Modal */}
      <AnimatePresence>
        {showHowToUse && (
          <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHowToUse(false)}
              className="fixed inset-0 bg-[#151e63]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white/95 backdrop-blur-xl w-full max-w-2xl rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/20 my-8 md:my-0"
              dir="rtl"
            >
              <div className="p-6 md:p-14 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-10 md:mb-12">
                  <div className="space-y-1">
                    <h2 className="text-2xl md:text-4xl font-black text-[#151e63] tracking-tighter">طريقة الاستخدام</h2>
                    <div className="w-12 h-1 bg-[#4F46E5] rounded-full" />
                  </div>
                  <button onClick={() => setShowHowToUse(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#777aaf] hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 shadow-sm">
                    <X size={20} className="md:size-6" />
                  </button>
                </div>

                <div className="space-y-6 md:space-y-8">
                  {[
                    { icon: <Copy className="text-[#4F46E5]" />, title: "انسخ الكود", desc: "اختر الكوبون المناسب لك وقم بنسخه بضغطة واحدة." },
                    { icon: <Search className="text-pink-500" />, title: "اختر غرفتك", desc: "تصفح الفنادق والغرف المتاحة واختر ما يناسبك." },
                    { icon: <Ticket className="text-amber-500" />, title: "طبق الخصم", desc: "في صفحة الحجز، الصق الكود في خانة 'كود الخصم' قبل الدفع." },
                    { icon: <Sparkles className="text-emerald-500" />, title: "استمتع بالتوفير", desc: "سيتم تطبيق الخصم فوراً على السعر الإجمالي لحجزك." },
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col xs:flex-row gap-4 md:gap-6 items-center xs:items-start text-center xs:text-right group">
                      <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl md:rounded-[1.5rem] bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 group-hover:bg-[#4F46E5] group-hover:text-white transition-all duration-500">
                        {React.cloneElement(step.icon as React.ReactElement<any>, { size: 24, className: "group-hover:text-white transition-colors" })}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg md:text-xl font-black text-[#151e63] mb-1">{step.title}</h3>
                        <p className="text-sm md:text-base text-[#777aaf] font-bold leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => setShowHowToUse(false)}
                  className="w-full h-16 mt-12 bg-[#151e63] hover:bg-[#4F46E5] text-white rounded-2xl md:rounded-[1.5rem] text-lg md:text-xl font-black shadow-xl shadow-[#151e63]/20 transition-all"
                >
                  فهمت، شكراً لك
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
