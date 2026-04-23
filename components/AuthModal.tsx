import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle
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
  signInWithRedirect
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { showError, showSuccess } from "@/src/lib/swal";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    try {
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
      onClose();
    } catch (error: any) {
      console.error("Google login failed:", error);
      showError("فشل تسجيل الدخول", "حدث خطأ أثناء الاتصال بجوجل");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
        
        // Create user doc in Firestore
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
      onClose();
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#151e63]/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Header Gradient */}
            <div className="h-3 bg-gradient-to-r from-[#4F46E5] via-[#818CF8] to-[#4F46E5]" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X size={20} className="text-gray-400" />
            </button>

            <div className="p-10 md:p-12">
              <div className="text-center space-y-3 mb-10">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-[#4F46E5] mb-4">
                   {mode === 'signup' ? <CheckCircle2 size={32} /> : <Lock size={32} />}
                </div>
                <h2 className="text-3xl font-black text-[#151e63] tracking-tighter">
                  {mode === 'login' ? "تسجيل الدخول" : "إنشاء حساب جديد"}
                </h2>
                <p className="text-sm text-[#777aaf] font-bold">
                  {mode === 'login' ? "مرحباً بعودتك! سجل دخولك للمتابعة" : "انضم إلينا واستمتع بأفضل تجربة حجز فنادق"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-[#151e63] mr-2">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input 
                        required
                        placeholder="أدخل اسمك بالكامل"
                        className="h-14 pr-12 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold"
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
                      className="h-14 pr-12 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold text-left"
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
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                      required
                      type="password"
                      placeholder="••••••••"
                      className="h-14 pr-12 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold text-left"
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

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-[#777aaf] font-bold">أو المتابعة عبر</span></div>
              </div>

              <Button 
                onClick={handleGoogleLogin}
                variant="outline" 
                className="w-full h-14 rounded-2xl border-gray-100 font-bold hover:bg-gray-50 flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                المتابعة باستخدام جوجل
              </Button>

              <p className="mt-10 text-center text-sm font-bold text-[#777aaf]">
                {mode === 'login' ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="mr-2 text-[#4F46E5] hover:underline"
                >
                  {mode === 'login' ? "إنشاء حساب جديد" : "تسجيل الدخول"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
