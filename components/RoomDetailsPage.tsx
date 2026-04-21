import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Users, BedDouble, Check, ArrowRight, ArrowLeft, Info, CreditCard, MapPin, Star, ShieldCheck, ChevronRight, ChevronLeft, Maximize, Zap, Sparkles, Ticket, Cigarette, Wallet, Wifi, Waves, Coffee, Dumbbell, ParkingCircle, Wind, Utensils, Wine, Baby, Umbrella, Trees, Tv, Sofa, Briefcase, BellRing, Plug, Flame, Bed, Eye } from "lucide-react";

// Utility to map amenity text to icons
const getAmenityIcon = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("واي فاي") || t.includes("wifi")) return <Wifi size={16} />;
  if (t.includes("سباحة") || t.includes("pool") || t.includes("مسبح")) return <Waves size={16} />;
  if (t.includes("إفطار") || t.includes("breakfast")) return <Coffee size={16} />;
  if (t.includes("جيم") || t.includes("gym")) return <Dumbbell size={16} />;
  if (t.includes("موقف") || t.includes("parking")) return <ParkingCircle size={16} />;
  if (t.includes("تكييف") || t.includes("ac")) return <Wind size={16} />;
  if (t.includes("مطعم") || t.includes("food")) return <Utensils size={16} />;
  if (t.includes("مشروبات") || t.includes("bar")) return <Wine size={16} />;
  if (t.includes("سبا") || t.includes("spa")) return <Sparkles size={16} />;
  if (t.includes("عائلية") || t.includes("family")) return <Baby size={16} />;
  if (t.includes("شاطئ") || t.includes("beach")) return <Umbrella size={16} />;
  if (t.includes("حديقة") || t.includes("garden")) return <Trees size={16} />;
  if (t.includes("تلفزيون") || t.includes("tv") || t.includes("شاشة")) return <Tv size={16} />;
  if (t.includes("جلوس") || t.includes("sofa")) return <Sofa size={16} />;
  if (t.includes("مكتب") || t.includes("desk")) return <Briefcase size={16} />;
  if (t.includes("إيقاظ") || t.includes("منبه") || t.includes("wake")) return <BellRing size={16} />;
  if (t.includes("مقبس") || t.includes("socket")) return <Plug size={16} />;
  if (t.includes("تدفئة") || t.includes("heating")) return <Flame size={16} />;
  if (t.includes("بياضات") || t.includes("سرير") || t.includes("bed")) return <Bed size={16} />;
  return <Zap size={16} />;
};
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { showError, showSuccess, showInfo } from "@/src/lib/swal";
import { db, auth, createBooking, getUserBalance, updateUserBalance, addTransaction } from "../src/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function RoomDetailsPage() {
  const { cityId, id, roomId } = useParams(); // Matches route: /hotel/:cityId/:id/room/:roomId
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [room, setRoom] = useState<any>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [walletBalance, setWalletBalance] = useState(0);

  const [checkIn, setCheckIn] = useState(searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date());
  const [checkOut, setCheckOut] = useState(searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(new Date().getTime() + 86400000 * 2));
  const [guestCount, setGuestCount] = useState(searchParams.get("guests") || "2");

  const [guestDetails, setGuestDetails] = useState({
    name: auth.currentUser?.displayName || "",
    email: auth.currentUser?.email || "",
    phone: "",
    requests: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, percentage: number} | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (auth.currentUser) {
        const bal = await getUserBalance(auth.currentUser.uid);
        setWalletBalance(bal);
      }
    };
    fetchBalance();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchRoomAndHotel = async () => {
      if (!cityId || !id || !roomId) return;
      try {
        setLoading(true);
        
        // 1. Fetch Hotel
        const hotelRef = doc(db, "cities", cityId, "hotels", id);
        const hotelSnap = await getDoc(hotelRef);
        
        if (!hotelSnap.exists()) {
          console.error("Hotel not found at path:", hotelRef.path);
          setLoading(false);
          return;
        }
        setHotel({ id: hotelSnap.id, ...hotelSnap.data() });

        // 2. Fetch Room (Robust multi-path approach)
        let roomData = null;
        let finalRoomId = roomId;

        const possiblePaths = [
          doc(hotelRef, "rooms", roomId),
          doc(hotelRef, "Rooms", roomId),
          doc(hotelRef, "room", roomId),
          doc(db, "rooms", roomId),
          doc(db, "Rooms", roomId)
        ];

        for (const path of possiblePaths) {
          try {
            const snap = await getDoc(path);
            if (snap.exists()) {
              roomData = snap.data();
              finalRoomId = snap.id;
              break;
            }
          } catch (e) { /* ignore */ }
        }
        
        if (roomData) {
          const roomImages = 
            Array.isArray(roomData.Room_img) && roomData.Room_img.length > 0 ? roomData.Room_img :
            Array.isArray(roomData.images) && roomData.images.length > 0 ? roomData.images :
            roomData.image ? [roomData.image] :
            ["https://picsum.photos/seed/room/800/600"];

          setRoom({ 
            id: finalRoomId, 
            ...roomData, 
            title: roomData.Room_name || roomData.title || roomData.name || roomData.Room_type || 'غرفة غير مسمى',
            price: roomData.السعر || roomData.price || roomData.Room_price || 0,
            description: roomData.description || roomData.Room_description || roomData.الإطلالة || roomData.view || 'لا يوجد وصف متاح.',
            images: roomImages,
            amenities: roomData['المرافق'] || roomData.amenities || [],
            guests: roomData.guests || roomData.Room_guests || roomData.capacity || 2,
            size: roomData.size || 0,
            bed: roomData.bed || roomData.Room_bed || roomData.bedType || 'غير محدد',
            level: roomData.level || roomData.Room_level || roomData.الإطلالة || roomData.view || 'ستاندرد'
          });
        } else {
          console.error("Room not found with ID:", roomId);
        }
      } catch (error) { 
        console.error("Error fetching room/hotel:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchRoomAndHotel();
  }, [cityId, id, roomId]);

  const calculateTotal = () => {
    if (!room) return 0;
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const base = (parseFloat(String(room.price)) || 0) * nights;
    return base;
  };

  const calculateDiscountedTotal = () => {
    const base = calculateTotal();
    if (appliedDiscount) {
      return base - (base * (appliedDiscount.percentage / 100));
    }
    return base;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        showError("خطأ", "كود الخصم غير صحيح");
        setAppliedDiscount(null);
        return;
      }

      const couponData = snap.docs[0].data();
      
      // Check if active
      if (couponData.isActive === false) {
        showError("تنبيه", "هذا الكوبون معطل حالياً");
        setAppliedDiscount(null);
        return;
      }

      // Check expiry if exists
      if (couponData.expiryDate) {
        const expiry = new Date(couponData.expiryDate);
        if (expiry < new Date()) {
          showError("تنبيه", "هذا الكوبون منتهي الصلاحية");
          setAppliedDiscount(null);
          return;
        }
      }

      setAppliedDiscount({ code: couponData.code, percentage: couponData.discountPercentage || 0 });
      showSuccess("تم!", `تم تطبيق خصم ${couponData.discountPercentage}% بنجاح!`);
    } catch (e) {
      showError("خطأ", "حدث خطأ أثناء التحقق من الكوبون");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) { 
      try { 
        await signInWithPopup(auth, new GoogleAuthProvider()); 
      } catch (e) { 
        return; 
      } 
    }
    
    setIsSubmitting(true);
    setPaymentError(null);
    
    try {
      const totalAmount = calculateDiscountedTotal() + 120; // Include taxes
      
      if (paymentMethod === 'wallet') {
        if (walletBalance < totalAmount) {
          throw new Error("رصيد المحفظة غير كافٍ. يرجى شحن الرصيد أولاً.");
        }
        
        // Deduct from wallet
        await updateUserBalance(auth.currentUser.uid, -totalAmount);
        
        const bookingData = { 
          userId: auth.currentUser?.uid, 
          hotelId: id, 
          roomId: room.id, 
          roomTitle: room.title, 
          checkIn: checkIn.toISOString(), 
          checkOut: checkOut.toISOString(), 
          guestName: guestDetails.name, 
          guestEmail: guestDetails.email, 
          guestPhone: guestDetails.phone, 
          guests: parseInt(guestCount), 
          price: totalAmount, 
          paymentMethod: "محفظة الموقع",
          status: 'confirmed'
        };
        
        const bookingId = await createBooking(bookingData);
        await addTransaction(auth.currentUser!.uid, {
          type: 'booking',
          amount: totalAmount,
          description: `حجز غرفة: ${room.title}`,
          method: 'محفظة الموقع'
        });
        setLastBooking({ ...bookingData, id: bookingId, createdAt: new Date().toISOString() });
        setIsSuccess(true);
        showSuccess("تم الحجز!", "تم الحجز بنجاح باستخدام المحفظة!");
      } else {
        // Stripe Payment
        if (!stripe || !elements) return;
        const response = await fetch("/api/create-payment-intent", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ amount: totalAmount }) 
        });
        
        const { clientSecret } = await response.json();
        const cardElement = elements.getElement(CardElement);
        
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, { 
          payment_method: { 
            card: cardElement!, 
            billing_details: { name: guestDetails.name, email: guestDetails.email } 
          } 
        });
        
        if (stripeError) throw new Error(stripeError.message);
        
        if (paymentIntent?.status === "succeeded") {
          const bookingData = { 
            userId: auth.currentUser?.uid, 
            hotelId: id, 
            roomId: room.id, 
            roomTitle: room.title, 
            checkIn: checkIn.toISOString(), 
            checkOut: checkOut.toISOString(), 
            guestName: guestDetails.name, 
            guestEmail: guestDetails.email, 
            guestPhone: guestDetails.phone, 
            guests: parseInt(guestCount), 
            price: totalAmount, 
            paymentMethod: "بطاقة ائتمان (Stripe)",
            status: 'confirmed'
          };
          
          const bookingId = await createBooking(bookingData);
          await addTransaction(auth.currentUser!.uid, {
            type: 'booking',
            amount: totalAmount,
            description: `حجز غرفة: ${room.title}`,
            method: 'بطاقة ائتمان (Stripe)'
          });
          setLastBooking({ ...bookingData, id: bookingId, createdAt: new Date().toISOString() });
          setIsSuccess(true);
          showSuccess("تم الحجز!", "تم الحجز بنجاح!");
        }
      }
    } catch (error: any) { 
      setPaymentError(error.message); 
      showError("فشل الحجز", error.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfd]"><div className="w-16 h-16 border-8 border-[#4F46E5] border-t-transparent rounded-full animate-spin" /></div>;
  
  if (!room) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
       <div className="w-20 h-20 bg-[#f5f5fa] rounded-full flex items-center justify-center text-[#777aaf]">
          <Info size={40} />
       </div>
       <div>
          <h2 className="text-3xl font-black text-[#151e63] mb-2">الغرفة غير موجودة</h2>
          <p className="text-[#777aaf] font-medium">عذراً، لم نتمكن من العثور على بيانات الغرفة المطلوبة.</p>
       </div>
       <Button onClick={() => navigate("/")} className="action-button px-10">العودة للرئيسية</Button>
    </div>
  );

  if (isSuccess && lastBooking) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fcfcfd]">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-2xl w-full border border-[#d6d6e7]/50 text-center">
         <div className="w-20 h-20 bg-[#e8e5f0] text-[#4F46E5] rounded-[2rem] flex items-center justify-center mx-auto mb-8"><Check size={40} /></div>
         <h3 className="text-4xl font-black text-[#151e63] mb-4">تم تأكيد حجزك!</h3>
         <p className="text-[#777aaf] font-medium mb-10">شكراً لاختيارك AQUA Booking، تم إرسال كافة التفاصيل إلى بريدك الإلكتروني.</p>
         <div className="bg-[#f5f5fa] rounded-[2rem] p-8 mb-10 text-right space-y-4">
            <div className="flex justify-between border-b border-[#d6d6e7]/30 pb-4"><span>المرجع:</span><span className="font-black text-[#151e63]">#{lastBooking.id.slice(0, 8)}</span></div>
            <div className="flex justify-between"><span>الإجمالي المدفوع:</span><span className="font-black text-[#4F46E5]">EGP {lastBooking.price}</span></div>
         </div>
         <Button onClick={() => navigate("/profile")} className="action-button w-full h-16 rounded-2xl text-lg">عرض حجوزاتي</Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32">
       <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             <div className="lg:col-span-8 space-y-12">
                <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl group border border-[#d6d6e7]/50">
                   <img src={room.images[currentImageIndex]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#151e63]/60 to-transparent" />
                   <div className="absolute bottom-10 right-10 left-10 text-white">
                      <div className="flex items-center gap-3 mb-4">
                         <span className="badge-indigo bg-white/20 backdrop-blur-md text-white border-white/20 w-fit inline-flex items-center gap-2">
                            <Zap size={14} className="fill-current" />
                            {room.level || room.الإطلالة || 'ستاندرد'}
                         </span>
                         <span className="flex items-center gap-1 text-[#ffb700] font-black"><Star size={16} className="fill-current" /> {room.rating || 4.9}</span>
                      </div>
                      <h1 className="text-2xl md:text-5xl font-black tracking-tighter mb-2">{room.title}</h1>
                      <p className="text-white/80 font-medium flex items-center gap-2 font-black"><MapPin size={18} /> {hotel?.name}، {hotel?.location}</p>
                   </div>
                   {room.images.length > 1 && (
                      <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setCurrentImageIndex(i => (i - 1 + room.images.length) % room.images.length)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-[#4F46E5] transition-all"><ChevronRight size={24} /></button>
                         <button onClick={() => setCurrentImageIndex(i => (i + 1) % room.images.length)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-[#4F46E5] transition-all"><ChevronLeft size={24} /></button>
                      </div>
                   )}
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-[#d6d6e7]/50 shadow-xl shadow-indigo-50/50">
                   <h3 className="text-3xl font-black text-[#151e63] mb-8">مواصفات الغرفة</h3>
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                      {[
                        { icon: <Maximize size={24} />, label: "المساحة", value: `${room.size || 0} م²` },
                        { icon: <Users size={24} />, label: "الضيوف", value: `${room.guests || 2} أشخاص` },
                        { icon: <BedDouble size={24} />, label: "الأسرّة", value: room.bed || 0 },
                        { icon: <Cigarette size={24} />, label: "التدخين", value: room.isSmokingAllowed ? "مسموح" : "ممنوع" },
                        { icon: <ShieldCheck size={24} />, label: "الإلغاء", value: "مجاني" }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2 text-right flex flex-col items-end">
                           <div className="text-[#4F46E5]">{item.icon}</div>
                           <p className="text-xs font-black text-[#777aaf] uppercase tracking-widest">{item.label}</p>
                           <p className="font-black text-[#151e63]">{item.value}</p>
                        </div>
                      ))}
                   </div>
                    <div className="mt-12 pt-12 border-t border-[#d6d6e7]/30">
                      <h4 className="text-xl font-black text-[#151e63] mb-6 flex items-center justify-start gap-2">
                         <Eye className="text-[#4F46E5]" size={24} />
                         <span>الإطلالة</span>
                      </h4>
                      <p className="text-[#5a5e9a] font-medium leading-relaxed text-lg text-right">{room.description}</p>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mt-12 pt-12 border-t border-[#d6d6e7]/30">
                        <h4 className="text-xl font-black text-[#151e63] mb-6">مرافق الغرفة</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {room.amenities.map((amenity: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-[#fcfcfd] p-4 rounded-2xl border border-[#d6d6e7]/50 shadow-sm text-[#151e63]">
                              <div className="text-[#4F46E5]">{getAmenityIcon(amenity)}</div>
                              <span className="font-bold text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-[#d6d6e7]/50 shadow-xl shadow-indigo-50/50">
                   <h3 className="text-3xl font-black text-[#151e63] mb-8">تفاصيل الضيف</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2"><Label className="text-xs font-black text-[#777aaf]">الاسم الكامل</Label><Input className="h-14 rounded-2xl border-[#d6d6e7]/50" value={guestDetails.name} onChange={e => setGuestDetails(p => ({ ...p, name: e.target.value }))} /></div>
                      <div className="space-y-2"><Label className="text-xs font-black text-[#777aaf]">البريد الإلكتروني</Label><Input className="h-14 rounded-2xl border-[#d6d6e7]/50" value={guestDetails.email} onChange={e => setGuestDetails(p => ({ ...p, email: e.target.value }))} /></div>
                      <div className="space-y-2"><Label className="text-xs font-black text-[#777aaf]">رقم الهاتف</Label><Input className="h-14 rounded-2xl border-[#d6d6e7]/50" value={guestDetails.phone} onChange={e => setGuestDetails(p => ({ ...p, phone: e.target.value }))} /></div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-[#777aaf]">عدد الضيوف</Label>
                        <Select value={guestCount} onValueChange={setGuestCount}><SelectTrigger className="h-14 rounded-2xl border-[#d6d6e7]/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select>
                      </div>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-4">
                <div className="sticky top-32 bg-[#080c27] rounded-[2.5rem] p-10 text-white shadow-2xl overflow-hidden">
                   <div className="absolute top-0 left-0 w-32 h-32 bg-[#4F46E5]/20 blur-3xl rounded-full -ml-16 -mt-16" />
                   <h3 className="text-2xl font-black mb-8 relative z-10">ملخص الحجز</h3>
                   <div className="space-y-6 relative z-10">
                      <Popover>
                        <PopoverTrigger className="w-full flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-right">
                             <div><p className="text-[10px] text-[#b6b7d5] font-black uppercase mb-1">الوصول</p><p className="font-black text-sm">{format(checkIn, "d MMM yyyy", { locale: ar })}</p></div>
                             <ArrowLeft size={20} className="text-[#4F46E5]" />
                             <div className="text-left"><p className="text-[10px] text-[#b6b7d5] font-black uppercase mb-1">المغادرة</p><p className="font-black text-sm">{format(checkOut, "d MMM yyyy", { locale: ar })}</p></div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-3xl" align="center">
                          <Calendar mode="range" selected={{ from: checkIn, to: checkOut }} onSelect={(range: any) => { if(range?.from) setCheckIn(range.from); if(range?.to) setCheckOut(range.to); }} numberOfMonths={1} locale={ar} className="p-3" />
                        </PopoverContent>
                      </Popover>
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 mt-3">
                          <div className="flex items-center gap-2">
                             <Users size={16} className="text-[#4F46E5]" />
                             <span className="text-[12px] text-[#b6b7d5] font-black uppercase">عدد الضيوف</span>
                          </div>
                          <Select value={guestCount} onValueChange={setGuestCount}>
                            <SelectTrigger className="w-24 h-8 bg-transparent border-none text-white font-black p-0 shadow-none focus:ring-0 text-left justify-end flex-row-reverse gap-2"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="1">1 ضيف</SelectItem><SelectItem value="2">2 ضيوف</SelectItem><SelectItem value="3">3 ضيوف</SelectItem><SelectItem value="4">4 ضيوف</SelectItem><SelectItem value="5">5 ضيوف</SelectItem></SelectContent>
                          </Select>
                      </div>
                       <div className="space-y-4 pt-4">
                         <div className="flex justify-between text-sm text-[#b6b7d5] font-bold"><span>سعر الليلة:</span><span className="text-white">EGP {room.price}</span></div>
                         <div className="flex justify-between text-sm text-[#b6b7d5] font-bold"><span>عدد الليالي:</span><span className="text-white">{Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))}</span></div>
                         
                         {appliedDiscount && (
                           <div className="flex justify-between text-sm text-green-400 font-bold">
                             <span>خصم الكوبون ({appliedDiscount.percentage}%):</span>
                             <span>- EGP {(calculateTotal() * (appliedDiscount.percentage / 100)).toFixed(2)}</span>
                           </div>
                         )}
                         
                         <div className="flex justify-between text-sm text-[#b6b7d5] font-bold border-t border-white/10 pt-4"><span>الضرائب والرسوم:</span><span className="text-white">EGP 120</span></div>
                         <div className="flex justify-between items-baseline pt-4">
                            <span className="text-xl font-black">الإجمالي</span>
                            <span className="text-3xl font-black text-[#818cf8] tracking-tighter">EGP {calculateDiscountedTotal() + 120}</span>
                         </div>
                      </div>

                      <div className="pt-6 space-y-4 border-t border-white/10">
                         <Label className="text-xs font-black uppercase text-[#b6b7d5] flex items-center gap-2"><Ticket size={16} /> لديك كود خصم؟</Label>
                         <div className="flex gap-2">
                           <Input 
                             value={couponCode} 
                             onChange={(e) => setCouponCode(e.target.value)} 
                             placeholder="أدخل كود الخصم هنا" 
                             className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#4F46E5]" 
                             disabled={appliedDiscount !== null}
                           />
                           {appliedDiscount ? (
                             <Button onClick={() => { setAppliedDiscount(null); setCouponCode(""); }} variant="destructive" className="h-12 px-4 rounded-xl font-black">إزالة</Button>
                           ) : (
                             <Button onClick={applyCoupon} disabled={isApplyingCoupon || !couponCode.trim()} className="h-12 px-6 rounded-xl bg-white text-[#151e63] hover:bg-gray-200 font-black">
                               {isApplyingCoupon ? "..." : "تطبيق"}
                             </Button>
                           )}
                         </div>
                      </div>

                      <div className="pt-8 space-y-8">
                         <div className="space-y-4">
                            <Label className="text-xs font-black uppercase text-[#b6b7d5] flex items-center gap-2">اختر طريقة الدفع</Label>
                            <div className="grid grid-cols-2 gap-4">
                               <button 
                                 onClick={() => setPaymentMethod('card')}
                                 className={cn(
                                   "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                   paymentMethod === 'card' ? "border-[#4F46E5] bg-[#4F46E5]/10 text-white" : "border-white/10 text-[#b6b7d5] hover:border-white/20"
                                 )}
                               >
                                  <CreditCard size={24} />
                                  <span className="text-xs font-black">بطاقة ائتمان</span>
                               </button>
                               <button 
                                 onClick={() => setPaymentMethod('wallet')}
                                 className={cn(
                                   "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                   paymentMethod === 'wallet' ? "border-[#4F46E5] bg-[#4F46E5]/10 text-white" : "border-white/10 text-[#b6b7d5] hover:border-white/20"
                                 )}
                               >
                                  <Wallet size={24} />
                                  <span className="text-xs font-black">محفظة الموقع</span>
                               </button>
                            </div>
                         </div>

                         {paymentMethod === 'wallet' ? (
                           <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                              <div className="flex justify-between items-center">
                                 <span className="text-sm text-[#b6b7d5] font-bold">الرصيد المتاح:</span>
                                 <span className="text-xl font-black text-white">EGP {walletBalance.toFixed(2)}</span>
                              </div>
                              {walletBalance < (calculateDiscountedTotal() + 120) && (
                                <p className="text-red-400 text-[10px] font-bold italic">* الرصيد غير كافٍ لإتمام العملية</p>
                              )}
                           </div>
                         ) : (
                           <div className="space-y-3">
                              <Label className="text-xs font-black uppercase text-[#b6b7d5] flex items-center gap-2"><CreditCard size={16} /> تفاصيل البطاقة</Label>
                              <div className="p-5 bg-white rounded-2xl shadow-inner"><CardElement options={{ style: { base: { fontSize: '16px', color: '#151e63' } } }} /></div>
                           </div>
                         )}

                         <Button onClick={handleSubmit} disabled={isSubmitting || (paymentMethod === 'card' && !stripe) || (paymentMethod === 'wallet' && walletBalance < (calculateDiscountedTotal() + 120))} className="action-button w-full h-16 rounded-[1.8rem] text-lg">
                            {isSubmitting ? "جاري المعالجة..." : "تأكيد الحجز والدفع"}
                         </Button>
                         <div className="flex items-center justify-center gap-4 text-[10px] font-black text-[#b6b7d5]">
                            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-[#4F46E5]" /> دفع آمن 100%</span>
                            <span className="flex items-center gap-1"><Sparkles size={14} className="text-[#4F46E5]" /> حجز فوري</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
