import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Users, BedDouble, Check, ArrowRight, ArrowLeft, Info, CreditCard, MapPin, Star, ShieldCheck, ChevronRight, ChevronLeft, Maximize, Zap, Sparkles, Ticket, Cigarette, Wallet, Wifi, Waves, Coffee, Dumbbell, ParkingCircle, Wind, Utensils, Wine, Baby, Umbrella, Trees, Tv, Sofa, Briefcase, BellRing, Plug, Flame, Bed, Eye, CigaretteOff, Plane, Car, Clock3, WashingMachine, Bath, ConciergeBell } from "lucide-react";

// Utility to map amenity text to icons
const getAmenityIcon = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("واي فاي") || t.includes("wifi") || t.includes("إنترنت") || t.includes("انترنت")) return <Wifi size={16} />;
  if (t.includes("تلفزيون") || t.includes("tv") || t.includes("شاشة")) return <Tv size={16} />;
  if (t.includes("إفطار") || t.includes("فطار") || t.includes("breakfast") || t.includes("فطور")) return <Coffee size={16} />;
  if (t.includes("شاي") || t.includes("قهوة") || t.includes("tea") || t.includes("coffee") || t.includes("آلة") || t.includes("الة")) return <Coffee size={16} />;
  if (t.includes("مطعم") || t.includes("food") || t.includes("عشاء") || t.includes("غداء")) return <Utensils size={16} />;
  if (t.includes("مشروبات") || t.includes("بار") || t.includes("bar") || t.includes("ميني بار")) return <Wine size={16} />;
  if (t.includes("مطار") || t.includes("airport") || t.includes("طيران")) return <Plane size={16} />;
  if (t.includes("نقل") || t.includes("transfer") || t.includes("توصيل") || t.includes("ليموزين")) return <Car size={16} />;
  if (t.includes("سباحة") || t.includes("pool") || t.includes("مسبح")) return <Waves size={16} />;
  if (t.includes("جيم") || t.includes("رياضي") || t.includes("gym") || t.includes("لياقة")) return <Dumbbell size={16} />;
  if (t.includes("سبا") || t.includes("spa") || t.includes("ساونا") || t.includes("جاكوزي")) return <Sparkles size={16} />;
  if (t.includes("حمام") || t.includes("bath") || t.includes("شاور")) return <Bath size={16} />;
  if (t.includes("موقف") || t.includes("parking") || t.includes("سيارات")) return <ParkingCircle size={16} />;
  if (t.includes("خدمة غرف") || t.includes("خدمة الغرف") || t.includes("room service")) return <ConciergeBell size={16} />;
  if (t.includes("استقبال") || t.includes("reception") || t.includes("24 ساعة") || t.includes("مدار")) return <Clock3 size={16} />;
  if (t.includes("غسيل") || t.includes("laundry") || t.includes("تنظيف")) return <WashingMachine size={16} />;
  if (t.includes("تكييف") || t.includes("ac") || t.includes("هواء") || t.includes("مكيف")) return <Wind size={16} />;
  if (t.includes("شاطئ") || t.includes("beach") || t.includes("بحر") || t.includes("مظلة")) return <Umbrella size={16} />;
  if (t.includes("حديقة") || t.includes("garden") || t.includes("أشجار")) return <Trees size={16} />;
  if (t.includes("عائلية") || t.includes("family") || t.includes("أطفال")) return <Baby size={16} />;
  if (t.includes("أمان") || t.includes("security") || t.includes("حراسة")) return <ShieldCheck size={16} />;
  if (t.includes("لا يدخن") || t.includes("non-smoking") || t.includes("مدخنين") || t.includes("تدخين")) return <CigaretteOff size={16} />;
  if (t.includes("جلوس") || t.includes("sofa")) return <Sofa size={16} />;
  if (t.includes("مكتب") || t.includes("desk")) return <Briefcase size={16} />;
  if (t.includes("إيقاظ") || t.includes("منبه") || t.includes("wake")) return <BellRing size={16} />;
  if (t.includes("مقبس") || t.includes("socket")) return <Plug size={16} />;
  if (t.includes("تدفئة") || t.includes("heating")) return <Flame size={16} />;
  if (t.includes("بياضات") || t.includes("سرير") || t.includes("bed")) return <Bed size={16} />;
  return <Zap size={16} />;
};

import { cn } from "@/lib/utils";
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

