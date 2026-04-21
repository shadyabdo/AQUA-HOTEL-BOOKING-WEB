import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Wallet,
  Search,
  Globe,
  HelpCircle,
  MapPin,
  Calendar,
  Home,
  Compass,
  Ticket,
  Newspaper,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/src/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubUser: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Listen to Firestore for profile image & other data
        unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        });
      } else {
        setUserData(null);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#d6d6e7]/50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-[#4F46E5] p-2 rounded-2xl shadow-lg shadow-[#4F46E5]/30 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="AQUA BOOKING" className="h-10 w-auto object-contain" />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {[
            { name: "الرئيسية", path: "/", icon: <Home size={18} /> },
            { name: "اكتشف", path: "/rooms", icon: <Compass size={18} /> },
            { name: "الكوبونات", path: "/offers", icon: <Ticket size={18} /> },
            { name: "المدونة", path: "/articles", icon: <Newspaper size={18} /> },
            { name: "تواصل معنا", path: "/contact", icon: <MessageCircle size={18} /> },
          ].map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={cn(
                "text-[15px] font-black transition-all relative px-5 py-2.5 rounded-xl flex items-center gap-2.5 group overflow-hidden",
                location.pathname === link.path 
                  ? "text-[#4F46E5] bg-indigo-50/50" 
                  : "text-[#777aaf] hover:text-[#4F46E5] hover:bg-gray-50 hover:scale-105"
              )}
            >
              <span className={cn(
                "transition-transform duration-300 group-hover:rotate-12",
                location.pathname === link.path && "scale-110"
              )}>
                {link.icon}
              </span>
              <span className="relative z-10">{link.name}</span>
              
              {location.pathname === link.path && (
                <motion.span 
                  layoutId="nav-active"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5] rounded-full mx-4" 
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              {/* Fixed: Removed asChild which was causing TS error */}
              <DropdownMenuTrigger>
                <div className="flex items-center gap-3 p-1 pr-3 bg-[#f5f5fa] rounded-full hover:bg-[#d6d6e7]/30 transition-all border border-[#d6d6e7]/50 cursor-pointer">
                  <span className="text-xs font-bold text-[#151e63] hidden sm:block">{user.displayName?.split(' ')[0]}</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm">
                    <img 
                      src={userData?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                      alt="User" 
                    />
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2 rounded-2xl shadow-2xl border-[#d6d6e7]/50" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-4">
                    <p className="text-sm font-black text-[#151e63]">{user.displayName}</p>
                    <p className="text-[10px] text-[#777aaf] font-medium">{user.email}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-xl p-3 gap-3 cursor-pointer">
                    <User size={18} className="text-[#4F46E5]" /> <span className="font-bold">حسابي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-xl p-3 gap-3 cursor-pointer">
                    <Wallet size={18} className="text-green-500" /> <span className="font-bold">المحفظة</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="rounded-xl p-3 gap-3 cursor-pointer text-red-600">
                  <LogOut size={18} /> <span className="font-bold">خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-[#4F46E5] font-bold hover:bg-[#EEF2FF] rounded-xl px-6" onClick={login}>
                دخول
              </Button>
              <Button className="bg-[#4F46E5] text-white hover:bg-[#3730A3] font-bold rounded-xl px-6 shadow-lg shadow-indigo-100" onClick={login}>
                اشتراك
              </Button>
            </div>
          )}
          
          <Button variant="ghost" className="lg:hidden p-2 rounded-xl text-[#151e63]" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-[#d6d6e7] overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
              {[
                { name: "الرئيسية", path: "/", icon: <Home size={20} /> },
                { name: "اكتشف", path: "/rooms", icon: <Compass size={20} /> },
                { name: "الكوبونات", path: "/offers", icon: <Ticket size={20} /> },
                { name: "المدونة", path: "/articles", icon: <Newspaper size={20} /> },
                { name: "تواصل معنا", path: "/contact", icon: <MessageCircle size={20} /> },
              ].map(link => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={cn(
                    "flex items-center gap-3 text-lg font-bold p-3 rounded-xl transition-all",
                    location.pathname === link.path ? "bg-indigo-50 text-[#4F46E5]" : "text-[#151e63] hover:bg-gray-50"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <span className={cn(location.pathname === link.path ? "text-[#4F46E5]" : "text-[#777aaf]")}>{link.icon}</span>
                  {link.name}
                </Link>
              ))}
              {!user && (
                <Button onClick={login} className="w-full h-12 bg-[#4F46E5] text-white font-bold rounded-xl">تسجيل الدخول</Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
