import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Users, Bed, Check, ArrowRight, ArrowLeft, Info, CreditCard, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { db, auth, sendVerificationEmail, createBooking, getAllRooms, addTransaction } from "@/src/lib/firebase";
import { collection, addDoc, getDocs, query, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  initialHotelId?: string;
}

export default function BookingModal({ isOpen, onClose, initialRoomId, initialHotelId }: BookingModalProps) {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(new Date().getTime() + 86400000 * 2),
  });
  const [selectedRoom, setSelectedRoom] = useState(initialRoomId || "");
  const [selectedHotel, setSelectedHotel] = useState(initialHotelId || "");
  const [guestDetails, setGuestDetails] = useState({
    name: auth.currentUser?.displayName || "",
    email: auth.currentUser?.email || "",
    phone: "",
    guests: "2",
    requests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  const handleClose = () => {
    if (isSuccess) {
      onClose();
      return;
    }
    setShowCloseConfirm(true);
  };

  useEffect(() => {
    if (initialRoomId) setSelectedRoom(initialRoomId);
    if (initialHotelId) setSelectedHotel(initialHotelId);

    if (isOpen && auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      getDoc(userRef).then(snap => {
        if (snap.exists()) {
          setWalletBalance(snap.data().walletBalance || 0);
        }
      });
      setIsEmailVerified(auth.currentUser.emailVerified);
    }
  }, [initialRoomId, initialHotelId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const roomsData = await getAllRooms();
        const filteredRooms = selectedHotel ? roomsData.filter(r => r.hotelId === selectedHotel) : roomsData;
        setRooms(filteredRooms);
        if (filteredRooms.length > 0 && !selectedRoom) {
          setSelectedRoom(filteredRooms[0].id);
          setSelectedHotel(filteredRooms[0].hotelId);
        }
      } catch (error) { console.error("Error:", error); }
      setLoading(false);
    };
    fetchRooms();
  }, [isOpen, selectedHotel]);

  const calculateTotal = () => {
    const room = rooms.find(r => r.id === selectedRoom);
    if (!room || !date.from || !date.to) return 0;
    const nights = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24));
    return room.price * nights;
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      toast.error("يرجى تسجيل الدخول أولاً لإتمام الحجز");
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    setPaymentError(null);
    try {
      const totalAmount = calculateTotal();
      
      // Simulated processing delay for "Interactive Scenario"
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (paymentMethod === "wallet") {
        if (walletBalance < totalAmount) throw new Error("رصيد المحفظة غير كافٍ.");
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { walletBalance: increment(-totalAmount), totalSpent: increment(totalAmount) });
        
        const room = rooms.find(r => r.id === selectedRoom);
        await createBooking({
          userId: auth.currentUser?.uid,
          hotelId: room?.hotelId || selectedHotel,
          roomId: selectedRoom,
          roomTitle: room?.title,
          checkIn: date.from?.toISOString(),
          checkOut: date.to?.toISOString(),
          guestName: guestDetails.name,
          guestEmail: guestDetails.email,
          guestPhone: guestDetails.phone,
          guests: parseInt(guestDetails.guests),
          requests: guestDetails.requests,
          price: totalAmount,
          paymentMethod: "محفظة AQUA"
        });
        await addTransaction(auth.currentUser!.uid, {
          type: 'booking',
          amount: totalAmount,
          description: `حجز غرفة: ${room?.title || 'غير معروف'}`,
          method: 'محفظة AQUA'
        });
      } else {
        // Simulated Card Payment
        const room = rooms.find(r => r.id === selectedRoom);
        await createBooking({
          userId: auth.currentUser?.uid,
          hotelId: room?.hotelId || selectedHotel,
          roomId: selectedRoom,
          roomTitle: room?.title,
          checkIn: date.from?.toISOString(),
          checkOut: date.to?.toISOString(),
          guestName: guestDetails.name,
          guestEmail: guestDetails.email,
          guestPhone: guestDetails.phone,
          guests: parseInt(guestDetails.guests),
          requests: guestDetails.requests,
          price: totalAmount,
          paymentMethod: "بطاقة دفع افتراضية (تجريبي)"
        });
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { totalSpent: increment(totalAmount) });
        await addTransaction(auth.currentUser!.uid, {
          type: 'booking',
          amount: totalAmount,
          description: `حجز غرفة: ${room?.title || 'غير معروف'}`,
          method: 'بطاقة دفع افتراضية'
        });
      }

      setIsSuccess(true);
      toast.success("تم الحجز بنجاح!");
    } catch (error: any) {
      setPaymentError(error.message);
      toast.error(error.message);
    } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#151e63]/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#d6d6e7]/50"
      >
        <div className="bg-[#4F46E5] p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tighter">حجز إقامة جديدة</h2>
            <p className="text-sm opacity-80 font-medium">أكمل التفاصيل لتأكيد حجزك في ثوانٍ</p>
          </div>
          <button onClick={handleClose} className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-colors relative z-10">
            <X size={24} />
          </button>
        </div>

        {/* Steps Progress */}
        {!isSuccess && (
          <div className="px-10 pt-10 flex justify-between relative">
             <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-[#f5f5fa] -translate-y-1/2 z-0" />
             {[1, 2, 3, 4].map((s) => (
                <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                   <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all",
                      step >= s ? "bg-[#4F46E5] text-white shadow-lg shadow-[#d0cae5] scale-110" : "bg-[#f5f5fa] text-[#777aaf]"
                   )}>
                      {step > s ? <Check size={18} /> : s}
                   </div>
                </div>
             ))}
          </div>
        )}

        <div className="flex-grow overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="w-24 h-24 bg-[#e8e5f0] text-[#4F46E5] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-50"><Check size={48} /></div>
                <h3 className="text-3xl font-black text-[#151e63] mb-3">تم الحجز بنجاح!</h3>
                <p className="text-[#777aaf] font-medium mb-10">نتطلع لاستقبالك في أقرب وقت. تم إرسال التفاصيل لبريدك.</p>
                <Button onClick={onClose} className="action-button px-12">إغلاق النافذة</Button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step1" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-[#777aaf]">تاريخ الوصول</Label>
                    <Calendar mode="single" selected={date.from} onSelect={(d) => setDate(p => ({ ...p, from: d }))} locale={ar} />
                 </div>
                 <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-[#777aaf]">تاريخ المغادرة</Label>
                    <Calendar mode="single" selected={date.to} onSelect={(d) => setDate(p => ({ ...p, to: d }))} locale={ar} />
                 </div>
              </motion.div>
            ) : step === 2 ? (
              <motion.div key="step2" className="space-y-6">
                <Label className="text-xl font-black text-[#151e63] block mb-4">اختر غرفتك المفضلة</Label>
                <div className="space-y-4">
                  {loading ? <div className="text-center py-10 font-bold text-[#777aaf]">جاري التحميل...</div> : rooms.map((room) => (
                    <div key={room.id} onClick={() => setSelectedRoom(room.id)} className={cn("p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-6", selectedRoom === room.id ? "border-[#4F46E5] bg-[#e8e5f0]/50" : "border-[#f5f5fa] hover:border-[#d6d6e7]")}>
                      <img src={room.images[0]} className="w-24 h-24 rounded-2xl object-cover" />
                      <div className="flex-1">
                         <h4 className="font-black text-lg text-[#151e63]">{room.title}</h4>
                         <p className="text-[#4F46E5] font-black tracking-tighter">EGP {room.price} <span className="text-[10px] text-[#777aaf]">/ ليلة</span></p>
                      </div>
                      <div className={cn("w-6 h-6 rounded-full border-2", selectedRoom === room.id ? "border-[#4F46E5] bg-[#4F46E5]" : "border-[#d6d6e7]")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : step === 3 ? (
               <motion.div key="step3" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><Label className="text-xs font-black text-[#777aaf]">الاسم الكامل</Label><Input className="rounded-xl h-12" value={guestDetails.name} onChange={(e) => setGuestDetails(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label className="text-xs font-black text-[#777aaf]">البريد الإلكتروني</Label><Input className="rounded-xl h-12" value={guestDetails.email} onChange={(e) => setGuestDetails(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label className="text-xs font-black text-[#777aaf]">رقم الهاتف</Label><Input className="rounded-xl h-12" value={guestDetails.phone} onChange={(e) => setGuestDetails(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-[#777aaf]">عدد الضيوف</Label>
                    <Select value={guestDetails.guests} onValueChange={(v) => setGuestDetails(p => ({ ...p, guests: v }))}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select>
                  </div>
               </motion.div>
            ) : (
              <motion.div key="step4" className="space-y-8 text-right">
                <div className="bg-[#f5f5fa] p-8 rounded-[2rem] border border-[#d6d6e7]/50">
                  <h4 className="font-black text-[#151e63] mb-6 flex items-center gap-2"><Info size={20} className="text-[#4F46E5]" /> ملخص الحجز</h4>
                  <div className="space-y-3 text-sm font-bold text-[#5a5e9a]">
                    <div className="flex justify-between"><span>الغرفة:</span><span className="text-[#151e63]">{rooms.find(r => r.id === selectedRoom)?.title}</span></div>
                    <div className="flex justify-between pt-4 border-t border-[#d6d6e7]/30"><span className="text-lg">الإجمالي:</span><span className="text-2xl font-black text-[#4F46E5]">EGP {calculateTotal()}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 p-1.5 bg-[#f5f5fa] rounded-2xl">
                    <button onClick={() => setPaymentMethod("card")} className={cn("flex-1 py-3 rounded-xl font-black text-sm transition-all", paymentMethod === "card" ? "bg-white shadow-xl text-[#4F46E5]" : "text-[#777aaf]")}>بطاقة ائتمان</button>
                    <button onClick={() => setPaymentMethod("wallet")} className={cn("flex-1 py-3 rounded-xl font-black text-sm transition-all", paymentMethod === "wallet" ? "bg-white shadow-xl text-[#4F46E5]" : "text-[#777aaf]")}>محفظة AQUA</button>
                  </div>
                  {paymentMethod === "card" ? (
                    <div className="p-8 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-[2rem] text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <Sparkles className="text-primary" size={32} />
                      </div>
                      <div>
                        <p className="font-black text-[#151e63]">نظام دفع تجريبي</p>
                        <p className="text-xs text-[#777aaf] font-bold mt-1">سيتم تأكيد الحجز فوراً دون طلب بيانات بطاقة حقيقية.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-[#e8e5f0] rounded-3xl text-center border-2 border-dashed border-[#4F46E5]/20">
                      <p className="font-black text-[#151e63]">رصيدك الحالي: EGP {walletBalance.toLocaleString()}</p>
                      {walletBalance < calculateTotal() && <p className="text-red-500 text-xs mt-3 font-black">الرصيد غير كافٍ.</p>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isSuccess && (
          <div className="p-8 bg-[#fcfcfd] border-t border-[#d6d6e7]/50 flex justify-between items-center">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="font-black text-[#777aaf]">السابق</Button>
            <Button 
              onClick={step === 4 ? handleSubmit : handleNext} 
              disabled={isSubmitting || (step === 4 && paymentMethod === "wallet" && walletBalance < calculateTotal())}
              className="action-button min-w-[140px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري...</span>
                </div>
              ) : step === 4 ? `تأكيد حجز ${calculateTotal()} EGP` : "التالي"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
