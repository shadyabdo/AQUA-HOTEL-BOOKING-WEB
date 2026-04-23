import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  MessageSquare, 
  Info, 
  ShieldCheck, 
  Search, 
  Phone, 
  Mail, 
  Globe, 
  CreditCard, 
  User, 
  Calendar,
  ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "الكل", icon: <Globe size={18} /> },
  { id: "booking", name: "الحجوزات", icon: <Calendar size={18} /> },
  { id: "payment", name: "المدفوعات", icon: <CreditCard size={18} /> },
  { id: "account", name: "الحساب", icon: <User size={18} /> },
  { id: "policies", name: "السياسات", icon: <ShieldCheck size={18} /> },
];

const faqs = [
  {
    id: 1,
    category: "booking",
    question: "كيف يمكنني حجز غرفة؟",
    answer: "يمكنك الحجز بسهولة من خلال اختيار الفندق والغرفة المناسبة، ثم الضغط على زر 'احجز الآن' واتباع خطوات الدفع البسيطة."
  },
  {
    id: 2,
    category: "policies",
    question: "ما هي سياسة الإلغاء؟",
    answer: "تختلف سياسة الإلغاء حسب الفندق ونوع الغرفة. يمكنك العثور على التفاصيل المحددة في صفحة تفاصيل الغرفة قبل إتمام الحجز."
  },
  {
    id: 3,
    category: "booking",
    question: "هل يمكنني تغيير تواريخ حجزي؟",
    answer: "نعم، يمكنك طلب تغيير التواريخ من خلال التواصل مع خدمة العملاء، وذلك حسب توفر الغرف وسياسة الفندق."
  },
  {
    id: 4,
    category: "payment",
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "نقبل الدفع عبر بطاقات الائتمان (Visa, Mastercard) وعبر Stripe، بالإضافة إلى إمكانية الشحن والدفع من خلال محفظة AQUA الخاصة بك."
  },
  {
    id: 5,
    category: "booking",
    question: "كيف أحصل على تأكيد الحجز؟",
    answer: "بمجرد إتمام عملية الدفع، ستتلقى رسالة تأكيد فورية عبر البريد الإلكتروني، كما يمكنك عرض جميع حجوزاتك في صفحة 'حسابي'."
  },
  {
    id: 6,
    category: "account",
    question: "كيف يمكنني استعادة كلمة المرور؟",
    answer: "يمكنك إعادة تعيين كلمة المرور من خلال صفحة تسجيل الدخول بالضغط على 'نسيت كلمة المرور' واتباع التعليمات المرسلة لبريدك."
  },
  {
    id: 7,
    category: "payment",
    question: "هل محفظة AQUA آمنة؟",
    answer: "نعم، نستخدم أعلى معايير التشفير والأمان لحماية بياناتك المالية ورصيد محفظتك، وتتم جميع المعاملات تحت رقابة تقنية صارمة."
  }
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32" dir="rtl">
      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-[#151e63] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-[0.2em] mb-8">
              <HelpCircle size={16} className="text-primary-foreground" /> مركز الدعم والمساعدة
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter leading-tight">
              كيف يمكننا <span className="text-primary-foreground">مساعدتك؟</span>
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-white/40">
                <Search size={24} />
              </div>
              <Input 
                type="text"
                placeholder="ابحث عن سؤالك هنا..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 md:h-20 bg-white/10 backdrop-blur-xl border-white/20 rounded-[2rem] pr-16 pl-8 text-xl text-white placeholder:text-white/40 focus:ring-4 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Tabs */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-[#d6d6e7]/30 sticky top-32">
              <h3 className="text-sm font-black text-[#151e63] px-4 mb-4 uppercase tracking-widest opacity-50">الأقسام</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all group",
                      activeCategory === cat.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/30" 
                        : "text-[#777aaf] hover:bg-gray-50 hover:text-[#151e63]"
                    )}
                  >
                    <span className={cn(
                      "transition-transform group-hover:scale-110",
                      activeCategory === cat.id ? "text-white" : "text-primary"
                    )}>
                      {cat.icon}
                    </span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* FAQ Accordion */}
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              {filteredFaqs.length > 0 ? (
                <motion.div
                  key={activeCategory + searchQuery}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {filteredFaqs.map((faq, index) => (
                      <AccordionItem 
                        key={faq.id} 
                        value={`item-${faq.id}`} 
                        className="border-none bg-white rounded-[2.5rem] shadow-sm border border-[#d6d6e7]/30 overflow-hidden group"
                      >
                        <AccordionTrigger className="px-8 py-8 md:py-10 hover:no-underline text-right group-data-[state=open]:bg-primary/5 transition-all">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all shadow-sm">
                              <HelpCircle size={24} />
                            </div>
                            <span className="text-lg md:text-2xl font-black text-[#151e63] group-hover:text-primary transition-colors">
                              {faq.question}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-10 md:px-24">
                          <div className="pt-6 border-t border-gray-100 text-lg text-[#5a5e9a] font-medium leading-relaxed">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-[#d6d6e7]/50"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#d6d6e7]">
                    <Search size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-[#151e63] mb-2">لم نجد نتائج مطابقة</h3>
                  <p className="text-[#777aaf] font-bold">جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Contact Support Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <MessageSquare size={32} />, title: "الدردشة المباشرة", desc: "تحدث مع فريقنا الآن للحصول على مساعدة فورية.", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: <Phone size={32} />, title: "اتصل بنا", desc: "متواجدون على مدار الساعة للرد على مكالماتكم.", color: "text-green-500", bg: "bg-green-50" },
            { icon: <Mail size={32} />, title: "البريد الإلكتروني", desc: "أرسل استفسارك وسنقوم بالرد خلال 24 ساعة.", color: "text-purple-500", bg: "bg-purple-50" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[3rem] border border-[#d6d6e7]/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group text-center"
            >
              <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110", item.bg, item.color)}>
                {item.icon}
              </div>
              <h4 className="text-2xl font-black text-[#151e63] mb-4">{item.title}</h4>
              <p className="text-[#777aaf] font-bold leading-relaxed mb-8">{item.desc}</p>
              <button className="flex items-center gap-2 mx-auto text-primary font-black group-hover:gap-4 transition-all">
                تواصل الآن <ChevronLeft size={20} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
