import { motion } from "motion/react";
import { Shield, Lock, Eye, FileText, Bell } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      icon: <Eye className="text-[#4F46E5]" />,
      title: "جمع المعلومات",
      content: "نحن نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب أو إجراء حجز، بما في ذلك الاسم والبريد الإلكتروني وتفاصيل الدفع."
    },
    {
      icon: <Lock className="text-pink-500" />,
      title: "أمن البيانات",
      content: "نحن نستخدم أحدث تقنيات التشفير والبروتوكولات الأمنية لحماية معلوماتك الشخصية ومنع الوصول غير المصرح به."
    },
    {
      icon: <Shield className="text-emerald-500" />,
      title: "مشاركة المعلومات",
      content: "نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. نشارك فقط البيانات اللازمة مع الفنادق لإتمام حجزك."
    },
    {
      icon: <FileText className="text-amber-500" />,
      title: "ملفات تعريف الارتباط",
      content: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا وتحليل حركة المرور وتخصيص المحتوى."
    },
    {
      icon: <Bell className="text-[#2d2040]" />,
      title: "التحديثات",
      content: "قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني."
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
          <h1 className="text-5xl font-black text-[#151e63] tracking-tighter mb-6">سياسة الخصوصية</h1>
          <p className="text-xl text-[#777aaf] font-medium max-w-2xl mx-auto leading-relaxed">
            نحن نلتزم بحماية خصوصيتك وضمان أمن معلوماتك الشخصية بأعلى المعايير العالمية.
          </p>
        </motion.div>

        <div className="space-y-8" dir="rtl">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-10 rounded-[2.5rem] border border-[#d6d6e7]/50 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#151e63] mb-4">{section.title}</h3>
                  <p className="text-lg text-[#777aaf] font-medium leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 p-12 bg-[#151e63] rounded-[3rem] text-center text-white relative overflow-hidden"
          dir="rtl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F46E5]/20 blur-[100px]" />
          <h2 className="text-3xl font-black mb-6 relative z-10">هل لديك استفسار حول خصوصيتك؟</h2>
          <p className="text-[#b6b7d5] text-lg font-medium mb-10 relative z-10">فريقنا القانوني والتقني متاح دائماً للإجابة على أسئلتك.</p>
          <button className="relative z-10 px-10 py-5 bg-[#4F46E5] hover:bg-[#0f0b18] text-white rounded-2xl text-xl font-black shadow-2xl transition-all">
            تواصل مع فريق الخصوصية
          </button>
        </motion.div>
      </div>
    </div>
  );
}
