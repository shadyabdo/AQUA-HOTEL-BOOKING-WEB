import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  BedDouble, 
  MapPin, 
  Star, 
  ChevronLeft,
  ShieldCheck,
  Zap,
  Coffee,
  Waves,
  Wifi,
  ParkingCircle,
  Heart,
  Share2,
  Info,
  Clock,
  Navigation,
  ExternalLink,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Dumbbell,
  Wind,
  Tv,
  Utensils,
  ArrowRight,
  Sparkles,
  Bath,
  Wine,
  Umbrella,
  ConciergeBell,
  Baby,
  WashingMachine,
  Phone,
  CigaretteOff,
  Trees,
  Car,
  Key,
  Gamepad2,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { db, auth, toggleFavorite, getFavoritesListener } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, getDoc, doc, getDocs, collectionGroup } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import { showError, showSuccess, showInfo } from "@/src/lib/swal";
import Lightbox from "@/components/Lightbox";

interface Hotel {
  id: string;
  cityId: string;
  name: string;
  description: string;
  images: string[];
  location: string;
  rating: number;
  reviews?: number;
  reviewsCount?: number;
  amenities: string[];
  city: string;
  price: any;
  mapUrl?: string;
  'المرافق'?: string[];
  Hotel_img?: string[];
}

interface Room {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: any;
  size: string;
  guests: number;
  bed: string;
  level: string;
  view?: string;
  amenities?: string[];
  'السعر'?: any;
  'الإطلالة'?: string;
  'Room_name'?: string;
  'Room_img'?: string[];
}

// Utility to map amenity text to icons
const getAmenityIcon = (text: string) => {
  const t = text.toLowerCase();
  
  // WiFi & Tech
  if (t.includes("واي فاي") || t.includes("wifi") || t.includes("إنترنت")) return <Wifi size={32} />;
  if (t.includes("تلفزيون") || t.includes("tv") || t.includes("شاشة")) return <Tv size={32} />;
  
  // Food & Drink
  if (t.includes("إفطار") || t.includes("breakfast") || t.includes("فطور")) return <Coffee size={32} />;
  if (t.includes("مطعم") || t.includes("food") || t.includes("عشاء") || t.includes("غداء")) return <Utensils size={32} />;
  if (t.includes("مشروبات") || t.includes("بار") || t.includes("bar") || t.includes("drinks") || t.includes("ميني بار")) return <Wine size={32} />;
  
  // Wellness & Pool
  if (t.includes("سباحة") || t.includes("pool") || t.includes("مسبح")) return <Waves size={32} />;
  if (t.includes("جيم") || t.includes("رياضي") || t.includes("gym") || t.includes("لياقة")) return <Dumbbell size={32} />;
  if (t.includes("سبا") || t.includes("spa") || t.includes("عافية") || t.includes("wellness") || t.includes("ساونا") || t.includes("جاكوزي")) return <Sparkles size={32} />;
  if (t.includes("حمام") || t.includes("bath") || t.includes("شاور")) return <Bath size={32} />;

  // Services
  if (t.includes("موقف") || t.includes("parking") || t.includes("سيارات")) return <ParkingCircle size={32} />;
  if (t.includes("خدمة غرف") || t.includes("room service") || t.includes("استقبال")) return <ConciergeBell size={32} />;
  if (t.includes("غسيل") || t.includes("laundry") || t.includes("تنظيف")) return <WashingMachine size={32} />;
  if (t.includes("تكييف") || t.includes("ac") || t.includes("هواء")) return <Wind size={32} />;
  
  // Leisure & Nature
  if (t.includes("شاطئ") || t.includes("beach") || t.includes("بحر") || t.includes("مظلة")) return <Umbrella size={32} />;
  if (t.includes("حديقة") || t.includes("garden") || t.includes("أشجار") || t.includes("trees")) return <Trees size={32} />;
  if (t.includes("ألعاب") || t.includes("games") || t.includes("ترفيه")) return <Gamepad2 size={32} />;

  // Family & Others
  if (t.includes("عائلية") || t.includes("family") || t.includes("أطفال") || t.includes("kids")) return <Baby size={32} />;
  if (t.includes("لغات") || t.includes("languages") || t.includes("ترجمة")) return <Languages size={32} />;
  if (t.includes("أمان") || t.includes("security") || t.includes("حراسة")) return <ShieldCheck size={32} />;
  if (t.includes("لا يدخن") || t.includes("non-smoking")) return <CigaretteOff size={32} />;

  return <Zap size={32} />; // Default
};

