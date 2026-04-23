import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CreditCard, Check, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, auth, addTransaction } from "@/src/lib/firebase";
import { doc, increment, setDoc } from "firebase/firestore";
import { showSuccess, showError } from "@/src/lib/swal";

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletTopUpModal({ isOpen, onClose }: WalletTopUpModalProps) {
  const [amount, setAmount] = useState<string>("500");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showError("خطأ", "يجب تسجيل الدخول أولاً");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showError("خطأ", "يرجى إدخال مبلغ صحيح");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulated processing delay for "Interactive Scenario"
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 1. Update Wallet Balance in Firestore (create user doc if missing)
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, {
        uid: auth.currentUser.uid,
        walletBalance: increment(numAmount)
      }, { merge: true });

      // 2. Record Transaction
      await addTransaction(auth.currentUser.uid, {
        type: 'topup',
        amount: numAmount,
        description: "شحن رصيد المحفظة (تجريبي)",
        method: "بطاقة دفع افتراضية"
      });

      setIsSuccess(true);
      showSuccess("تم الشحن!", `تم إضافة ${numAmount} ج.م إلى محفظتك بنجاح!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء معالجة العملية");
      showError("فشلت العملية", err.message || "فشلت عملية الشحن");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 bg-primary text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="font-bold">شحن المحفظة (تجريبي)</h3>
              <p className="text-xs opacity-80">أضف رصيداً إلى محفظتك لتجربة الحجز</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={40} />
                </div>
                <h4 className="text-2xl font-black mb-2">تم الشحن بنجاح!</h4>
                <p className="text-gray-500 mb-8 font-bold">رصيدك الجديد متاح الآن للاستخدام في حجز الفنادق.</p>
                <Button onClick={onClose} className="w-full bg-primary text-white h-12 rounded-xl font-bold">
                  إغلاق
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-bold block mb-2 text-gray-700">المبلغ المطلوب شحنه (EGP)</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {["200", "500", "1000"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`py-3 rounded-2xl border-2 font-black transition-all ${
                          amount === val ? "border-primary bg-primary/5 text-primary" : "border-gray-100 hover:border-primary/30"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 bg-gray-50 border-none text-center text-2xl font-black focus:ring-2 focus:ring-primary/50"
                    placeholder="أدخل مبلغاً مخصصاً"
                  />
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <Sparkles size={20} className="text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                      هذا النظام مخصص للتجربة التفاعلية. سيتم إضافة الرصيد إلى حسابك فوراً دون الحاجة لبيانات دفع حقيقية.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold bg-gray-50 p-3 rounded-xl">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>تتم حماية بيانات حسابك وفق أعلى معايير الأمان المعتمدة في AQUA.</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-primary text-white font-black text-lg rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري المعالجة...</span>
                    </div>
                  ) : (
                    `شحن EGP ${parseFloat(amount) || 0} الآن`
                  )}
                </Button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
