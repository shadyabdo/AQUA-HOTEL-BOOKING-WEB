import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  Users, 
  MapPin, 
  Star, 
  Search, 
  SlidersHorizontal,
  ChevronLeft,
  ArrowRight,
  Info,
  ShieldCheck,
  Zap,
  Check,
  Heart,
  Wifi,
  Waves,
  Coffee,
  Dumbbell,
  ParkingCircle,
  Wind,
  Tv,
  Utensils,
  Wine,
  Sparkles,
  Baby,
  Umbrella,
  Trees,
  ConciergeBell
} from "lucide-react";

// Utility to map amenity text to icons
const getAmenityIcon = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("واي فاي") || t.includes("wifi")) return <Wifi size={12} />;
  if (t.includes("سباحة") || t.includes("pool") || t.includes("مسبح")) return <Waves size={12} />;
  if (t.includes("إفطار") || t.includes("breakfast")) return <Coffee size={12} />;
  if (t.includes("جيم") || t.includes("gym")) return <Dumbbell size={12} />;
  if (t.includes("موقف") || t.includes("parking")) return <ParkingCircle size={12} />;
  if (t.includes("تكييف") || t.includes("ac")) return <Wind size={12} />;
  if (t.includes("مطعم") || t.includes("food")) return <Utensils size={12} />;
  if (t.includes("مشروبات") || t.includes("bar")) return <Wine size={12} />;
  if (t.includes("سبا") || t.includes("spa")) return <Sparkles size={12} />;
  if (t.includes("عائلية") || t.includes("family")) return <Baby size={12} />;
  if (t.includes("شاطئ") || t.includes("beach")) return <Umbrella size={12} />;
  if (t.includes("حديقة") || t.includes("garden")) return <Trees size={12} />;
  return <Zap size={12} />;
};
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { db, handleFirestoreError, OperationType, toggleFavorite, getFavoritesListener, auth, getAllHotels } from "@/src/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { showError, showSuccess, showInfo } from "@/src/lib/swal";

interface Hotel {
  id: string;
  cityId: string;
  name: string;
  description: string;
  images: string[];
  price: any; // Using any because Firestore data might be string or number
  rating: number;
  location: string;
  city: string;
  amenities: string[];
  reviewsCount?: number;
  Hotel_img?: string[];
  image?: string;
  'المرافق'?: string[];
}

