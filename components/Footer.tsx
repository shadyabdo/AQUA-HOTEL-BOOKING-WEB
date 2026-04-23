import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#050814] text-white pt-16 md:pt-32 pb-12 border-t border-white/5 relative overflow-x-hidden w-full" dir="rtl">
      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#4F46E5]/5 to-transparent pointer-events-none" />

      <div className="container-custom relative z-10 text-right">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <img src="/logo.png" alt="Aqua Logo" className="h-16 md:h-20 w-auto object-contain" />
            </div>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-sm mx-auto md:mx-0">
              وجهتك المثالية لحجز أرقى الفنادق والمنتجعات في مصر. نحن نضمن لك أفضل الأسعار وتجربة حجز سلسة وآمنة.
            </p>

          </div>

          <div>
            <h4 className="text-[#4F46E5] font-black uppercase tracking-widest text-xs mb-8">روابط سريعة</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link to="/" className="hover:text-white transition-colors">الرئيسية</Link></li>
              <li><Link to="/offers" className="hover:text-white transition-colors">الكوبونات</Link></li>
              <li><Link to="/articles" className="hover:text-white transition-colors">المدونة السياحية</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#4F46E5] font-black uppercase tracking-widest text-xs mb-8">الدعم والمساندة</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link to="/faq" className="hover:text-white transition-colors">مركز المساعدة</Link></li>
              <li><Link to="/cancellation" className="hover:text-white transition-colors">سياسة الإلغاء</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">الأمان والخصوصية</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">الأسئلة الشائعة</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#4F46E5] font-black uppercase tracking-widest text-xs mb-8">اكتشف المزيد</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link to="/rooms" className="hover:text-white transition-colors">تصفح الفنادق</Link></li>
              <li><Link to="/rooms" className="hover:text-white transition-colors">أفضل العروض</Link></li>
              <li><Link to="/articles" className="hover:text-white transition-colors">نصائح السفر</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">شركاء النجاح</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-normal md:tracking-[0.2em] text-muted-foreground/50">
          <p>© 2026 AQUABOOK™. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4 md:gap-8">
            <Link to="/privacy" className="hover:text-white">الخصوصية</Link>
            <Link to="/cancellation" className="hover:text-white">الشروط</Link>
            <Link to="/privacy" className="hover:text-white">الكوكيز</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
