import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Maximize, Users, BedDouble, Star, MapPin, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db, handleFirestoreError, OperationType, getAllRooms } from "@/src/lib/firebase";

interface Room {
  id: string;
  hotelId?: string;
  hotelName?: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  size: string;
  guests: number;
  bed: string;
  rating?: number;
  reviews?: number;
  location?: string;
}

export default function Rooms({ onBookRoom, onViewDetails }: { onBookRoom?: (id: string, hotelId?: string) => void, onViewDetails?: (room: Room) => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsData = await getAllRooms();
        const mappedRooms = roomsData.map(room => ({
          ...room,
          images: Array.isArray(room.images) ? room.images : [room.image || "https://picsum.photos/seed/room/800/600"],
        }));
        setRooms(mappedRooms);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading || rooms.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 text-[#4F46E5] font-black uppercase tracking-widest text-xs mb-3">
           <div className="w-8 h-px bg-[#4F46E5]" /> اخترنا لك بعناية
        </div>
        <h2 className="text-4xl font-black text-[#151e63] mb-12 tracking-tighter">إقامات مقترحة</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rooms.map((room) => (
            <div 
              key={room.id} 
              className="modern-card group flex flex-col" 
              onClick={() => onBookRoom?.(room.id, room.hotelId)}
            >
              <div className="relative h-72 overflow-hidden">
                <img
                  src={room.images[0]}
                  alt={room.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-[#d6d6e7]/30">
                  <Star size={14} className="text-[#ffb700] fill-current" />
                  <span className="text-xs font-black text-[#151e63]">{room.rating || 9.0}</span>
                </div>
              </div>
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-black text-[#151e63] mb-2 group-hover:text-[#4F46E5] transition-colors">{room.title}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-[#777aaf] mb-4">
                  <MapPin size={14} className="text-[#4F46E5]" />
                  <span>{room.location || "موقع متميز"}</span>
                </div>

                <div className="flex gap-4 text-[11px] font-bold text-[#5a5e9a] mb-6">
                   <div className="flex items-center gap-1"><Users size={14} /> x {room.guests}</div>
                   <div className="flex items-center gap-1"><BedDouble size={14} /> {room.bed}</div>
                </div>

                <div className="mt-auto pt-6 border-t border-[#d6d6e7]/30 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-[#777aaf] font-black uppercase tracking-widest block mb-1">ليلة واحدة</span>
                    <span className="text-2xl font-black text-[#151e63] tracking-tighter">EGP {room.price}</span>
                  </div>
                  <Button className="action-button px-6 rounded-xl h-12 text-sm">احجز <ChevronLeft size={16} className="mr-1" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