export default function RoomDetailsPage() {
  const { cityId, id, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
        const hotelRef = doc(db, "cities", cityId, "hotels", id);
        const hotelSnap = await getDoc(hotelRef);
        
        if (!hotelSnap.exists()) {
          setLoading(false);
          return;
        }
        setHotel({ id: hotelSnap.id, ...hotelSnap.data() });

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
          } catch (e) { }
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
    return (parseFloat(String(room.price)) || 0) * nights;
  };

  const calculateDiscountedTotal = () => {
    const base = calculateTotal();
    return appliedDiscount ? base - (base * (appliedDiscount.percentage / 100)) : base;
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
      if (couponData.isActive === false) {
        showError("تنبيه", "هذا الكوبون معطل حالياً");
        setAppliedDiscount(null);
        return;
      }
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
      navigate("/login");
      return;
    }
    setIsSubmitting(true);
    setPaymentError(null);
    try {
      const totalAmount = calculateDiscountedTotal() + 120;
      
      // Simulated processing delay for "Interactive Scenario"
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (paymentMethod === 'wallet') {
        if (walletBalance < totalAmount) throw new Error("رصيد المحفظة غير كافٍ.");
        await updateUserBalance(auth.currentUser.uid, -totalAmount);
        const bookingData = { 
          userId: auth.currentUser?.uid, hotelId: id, roomId: room.id, roomTitle: room.title, 
          checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), 
          guestName: guestDetails.name, guestEmail: guestDetails.email, guestPhone: guestDetails.phone, 
          guests: parseInt(guestCount), price: totalAmount, paymentMethod: "محفظة الموقع", status: 'confirmed'
        };
        const bookingId = await createBooking(bookingData);
        await addTransaction(auth.currentUser!.uid, { type: 'booking', amount: totalAmount, description: `حجز غرفة: ${room.title}`, method: 'محفظة الموقع' });
        setLastBooking({ ...bookingData, id: bookingId, createdAt: new Date().toISOString() });
        setIsSuccess(true);
        showSuccess("تم الحجز!", "تم الحجز بنجاح باستخدام المحفظة!");
      } else {
        // Simulated Card Payment
        const bookingData = { 
          userId: auth.currentUser?.uid, hotelId: id, roomId: room.id, roomTitle: room.title, 
          checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), 
          guestName: guestDetails.name, guestEmail: guestDetails.email, guestPhone: guestDetails.phone, 
          guests: parseInt(guestCount), price: totalAmount, paymentMethod: "بطاقة دفع افتراضية (تجريبي)", status: 'confirmed'
        };
        const bookingId = await createBooking(bookingData);
        await addTransaction(auth.currentUser!.uid, { type: 'booking', amount: totalAmount, description: `حجز غرفة: ${room.title}`, method: 'بطاقة دفع افتراضية' });
        setLastBooking({ ...bookingData, id: bookingId, createdAt: new Date().toISOString() });
        setIsSuccess(true);
        showSuccess("تم الحجز!", "تم الحجز بنجاح (دفع تجريبي)!");
      }
    } catch (error: any) { 
      setPaymentError(error.message); showError("فشل الحجز", error.message); 
    } finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfd]"><div className="w-16 h-16 border-8 border-[#4F46E5] border-t-transparent rounded-full animate-spin" /></div>;
  if (!room) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6"> <div className="w-20 h-20 bg-[#f5f5fa] rounded-full flex items-center justify-center text-[#777aaf]"> <Info size={40} /> </div> <div> <h2 className="text-3xl font-black text-[#151e63] mb-2">الغرفة غير موجودة</h2> <p className="text-[#777aaf] font-medium">عذراً، لم نتمكن من العثور على بيانات الغرفة المطلوبة.</p> </div> <Button onClick={() => navigate("/")} className="action-button px-10">العودة للرئيسية</Button> </div>;

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
    <div className="min-h-screen bg-[#fcfcfd] overflow-x-clip pb-24 md:pb-32">
       <div className="container-custom py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
             <div className="lg:col-span-8 space-y-8 md:space-y-12">
                <div className="relative h-[320px] sm:h-[450px] md:h-[550px] 3xl:h-[700px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl group border border-[#d6d6e7]/50 bg-black">
                   <AnimatePresence mode="wait">
                      <motion.img 
                        key={currentImageIndex}
                        src={room.images[currentImageIndex]} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                          const swipeThreshold = 50;
                          if (info.offset.x > swipeThreshold) {
                            setCurrentImageIndex(p => p === room.images.length - 1 ? 0 : p + 1);
                          } else if (info.offset.x < -swipeThreshold) {
                            setCurrentImageIndex(p => p === 0 ? room.images.length - 1 : p - 1);
                          }
                        }}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 cursor-grab active:cursor-grabbing" 
                      />
                   </AnimatePresence>
                   <div className="absolute inset-0 bg-gradient-to-t from-[#151e63]/90 via-[#151e63]/40 to-transparent" />
                   <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 left-6 md:left-12 text-white">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-5">
                         <span className="badge-indigo bg-white/20 backdrop-blur-md text-white border-white/20 w-fit inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs 3xl:text-sm uppercase tracking-widest font-black">
                            <Zap size={12} className="md:size-4 fill-current" />
                            {room.level || room.الإطلالة || 'ستاندرد'}
                         </span>
                         <span className="flex items-center gap-1.5 text-[#ffb700] font-black text-sm md:text-lg"><Star size={16} className="md:size-5 fill-current" /> {room.rating || 4.9}</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl md:text-5xl 3xl:text-7xl font-black tracking-tighter mb-2 md:mb-4 leading-[1.1] md:leading-tight">{room.title}</h1>
                      <p className="text-white/80 font-black text-xs md:text-lg flex items-center gap-2"><MapPin size={16} className="md:size-5 text-[#4F46E5]" /> {hotel?.name}، {hotel?.location}</p>
                   </div>
                   {room.images.length > 1 && (
                      <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setCurrentImageIndex(i => (i - 1 + room.images.length) % room.images.length)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-[#4F46E5] transition-all"><ChevronRight size={24} /></button>
                         <button onClick={() => setCurrentImageIndex(i => (i + 1) % room.images.length)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-[#4F46E5] transition-all"><ChevronLeft size={24} /></button>
                      </div>
                   )}
                </div>

                <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 3xl:p-14 border border-[#d6d6e7]/50 shadow-xl shadow-indigo-50/50">
                   <h3 className="text-xl md:text-3xl 3xl:text-4xl font-black text-[#151e63] mb-8 md:mb-10 tracking-tighter">مواصفات الغرفة</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-8 xl:gap-12">
                      {[
                        { icon: <Maximize size={28} />, label: "المساحة", value: `${room.size || 0} م²` },
                        { icon: <Users size={28} />, label: "الضيوف", value: `${room.guests || 2} أشخاص` },
                        { icon: <BedDouble size={28} />, label: "الأسرّة", value: room.bed || 0 },
                        { icon: <Cigarette size={28} />, label: "التدخين", value: room.isSmokingAllowed ? "مسموح" : "ممنوع" },
                        { icon: <ShieldCheck size={28} />, label: "الإلغاء", value: "مجاني" }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2 md:space-y-3 text-right flex flex-col items-start group/item">
                           <div className="text-[#4F46E5] scale-90 md:scale-100 group-hover/item:scale-110 transition-transform">{item.icon}</div>
                           <div>
                            <p className="text-[10px] md:text-xs font-black text-[#777aaf] uppercase tracking-widest mb-0.5 md:mb-1">{item.label}</p>
                            <p className="font-black text-[#151e63] text-sm md:text-lg">{item.value}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-[#d6d6e7]/30">
                      <h4 className="text-lg md:text-xl font-black text-[#151e63] mb-4 md:mb-6 flex items-center justify-start gap-2">
                         <Eye className="text-[#4F46E5]" size={20} />
                         <span>الإطلالة</span>
                      </h4>
                      <p className="text-[#5a5e9a] font-medium leading-relaxed text-base md:text-lg text-right">{room.description}</p>
                    </div>
                   {room.amenities && room.amenities.length > 0 && (
                      <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-[#d6d6e7]/30">
                        <h4 className="text-lg md:text-xl font-black text-[#151e63] mb-4 md:mb-6">مرافق الغرفة</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                          {room.amenities.map((amenity: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 md:gap-3 bg-[#fcfcfd] p-3 md:p-4 rounded-xl md:rounded-2xl border border-[#d6d6e7]/50 shadow-sm text-[#151e63]">
                              <div className="text-[#4F46E5] scale-90 md:scale-100">{getAmenityIcon(amenity)}</div>
                              <span className="font-bold text-xs md:text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 3xl:p-14 border border-[#d6d6e7]/50 shadow-xl shadow-indigo-50/50">
                   <h3 className="text-xl md:text-3xl 3xl:text-4xl font-black text-[#151e63] mb-8 md:mb-10 tracking-tighter">تفاصيل الضيف</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                      <div className="space-y-2 md:space-y-3"><Label className="text-[10px] md:text-xs font-black text-[#777aaf] uppercase tracking-widest mr-1">الاسم الكامل</Label><Input className="h-14 md:h-16 rounded-2xl border-[#d6d6e7]/50 px-6 font-bold bg-[#fcfcfd]" value={guestDetails.name} onChange={e => setGuestDetails(p => ({ ...p, name: e.target.value }))} /></div>
                      <div className="space-y-2 md:space-y-3"><Label className="text-[10px] md:text-xs font-black text-[#777aaf] uppercase tracking-widest mr-1">البريد الإلكتروني</Label><Input className="h-14 md:h-16 rounded-2xl border-[#d6d6e7]/50 px-6 font-bold bg-[#fcfcfd]" value={guestDetails.email} onChange={e => setGuestDetails(p => ({ ...p, email: e.target.value }))} /></div>
                      <div className="space-y-2 md:space-y-3"><Label className="text-[10px] md:text-xs font-black text-[#777aaf] uppercase tracking-widest mr-1">رقم الهاتف</Label><Input className="h-14 md:h-16 rounded-2xl border-[#d6d6e7]/50 px-6 font-bold text-left bg-[#fcfcfd]" value={guestDetails.phone} onChange={e => setGuestDetails(p => ({ ...p, phone: e.target.value }))} /></div>
                      <div className="space-y-2 md:space-y-3">
                        <Label className="text-[10px] md:text-xs font-black text-[#777aaf] uppercase tracking-widest mr-1">عدد الضيوف</Label>
                        <Select value={guestCount} onValueChange={setGuestCount}><SelectTrigger className="h-14 md:h-16 rounded-2xl border-[#d6d6e7]/50 px-6 font-bold bg-[#fcfcfd]"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select>
                      </div>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-4 mt-4 lg:mt-0">
                <div className="lg:sticky lg:top-32 bg-[#080c27] rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3.5rem] p-4 sm:p-6 md:p-10 text-white shadow-2xl overflow-hidden border border-white/5">
                   <div className="absolute top-0 left-0 w-32 h-32 bg-[#4F46E5]/30 blur-[80px] rounded-full -ml-16 -mt-16" />
                   <h3 className="text-xl md:text-2xl font-black mb-8 relative z-10 tracking-tighter">ملخص الحجز</h3>
                   <div className="space-y-6 relative z-10">
                      <Popover>
                        <PopoverTrigger className="w-full flex justify-between items-center bg-white/10 p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-all text-right shadow-inner">
                             <div className="min-w-0 flex-1"><p className="text-[9px] text-white/50 font-black uppercase mb-1 tracking-widest">الوصول</p><p className="font-black text-sm md:text-base truncate">{format(checkIn, "d MMM yyyy", { locale: ar })}</p></div>
                             <div className="px-4"><ArrowLeft size={20} className="text-[#4F46E5] animate-pulse" /></div>
                             <div className="text-left min-w-0 flex-1"><p className="text-[9px] text-white/50 font-black uppercase mb-1 tracking-widest">المغادرة</p><p className="font-black text-sm md:text-base truncate">{format(checkOut, "d MMM yyyy", { locale: ar })}</p></div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-auto p-0 rounded-3xl border-none shadow-2xl" align="center" sideOffset={10}>
                          <Calendar mode="range" selected={{ from: checkIn, to: checkOut }} onSelect={(range: any) => { if(range?.from) setCheckIn(range.from); if(range?.to) setCheckOut(range.to); }} numberOfMonths={1} locale={ar} className="p-3" />
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/10 mt-3">
                          <div className="flex items-center gap-2">
                             <Users size={16} className="text-[#4F46E5]" />
                             <span className="text-[11px] text-white/60 font-black uppercase tracking-wider">عدد الضيوف</span>
                          </div>
                          <Select value={guestCount} onValueChange={setGuestCount}>
                            <SelectTrigger className="w-24 h-8 bg-transparent border-none text-white font-black p-0 shadow-none focus:ring-0 text-left justify-end flex-row-reverse gap-2 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl"><SelectItem value="1">1 ضيف</SelectItem><SelectItem value="2">2 ضيوف</SelectItem><SelectItem value="3">3 ضيوف</SelectItem><SelectItem value="4">4 ضيوف</SelectItem><SelectItem value="5">5 ضيوف</SelectItem></SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/10">
                         <div className="flex justify-between text-sm text-white/70 font-bold"><span>سعر الليلة:</span><span className="text-white font-black">EGP {room.price}</span></div>
                         <div className="flex justify-between text-sm text-white/70 font-bold"><span>عدد الليالي:</span><span className="text-white font-black">{Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))} ليلة</span></div>
                         
                         {appliedDiscount && (
                           <div className="flex justify-between text-sm text-emerald-400 font-black bg-emerald-400/10 p-2 rounded-lg border border-emerald-400/20">
                             <span>خصم الكوبون ({appliedDiscount.percentage}%):</span>
                             <span dir="ltr">- EGP {(calculateTotal() * (appliedDiscount.percentage / 100)).toFixed(0)}</span>
                           </div>
                         )}

                         <div className="flex justify-between text-sm text-white/70 font-bold border-t border-white/10 pt-4"><span>الضرائب والرسوم:</span><span className="text-white font-black">EGP 120</span></div>
                         
                         <div className="flex justify-between items-center pt-4 border-t border-white/20">
                            <span className="text-xl font-black tracking-tighter">الإجمالي</span>
                            <div className="text-right">
                               <span className="text-3xl font-black text-[#818cf8] tracking-tighter">EGP {calculateDiscountedTotal() + 120}</span>
                               <p className="text-[10px] text-white/40 font-bold">شامل كافة الرسوم</p>
                            </div>
                         </div>
                      </div>

                      <div className="pt-6 space-y-4 border-t border-white/10">
                         <Label className="text-[10px] font-black uppercase text-white/60 flex items-center gap-2 tracking-widest"><Ticket size={14} /> لديك كود خصم؟</Label>
                         <div className="flex flex-col xs:flex-row gap-2">
                           <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="الكود..." className="h-12 w-full xs:flex-1 bg-white/10 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-[#4F46E5] outline-none text-sm font-bold" disabled={appliedDiscount !== null} />
                           {appliedDiscount ? (
                             <Button onClick={() => { setAppliedDiscount(null); setCouponCode(""); }} variant="destructive" className="h-12 w-full xs:w-auto px-4 rounded-xl font-black text-xs">إزالة</Button>
                           ) : (
                             <Button onClick={applyCoupon} disabled={isApplyingCoupon || !couponCode.trim()} className="h-12 w-full xs:w-auto px-6 rounded-xl bg-white text-[#080c27] hover:bg-[#4F46E5] hover:text-white transition-all font-black text-sm shadow-lg whitespace-nowrap">
                               {isApplyingCoupon ? "..." : "تطبيق"}
                             </Button>
                           )}
                         </div>
                      </div>

                      <div className="pt-8 space-y-8">
                         <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-white/60 flex items-center gap-2 tracking-widest">اختر طريقة الدفع</Label>
                            <div className="grid grid-cols-2 gap-3">
                               <button onClick={() => setPaymentMethod('card')} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", paymentMethod === 'card' ? "border-[#4F46E5] bg-[#4F46E5]/20 text-white shadow-lg shadow-[#4F46E5]/20" : "border-white/10 text-white/40 hover:border-white/20")}>
                                  <CreditCard size={24} />
                                  <span className="text-[10px] font-black uppercase">دفع تجريبي</span>
                               </button>
                               <button onClick={() => setPaymentMethod('wallet')} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", paymentMethod === 'wallet' ? "border-[#4F46E5] bg-[#4F46E5]/20 text-white shadow-lg shadow-[#4F46E5]/20" : "border-white/10 text-white/40 hover:border-white/20")}>
                                  <Wallet size={24} />
                                  <span className="text-[10px] font-black uppercase">محفظة الموقع</span>
                               </button>
                            </div>
                         </div>

                         {paymentMethod === 'wallet' ? (
                           <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3 shadow-inner">
                              <div className="flex justify-between items-center">
                                 <span className="text-sm text-white/60 font-bold">الرصيد المتاح:</span>
                                 <span className="text-xl font-black text-white">EGP {walletBalance.toFixed(0)}</span>
                              </div>
                              {walletBalance < (calculateDiscountedTotal() + 120) && (
                                <p className="text-red-400 text-[10px] font-black italic">* الرصيد غير كافٍ لإتمام العملية</p>
                              )}
                           </div>
                         ) : (
                           <div className="p-8 bg-white/5 border border-white/10 border-dashed rounded-3xl text-center space-y-4">
                              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <Sparkles className="text-[#818cf8]" size={32} />
                              </div>
                              <div>
                                <p className="font-black text-white">نظام دفع تجريبي آمن</p>
                                <p className="text-[10px] text-white/40 font-bold mt-1">سيتم تأكيد حجزك فوراً لتجربة النظام التفاعلي.</p>
                              </div>
                           </div>
                         )}

                         <Button onClick={handleSubmit} disabled={isSubmitting || (paymentMethod === 'wallet' && walletBalance < (calculateDiscountedTotal() + 120))} className="action-button w-full h-16 rounded-[2rem] text-lg font-black shadow-2xl shadow-[#4F46E5]/20">
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                <span>جاري الحجز...</span>
                              </div>
                            ) : "تأكيد الحجز والدفع الآن"}
                         </Button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