export default function HotelPage() {
  const { cityId, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(),
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(new Date().getTime() + 86400000 * 3),
  });

  useEffect(() => {
    if (!id || !cityId) return;
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        const hotelRef = doc(db, "cities", cityId, "hotels", id);
        const hotelSnap = await getDoc(hotelRef);
        
        if (!hotelSnap.exists()) { 
          setLoading(false); 
          return; 
        }
        
        const hotelData = hotelSnap.data();
        const hotelImages = 
          Array.isArray(hotelData.images) && hotelData.images.length > 0 ? hotelData.images :
          Array.isArray(hotelData.Hotel_img) && hotelData.Hotel_img.length > 0 ? hotelData.Hotel_img :
          hotelData.image ? [hotelData.image] :
          ["https://picsum.photos/seed/hotel/800/600"];

        const hotelAmenities =
          Array.isArray(hotelData.amenities) && hotelData.amenities.length > 0 ? hotelData.amenities :
          Array.isArray(hotelData['المرافق']) && hotelData['المرافق'].length > 0 ? hotelData['المرافق'] :
          [];

        setHotel({ 
          id: hotelSnap.id, 
          cityId, 
          ...hotelData, 
          images: hotelImages,
          amenities: hotelAmenities
        } as Hotel);

        // Fetch Rooms (Robust multi-path approach)
        try {
          let allRoomDocs = new Map();

          // 1. Nested paths
          const nestedPaths = ["rooms", "Rooms", "room", "Room"];
          for (const path of nestedPaths) {
            try {
              const ref = collection(db, "cities", cityId, "hotels", id, path);
              const snap = await getDocs(ref);
              snap.docs.forEach(doc => allRoomDocs.set(doc.id, doc));
            } catch (e) { /* ignore */ }
          }

          // 2. Root paths with hotelId filtering
          const rootPaths = ["rooms", "Rooms", "room", "Room"];
          for (const path of rootPaths) {
            try {
              const rootQuery = query(collection(db, path), where("hotelId", "==", id));
              const snap = await getDocs(rootQuery);
              snap.docs.forEach(doc => allRoomDocs.set(doc.id, doc));
              
              // Try also with Hotel_id just in case
              const rootQuery2 = query(collection(db, path), where("Hotel_id", "==", id));
              const snap2 = await getDocs(rootQuery2);
              snap2.docs.forEach(doc => allRoomDocs.set(doc.id, doc));
            } catch (e) { /* ignore */ }
          }

          // 3. Collection Group as fallback
          try {
            const cgQuery = query(collectionGroup(db, "rooms"), where("hotelId", "==", id));
            const cgSnap = await getDocs(cgQuery);
            cgSnap.docs.forEach(doc => allRoomDocs.set(doc.id, doc));
          } catch (e) { /* ignore index errors */ }
          try {
            const cgQuery2 = query(collectionGroup(db, "Rooms"), where("hotelId", "==", id));
            const cgSnap2 = await getDocs(cgQuery2);
            cgSnap2.docs.forEach(doc => allRoomDocs.set(doc.id, doc));
          } catch (e) { /* ignore index errors */ }

          let roomsData: Room[] = Array.from(allRoomDocs.values()).map(doc => {
            const data = doc.data() as any;
            return { 
              id: doc.id, 
              ...data,
              title: data.Room_name || data.title || data.name || data.Room_type || 'غرفة غير مسمى',
              price: parseFloat(data.السعر || data.price || data.Room_price || 0),
              images: Array.isArray(data.Room_img) ? data.Room_img : (Array.isArray(data.images) ? data.images : [data.image || data.Room_image || "https://picsum.photos/seed/room/800/600"]),
              description: data.description || data.Room_description || data.الإطلالة || data.view || 'لا يوجد وصف متاح حالياً لهذه الغرفة.',
              guests: parseInt(data.guests || data.Room_guests || data.capacity || 2),
              bed: data.bed || data.Room_bed || data.bedType || 'غير محدد',
              level: data.level || data.Room_level || data.الإطلالة || data.view || 'ستاندرد'
            };
          });

          if (roomsData.length === 0) {
            console.error("❌ Final attempt: No rooms found for hotel:", id);
          } else {
            console.log(`✅ Successfully loaded ${roomsData.length} rooms for hotel:`, id);
          }

          setRooms(roomsData);
        } catch (roomErr) {
          console.error("Error fetching rooms:", roomErr);
        }

        // Fetch Bookings for availability check
        try {
          const qBookings = query(
            collection(db, "bookings"), 
            where("hotelId", "==", id)
          );
          const bookingsSnap = await getDocs(qBookings);
          const confirmedBookings = bookingsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((b: any) => b.status === "confirmed");
          
          setBookings(confirmedBookings);
        } catch (bookingErr) {
          console.error("Error fetching bookings:", bookingErr);
        }

        setLoading(false);
      } catch (error) { 
        console.error("Error fetching hotel data:", error); 
        setLoading(false); 
      }
    };
    fetchHotelData();
  }, [id, cityId]);

  useEffect(() => {
    let unsubFavs: any;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubFavs = getFavoritesListener(user.uid, (favs) => {
          setFavorites(favs.map(f => f.hotelId || f.id));
        });
      } else {
        setFavorites([]);
        if (unsubFavs) unsubFavs();
      }
    });

    return () => {
      unsubAuth();
      if (unsubFavs) unsubFavs();
    };
  }, []);

  const handleToggleFavorite = async () => {
    if (!auth.currentUser || !hotel) { 
      showError("تنبيه", "يرجى تسجيل الدخول أولاً"); 
      return; 
    }
    try {
      const isAdded = await toggleFavorite(auth.currentUser.uid, hotel);
      if (isAdded) {
        showSuccess("تم!", "تمت إضافة الفندق للمفضلة");
      } else {
        showInfo("تنبيه", "تمت إزالة الفندق من المفضلة");
      }
    } catch (e) { 
      showError("خطأ", "حدث خطأ ما أثناء تحديث المفضلة"); 
    }
  };

  const nextSlide = () => hotel && setCurrentSlide((prev) => (prev + 1) % hotel.images.length);
  const prevSlide = () => hotel && setCurrentSlide((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);

  const availableRooms = useMemo(() => {
    if (!date.from || !date.to) return rooms;
    const selectedFrom = date.from.getTime();
    const selectedTo = date.to.getTime();
    return rooms.filter(room => {
      const isBooked = bookings.some(booking => {
        if (booking.roomId !== room.id) return false;
        const bFrom = new Date(booking.checkIn).getTime();
        const bTo = new Date(booking.checkOut).getTime();
        return (bFrom < selectedTo) && (bTo > selectedFrom);
      });
      return !isBooked;
    });
  }, [rooms, bookings, date]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" /></div>;
  if (!hotel) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col gap-0 pb-40">
      
      {/* 1. Header Section */}
      <section className="w-full bg-white pt-10 pb-8 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                <Link to="/" className="hover:text-[#4F46E5]">الرئيسية</Link>
                <ChevronLeft size={10} />
                <span className="text-[#4F46E5]">{hotel.name}</span>
              </nav>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter">{hotel.name}</h1>
              {hotel.mapUrl && (
                <button
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-2 text-sm font-black text-[#4F46E5] hover:text-[#0f0b18] hover:underline underline-offset-4 transition-all group w-fit"
                >
                  <MapPin size={16} className="group-hover:scale-110 transition-transform" />
                  <span>{hotel.location || 'عرض الموقع على الخريطة'}</span>
                  <ExternalLink size={13} className="opacity-60" />
                </button>
              )}
              {!hotel.mapUrl && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500">
                  <MapPin size={16} className="text-[#4F46E5]" />
                  <span>{hotel.location}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500">
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star size={16} className="fill-current" /><Star size={16} className="fill-current" /><Star size={16} className="fill-current" /><Star size={16} className="fill-current" /><Star size={16} className="fill-current" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleToggleFavorite} className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-all", favorites.includes(hotel.id) ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-400 border-gray-200 hover:border-red-500 hover:text-red-500")}><Heart size={24} className={cn(favorites.includes(hotel.id) && "fill-current")} /></button>
              <Button 
                onClick={() => document.getElementById('rooms-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="action-button h-14 px-12 rounded-2xl text-lg font-black"
              >
                احجز الآن
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Slider Section */}
      <section className="w-full mt-8 mb-8 overflow-hidden">
        <div className="container mx-auto px-4">
           <div className="relative h-[500px] rounded-[3rem] overflow-hidden group shadow-2xl bg-gray-100 border border-gray-100">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSlide}
                  src={hotel.images[currentSlide]}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.8 }}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => { setLightboxIndex(currentSlide); setIsLightboxOpen(true); }}
                />
              </AnimatePresence>
              
              <button onClick={prevSlide} className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white"><ChevronRightIcon size={28} /></button>
              <button onClick={nextSlide} className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white"><ChevronLeftIcon size={28} /></button>
              
              <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs font-black">
                {currentSlide + 1} / {hotel.images.length}
              </div>

              <button onClick={() => setIsLightboxOpen(true)} className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl text-sm font-black text-gray-900 flex items-center gap-2 shadow-xl hover:bg-[#4F46E5] hover:text-white transition-all"><ExternalLink size={16} /> تصفح كل الصور</button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                 {hotel.images.map((_, idx) => (
                   <button key={idx} onClick={() => setCurrentSlide(idx)} className={cn("w-2 h-2 rounded-full transition-all", currentSlide === idx ? "bg-white w-8" : "bg-white/40")} />
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* 3. Description Section */}
      <section className="w-full py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
             <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#4F46E5]">
                   <Info size={28} />
                   <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">وصف الفندق والخدمات</h2>
                </div>
                <p className="text-base md:text-xl lg:text-[25px] text-gray-600 leading-[1.7] font-medium text-right">{hotel.description}</p>
             </div>
          </div>
        </div>
      </section>

      {/* 4. Amenities & Ratings Section - DYNAMIC AMENITIES */}
      <section className="w-full py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Dynamic Amenities Grid */}
            <div className="lg:col-span-7 space-y-8">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#f0eef5] rounded-xl flex items-center justify-center text-[#4F46E5]"><Waves size={26} /></div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">المرافق والمميزات</h2>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {hotel.amenities.map((amenity, i) => (
                    <div key={i} className="flex flex-col items-center gap-4 p-10 bg-white rounded-[2rem] border border-gray-100 text-center shadow-sm hover:border-[#e3dff0] transition-colors group">
                       <div className="text-[#4F46E5] group-hover:scale-110 transition-transform">
                          {getAmenityIcon(amenity)}
                       </div>
                       <span className="font-black text-xs text-gray-900">{amenity}</span>
                    </div>
                  ))}
                  {hotel.amenities.length === 0 && (
                    <div className="col-span-2 py-10 text-center text-gray-400 font-bold">لا توجد مرافق مسجلة</div>
                  )}
               </div>
            </div>

            {/* Guest Ratings Block - Using hotel.rating and hotel.reviews from DB */}
            <div className="lg:col-span-5 space-y-8">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#f0eef5] rounded-xl flex items-center justify-center text-[#4F46E5]"><Star size={26} /></div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">تقييمات الضيوف</h2>
               </div>
               <div className="bg-[#1e2235] text-white p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8 relative z-10">
                     <div className="text-right">
                        <p className="text-3xl font-black">استثنائي</p>
                        <p className="text-[10px] text-gray-400 font-bold opacity-80 uppercase tracking-widest mt-1">{(hotel.reviewsCount || hotel.reviews || 0)} تقييم</p>
                     </div>
                     <div className="w-20 h-20 bg-[#4F46E5] rounded-[1.5rem] flex items-center justify-center text-4xl font-black border border-white/10 shadow-lg">
                        {hotel.rating.toFixed(1)}
                     </div>
                  </div>
                  <div className="space-y-6 relative z-10">
                    {[
                      { label: "الموقع الاستراتيجي", score: 9.8, color: "bg-blue-500" },
                      { label: "جودة الخدمات", score: 9.5, color: "bg-[#2d2040]" },
                      { label: "النظافة والتعقيم", score: 9.2, color: "bg-sky-400" }
                    ].map((s, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <span>{s.label}</span>
                            <span className="text-[#4a3f5c]">{s.score}</span>
                         </div>
                         <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s.score * 10}%` }} transition={{ duration: 1.2 }} className={cn("h-full", s.color)} />
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Rooms Section */}
      <section id="rooms-section" className="w-full py-8">
        <div className="container mx-auto px-4">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#f0eef5] rounded-xl flex items-center justify-center text-[#4F46E5]"><BedDouble size={26} /></div>
              <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter">خيارات الإقامة المتاحة</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableRooms.length > 0 ? (
                availableRooms.map((room: any) => (
                  <div key={room.id} className="modern-card group flex flex-col">
                    <div className="h-64 overflow-hidden relative">
                      <img src={(room.Room_img && room.Room_img[0]) || room.image || room.images?.[0] || "https://picsum.photos/seed/room/800/600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 right-4 badge-indigo bg-white/90 backdrop-blur-md w-fit flex items-center gap-2">
                         <Zap size={14} className="text-[#4F46E5] fill-current" />
                         <span className="font-black text-xs uppercase tracking-widest">{room.level || room.الإطلالة || 'ستاندرد'}</span>
                      </div>
                    </div>
                    <div className="p-8 flex-grow flex flex-col">
                      <h3 className="font-black text-xl md:text-2xl text-[#151e63] mb-2">{room.Room_name || room.title || 'غرفة غير مسمى'}</h3>
                      <p className="text-sm text-gray-500 font-bold mb-4 line-clamp-2">{room.description || room.الإطلالة || 'لا يوجد وصف متاح حالياً لهذه الغرفة.'}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="flex items-center gap-1 text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><Users size={14} className="text-[#4F46E5]" /> {room.guests || 2} ضيوف</span>
                        <span className="flex items-center gap-1 text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><BedDouble size={14} className="text-[#4F46E5]" /> {room.bed || 'غير محدد'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-[#d6d6e7]/30 mt-auto">
                         <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-[#151e63]">EGP {room.السعر || room.price}</span>
                            <span className="text-xs text-gray-400 font-bold">/ ليلة</span>
                         </div>
                         <Button 
                           onClick={() => navigate(`/hotel/${cityId}/${hotel.id}/room/${room.id}${window.location.search}`)}
                           variant="ghost" 
                           className="text-[#4F46E5] font-black hover:bg-[#f0eef5] gap-2 rounded-xl"
                         >
                           حجز الآن <ArrowRight className="rotate-180" size={18} />
                         </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                   <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm">
                      <BedDouble size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 mb-2">لا توجد غرف متاحة حالياً</h3>
                   <p className="text-gray-500 font-medium max-w-md mx-auto">عذراً، هذا الفندق لم يقم بإضافة غرف متاحة للحجز بعد. يمكنك التحقق من فنادق أخرى في نفس المدينة.</p>
                   <Button onClick={() => navigate(`/city/${hotel.city}`)} variant="outline" className="mt-8 rounded-xl border-[#d0cae5] text-[#4F46E5] font-black hover:bg-[#f0eef5]">استكشاف فنادق أخرى في {hotel.city}</Button>
                </div>
              )}
           </div>

        </div>
      </section>

      <Lightbox images={hotel.images} isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} initialIndex={lightboxIndex} />

      {/* ─── Map Lightbox ───────────────────────────────────────── */}
      <AnimatePresence>
        {isMapOpen && hotel.mapUrl && (
          <motion.div
            key="map-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={() => setIsMapOpen(false)}
          >
            {/* Blurred backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f0eef5] rounded-xl flex items-center justify-center text-[#4F46E5]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">موقع الفندق</p>
                    <p className="font-black text-gray-900 text-sm">{hotel.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={(() => {
                      const rawUrl = hotel.mapUrl || "";
                      if (rawUrl.includes("<iframe")) {
                        const match = rawUrl.match(/src="([^"]+)"/);
                        return match ? match[1] : rawUrl;
                      }
                      return rawUrl;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-black text-[#4F46E5] bg-[#f0eef5] hover:bg-[#e3dff0] px-4 py-2 rounded-xl transition-all"
                  >
                    <ExternalLink size={14} />
                    فتح في جوجل ماب
                  </a>
                  <button
                    onClick={() => setIsMapOpen(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Map iframe — extracts src if user pasted a full <iframe> tag */}
              <div className="w-full h-[500px] bg-gray-100">
                {(() => {
                  const rawUrl = hotel.mapUrl || "";
                  let cleanSrc = rawUrl;
                  
                  // Extract src if it's a full iframe tag
                  if (rawUrl.includes("<iframe")) {
                    const match = rawUrl.match(/src="([^"]+)"/);
                    if (match && match[1]) cleanSrc = match[1];
                  }

                  // Use location search as fallback if not an embed URL
                  const finalSrc = cleanSrc.includes('/embed') || cleanSrc.includes('pb=')
                    ? cleanSrc
                    : `https://maps.google.com/maps?q=${encodeURIComponent(hotel.location || hotel.name)}&output=embed`;

                  return (
                    <iframe
                      src={finalSrc}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`موقع ${hotel.name}`}
                    />
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                <Navigation size={14} className="text-[#2d2040]" />
                <span className="text-xs font-bold text-gray-500">{hotel.location}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
