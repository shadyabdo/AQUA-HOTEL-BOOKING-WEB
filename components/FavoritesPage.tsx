import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Heart,
  Star,
  Trash2,
  ChevronLeft,
  Info,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, auth, getFavoritesListener, toggleFavorite } from "@/src/lib/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const unsubFavs = getFavoritesListener(auth.currentUser.uid, (favs) => {
      setFavorites(favs as Favorite[]);
      setLoading(false);
    });

    return () => unsubFavs();
  }, []);

  const handleRemoveFavorite = async (fav: Favorite) => {
    if (!auth.currentUser) return;
    try {
      // Pass the necessary ID for deletion
      await toggleFavorite(auth.currentUser.uid, { id: fav.hotelId || fav.id });
      toast.info("تمت الإزالة من المفضلة");
    } catch (e) {
      toast.error("خطأ في الإزالة");
    }
  };

  if (!auth.currentUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
       <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Heart size={40} />
       </div>
       <h2 className="text-3xl font-black text-[#151e63] mb-4">يجب تسجيل الدخول</h2>
       <p className="text-[#777aaf] mb-8 font-medium">يرجى تسجيل الدخول لمشاهدة فنادقك المفضلة.</p>
       <Button onClick={() => navigate("/")} className="action-button px-10">العودة للرئيسية</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-40">
      <div className="bg-white border-b border-[#d6d6e7]/50 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
             <Button variant="ghost" onClick={() => navigate(-1)} className="p-0 hover:bg-transparent text-[#4F46E5] font-black gap-2">
                <ArrowRight className="rotate-180" size={20} /> العودة
             </Button>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                <Heart size={28} className="fill-current" />
             </div>
             <h1 className="text-5xl font-black text-[#151e63] tracking-tighter">الفنادق المفضلة</h1>
          </div>
          <p className="text-[#777aaf] font-medium mt-4">قائمة بالفنادق والمنتجعات التي قمت بحفظها للرجوع إليها لاحقاً.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-[#d6d6e7]">
            <div className="w-20 h-20 bg-[#f5f5fa] text-[#d6d6e7] rounded-full flex items-center justify-center mx-auto mb-6">
               <Heart size={40} />
            </div>
            <p className="text-xl font-black text-[#777aaf]">قائمة المفضلة فارغة حالياً</p>
            <Button variant="link" onClick={() => navigate("/rooms")} className="text-red-500 mt-4 font-black">اكتشف الفنادق وأضفها هنا</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {favorites.map((fav) => (
              <motion.div 
                key={fav.id} 
                layout 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="modern-card group"
              >
                <div className="h-64 relative overflow-hidden">
                  <img src={fav.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <button 
                    onClick={() => handleRemoveFavorite(fav)} 
                    className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                  >
                     <Trash2 size={18} />
                  </button>
                  <div className="absolute bottom-4 left-4">
                     <span className="badge-indigo bg-white/90 backdrop-blur-md">محفوظ</span>
                  </div>
                </div>
                <div className="p-8">
                   <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-[#151e63] group-hover:text-red-500 transition-colors cursor-pointer" onClick={() => navigate(`/hotel/${fav.cityId}/${fav.hotelId}`)}>{fav.name}</h3>
                      <div className="flex items-center gap-1 text-[#ffb700]"><Star size={14} className="fill-current" /><span className="text-sm font-black text-[#151e63]">{fav.rating}</span></div>
                   </div>
                   <p className="text-xs font-bold text-[#777aaf] mb-6 flex items-center gap-2"><MapPin size={16} className="text-[#4F46E5]" /> {fav.city} • {fav.location}</p>
                   <div className="flex justify-between items-end border-t border-[#d6d6e7]/30 pt-6">
                      <div><p className="text-[10px] font-black text-[#777aaf] uppercase">يبدأ من</p><p className="text-2xl font-black text-[#4F46E5]">EGP {fav.price}</p></div>
                      <Button onClick={() => navigate(`/hotel/${fav.cityId}/${fav.hotelId}`)} className="h-12 rounded-xl bg-[#151e63] text-white hover:bg-red-500 font-bold px-6 shadow-lg shadow-gray-100 hover:shadow-red-100 transition-all">حجز الآن</Button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
