import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db, handleFirestoreError, OperationType, auth, toggleFavorite, getFavoritesListener } from "@/src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Star, MapPin, ArrowRight, Heart, SlidersHorizontal, Calendar as CalendarIcon, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "motion/react";
import { showError, showSuccess, showInfo } from "@/src/lib/swal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function CityHotelsPage() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Filters state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);

  const dateFrom = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date();
  const dateTo = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(new Date().getTime() + 86400000 * 3);
  const guestsCount = searchParams.get("guests") || "2 بالغين · 1 غرفة";

  useEffect(() => {
    if (!cityName) return;
    setLoading(true);

    import("firebase/firestore").then(({ collection, getDocs, query, where }) => {
      const citiesRef = collection(db, "cities");
      getDocs(query(citiesRef, where("name", "==", cityName)))
        .then(async (citySnap) => {
          if (citySnap.empty) {
            setLoading(false);
            return;
          }

          const cityDoc = citySnap.docs[0];
          const cityId = cityDoc.id;

          try {
            const hotelsRef = collection(db, "cities", cityId, "hotels");
            const snapshot = await getDocs(hotelsRef);
            const hotelsData = snapshot.docs.map(doc => {
              const data = doc.data();
              const images =
                Array.isArray(data.images) && data.images.length > 0 ? data.images :
                Array.isArray(data.Hotel_img) && data.Hotel_img.length > 0 ? data.Hotel_img :
                data.image ? [data.image] :
                ["https://picsum.photos/seed/hotel/800/600"];
              return {
                id: doc.id,
                cityId,
                ...data,
                images,
                reviewsCount: data.reviewsCount || Math.floor(Math.random() * 500) + 100
              };
            });
            setHotels(hotelsData);
          } catch (error) {
            handleFirestoreError(error, OperationType.LIST, `hotels_in_${cityName}`);
          } finally {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    });
  }, [cityName]);

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

  const handleToggleFavorite = async (e: React.MouseEvent, hotel: any) => {
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
      const hPrice = Number(hotel.price) || 0;
      const hRating = Number(hotel.rating) || 5;

      const matchesPrice = hPrice >= priceRange[0] && hPrice <= priceRange[1];
      const matchesRating = hRating >= minRating;
      
      return matchesPrice && matchesRating;
    });
  }, [hotels, priceRange, minRating]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32">
      {/* Modern Search Summary */}
      <div className="bg-white border-b border-[#d6d6e7]/50 pt-10 pb-10">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                   <h1 className="text-2xl md:text-4xl font-black text-[#151e63] mb-2">فنادق في {cityName}</h1>
                   <div className="flex items-center gap-4 text-[#777aaf] font-bold text-sm">
                      <div className="flex items-center gap-1"><CalendarIcon size={16} /> {format(dateFrom, "d MMM", { locale: ar })} — {format(dateTo, "d MMM", { locale: ar })}</div>
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
          <div className="bg-white rounded-[2rem] md:rounded-3xl p-6 md:p-8 border border-[#d6d6e7]/50 shadow-sm lg:sticky lg:top-32">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <SlidersHorizontal className="text-[#4F46E5]" size={20} />
              <h3 className="text-xl font-black text-[#151e63]">تصفية النتائج</h3>
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

        {/* Hotels Grid */}
        <div className="lg:col-span-9">
          {filteredHotels.length === 0 ? (
            <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-[#d6d6e7] shadow-sm">
              <p className="text-2xl font-black text-[#777aaf]">عذراً، لا توجد فنادق تطابق اختياراتك.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredHotels.map((hotel) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="modern-card group cursor-pointer flex flex-col h-full bg-white overflow-hidden"
                  onClick={() => navigate(`/hotel/${hotel.cityId}/${hotel.id}`)}
                >
                  <div className="relative h-64 sm:h-72 overflow-hidden shrink-0">
                    <img 
                      src={hotel.images[0]} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute bottom-4 left-4">
                       <span className="badge-indigo bg-white/90 backdrop-blur-md text-[10px]">موصى به</span>
                    </div>
                    <button 
                      onClick={(e) => handleToggleFavorite(e, hotel)}
                      className={cn(
                        "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10",
                        favorites.includes(hotel.id) 
                          ? "bg-red-500 text-white" 
                          : "bg-white/90 backdrop-blur-md text-[#777aaf] hover:text-red-500 hover:scale-110"
                      )}
                    >
                        <Heart size={18} className={cn(favorites.includes(hotel.id) && "fill-current")} />
                    </button>
                  </div>
                  
                  <div className="p-5 md:p-6 flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[#4F46E5] mb-1">
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                           <Star size={10} className="fill-current" />
                        </div>
                        <h3 className="text-xl font-black text-[#151e63] group-hover:text-[#4F46E5] transition-colors line-clamp-1 leading-tight">{hotel.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-[#e8e5f0] p-2 rounded-xl border border-[#C7D2FE]/30 shrink-0">
                        <div className="bg-[#4F46E5] text-white font-black text-sm w-8 h-8 flex items-center justify-center rounded-lg shadow-md">
                          {(hotel.rating || 4.5).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] md:text-xs text-[#5a5e9a] font-bold line-clamp-2 mb-6 flex-grow leading-relaxed">
                      {hotel.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-[#d6d6e7]/30">
                      <div>
                        <p className="text-[10px] text-[#777aaf] font-black uppercase tracking-tighter">تبدأ من</p>
                        <p className="text-lg font-black text-[#4F46E5]">EGP {hotel.price || "---"}</p>
                      </div>
                      <Button variant="ghost" className="text-[#4F46E5] font-black p-0 hover:bg-transparent text-sm">التفاصيل <ArrowRight className="rotate-180 mr-1" size={14} /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
