import { motion } from "motion/react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, Info, ShieldCheck } from "lucide-react";

const faqs = [
  {
    question: "كيف يمكنني حجز غرفة؟",
    answer: "يمكنك الحجز بسهولة من خلال اختيار الفندق والغرفة المناسبة، ثم الضغط على زر 'احجز الآن' واتباع خطوات الدفع البسيطة."
  },
  {
    question: "ما هي سياسة الإلغاء؟",
    answer: "تختلف سياسة الإلغاء حسب الفندق ونوع الغرفة. يمكنك العثور على التفاصيل المحددة في صفحة تفاصيل الغرفة قبل إتمام الحجز."
  },
  {
    question: "هل يمكنني تغيير تواريخ حجزي؟",
    answer: "نعم، يمكنك طلب تغيير التواريخ من خلال التواصل مع خدمة العملاء، وذلك حسب توفر الغرف وسياسة الفندق."
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "نقبل الدفع عبر بطاقات الائتمان (Visa, Mastercard) ومدى، بالإضافة إلى خيارات الدفع الإلكتروني الأخرى."
  },
  {
    question: "كيف أحصل على تأكيد الحجز؟",
    answer: "بمجرد إتمام عملية الدفع، ستتلقى رسالة تأكيد فورية عبر البريد الإلكتروني، كما يمكنك عرض جميع حجوزاتك في صفحة 'حجوزاتي'."
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] py-24" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <span className="px-5 py-2 bg-[#f0eef5] text-[#4F46E5] text-xs font-black uppercase tracking-widest rounded-full mb-6 inline-block">
            مركز المساعدة
          </span>
          <h1 className="text-6xl font-black text-[#151e63] tracking-tighter mb-8 leading-tight">
            كيف يمكننا <br/> <span className="text-[#4F46E5]">مساعدتك اليوم؟</span>
          </h1>
          <p className="text-xl text-[#777aaf] font-medium max-w-2xl mx-auto leading-relaxed">
            استكشف الإجابات على الأسئلة الأكثر شيوعاً حول خدماتنا، الحجوزات، وسياسات الموقع.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Accordion className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className="group border border-[#d6d6e7]/50 bg-white rounded-[2rem] px-8 transition-all hover:shadow-xl hover:shadow-[#4F46E5]/5 hover:border-[#4F46E5]/30 overflow-hidden relative"
              >
                {/* Active Indicator Bar */}
                <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-[#4F46E5] opacity-0 group-data-[state=open]:opacity-100 transition-opacity" />
                
                <AccordionTrigger className="text-right text-xl font-black py-10 hover:text-[#4F46E5] transition-colors no-underline flex flex-row-reverse justify-between items-center w-full">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#f0eef5]/50 flex items-center justify-center text-lg text-[#4F46E5] font-black group-hover:bg-[#4F46E5] group-hover:text-white transition-all shadow-sm">
                      {index + 1}
                    </div>
                    <span className="text-right leading-snug">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="text-right text-[#777aaf] text-lg font-medium leading-relaxed pb-10 pr-20 pl-4 border-t border-gray-50 pt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {faq.answer}
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Premium CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-32 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#818CF8] rounded-[4rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-[#151e63] rounded-[4rem] p-12 md:p-20 overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#4F46E5]/20 rounded-full blur-[100px]" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="text-center md:text-right">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">ما زلت بحاجة للمساعدة؟</h2>
                <p className="text-[#b6b7d5] text-xl font-medium max-w-xl">
                  فريق الخبراء لدينا متاح على مدار الساعة للإجابة على جميع استفساراتك وضمان راحتك.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 shrink-0">
                <button className="px-10 py-5 bg-[#4F46E5] hover:bg-[#0f0b18] text-white rounded-[1.5rem] text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                  تحدث معنا الآن
                </button>
                <button className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md rounded-[1.5rem] text-xl font-black transition-all hover:scale-105">
                   البريد الإلكتروني
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
