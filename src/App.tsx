import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BookingBar from "@/components/BookingBar";
import Rooms from "@/components/Rooms";
import Amenities from "@/components/Amenities";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import RoomsPage from "@/components/RoomsPage";
import RoomDetailsPage from "@/components/RoomDetailsPage";
import HotelPage from "@/components/HotelPage";
import FAQPage from "@/components/FAQPage";
import CityHotelsPage from "@/components/CityHotelsPage";
import ProfilePage from "@/components/ProfilePage";
import ContactPage from "@/components/ContactPage";
import OffersPage from "@/components/OffersPage";
import { ArticlesPage } from "@/components/ArticlesPage";
import ArticleDetailsPage from "@/components/ArticleDetailsPage";
import LoginPage from "@/components/LoginPage";
import SitemapPage from "@/components/SitemapPage";
import ScrollToTop from "@/components/ScrollToTop";
import PrivacyPolicyPage from "@/components/PrivacyPolicyPage";
import CancellationPolicyPage from "@/components/CancellationPolicyPage";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { auth, db, handleFirestoreError, OperationType, getCitiesListener, getAllHotels, getFeaturedCitiesListener, fetchTopDeals, toggleFavorite, getFavoritesListener } from "@/src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/src/lib/stripe";
import { Star, MapPin, ChevronRight, ChevronLeft, ArrowRight, ShieldCheck, Mail, AlertCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/src/lib/swal";

interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: any; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 text-center">
          <div className="p-12 max-w-2xl border border-[#d6d6e7] rounded-[3rem] shadow-2xl bg-white space-y-8">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><AlertCircle size={40} /></div>
            <h2 className="text-4xl font-black text-[#151e63] tracking-tighter">عذراً، حدث خطأ تقني</h2>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={() => window.location.reload()} className="action-button flex-1 h-14 rounded-2xl text-lg">تحديث الصفحة</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function HomePage({ openBookingModal, user }: { openBookingModal: (id?: string, hotelId?: string) => void; user: any }) {
  const navigate = useNavigate();
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [latestHotels, setLatestHotels] = useState<any[]>([]);
  const [topDeals, setTopDeals] = useState<any[]>([]);
  const [egyptCities, setEgyptCities] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 440;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    let citiesLoaded = false;
    let dealsLoaded = false;
    let hotelsLoaded = false;

    const checkLoading = () => {
      if (citiesLoaded && dealsLoaded && hotelsLoaded) {
        setTimeout(() => setLoading(false), 800); // Small delay for smooth transition
      }
    };

    const unsubCities = getFeaturedCitiesListener(async (cities) => { 
      try {
        const allHotels = await getAllHotels();
        const citiesWithCounts = cities.map(city => ({
          ...city,
          hotelCount: allHotels.filter(h => h.cityId === city.id || h.city === city.name).length
        }));
        setEgyptCities(citiesWithCounts);
      } catch (err) {
        setEgyptCities(cities);
      }
      citiesLoaded = true; 
      checkLoading(); 
    });

    const loadData = async () => {
      try {
        const deals = await fetchTopDeals();
        setTopDeals(deals);
        dealsLoaded = true;
        checkLoading();
      } catch (e) {
        dealsLoaded = true;
        checkLoading();
      }

      try {
        const allHotels = await getAllHotels();
        if (Array.isArray(allHotels)) {
          setLatestHotels(allHotels.slice(0, 4));
        }
      } finally {
        hotelsLoaded = true;
        checkLoading();
      }
    };

    loadData();
    return () => { unsubCities(); };
  }, []);

  React.useEffect(() => {
    let unsubFavs: any;
    if (user) {
      unsubFavs = getFavoritesListener(user.uid, (favs) => {
        setFavorites(favs.map(f => f.hotelId || f.id));
      });
    } else {
      setFavorites([]);
    }
    return () => { if (unsubFavs) unsubFavs(); };
  }, [user]);

  const handleToggleFavorite = async (e: React.MouseEvent, hotel: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (!auth.currentUser) { toast.error("يرجى تسجيل الدخول أولاً"); return; }
    try {
      const isAdded = await toggleFavorite(auth.currentUser.uid, hotel);
      if (isAdded) {
        showSuccess("تم!", "تمت إضافة الفندق للمفضلة بنجاح");
      } else {
        showInfo("تنبيه", "تمت إزالة الفندق من المفضلة");
      }
    } catch (err: any) { showError("خطأ", err.message || "حدث خطأ ما"); }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="bg-[#4F46E5] p-6 rounded-[2.5rem] shadow-2xl shadow-[#4F46E5]/50 mb-8"
        >
          <img src="/logo.png" alt="Loading..." className="h-24 w-auto object-contain" />
        </motion.div>
        <div className="flex gap-2">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-3 h-3 bg-[#4F46E5] rounded-full" />
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-3 h-3 bg-[#4F46E5] rounded-full" />
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-3 h-3 bg-[#4F46E5] rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <BookingBar />
      <section className="py-16 md:py-24 3xl:py-32 bg-white relative overflow-hidden">
        <div className="container-custom relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#4F46E5] font-black uppercase tracking-widest text-xs md:text-sm"><div className="w-8 h-px bg-[#4F46E5]" /> اكتشف وجهاتنا</div>
              <h2 className="text-3xl md:text-5xl 3xl:text-6xl font-black text-[#151e63] tracking-tighter leading-[1.1]">أين تذهب بعد ذلك؟</h2>
            </div>
            
            {/* Navigation Arrows */}
            <div className="flex gap-4">
              <button 
                onClick={() => scroll('right')}
                className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#151e63] hover:bg-[#4F46E5] hover:text-white transition-all shadow-sm border border-[#d6d6e7]/50"
              >
                <ChevronRight size={24} />
              </button>
              <button 
                onClick={() => scroll('left')}
                className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#151e63] hover:bg-[#4F46E5] hover:text-white transition-all shadow-sm border border-[#d6d6e7]/50"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
          </div>

          <div 
            ref={sliderRef}
            className="flex gap-6 md:gap-10 overflow-x-auto pb-12 scrollbar-hide snap-x -mx-4 px-4 scroll-smooth"
          >
            {egyptCities.map((city, idx) => (
              <motion.div 
                key={idx} 
                className="min-w-[260px] sm:min-w-[320px] md:min-w-[380px] 3xl:min-w-[450px] h-[380px] sm:h-[450px] md:h-[520px] 3xl:h-[600px] relative rounded-[2rem] md:rounded-[3rem] overflow-hidden cursor-pointer snap-start shadow-2xl shadow-[#e3dff0]/50 group border border-[#d6d6e7]/30" 
                onClick={() => navigate(`/city/${city.name}`)}
              >
                {/* Hotel Count Badge */}
                <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 md:px-5 md:py-2.5 text-[#4F46E5] font-black text-xs md:text-sm shadow-xl flex items-center gap-2 group-hover:scale-110 transition-transform">
                  <Star size={14} className="fill-current" />
                  {city.hotelCount || 0} فندق
                </div>

                <img src={city.city_img || city.image} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[1.5s] ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151e63] via-[#151e63]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                <div className="absolute bottom-8 sm:bottom-12 right-8 sm:right-12 left-8 sm:left-12 text-white z-10">
                  <h3 className="text-xl sm:text-2xl md:text-4xl font-black mb-2 sm:mb-3 tracking-tighter group-hover:translate-x-2 transition-transform">{city.name}</h3>
                  <div className="flex items-center gap-2 sm:gap-3 group/btn">
                    <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">عرض الوجهات</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover/btn:bg-[#4F46E5] transition-all group-hover:scale-110"><ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 3xl:py-32 bg-[#fcfcfd]">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-12 md:mb-16 gap-6">
            <div><h2 className="text-2xl md:text-4xl 3xl:text-5xl font-black text-[#151e63] tracking-tighter">وصل حديثاً</h2></div>
            <Button variant="ghost" onClick={() => navigate("/rooms")} className="text-[#4F46E5] font-black hover:bg-[#e8e5f0] gap-2 rounded-xl h-11 md:h-12 px-5 md:px-6">عرض الكل <ArrowRight className="rotate-180" size={18} /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-5 gap-6 md:gap-8 xl:gap-10">
            {latestHotels.map((hotel) => (
              <div key={hotel.id} className="modern-card group cursor-pointer flex flex-col" onClick={() => navigate(`/hotel/${hotel.cityId}/${hotel.id}`)}>
                <div className="h-64 sm:h-80 overflow-hidden relative">
                  <img src={hotel.images?.[0] || "https://picsum.photos/seed/hotel/800/600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <button onClick={(e) => handleToggleFavorite(e, hotel)} className={cn("absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10", favorites.includes(hotel.id) ? "bg-red-500 text-white" : "bg-white/90 backdrop-blur-md text-[#777aaf] hover:text-red-500 hover:scale-110")}><Heart size={18} className={cn(favorites.includes(hotel.id) && "fill-current")} /></button>
                </div>
                <div className="p-8 flex-grow flex flex-col">
                  <h3 className="font-black text-xl text-[#151e63] mb-2 line-clamp-1 group-hover:text-[#4F46E5] transition-colors">{hotel.name}</h3>
                  <p className="text-xs text-gray-500 font-bold mb-3 line-clamp-2">{hotel.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-[#d6d6e7]/30 mt-auto">
                    <div className="flex items-center gap-1.5 bg-[#e8e5f0] px-3 py-1.5 rounded-xl border border-indigo-50">
                      <Star size={14} className="text-[#4F46E5] fill-current" />
                      <span className="text-sm font-black text-[#4F46E5]">{hotel.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AppContent() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  React.useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { 
      setUser(currentUser); 
    }); 
    return () => unsubscribe(); 
  }, []);

  const openBookingModal = (roomId?: string, hotelId?: string) => { 
    setSelectedRoomId(roomId); 
    setSelectedHotelId(hotelId); 
    setIsBookingModalOpen(true); 
  };

  const isAuthPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-white selection:bg-[#4F46E5] selection:text-white overflow-x-hidden relative">
      {!isAuthPage && <Navbar />}
      <main className={cn(
        !isAuthPage && "pt-20 md:pt-24"
      )}>
        <Routes>
          <Route path="/" element={<HomePage openBookingModal={openBookingModal} user={user} />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/hotel/:cityId/:id" element={<HotelPage />} />
          <Route path="/hotel/:cityId/:id/room/:roomId" element={<RoomDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />
          <Route path="/bookings" element={<Navigate to="/profile" />} />
          <Route path="/favorites" element={<Navigate to="/profile" />} />

          <Route path="/offers" element={<OffersPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/article/:id" element={<ArticleDetailsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/city/:cityName" element={<CityHotelsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/cancellation" element={<CancellationPolicyPage />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
      <AnimatePresence>
        {isBookingModalOpen && (
          <BookingModal 
            isOpen={isBookingModalOpen} 
            onClose={() => setIsBookingModalOpen(false)} 
            initialRoomId={selectedRoomId} 
            initialHotelId={selectedHotelId} 
          />
        )}
      </AnimatePresence>
      <ScrollToTop />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster 
        position="top-center" 
        richColors 
        dir="rtl" 
        toastOptions={{ 
          style: { fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold', padding: '16px 20px', borderRadius: '12px' }, 
          className: 'flex-row-reverse text-right' 
        }} 
      />
      <Elements stripe={stripePromise}>
        <Router>
          <AppContent />
        </Router>
      </Elements>
    </ErrorBoundary>
  );
}

