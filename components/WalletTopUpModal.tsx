import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CreditCard, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { db, auth, addTransaction } from "@/src/lib/firebase";
import { doc, increment, setDoc, collection, addDoc } from "firebase/firestore";
import { showSuccess, showError } from "@/src/lib/swal";

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletTopUpModal({ isOpen, onClose }: WalletTopUpModalProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState<string>("500");
  const [selectedWallet, setSelectedWallet] = useState<"bank_card" | "stripe">("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWallet === "stripe" && (!stripe || !elements)) return;
    if (!auth.currentUser) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showError("خطأ", "يرجى إدخال مبلغ صحيح");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const walletLabel = selectedWallet === "stripe" ? "Stripe" : "البطاقة البنكية";
    const transactionDescription = selectedWallet === "stripe"
      ? "شحن رصيد المحفظة عبر Stripe"
      : "شحن رصيد المحفظة عبر البطاقة البنكية";

    try {
      let paymentIntentId = null;

      if (selectedWallet === "stripe" || selectedWallet === "bank_card") {
        // 1. Create Payment Intent
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: numAmount, currency: "egp" }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`خطأ في الخادم (${response.status}): ${text || 'استجابة فارغة'}`);
        }

        const data = await response.json();
        const { clientSecret, error: backendError } = data;

        if (backendError) throw new Error(backendError);

        // 2. Confirm Payment
        const cardElement = elements!.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");

        const { error: stripeError, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: auth.currentUser.displayName || "",
              email: auth.currentUser.email || "",
            },
          },
        });

        if (stripeError) throw new Error(stripeError.message);

        if (paymentIntent?.status !== "succeeded") throw new Error("Payment failed");

        paymentIntentId = paymentIntent.id;
      }

      // 3. Update Wallet Balance in Firestore (create user doc if missing)
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, {
        uid: auth.currentUser.uid,
        walletBalance: increment(numAmount)
      }, { merge: true });

      // 4. Record Transaction
      await addTransaction(auth.currentUser.uid, {
        type: 'topup',
        amount: numAmount,
        description: transactionDescription,
        method: walletLabel
      });

      setIsSuccess(true);
      showSuccess("تم الشحن!", "تم شحن رصيد المحفظة بنجاح!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء معالجة الدفع");
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
              <h3 className="font-bold">شحن المحفظة</h3>
              <p className="text-xs opacity-80">اختر المحفظة الإلكترونية ثم أضف مبلغ الشحن</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-700 mb-2">اختر المحفظة الإلكترونية</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedWallet("bank_card")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  selectedWallet === "bank_card"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-100 bg-white text-gray-700 hover:border-primary/30"
                }`}
              >
                <p className="font-black">البطاقة البنكية</p>
                <p className="text-xs text-muted-foreground mt-1">بطاقة الائتمان / الخصم المباشر</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedWallet("stripe")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  selectedWallet === "stripe"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-100 bg-white text-gray-700 hover:border-primary/30"
                }`}
              >
                <p className="font-black">Stripe</p>
                <p className="text-xs text-muted-foreground mt-1">الدفع الإلكتروني الآمن</p>
              </button>
            </div>
          </div>
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
                <p className="text-gray-500 mb-8 font-bold">رصيدك الجديد متاح الآن للاستخدام.</p>
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

                {(selectedWallet === "stripe" || selectedWallet === "bank_card") && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold block mb-2 text-gray-700">بيانات البطاقة</label>
                    <div className="p-4 border-2 border-gray-100 rounded-2xl bg-gray-50/50">
                      <CardElement 
                        options={{
                          style: {
                            base: {
                              fontSize: '15px',
                              color: '#1a1a1a',
                              fontFamily: 'system-ui, sans-serif',
                              '::placeholder': { color: '#a0a0a0' },
                            },
                          },
                          hidePostalCode: true
                        }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold bg-gray-50 p-3 rounded-xl">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>
                    {selectedWallet === "stripe"
                      ? "تتم معالجة جميع المدفوعات بأمان عبر Stripe بتقنية التشفير 256-bit."
                      : "تتم معالجة بيانات بطاقتك البنكية بأعلى معايير الأمان المعتمدة."
                    }
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !stripe}
                  className="w-full h-14 bg-primary text-white font-black text-lg rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  {isSubmitting ? "جاري المعالجة..." : `شحن EGP ${parseFloat(amount) || 0} عبر ${selectedWallet === "stripe" ? "Stripe" : "البطاقة البنكية"}`}
                </Button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
