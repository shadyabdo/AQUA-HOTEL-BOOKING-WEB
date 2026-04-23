import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  XCircle, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Users, 
  CreditCard, 
  Hash,
  Heart,
  Star,
  Trash2,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db, auth, getFavoritesListener, toggleFavorite } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Booking {
  id: string;
  roomTitle: string;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  guests: number;
  price?: number;
  createdAt: string;
}

interface Favorite {
  id: string;
  hotelId: string;
  cityId: string;
  name: string;
  image: string;
  location: string;
  city: string;
  rating: number;
  price: number;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // 1. Listen to Bookings
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubBookings = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(data);
      if (activeTab === 'bookings') setLoading(false);
    });

    // 2. Listen to Favorites
    const unsubFavs = getFavoritesListener(auth.currentUser.uid, (favs) => {
      setFavorites(favs as Favorite[]);
      if (activeTab === 'favorites') setLoading(false);
    });

    return () => {
      unsubBookings();
      unsubFavs();
    };
  }, [activeTab]);

  const handleCancel = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
      toast.success("تم إلغاء الحجز بنجاح");
    } catch (error) {
      toast.error("خطأ في إلغاء الحجز");
    }
  };

  const handleRemoveFavorite = async (fav: Favorite) => {
    if (!auth.currentUser) return;
    try {
      await toggleFavorite(auth.currentUser.uid, { id: fav.hotelId });
      toast.info("تمت الإزالة من المفضلة");
    } catch (e) {
      toast.error("خطأ في الإزالة");
    }
  };

  if (!auth.currentUser) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-40">
      <div className="bg-white border-b border-[#d6d6e7]/50 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-black text-[#151e63] tracking-tighter mb-10">حسابي</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={cn(
                "px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2",
                activeTab === 'bookings' ? "bg-[#4F46E5] text-white shadow-lg shadow-[#e3dff0]" : "bg-[#f5f5fa] text-[#777aaf] hover:bg-[#e8e5f0] hover:text-[#4F46E5]"
              )}
            >
              <Clock size={18} /> حجوزاتي
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={cn(
                "px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2",
                activeTab === 'favorites' ? "bg-red-500 text-white shadow-lg shadow-red-100" : "bg-[#f5f5fa] text-[#777aaf] hover:bg-red-50 hover:text-red-500"
              )}
            >
              <Heart size={18} /> المفضلة
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTab === 'bookings' ? (
          /* Bookings Section */
          <div className="space-y-8">
            {bookings.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-[#d6d6e7]">
                <p className="text-xl font-black text-[#777aaf]">لا يوجد لديك حجوزات حالية</p>
                <Button variant="link" onClick={() => navigate("/rooms")} className="text-[#4F46E5] mt-4 font-black">ابدأ البحث عن فندقك القادم</Button>
              </div>
            ) : (
              bookings.map((booking) => (
                <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-[#d6d6e7]/50 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-8 flex-grow">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-3xl font-black text-[#151e63] mb-2">{booking.roomTitle}</h3>
                          <div className="flex items-center gap-2 text-sm font-bold text-[#777aaf]">
                            <MapPin size={16} className="text-[#4F46E5]" /> <span>أكوا ريزورت، الوجهة الرئيسية</span>
                          </div>
                        </div>
                        <span className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          booking.status === 'confirmed' ? "bg-green-100 text-green-700" :
                          booking.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        )}>
                          {booking.status === 'confirmed' ? "مؤكد" : booking.status === 'pending' ? "قيد الانتظار" : "ملغي"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 border-y border-[#d6d6e7]/30">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-[#e8e5f0] flex flex-col items-center justify-center text-[#4F46E5] shrink-0 border border-[#e3dff0]">
                             <span className="text-[10px] font-black uppercase mb-0.5">{format(new Date(booking.checkIn), "MMM", { locale: ar })}</span>
                             <span className="text-xl font-black">{format(new Date(booking.checkIn), "d")}</span>
                          </div>
                          <div><p className="text-[10px] uppercase text-[#777aaf] font-black mb-1">الوصول</p><p className="font-black text-[#151e63]">{format(new Date(booking.checkIn), "EEEE, d MMM", { locale: ar })}</p></div>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-[#e8e5f0] flex flex-col items-center justify-center text-[#4F46E5] shrink-0 border border-[#e3dff0]">
                             <span className="text-[10px] font-black uppercase mb-0.5">{format(new Date(booking.checkOut), "MMM", { locale: ar })}</span>
                             <span className="text-xl font-black">{format(new Date(booking.checkOut), "d")}</span>
                          </div>
                          <div><p className="text-[10px] uppercase text-[#777aaf] font-black mb-1">المغادرة</p><p className="font-black text-[#151e63]">{format(new Date(booking.checkOut), "EEEE, d MMM", { locale: ar })}</p></div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div><p className="text-[10px] uppercase text-[#777aaf] font-black mb-1">الضيوف</p><p className="font-black text-[#151e63]">{booking.guests} أشخاص</p></div>
                           <div><p className="text-[10px] uppercase text-[#777aaf] font-black mb-1">الإجمالي</p><p className="text-xl font-black text-[#4F46E5]">EGP {booking.price}</p></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#fcfcfd] p-8 flex flex-col justify-center gap-4 min-w-[220px] border-r border-[#d6d6e7]/50">
                       <p className="text-[10px] font-black text-[#777aaf] text-center uppercase tracking-widest">#{booking.id.slice(0, 8)}</p>
                       <Button variant="outline" className="h-12 rounded-xl border-[#d6d6e7] font-bold text-[#151e63] hover:bg-white">تفاصيل الحجز</Button>
                       {booking.status !== 'cancelled' && (
                         <Button variant="ghost" onClick={() => handleCancel(booking.id)} className="text-red-500 hover:bg-red-50 font-bold">إلغاء الحجز</Button>
                       )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          /* Favorites Section */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {favorites.length === 0 ? (
              <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-[#d6d6e7]">
                <p className="text-xl font-black text-[#777aaf]">قائمة المفضلة فارغة</p>
                <Button variant="link" onClick={() => navigate("/rooms")} className="text-red-500 mt-4 font-black">اكتشف الفنادق وأضفها هنا</Button>
              </div>
            ) : (
              favorites.map((fav) => (
                <motion.div key={fav.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modern-card group">
                  <div className="h-64 relative overflow-hidden">
                    <img src={fav.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <button onClick={() => handleRemoveFavorite(fav)} className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                       <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="p-8">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-black text-[#151e63]">{fav.name}</h3>
                        <div className="flex items-center gap-1 text-[#ffb700]"><Star size={14} className="fill-current" /><span className="text-sm font-black text-[#151e63]">{fav.rating}</span></div>
                     </div>
                     <p className="text-xs font-bold text-[#777aaf] mb-6 flex items-center gap-2"><MapPin size={16} className="text-[#4F46E5]" /> {fav.city} • {fav.location}</p>
                     <div className="flex justify-between items-end border-t border-[#d6d6e7]/30 pt-6">
                        <div><p className="text-[10px] font-black text-[#777aaf] uppercase">يبدأ من</p><p className="text-2xl font-black text-[#4F46E5]">EGP {fav.price}</p></div>
                        <Button onClick={() => navigate(`/hotel/${fav.cityId}/${fav.hotelId}`)} className="h-12 rounded-xl bg-[#151e63] text-white hover:bg-[#4F46E5] font-bold px-6">حجز الآن</Button>
                     </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
