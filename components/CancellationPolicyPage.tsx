import { motion } from "motion/react";
import { RefreshCcw, CalendarX, Wallet, Clock, CheckCircle2 } from "lucide-react";

export default function CancellationPolicyPage() {
  const policies = [
    {
      icon: <RefreshCcw className="text-[#4F46E5]" />,
      title: "الإلغاء المجاني",
      content: "تتيح معظم حجوزاتنا إمكانية الإلغاء المجاني حتى قبل 48 ساعة من موعد تسجيل الوصول. يرجى مراجعة شروط الغرفة المحددة."
    },
    {
      icon: <CalendarX className="text-red-500" />,
      title: "الإلغاء المتأخر",
      content: "في حال الإلغاء قبل أقل من 48 ساعة من الموعد، قد يتم خصم رسوم الليلة الأولى أو نسبة محددة من إجمالي الحجز."
    },
    {
      icon: <Wallet className="text-emerald-500" />,
      title: "استرداد الأموال",
      content: "يتم استرداد المبالغ تلقائياً إلى محفظتك الرقمية في AQUABOOK أو إلى وسيلة الدفع الأصلية خلال 5-10 أيام عمل."
    },
    {
      icon: <Clock className="text-amber-500" />,
      title: "تعديل الحجز",
      content: "يمكنك تعديل تواريخ الحجز أو نوع الغرفة دون رسوم إضافية قبل 72 ساعة من الموعد، حسب توفر الغرف."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfd] py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
          dir="rtl"
        >
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-black uppercase mb-6">
            <CheckCircle2 size={14} /> سياسات مرنة ومضمونة
          </div>
          <h1 className="text-5xl font-black text-[#151e63] tracking-tighter mb-6">سياسة الإلغاء والاسترداد</h1>
          <p className="text-xl text-[#777aaf] font-medium max-w-2xl mx-auto leading-relaxed">
            نحن نقدر مرونة خطط سفرك، لذلك وفرنا لك سياسات إلغاء واضحة وعادلة تضمن حقوقك وتسهل عليك تغيير قراراتك.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" dir="rtl">
          {policies.map((policy, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-10 rounded-[3rem] border border-[#d6d6e7]/50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-8 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors shadow-sm">
                {policy.icon}
              </div>
              <h3 className="text-2xl font-black text-[#151e63] mb-4">{policy.title}</h3>
              <p className="text-lg text-[#777aaf] font-medium leading-relaxed">
                {policy.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 p-12 bg-gradient-to-br from-[#4F46E5] to-[#0f0b18] rounded-[3rem] text-center text-white"
          dir="rtl"
        >
          <h2 className="text-3xl font-black mb-6">هل تحتاج إلى مساعدة في إلغاء حجزك؟</h2>
          <p className="text-indigo-100 text-lg font-medium mb-10">تواصل مع فريق الدعم الفني لمساعدتك في خطوات الاسترداد فوراً.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-10 py-5 bg-white text-[#4F46E5] rounded-2xl text-xl font-black shadow-xl hover:bg-gray-50 transition-all">
              إلغاء حجز الآن
            </button>
            <button className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl text-xl font-black backdrop-blur-md hover:bg-white/20 transition-all">
              مركز المساعدة
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