export default function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(),
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(new Date().getTime() + 86400000 * 3),
  });
  
  const [destination] = useState(searchParams.get("destination") || "");
  const [guestsCount] = useState(searchParams.get("guests") || "2 بالغين · 1 غرفة");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const hotelsData = await getAllHotels();
        setHotels(hotelsData.map(hotel => ({
          ...hotel,
          reviewsCount: hotel.reviewsCount || Math.floor(Math.random() * 500) + 100
        })) as Hotel[]);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "hotels_fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleToggleFavorite = async (e: React.MouseEvent, hotel: Hotel) => {
    e.stopPropagation();
    e.preventDefault();
    if (!auth.currentUser) {
      showError("تنبيه", "يرجى تسجيل الدخول لإضافة الفندق للمفضلة");
      return;
    }

    try {
      const isAdded = await toggleFavorite(auth.currentUser.uid, hotel);
      if (isAdded) {
        showSuccess("تم!", "تمت إضافة الفندق للمفضلة");
      } else {
        showInfo("تنبيه", "تمت الإزالة من المفضلة");
      }
    } catch (error) {
      showError("خطأ", "حدث خطأ أثناء تحديث المفضلة");
    }
  };

  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const matchesDestination = !destination || 
        (hotel.name?.toLowerCase().includes(destination.toLowerCase())) || 
        (hotel.city?.toLowerCase().includes(destination.toLowerCase()));
        
      const hPrice = Number(hotel.price) || 0;
      const hRating = Number(hotel.rating) || 5; // Default to 5 stars if not provided

      const matchesPrice = hPrice >= priceRange[0] && hPrice <= priceRange[1];
      const matchesRating = hRating >= minRating;
      
      return matchesDestination && matchesPrice && matchesRating;
    });
  }, [hotels, destination, priceRange, minRating]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32">
      {/* Modern Search Summary */}
      <div className="bg-white border-b border-[#d6d6e7]/50 pt-10 pb-10">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                   <h1 className="text-2xl md:text-4xl font-black text-[#151e63] mb-2">{destination || "كل الوجهات"}</h1>
                   <div className="flex items-center gap-4 text-[#777aaf] font-bold text-sm">
                      <div className="flex items-center gap-1"><CalendarIcon size={16} /> {date.from && format(date.from, "d MMM")} — {date.to && format(date.to, "d MMM")}</div>
                      <div className="w-1 h-1 bg-[#d6d6e7] rounded-full" />
                      <div className="flex items-center gap-1"><Users size={16} /> {guestsCount}</div>
                   </div>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-[#d6d6e7] font-bold text-[#4F46E5] gap-2 h-12 px-6 hover:bg-[#e8e5f0]"
                  onClick={() => navigate("/")}
                >
                   <Search size={18} /> تعديل البحث
                </Button>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        {/* Modern Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-[#d6d6e7]/50 shadow-sm sticky top-32">
            <div className="flex items-center gap-3 mb-8">
              <SlidersHorizontal className="text-[#4F46E5]" size={20} />
              <h3 className="text-xl font-black text-[#151e63]">تصفية متقدمة</h3>
            </div>

            <div className="space-y-8">
              {/* Budget Filter */}
              <div className="space-y-4">
                <p className="text-xs font-black text-[#777aaf] uppercase tracking-widest mb-4">الميزانية لليلة الواحدة</p>
                <div className="space-y-2">
                  {[0, 1000, 2500, 5000].map((val, i) => (
                    <label key={i} className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl hover:bg-[#e8e5f0] transition-all border border-transparent hover:border-[#C7D2FE]">
                      <div className="bg-white rounded-lg flex items-center justify-center">
                        <Checkbox 
                          onCheckedChange={(checked) => checked ? setPriceRange([val, 10000]) : setPriceRange([0, 10000])}
                          checked={priceRange[0] === val && priceRange[1] === 10000} 
                        />
                      </div>
                      <span className="text-sm font-bold text-[#5a5e9a] group-hover:text-[#4F46E5] transition-colors">
                         {val === 0 ? "أي ميزانية" : `أكثر من ${val} EGP`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-[#d6d6e7]/50 my-6" />

              {/* Rating Filter */}
              <div className="space-y-4">
                <p className="text-xs font-black text-[#777aaf] uppercase tracking-widest mb-4">تقييم الضيوف</p>
                <div className="space-y-2">
                  {[5, 4, 3].map((r, i) => (
                    <label key={i} className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl hover:bg-[#e8e5f0] transition-all border border-transparent hover:border-[#C7D2FE]">
                      <div className="bg-white rounded-lg flex items-center justify-center">
                        <Checkbox 
                          onCheckedChange={(checked) => checked ? setMinRating(r) : setMinRating(0)}
                          checked={minRating === r}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[#5a5e9a] group-hover:text-[#4F46E5] transition-colors">
                        <div className="bg-[#4F46E5] text-white px-2 py-0.5 rounded-lg text-xs font-black">{r}+</div>
                        <span>ممتاز</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Results List */}
        <main className="lg:col-span-9 space-y-8">
          <div className="flex justify-between items-center mb-4">
             <p className="text-sm font-bold text-[#777aaf]">تم العثور على {filteredHotels.length} فندقاً</p>
             <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="font-bold text-[#4F46E5] bg-[#e8e5f0] rounded-lg">الأكثر رواجاً</Button>
                <Button variant="ghost" size="sm" className="font-bold text-[#777aaf] rounded-lg">الأقل سعراً</Button>
             </div>
          </div>

          {loading ? (
             <div className="flex justify-center py-40"><div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-8">
              {filteredHotels.map((hotel, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={hotel.id} 
                  className="modern-card group flex flex-col md:flex-row h-full md:h-[340px]"
                >
                  <div className="w-full md:w-[320px] lg:w-[380px] h-72 md:h-auto relative shrink-0 overflow-hidden">
                    <img src={(hotel.Hotel_img && hotel.Hotel_img[0]) || hotel.images?.[0] || hotel.image || "https://picsum.photos/seed/hotel/800/600"} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <button 
                      onClick={(e) => handleToggleFavorite(e, hotel)}
                      className={cn(
                        "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10",
                        favorites.includes(hotel.id) 
                          ? "bg-red-500 text-white" 
                          : "bg-white/90 backdrop-blur-md text-[#777aaf] hover:text-red-500 hover:scale-110"
                      )}
                    >
                        <Heart size={20} className={cn(favorites.includes(hotel.id) && "fill-current")} />
                    </button>
                    <div className="absolute bottom-4 left-4">
                       <span className="badge-indigo bg-white/90 backdrop-blur-md">موصى به</span>
                    </div>
                  </div>
                  
                  <div className="flex-grow p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-[#4F46E5]">
                           <Star size={12} className="fill-current" />
                           <Star size={12} className="fill-current" />
                           <Star size={12} className="fill-current" />
                           <Star size={12} className="fill-current" />
                           <Star size={12} className="fill-current" />
                        </div>
                        <h3 className="text-3xl font-black text-[#151e63] group-hover:text-[#4F46E5] transition-colors cursor-pointer" onClick={() => navigate(`/hotel/${hotel.cityId}/${hotel.id}`)}>{hotel.name}</h3>

                      </div>
                      
                      <div className="flex items-center gap-3 bg-[#e8e5f0] p-3 rounded-2xl border border-[#C7D2FE]/30">
                        <div className="text-left">
                          <p className="font-black text-sm text-[#0f0b18]">رائع</p>
                          <p className="text-[10px] text-[#777aaf] font-bold">{(hotel.reviewsCount || hotel.reviews || 0)} تقييم</p>
                        </div>
                        <div className="bg-[#4F46E5] text-white font-black text-xl w-fit h-fit min-w-[3rem] min-h-[3rem] px-3 py-2 flex items-center justify-center rounded-xl shadow-lg shadow-[#e3dff0]">
                          {(hotel.rating || 4.5).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 my-4">
                      {(hotel.amenities || hotel['المرافق'] || []).slice(0, 3).map((a: string, i: number) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-[#f5f5fa] text-[#5a5e9a] text-[11px] font-bold rounded-lg border border-[#d6d6e7]/30">
                          {getAmenityIcon(a)}
                          {a}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex justify-between items-end pt-8 border-t border-[#d6d6e7]/30">
                      <div>
                        <div className="flex items-center gap-2 text-[#059669] text-xs font-black mb-2">
                           <ShieldCheck size={14} /> إلغاء مجاني متاح
                        </div>
                        {hotel.price && parseFloat(String(hotel.price)) > 0 ? (
                          <>
                            <div className="text-xs text-[#777aaf] font-bold">السعر لـ 3 ليالٍ</div>
                            <div className="text-3xl font-black text-[#151e63] tracking-tighter">EGP {(parseFloat(String(hotel.price)) || 0) * 3}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-[#777aaf] font-bold">الأسعار متوفرة</div>
                            <div className="text-xl font-black text-[#4F46E5] tracking-tighter">عرض الأسعار بالداخل</div>
                          </>
                        )}
                      </div>
                      <Button 
                        onClick={() => navigate(`/hotel/${hotel.cityId}/${hotel.id}${window.location.search}`)}
                        className="action-button px-10 rounded-2xl"
                      >
                        عرض الغرف <ChevronLeft size={20} className="mr-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
