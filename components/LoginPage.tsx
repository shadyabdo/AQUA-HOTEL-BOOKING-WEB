import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowLeft, 
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  auth, 
  db 
} from "@/src/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { showError, showSuccess } from "@/src/lib/swal";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            updatedAt: serverTimestamp()
          }, { merge: true });
          showSuccess("تم الدخول", `مرحباً ${result.user.displayName}`);
          navigate('/');
        }
      } catch (error: any) {
        console.error("Redirect Error:", error);
        if (error.code !== 'auth/web-storage-unsupported') {
          showError("خطأ في الدخول", "حدث خطأ أثناء معالجة تسجيل الدخول");
        }
      }
    };
    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Only navigate if we're not in the middle of a redirect check
        // or just navigate anyway as a fallback
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setLoading(true);
    try {
      let result;
      if (isMobile) {
        // Redirect mode for mobile - processing happens in useEffect via getRedirectResult
        await signInWithRedirect(auth, provider);
        return; 
      } else {
        result = await signInWithPopup(auth, provider);
      }
      
      if (result?.user) {
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        showSuccess("تم الدخول", `مرحباً ${result.user.displayName}`);
        navigate('/');
      }
    } catch (error: any) {
      console.error("Google login failed:", error);
      showError("فشل تسجيل الدخول", "حدث خطأ أثناء الاتصال بجوجل");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: formData.email,
          displayName: formData.name,
          walletBalance: 0,
          createdAt: serverTimestamp(),
          favorites: []
        }, { merge: true });

        showSuccess("تم إنشاء الحساب", "مرحباً بك في AQUA BOOKING");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        showSuccess("تم الدخول", "مرحباً بعودتك");
      }
      navigate('/');
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "حدث خطأ غير متوقع";
      if (error.code === 'auth/user-not-found') message = "المستخدم غير موجود";
      if (error.code === 'auth/wrong-password') message = "كلمة المرور غير صحيحة";
      if (error.code === 'auth/email-already-in-use') message = "البريد الإلكتروني مستخدم بالفعل";
      if (error.code === 'auth/invalid-email') message = "البريد الإلكتروني غير صالح";
      if (error.code === 'auth/weak-password') message = "كلمة المرور ضعيفة جداً";
      if (error.code === 'auth/invalid-credential') message = "بيانات الاعتماد غير صحيحة";
      showError("خطأ في المصادقة", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Visual Side (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#080c27] items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/20 via-transparent to-[#818CF8]/10" />
         <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop')] opacity-20 bg-cover bg-center" />
         
         <div className="relative z-10 p-12 text-white max-w-xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
               <div className="w-16 h-16 bg-[#4F46E5] rounded-2xl flex items-center justify-center shadow-2xl mb-8">
                  <img src="/logo.png" alt="AQUA" className="h-10 w-auto" />
               </div>
               <h2 className="text-5xl font-black tracking-tighter leading-tight mb-6">
                  احجز فندقك المفضل <br />
                  <span className="text-[#818CF8]">بأفضل الأسعار</span>
               </h2>
               <p className="text-lg text-white/60 font-bold leading-relaxed">
                  انضم إلى آلاف المسافرين الذين يثقون في AQUA للحصول على أفضل تجربة حجز فنادق في مصر.
               </p>
            </motion.div>

            <div className="space-y-6">
               {[
                 { icon: <ShieldCheck className="text-emerald-400" />, text: "دفع آمن وحماية كاملة لبياناتك" },
                 { icon: <Zap className="text-amber-400" />, text: "تأكيد فوري لحجزك في ثوانٍ" },
                 { icon: <Star className="text-[#818CF8]" />, text: "عروض حصرية وخصومات للأعضاء" }
               ].map((item, i) => (
                 <motion.div 
                   key={i} 
                   initial={{ opacity: 0, x: -20 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   transition={{ delay: 0.4 + (i * 0.1) }}
                   className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10"
                 >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                       {item.icon}
                    </div>
                    <span className="font-bold text-white/80">{item.text}</span>
                 </motion.div>
               ))}
            </div>
         </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-[#fcfcfd]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-10">
             <Link to="/" className="bg-[#4F46E5] p-3 rounded-2xl shadow-xl shadow-indigo-100">
                <img src="/logo.png" alt="AQUA" className="h-10 w-auto" />
             </Link>
          </div>

          <div className="mb-10 text-center lg:text-right">
             <h1 className="text-3xl md:text-4xl font-black text-[#151e63] tracking-tighter mb-3">
                {mode === 'login' ? "تسجيل الدخول" : "إنشاء حساب جديد"}
             </h1>
             <p className="text-[#777aaf] font-bold">
                {mode === 'login' ? "مرحباً بعودتك! سجل دخولك للمتابعة" : "انضم إلينا واستمتع بأفضل تجربة حجز فنادق"}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-[#151e63] mr-2">الاسم الكامل</Label>
                <div className="relative">
                  <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    required
                    placeholder="أدخل اسمك بالكامل"
                    className="h-14 pr-12 rounded-2xl bg-white border-gray-100 focus:bg-white transition-all font-bold shadow-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-[#151e63] mr-2">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  required
                  type="email"
                  placeholder="name@example.com"
                  className="h-14 pr-12 rounded-2xl bg-white border-gray-100 focus:bg-white transition-all font-bold shadow-sm text-left"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mr-2">
                <Label className="text-xs font-black uppercase tracking-widest text-[#151e63]">كلمة المرور</Label>
                {mode === 'login' && (
                  <button type="button" className="text-[10px] font-black text-[#4F46E5] hover:underline">نسيت كلمة المرور؟</button>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4F46E5] transition-colors z-10"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <Input 
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-14 pr-12 rounded-2xl bg-white border-gray-100 focus:bg-white transition-all font-bold shadow-sm text-left"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? "تسجيل الدخول" : "إنشاء الحساب"}
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#fcfcfd] px-4 text-[#777aaf] font-bold">أو المتابعة عبر</span></div>
          </div>

          <Button 
            onClick={handleGoogleLogin}
            variant="outline" 
            className="w-full h-14 rounded-2xl border-gray-200 font-bold hover:bg-gray-50 flex items-center justify-center gap-3 bg-white shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            المتابعة باستخدام جوجل
          </Button>

          <p className="mt-8 text-center text-sm font-bold text-[#777aaf]">
            {mode === 'login' ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="mr-2 text-[#4F46E5] hover:underline font-black"
            >
              {mode === 'login' ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </button>
          </p>

          <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
             <Link to="/" className="text-xs font-black uppercase tracking-widest text-[#151e63] hover:text-[#4F46E5] transition-colors">الرئيسية</Link>
             <Link to="/contact" className="text-xs font-black uppercase tracking-widest text-[#151e63] hover:text-[#4F46E5] transition-colors">تواصل معنا</Link>
             <Link to="/privacy" className="text-xs font-black uppercase tracking-widest text-[#151e63] hover:text-[#4F46E5] transition-colors">الخصوصية</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
