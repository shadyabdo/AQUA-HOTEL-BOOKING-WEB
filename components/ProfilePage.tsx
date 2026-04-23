import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Calendar, 
  Heart, 
  Wallet, 
  History, 
  LogOut, 
  Camera,
  ChevronLeft,
  Settings,
  ShieldCheck,
  Bell,
  CreditCard,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth, db, getFavoritesListener, toggleFavorite, cancelBooking, updateUserProfileImage, addTransaction, getTransactionsListener } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { showError, showSuccess, showInfo, showConfirm } from "@/src/lib/swal";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import WalletTopUpModal from "./WalletTopUpModal";

// Types from existing components
interface Booking {
  id: string;
  roomTitle: string;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  guests: number;
  price?: number;
  createdAt: string;
  cancelledAt?: any;
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites' | 'wallet'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const user = auth.currentUser;

  // Refresh component every minute to update the "5-minute hide" logic
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const visibleBookings = useMemo(() => {
    return bookings.filter(booking => {
      if (booking.status !== 'cancelled') return true;
      if (!booking.cancelledAt) return true;
      
      const cancelledTime = booking.cancelledAt.toDate 
        ? booking.cancelledAt.toDate().getTime() 
        : new Date(booking.cancelledAt).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - cancelledTime) / (1000 * 60);
      
      return diffMinutes < 5;
    });
  }, [bookings, refreshKey]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Bookings Listener
    const qBookings = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(data);
    });

    // Transactions Listener
    const unsubTransactions = getTransactionsListener(user.uid, (data) => {
      setTransactions(data);
    });

    // Favorites Listener
    const unsubFavs = getFavoritesListener(user.uid, (favs) => {
      setFavorites(favs as Favorite[]);
      setLoading(false);
    });

    // User Data Listener (Wallet Balance)
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        setWalletBalance(data.walletBalance || 0);
      }
    });

    return () => {
      unsubBookings();
      unsubFavs();
      unsubUser();
      unsubTransactions();
    };
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;
    
    const { isConfirmed } = await showConfirm(
      "هل أنت متأكد؟",
      "هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟ سيتم استرداد المبلغ بالكامل إلى محفظتك.",
      "نعم، إلغاء الحجز",
      "تراجع"
    );

    if (!isConfirmed) return;

    try {
      const bookingToCancel = bookings.find(b => b.id === bookingId);
      const result = await cancelBooking(bookingId, user.uid);
      
      // Log Refund Transaction
      await addTransaction(user.uid, {
        type: 'refund',
        amount: result.refundAmount,
        description: `استرداد مبلغ لإلغاء حجز: ${bookingToCancel?.roomTitle || 'غرفة'}`,
        method: 'محفظة الموقع'
      });

      showSuccess("تم الإلغاء!", `تم إلغاء الحجز بنجاح واسترداد EGP ${result.refundAmount} إلى محفظتك.`);
    } catch (e: any) {
      showError("فشل الإلغاء", e.message || "حدث خطأ أثناء إلغاء الحجز");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleRemoveFavorite = async (fav: Favorite) => {
    try {
      await toggleFavorite(user!.uid, { id: fav.hotelId || fav.id });
      showInfo("تمت الإزالة", "تم حذف الفندق من قائمة المفضلة");
    } catch (e) {
      showError("خطأ", "فشل في إزالة الفندق من المفضلة");
    }
  };

  if (!user) return null;

  const menuItems = [
    { id: 'bookings', label: 'حجوزاتي', icon: <Calendar size={20} /> },
    { id: 'favorites', label: 'المفضلة', icon: <Heart size={20} /> },
    { id: 'wallet', label: 'المحفظة', icon: <Wallet size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (Left in RTL) */}
          <div className="lg:col-span-8 space-y-8 lg:order-2">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] md:rounded-[3rem] border border-[#d6d6e7]/50 shadow-sm overflow-hidden min-h-[500px] md:min-h-[600px]"
            >
              {/* Header inside content */}
              <div className="p-6 md:p-10 border-b border-[#d6d6e7]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                   <h2 className="text-xl md:text-3xl font-black text-[#151e63] tracking-tighter mb-3">
                      {activeTab === 'bookings' && "حجوزاتي القادمة"}
                      {activeTab === 'favorites' && "الفنادق المفضلة"}
                      {activeTab === 'wallet' && "محفظتي الرقمية"}
                   </h2>
                   {activeTab === 'bookings' && (
                     <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100">
                           {visibleBookings.length} حجوزات نشطة
                        </span>
                     </div>
                   )}
                </div>
                {activeTab === 'wallet' && (
                  <Button className="action-button rounded-xl px-6 h-12 shadow-[#e3dff0]" onClick={() => setShowWalletModal(true)}>شحن الرصيد</Button>
                )}
              </div>

              <div className="p-6 md:p-10">
                {loading ? (
                   <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <>
                    {activeTab === 'bookings' && (
                       visibleBookings.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                            <div className="w-24 h-24 bg-[#f5f5fa] rounded-full border-2 border-dashed border-[#d6d6e7] flex items-center justify-center text-[#d6d6e7]">
                               <Calendar size={40} />
                            </div>
                            <div className="space-y-2">
                               <p className="text-[#777aaf] font-bold">ليس لديك أي حجوزات حالياً.</p>
                               <Button variant="link" onClick={() => navigate("/rooms")} className="text-[#4F46E5] font-black">ابدأ بالبحث عن إقامتك القادمة</Button>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            {visibleBookings.map(booking => (
                              <div key={booking.id} className="p-6 bg-[#fcfcfd] border border-[#d6d6e7]/50 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[#4F46E5]/30 transition-all">
                                 <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full sm:w-auto">
                                    <div className="w-16 h-16 bg-white rounded-2xl border border-[#d6d6e7]/30 flex flex-col items-center justify-center text-[#4F46E5] shrink-0">
                                       <span className="text-[10px] font-black uppercase mb-0.5">{format(new Date(booking.checkIn), "MMM", { locale: ar })}</span>
                                       <span className="text-xl font-black">{format(new Date(booking.checkIn), "d")}</span>
                                    </div>
                                    <div className="text-center sm:text-right">
                                       <h4 className="text-base md:text-lg font-black text-[#151e63] group-hover:text-[#4F46E5] transition-colors">{booking.roomTitle}</h4>
                                       <p className="text-[10px] md:text-xs text-[#777aaf] font-bold flex items-center justify-center sm:justify-start gap-1"><MapPin size={12} /> القاهرة، مصر</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="text-right">
                                       <p className="text-[10px] text-[#777aaf] font-black uppercase mb-1">الحالة</p>
                                       <span className={cn(
                                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                          booking.status === 'confirmed' ? "bg-green-100 text-green-700" :
                                          booking.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                       )}>
                                          {booking.status === 'confirmed' ? "مؤكد" : booking.status === 'pending' ? "قيد الانتظار" : "ملغي"}
                                       </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {booking.status !== 'cancelled' && (
                                        <Button 
                                          onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                                          variant="ghost" 
                                          className="h-10 text-[10px] font-black text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl px-3"
                                        >
                                          إلغاء الحجز
                                        </Button>
                                      )}
                                      <Button variant="ghost" className="h-10 w-10 rounded-xl p-0 text-[#777aaf] hover:bg-[#f5f5fa]"><ChevronLeft size={20} /></Button>
                                    </div>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )
                    )}

                    {activeTab === 'favorites' && (
                       favorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                           <div className="w-24 h-24 bg-[#f5f5fa] rounded-full border-2 border-dashed border-[#d6d6e7] flex items-center justify-center text-[#d6d6e7]">
                              <Heart size={40} />
                           </div>
                           <p className="text-[#777aaf] font-bold">قائمة المفضلة فارغة حالياً.</p>
                        </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {favorites.map(fav => (
                              <div key={fav.id} className="modern-card group overflow-hidden border border-[#d6d6e7]/50">
                                 <div className="h-48 relative overflow-hidden">
                                    <img src={fav.image} className="w-full h-full object-cover" />
                                    <button onClick={() => handleRemoveFavorite(fav)} className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"><Heart size={14} className="fill-current" /></button>
                                 </div>
                                 <div className="p-6">
                                    <h4 className="font-black text-[#151e63] mb-1 line-clamp-1">{fav.name}</h4>
                                    <p className="text-[10px] text-[#777aaf] font-bold flex items-center gap-1 mb-4"><MapPin size={12} /></p>
                                    <Button onClick={() => navigate(`/hotel/${fav.cityId}/${fav.hotelId}`)} className="w-full h-10 rounded-xl bg-[#f5f5fa] text-[#4F46E5] font-black hover:bg-[#e8e5f0]">عرض الفندق</Button>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )
                    )}

                    {activeTab === 'wallet' && (
                       <div className="flex flex-col items-center justify-center py-32 space-y-8">
                          <div className="relative inline-block">
                             <div className="min-w-[12rem] px-8 h-40 bg-gradient-to-br from-[#4F46E5] to-[#818CF8] rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-white transition-all">
                                <Wallet size={48} className="mb-4 shrink-0" />
                                <p className="text-[10px] font-black uppercase opacity-80">الرصيد المتاح</p>
                                <p className="text-2xl md:text-3xl font-black tracking-tighter whitespace-nowrap">EGP {walletBalance.toFixed(2)}</p>
                             </div>
                             <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white"><CreditCard size={20} /></div>
                          </div>
                          <p className="text-[#777aaf] font-bold text-center max-w-sm leading-relaxed">يمكنك استخدام محفظتك الرقمية لحجز الفنادق بسرعة وتلقي استرداد المبالغ في حال الإلغاء.</p>
                       </div>
                    )}
                    
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar (Right in RTL) */}
          <aside className="lg:col-span-4 lg:order-1">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-[#d6d6e7]/50 shadow-sm p-6 md:p-8 sticky top-32 space-y-8 md:space-y-10">
              {/* User Profile Info */}
              <div className="text-center space-y-6">
                <div className="relative w-32 h-32 mx-auto">
                   <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-[#e8e5f0] shadow-xl relative">
                       <img 
                        src={userData?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        className="w-full h-full object-cover" 
                       />
                   </div>
                   <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#4F46E5] text-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white cursor-pointer hover:bg-[#0f0b18] hover:scale-110 transition-all disabled:opacity-50">
                      {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={18} />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        disabled={isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (file.size > 1024 * 1024) {
                            showError("ملف كبير جداً", "يرجى اختيار صورة بحجم أقل من 1 ميجابايت");
                            return;
                          }

                          setIsUploading(true);
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64 = reader.result as string;
                            try {
                              await updateUserProfileImage(user.uid, base64);
                              showSuccess("تم التحديث", "تم تحديث صورة الملف الشخصي بنجاح");
                            } catch (err: any) {
                              console.error("Upload error:", err);
                              showError("فشل التحديث", err.message || "لم نتمكن من تحديث الصورة");
                            } finally {
                              setIsUploading(false);
                              e.target.value = '';
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                   </label>
                </div>
                <div className="space-y-1">
                   <h3 className="text-xl md:text-2xl font-black text-[#151e63] tracking-tighter">{user.displayName}</h3>
                   <p className="text-sm text-[#777aaf] font-medium">{user.email}</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all font-black text-sm group",
                      activeTab === item.id 
                        ? "bg-[#4F46E5] text-white shadow-lg shadow-[#e3dff0]" 
                        : "text-[#777aaf] hover:bg-[#f5f5fa] hover:text-[#4F46E5]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                       {item.icon}
                       <span>{item.label}</span>
                    </div>
                    <ChevronLeft size={16} className={cn("transition-transform", activeTab === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-x-2")} />
                  </button>
                ))}
                
                <div className="h-px bg-[#d6d6e7]/30 my-6" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-sm"
                >
                   <div className="flex items-center gap-3">
                      <LogOut size={20} />
                      <span>تسجيل الخروج</span>
                   </div>
                </button>
              </div>

              {/* Security Badge */}
              <div className="p-6 bg-[#fcfcfd] rounded-[2rem] border border-[#d6d6e7]/30 flex items-center gap-4">
                 <div className="w-10 h-10 bg-[#f0eef5] rounded-xl flex items-center justify-center text-[#4F46E5]"><ShieldCheck size={20} /></div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-[#151e63] uppercase">حماية الحساب</p>
                    <p className="text-[8px] text-[#777aaf] font-bold">حسابك مؤمن بنظام AQUA-SECURE</p>
                 </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {showWalletModal && (
        <WalletTopUpModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      )}
    </div>
  );
}
