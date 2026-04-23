import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon, Users, Bed, MapPin, Hotel, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { collection, getDocs } from "firebase/firestore";
import { db, getAllHotels } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface Suggestion {
  id: string;
  name: string;
  type: "city" | "hotel";
  cityId?: string; // Added for hotels
}

export default function BookingBar({ onSearch }: { onSearch?: () => void }) {
  const navigate = useNavigate();
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(new Date().getTime() + 86400000 * 3),
  });
  const [guestsConfig, setGuestsConfig] = useState({ adults: 2, children: 0, rooms: 1 });
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  const guestsLabel = `${guestsConfig.adults} بالغين · ${guestsConfig.children} أطفال · ${guestsConfig.rooms} غرفة`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const citiesSnapshot = await getDocs(collection(db, "cities"));
        const hotels = await getAllHotels();

        const citySuggestions: Suggestion[] = citiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          type: "city"
        }));

        const hotelSuggestions: Suggestion[] = hotels.map(hotel => ({
          id: hotel.id,
          name: hotel.name,
          type: "hotel",
          cityId: hotel.cityId
        }));

        setSuggestions([...citySuggestions, ...hotelSuggestions]);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (destination.trim().length > 0) {
      const filtered = suggestions.filter(s => 
        s.name.toLowerCase().includes(destination.toLowerCase())
      ).slice(0, 8);
      setFilteredSuggestions(filtered);
      setIsSuggestionsOpen(filtered.length > 0);
    } else {
      setIsSuggestionsOpen(false);
    }
  }, [destination, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setIsGuestsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBooking = () => {
    const from = date.from ? date.from.toISOString() : new Date().toISOString();
    const to = date.to ? date.to.toISOString() : new Date(new Date(from).getTime() + 86400000).toISOString();
    
    const queryParams = `?from=${from}&to=${to}&guests=${guestsConfig.adults}&adults=${guestsConfig.adults}&children=${guestsConfig.children}&rooms=${guestsConfig.rooms}`;

    if (selectedSuggestion) {
      if (selectedSuggestion.type === "city") {
        navigate(`/city/${selectedSuggestion.name}${queryParams}`);
      } else if (selectedSuggestion.type === "hotel" && selectedSuggestion.cityId) {
        navigate(`/hotel/${selectedSuggestion.cityId}/${selectedSuggestion.id}${queryParams}`);
      }
    } else {
      navigate(`/rooms${queryParams}&destination=${destination}`);
    }
    
    if (onSearch) onSearch();
  };

  return (
    <div className="container-custom relative z-30 -mt-10 sm:-mt-16 md:-mt-20 lg:-mt-24 3xl:-mt-32">
      <div className="bg-white p-2 md:p-3 lg:p-4 rounded-[2rem] sm:rounded-[2.5rem] 3xl:rounded-[3.5rem] shadow-[0_20px_60px_rgba(55,48,163,0.15)] max-w-7xl mx-auto border border-[#d6d6e7]/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-1 md:gap-2 lg:gap-2 items-center">
          
          {/* Destination */}
          <div className="lg:col-span-4 flex items-center px-4 xl:px-6 py-3 md:py-4 xl:py-5 rounded-2xl md:rounded-[1.8rem] 3xl:rounded-[2.2rem] hover:bg-[#f5f5fa] transition-colors relative group" ref={dropdownRef}>
            <MapPin className="text-[#4F46E5] ml-3 md:ml-4 shrink-0 group-hover:scale-110 transition-transform" size={24} />
            <div className="flex-1">
               <label className="text-[9px] md:text-[10px] font-black text-[#777aaf] uppercase tracking-widest block mb-0.5">الوجهة</label>
               <input 
                type="text" 
                placeholder="إلى أين تريد الذهاب؟" 
                className="w-full outline-none text-sm md:text-base 3xl:text-lg font-bold placeholder:text-[#b6b7d5] bg-transparent"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => destination.trim().length > 0 && setIsSuggestionsOpen(true)}
              />
            </div>

            <AnimatePresence>
              {isSuggestionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white border border-[#d6d6e7] shadow-2xl rounded-2xl overflow-hidden z-50 py-2"
                >
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => { 
                        setDestination(suggestion.name); 
                        setSelectedSuggestion(suggestion);
                        setIsSuggestionsOpen(false); 
                      }}
                      className="w-full flex items-center px-6 py-4 hover:bg-[#f5f5fa] text-right transition-colors"
                    >
                      <div className="bg-[#e8e5f0] p-2 rounded-lg ml-4">
                        {suggestion.type === "city" ? <MapPin size={18} className="text-[#4F46E5]" /> : <Hotel size={18} className="text-[#4F46E5]" />}
                      </div>
                      <span className="text-sm font-bold text-[#151e63]">{suggestion.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dates */}
          <div className="lg:col-span-4 flex items-center px-4 xl:px-6 py-3 md:py-4 xl:py-5 rounded-2xl md:rounded-[1.8rem] 3xl:rounded-[2.2rem] hover:bg-[#f5f5fa] transition-colors lg:border-r border-[#d6d6e7]/50 group">
            <Popover>
              <PopoverTrigger
                render={
                  <button className="flex items-center w-full text-right group">
                    <CalendarIcon className="text-[#4F46E5] ml-3 md:ml-4 shrink-0 group-hover:rotate-6 transition-transform" size={24} />
                    <div className="flex-1">
                       <label className="text-[9px] md:text-[10px] font-black text-[#777aaf] uppercase tracking-widest block mb-0.5">التواريخ</label>
                       <span className="text-sm md:text-base 3xl:text-lg font-bold text-[#151e63] whitespace-nowrap">
                        {date.from ? (
                          date.to ? (
                            <>{format(date.from, "d MMM", { locale: ar })} — {format(date.to, "d MMM", { locale: ar })}</>
                          ) : (
                            format(date.from, "d MMM", { locale: ar })
                          )
                        ) : (
                          "اختر التواريخ"
                        )}
                      </span>
                    </div>
                  </button>
                }
              />
              <PopoverContent className="w-auto p-0 rounded-[22px] border-[#4F46E5]/10 shadow-[0_30px_70px_rgba(79,70,229,0.15)] overflow-hidden" align="center">
                <Calendar
                  mode="range"
                  selected={{ from: date.from, to: date.to }}
                  onSelect={(range: any) => setDate(range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                  locale={ar}
                  className="p-0"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div className="lg:col-span-3 relative" ref={guestsRef}>
            <div 
              className="flex items-center px-4 xl:px-6 py-3 md:py-4 xl:py-5 rounded-2xl md:rounded-[1.8rem] 3xl:rounded-[2.2rem] hover:bg-[#f5f5fa] transition-colors lg:border-r border-[#d6d6e7]/50 cursor-pointer group"
              onClick={() => setIsGuestsOpen(!isGuestsOpen)}
            >
              <Users className="text-[#4F46E5] ml-3 md:ml-4 shrink-0 group-hover:scale-110 transition-transform" size={24} />
              <div className="flex-1">
                 <label className="text-[9px] md:text-[10px] font-black text-[#777aaf] uppercase tracking-widest block mb-0.5">الضيوف</label>
                 <span className="text-sm md:text-base 3xl:text-lg font-bold text-[#151e63] whitespace-nowrap overflow-hidden text-ellipsis block">{guestsLabel}</span>
              </div>
            </div>

            <AnimatePresence>
              {isGuestsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white border border-[#d6d6e7] shadow-2xl rounded-2xl overflow-hidden z-50 p-6 space-y-6"
                >
                  {[
                    { label: "البالغين", key: "adults", sub: "بعمر 13 وما فوق" },
                    { label: "الأطفال", key: "children", sub: "بعمر 0 - 12" },
                    { label: "الغرف", key: "rooms", sub: "" }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#151e63]">{item.label}</p>
                        {item.sub && <p className="text-[10px] text-[#777aaf] font-medium">{item.sub}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setGuestsConfig(prev => ({ ...prev, [item.key]: Math.max(item.key === 'adults' || item.key === 'rooms' ? 1 : 0, prev[item.key as keyof typeof prev] - 1) }))}
                          className="w-8 h-8 rounded-full border border-[#d6d6e7] flex items-center justify-center text-[#4F46E5] hover:bg-[#e8e5f0] transition-colors"
                        >-</button>
                        <span className="font-bold w-4 text-center">{guestsConfig[item.key as keyof typeof guestsConfig]}</span>
                        <button 
                          onClick={() => setGuestsConfig(prev => ({ ...prev, [item.key]: prev[item.key as keyof typeof prev] + 1 }))}
                          className="w-8 h-8 rounded-full border border-[#d6d6e7] flex items-center justify-center text-[#4F46E5] hover:bg-[#e8e5f0] transition-colors"
                        >+</button>
                      </div>
                    </div>
                  ))}
                  <Button onClick={() => setIsGuestsOpen(false)} className="w-full h-12 rounded-xl bg-[#4F46E5] hover:bg-[#0f0b18] font-bold mt-4">تم</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Button */}
          <div className="lg:col-span-1 p-1 md:col-span-2 lg:col-span-1">
            <Button 
              onClick={handleBooking}
              className="w-full h-14 md:h-16 xl:h-20 rounded-2xl md:rounded-[1.5rem] 3xl:rounded-[2rem] bg-[#4F46E5] hover:bg-[#0f0b18] text-white font-black shadow-lg shadow-[#d0cae5] transition-all hover:scale-[1.02] active:scale-95"
            >
              <Search className="h-6 w-6 md:h-7 md:w-7" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
