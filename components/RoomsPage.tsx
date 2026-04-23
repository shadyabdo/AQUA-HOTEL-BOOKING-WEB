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
  ConciergeBell,
  CigaretteOff,
  Plane,
  Car,
  Clock3,
  WashingMachine,
  Bath,
  X,
  ChevronDown
} from "lucide-react";

// Utility to map amenity text to icons
const getAmenityIcon = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("واي فاي") || t.includes("wifi") || t.includes("إنترنت") || t.includes("انترنت")) return <Wifi size={12} />;
  if (t.includes("تلفزيون") || t.includes("tv") || t.includes("شاشة")) return <Tv size={12} />;
  if (t.includes("إفطار") || t.includes("فطار") || t.includes("breakfast") || t.includes("فطور")) return <Coffee size={12} />;
  if (t.includes("شاي") || t.includes("قهوة") || t.includes("tea") || t.includes("coffee") || t.includes("آلة") || t.includes("الة")) return <Coffee size={12} />;
  if (t.includes("مطعم") || t.includes("food") || t.includes("عشاء") || t.includes("غداء")) return <Utensils size={12} />;
  if (t.includes("مشروبات") || t.includes("بار") || t.includes("bar") || t.includes("ميني بار")) return <Wine size={12} />;
  if (t.includes("مطار") || t.includes("airport") || t.includes("طيران")) return <Plane size={12} />;
  if (t.includes("نقل") || t.includes("transfer") || t.includes("توصيل") || t.includes("ليموزين")) return <Car size={12} />;
  if (t.includes("سباحة") || t.includes("pool") || t.includes("مسبح")) return <Waves size={12} />;
  if (t.includes("جيم") || t.includes("رياضي") || t.includes("gym") || t.includes("لياقة")) return <Dumbbell size={12} />;
  if (t.includes("سبا") || t.includes("spa") || t.includes("ساونا") || t.includes("جاكوزي")) return <Sparkles size={12} />;
  if (t.includes("حمام") || t.includes("bath") || t.includes("شاور")) return <Bath size={12} />;
  if (t.includes("موقف") || t.includes("parking") || t.includes("سيارات")) return <ParkingCircle size={12} />;
  if (t.includes("خدمة غرف") || t.includes("خدمة الغرف") || t.includes("room service")) return <ConciergeBell size={12} />;
  if (t.includes("استقبال") || t.includes("reception") || t.includes("24 ساعة") || t.includes("مدار")) return <Clock3 size={12} />;
  if (t.includes("غسيل") || t.includes("laundry") || t.includes("تنظيف")) return <WashingMachine size={12} />;
  if (t.includes("تكييف") || t.includes("ac") || t.includes("هواء") || t.includes("مكيف")) return <Wind size={12} />;
  if (t.includes("شاطئ") || t.includes("beach") || t.includes("بحر") || t.includes("مظلة")) return <Umbrella size={12} />;
  if (t.includes("حديقة") || t.includes("garden") || t.includes("أشجار")) return <Trees size={12} />;
  if (t.includes("عائلية") || t.includes("family") || t.includes("أطفال")) return <Baby size={12} />;
  if (t.includes("أمان") || t.includes("security") || t.includes("حراسة")) return <ShieldCheck size={12} />;
  if (t.includes("لا يدخن") || t.includes("non-smoking") || t.includes("مدخنين") || t.includes("تدخين")) return <CigaretteOff size={12} />;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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

  const categories = useMemo(() => {
    return ["الكل", "منتجع", "فندق", "فيلا", "شقة", "بوتيك"];
  }, []);

  const allAmenitiesList = useMemo(() => {
    const amenitiesSet = new Set<string>();
    hotels.forEach(hotel => {
      const hotelAmenities = hotel.amenities || hotel['المرافق'] || [];
      hotelAmenities.forEach(a => amenitiesSet.add(a));
    });
    // Filter out very long ones or duplicates if any, and limit to common ones
    return Array.from(amenitiesSet).filter(a => a.length < 20).slice(0, 12);
  }, [hotels]);

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
      const searchTarget = `${hotel.name} ${hotel.city} ${hotel.location} ${hotel.description}`.toLowerCase();
      const matchesSearch = !searchTerm || searchTarget.includes(searchTerm.toLowerCase());
      
      const matchesDestination = !destination || 
        (hotel.name?.toLowerCase().includes(destination.toLowerCase())) || 
        (hotel.city?.toLowerCase().includes(destination.toLowerCase()));
        
      const hPrice = Number(hotel.price) || 0;
      const hRating = Number(hotel.rating) || 5; 

      const matchesPrice = hPrice >= priceRange[0] && hPrice <= priceRange[1];
      const matchesRating = hRating >= minRating;

      const matchesCategory = selectedCategory === "الكل" || 
        hotel.name?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        hotel.description?.toLowerCase().includes(selectedCategory.toLowerCase());
      
      const hotelAmenities = hotel.amenities || hotel['المرافق'] || [];
      const matchesAmenities = selectedAmenities.length === 0 || 
        selectedAmenities.every(amenity => hotelAmenities.includes(amenity));

      return matchesSearch && matchesDestination && matchesPrice && matchesRating && matchesCategory && matchesAmenities;
    });
  }, [hotels, destination, searchTerm, priceRange, minRating, selectedCategory, selectedAmenities]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32">
      {/* Modern Search & Filter Hero */}
      <div className="bg-white border-b border-[#d6d6e7]/50 pt-16 pb-12 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="container mx-auto px-4 relative">
            <div className="flex flex-col gap-10">
                <div className="space-y-4">
                   <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#151e63] leading-[1.1] tracking-tight">
                     {destination || "اكتشف إقامتك المثالية"}
                   </h1>
                   <div className="flex flex-wrap items-center gap-4 text-[#777aaf] font-bold text-sm md:text-base">
                      <div className="flex items-center gap-2 bg-[#f5f5fa] px-4 py-2 rounded-xl border border-[#d6d6e7]/30">
                        <CalendarIcon size={16} className="text-primary" /> 
                        {date.from && format(date.from, "d MMM", { locale: ar })} — {date.to && format(date.to, "d MMM", { locale: ar })}
                      </div>
                      <div className="flex items-center gap-2 bg-[#f5f5fa] px-4 py-2 rounded-xl border border-[#d6d6e7]/30">
                        <Users size={16} className="text-primary" /> 
                        {guestsCount}
                      </div>
                      <button 
                        onClick={() => navigate("/")}
                        className="text-primary hover:underline underline-offset-4 flex items-center gap-1.5 px-2"
                      >
                        <Search size={16} /> تعديل البحث
                      </button>
                   </div>
                </div>

                {/* Enhanced Search Bar */}
                <div className="max-w-4xl relative">
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-[#777aaf] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="ابحث عن اسم الفندق، المدينة، أو المعالم السياحية..."
                        className="block w-full bg-[#fcfcfd] border border-[#d6d6e7] rounded-2xl py-5 pr-14 pl-12 text-sm md:text-base font-bold text-[#151e63] placeholder:text-[#777aaf]/60 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm group-hover:shadow-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <AnimatePresence>
                        {searchTerm && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#777aaf] hover:text-primary transition-colors"
                          >
                            <div className="p-1.5 rounded-lg bg-[#e8e5f0] hover:bg-primary/10">
                              <X size={18} />
                            </div>
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <button
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className={`flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-sm font-black transition-all duration-300 border shadow-sm shrink-0 ${
                        isFiltersOpen || selectedCategory !== 'الكل'
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-white text-[#151e63] border-[#d6d6e7] hover:border-primary hover:text-primary'
                      }`}
                    >
                      <SlidersHorizontal size={20} />
                      <span>التصنيفات</span>
                      <motion.div
                        animate={{ rotate: isFiltersOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    </button>
                  </div>

                  {/* Categories Filter (Collapsible) */}
                  <AnimatePresence>
                    {isFiltersOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                      >
                        <div className="pt-8 pb-2">
                          <div className="bg-[#f5f5fa]/50 backdrop-blur-sm border border-[#d6d6e7]/50 rounded-[2rem] p-6 md:p-8">
                            <div className="flex flex-wrap gap-3">
                              {categories.map((cat, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedCategory(cat)}
                                  className={`px-8 py-3.5 rounded-xl text-xs md:text-sm font-black transition-all duration-300 border ${
                                    selectedCategory === cat
                                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                      : 'bg-white text-[#5a5e9a] border-[#d6d6e7] hover:border-primary hover:text-primary hover:scale-105'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        {/* Modern Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] md:rounded-3xl p-6 md:p-8 border border-[#d6d6e7]/50 shadow-sm lg:sticky lg:top-32 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <SlidersHorizontal size={20} />
              </div>
              <h3 className="text-xl font-black text-[#151e63]">تصفية متقدمة</h3>
            </div>

            <div className="space-y-10">
              {/* Budget Filter */}
              <div className="space-y-5">
                <p className="text-xs font-black text-[#777aaf] uppercase tracking-widest">الميزانية لليلة الواحدة</p>
                <div className="space-y-2">
                  {[0, 1000, 2500, 5000].map((val, i) => (
                    <label key={i} className={`flex items-center gap-4 cursor-pointer group p-3 rounded-2xl transition-all border ${
                      priceRange[0] === val && priceRange[1] === 10000 
                        ? "bg-primary/5 border-primary/20" 
                        : "border-transparent hover:bg-[#f5f5fa]"
                    }`}>
                      <div className="bg-white rounded-lg flex items-center justify-center">
                        <Checkbox 
                          onCheckedChange={(checked) => checked ? setPriceRange([val, 10000]) : setPriceRange([0, 10000])}
                          checked={priceRange[0] === val && priceRange[1] === 10000} 
                        />
                      </div>
                      <span className={`text-sm font-bold transition-colors ${
                        priceRange[0] === val && priceRange[1] === 10000 ? "text-primary" : "text-[#5a5e9a] group-hover:text-primary"
                      }`}>
                         {val === 0 ? "أي ميزانية" : `أكثر من ${val} EGP`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-[#d6d6e7]/50" />

              {/* Rating Filter */}
              <div className="space-y-5">
                <p className="text-xs font-black text-[#777aaf] uppercase tracking-widest">تقييم الضيوف</p>
                <div className="space-y-2">
                  {[5, 4, 3].map((r, i) => (
                    <label key={i} className={`flex items-center gap-4 cursor-pointer group p-3 rounded-2xl transition-all border ${
                      minRating === r 
                        ? "bg-primary/5 border-primary/20" 
                        : "border-transparent hover:bg-[#f5f5fa]"
                    }`}>
                      <div className="bg-white rounded-lg flex items-center justify-center">
                        <Checkbox 
                          onCheckedChange={(checked) => checked ? setMinRating(r) : setMinRating(0)}
                          checked={minRating === r}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition-colors ${
                          minRating === r ? "bg-primary text-white" : "bg-[#4F46E5]/10 text-primary"
                        }`}>{r}+</div>
                        <span className={`text-sm font-bold transition-colors ${
                          minRating === r ? "text-primary" : "text-[#5a5e9a] group-hover:text-primary"
                        }`}>ممتاز</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-[#d6d6e7]/50" />

              {/* Amenities Filter */}
              {allAmenitiesList.length > 0 && (
                <div className="space-y-5">
                  <p className="text-xs font-black text-[#777aaf] uppercase tracking-widest">المرافق</p>
                  <div className="space-y-2">
                    {allAmenitiesList.map((amenity, i) => (
                      <label key={i} className={`flex items-center gap-4 cursor-pointer group p-3 rounded-2xl transition-all border ${
                        selectedAmenities.includes(amenity) 
                          ? "bg-primary/5 border-primary/20" 
                          : "border-transparent hover:bg-[#f5f5fa]"
                      }`}>
                        <div className="bg-white rounded-lg flex items-center justify-center">
                          <Checkbox 
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedAmenities([...selectedAmenities, amenity]);
                              else setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                            }}
                            checked={selectedAmenities.includes(amenity)}
                          />
                        </div>
                        <span className={`text-sm font-bold transition-colors ${
                          selectedAmenities.includes(amenity) ? "text-primary" : "text-[#5a5e9a] group-hover:text-primary"
                        }`}>{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
          ) : filteredHotels.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-[#d6d6e7] shadow-sm"
            >
              <div className="w-20 h-20 bg-[#f5f5fa] rounded-full flex items-center justify-center mx-auto mb-6 text-[#777aaf]">
                <Search className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-[#151e63] mb-2">لم نجد نتائج تطابق بحثك</h2>
              <p className="text-[#777aaf] font-bold max-w-sm mx-auto">
                جرب تغيير كلمات البحث أو تصفية النتائج بشكل مختلف
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('الكل'); setMinRating(0); setPriceRange([0, 10000]); }}
                className="mt-8 text-primary font-black hover:underline underline-offset-8"
              >
                إعادة ضبط كافة الفلاتر
              </button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {filteredHotels.map((hotel, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={hotel.id} 
                  className="modern-card group flex flex-col md:flex-row h-full md:min-h-[340px]"
                >
                  <div className="w-full md:w-[280px] lg:w-[350px] 3xl:w-[420px] h-64 md:h-auto relative shrink-0 overflow-hidden">
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
                       <span className="badge-indigo bg-white/90 backdrop-blur-md text-[10px] md:text-xs">موصى به</span>
                    </div>
                  </div>
                  
                  <div className="flex-grow p-5 md:p-8 flex flex-col min-w-0">
                    <div className="flex flex-col-reverse xs:flex-row justify-between items-start gap-4 mb-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[#4F46E5]">
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                        </div>
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-[#151e63] group-hover:text-[#4F46E5] transition-colors cursor-pointer leading-tight break-words" onClick={() => navigate(`/hotel/${hotel.cityId}/${hotel.id}`)}>{hotel.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 md:gap-3 bg-[#e8e5f0] p-2 md:p-3 rounded-2xl border border-[#C7D2FE]/30 shrink-0 self-end xs:self-start">
                        <div className="text-left">
                          <p className="font-black text-xs md:text-sm text-[#0f0b18]">رائع</p>
                          <p className="text-[8px] md:text-[10px] text-[#777aaf] font-bold">{(hotel.reviewsCount || 0)} تقييم</p>
                        </div>
                        <div className="bg-[#4F46E5] text-white font-black text-base md:text-xl w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl shadow-lg shadow-[#e3dff0]">
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

                    <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-end pt-6 md:pt-8 border-t border-[#d6d6e7]/30 gap-4 sm:gap-0">
                      <div>
                        <div className="flex items-center gap-2 text-[#059669] text-[10px] md:text-xs font-black mb-2">
                           <ShieldCheck size={14} /> إلغاء مجاني متاح
                        </div>
                        {hotel.price && parseFloat(String(hotel.price)) > 0 ? (
                          <>
                            <div className="text-[10px] md:text-xs text-[#777aaf] font-bold">السعر لـ 3 ليالٍ</div>
                            <div className="text-2xl md:text-3xl font-black text-[#151e63] tracking-tighter">EGP {(parseFloat(String(hotel.price)) || 0) * 3}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-[10px] md:text-xs text-[#777aaf] font-bold">الأسعار متوفرة</div>
                            <div className="text-lg md:text-xl font-black text-[#4F46E5] tracking-tighter">عرض الأسعار بالداخل</div>
                          </>
                        )}
                      </div>
                      <Button 
                        onClick={() => navigate(`/hotel/${hotel.cityId}/${hotel.id}${window.location.search}`)}
                        className="action-button w-full sm:w-auto px-8 md:px-10 rounded-xl md:rounded-2xl h-12 md:h-14"
                      >
                        عرض الغرف <ChevronLeft size={18} className="mr-2" />
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
