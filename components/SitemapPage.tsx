import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  Compass, 
  Ticket, 
  Newspaper, 
  MessageCircle, 
  User, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle,
  ChevronLeft,
  Globe,
  Map,
  Zap,
  Star,
  Search,
  Wallet,
  History
} from "lucide-react";
import { motion } from "motion/react";
import { db } from "@/src/lib/firebase";
import { collectionGroup, onSnapshot } from "firebase/firestore";

const sitemapData = [
  {
    title: "الصفحات الرئيسية",
    icon: <Globe className="text-blue-500" />,
    description: "الوصول السريع إلى الأقسام الأساسية في المنصة",
    links: [
      { name: "الرئيسية", path: "/", icon: <Home size={18} />, desc: "نقطة الانطلاق لاكتشاف أفضل العروض والفنادق" },
      { name: "اكتشف الفنادق", path: "/rooms", icon: <Compass size={18} />, desc: "محرك بحث متقدم للفنادق والغرف المتاحة" },
      { name: "العروض والكوبونات", path: "/offers", icon: <Ticket size={18} />, desc: "خصومات حصرية وعروض توفير لا تنتهي" },
      { name: "المدونة السياحية", path: "/articles", icon: <Newspaper size={18} />, desc: "نصائح سفر ومقالات حول أجمل الوجهات" },
    ]
  },
  {
    title: "إدارة الحساب",
    icon: <User className="text-purple-500" />,
    description: "إدارة بياناتك الشخصية وحجوزاتك بكل سهولة",
    links: [
      { name: "الملف الشخصي", path: "/profile", icon: <User size={18} />, desc: "تحديث بياناتك الشخصية وصورتك" },
      { name: "محفظتي", path: "/profile", icon: <Wallet size={18} />, desc: "رصيد المحفظة والعمليات المالية" },
      { name: "حجوزاتي", path: "/profile", icon: <History size={18} />, desc: "سجل الحجوزات الحالية والسابقة" },
      { name: "المفضلة", path: "/profile", icon: <Star size={18} />, desc: "الفنادق التي قمت بحفظها للرجوع إليها" },
    ]
  },
  {
    title: "الدعم والمساعدة",
    icon: <HelpCircle className="text-green-500" />,
    description: "نحن هنا لمساعدتك في أي وقت",
    links: [
      { name: "تواصل معنا", path: "/contact", icon: <MessageCircle size={18} />, desc: "فريق الدعم جاهز للرد على استفساراتكم" },
      { name: "الأسئلة الشائعة", path: "/faq", icon: <HelpCircle size={18} />, desc: "إجابات سريعة على التساؤلات الأكثر تكراراً" },
      { name: "سياسة الخصوصية", path: "/privacy", icon: <ShieldCheck size={18} />, desc: "كيف نحافظ على خصوصية وأمان بياناتك" },
      { name: "سياسة الإلغاء", path: "/cancellation", icon: <AlertCircle size={18} />, desc: "شروط إلغاء الحجز واسترداد المبالغ" },
    ]
  }
];

export default function SitemapPage() {
  const [hotelCount, setHotelCount] = useState(0);

  useEffect(() => {
    // Listen to all hotels in real-time
    const hotelsQuery = collectionGroup(db, 'hotels');
    const unsubscribe = onSnapshot(hotelsQuery, (snapshot) => {
      setHotelCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching hotel count:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32" dir="rtl">
      {/* Header Section */}
      <div className="bg-white border-b border-[#d6d6e7]/50 pt-20 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 text-primary font-black mb-4">
              <Map size={24} />
              <span className="uppercase tracking-[0.2em] text-sm">AQUA BOOKING GUIDE</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#151e63] mb-6 tracking-tighter leading-tight">
              خريطة الموقع والشرح التفصيلي
            </h1>
            <p className="text-lg md:text-xl text-[#777aaf] font-bold leading-relaxed">
              تعرف على هيكلية منصة أكوا بوكينج وكيفية التنقل بين أقسامها المختلفة للاستفادة القصوى من خدماتنا السياحية.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sitemapData.map((section, sectionIdx) => (
            <motion.div 
              key={sectionIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.1 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-[#d6d6e7]/30">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#151e63] tracking-tight">{section.title}</h2>
                  <p className="text-xs text-[#777aaf] font-bold">{section.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {section.links.map((link, linkIdx) => (
                  <Link 
                    key={linkIdx} 
                    to={link.path}
                    className="block group"
                  >
                    <div className="bg-white p-6 rounded-3xl border border-[#d6d6e7]/50 shadow-sm group-hover:shadow-xl group-hover:border-primary/20 group-hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {link.icon}
                          </div>
                          <span className="font-black text-[#151e63] group-hover:text-primary transition-colors">{link.name}</span>
                        </div>
                        <ChevronLeft size={16} className="text-[#777aaf] group-hover:translate-x-[-4px] transition-transform" />
                      </div>
                      <p className="text-sm text-[#777aaf] font-medium leading-relaxed">
                        {link.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Explanation Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 bg-[#151e63] rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-indigo-200"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 border-4 border-white rounded-full" />
            <div className="absolute bottom-10 left-10 w-96 h-96 border-8 border-white rounded-full" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest">
                <Zap size={14} className="text-yellow-400" /> رؤية المنصة
              </div>
              <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
                تجربة حجز فنادق عصرية <br /> <span className="text-primary-foreground/70">تليق بك.</span>
              </h2>
              <div className="space-y-6 text-lg text-indigo-100 font-medium leading-relaxed">
                <p>
                  منصة أكوا بوكينج ليست مجرد موقع للحجز، بل هي رفيقك في رحلة البحث عن الراحة والرفاهية. قمنا بتصميم الواجهة لتوفر لك سلاسة فائقة في اختيار الفندق المناسب بميزانية تناسب احتياجاتك.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <div className="text-2xl font-black text-white">+{hotelCount}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">فندق موثق</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-black text-white">100%</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">أمان وحماية</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-8">
              <h3 className="text-2xl font-black border-b border-white/10 pb-6">كيف تبدأ؟</h3>
              <div className="space-y-8">
                {[
                  { step: "01", title: "البحث الذكي", text: "استخدم محرك البحث في الصفحة الرئيسية لتحديد وجهتك وتاريخ رحلتك." },
                  { step: "02", title: "الفلترة المتقدمة", text: "استخدم فلاتر الأسعار والتقييمات والمرافق للوصول لنتائج دقيقة." },
                  { step: "03", title: "الحجز الفوري", text: "اختر الغرفة المفضلة وأتمم الحجز في أقل من دقيقة عبر محفظتك الإلكترونية." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="text-4xl font-black text-white/20 group-hover:text-primary transition-colors">{item.step}</div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black">{item.title}</h4>
                      <p className="text-sm text-indigo-200 font-medium">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
