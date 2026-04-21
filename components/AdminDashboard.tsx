import React, { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// ============================================================================
// 📱 ADMIN DASHBOARD - لإدارة الفنادق والغرف والأسعار والصور
// ============================================================================

interface AdminHotel {
  id: string;
  name: string;
  description: string;
  city: string;
  price: number;
  images: string[];
  amenities: string[];
  rating: number;
}

interface AdminRoom {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  amenities: string[];
  bed: string;
  guests: number;
  size: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"hotels" | "rooms">("hotels");
  const [cities, setCities] = useState<any[]>([]);
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedHotel, setSelectedHotel] = useState("");

  // ========== حالة النموذج - إضافة/تعديل فندق ==========
  const [hotelForm, setHotelForm] = useState({
    name: "",
    description: "",
    location: "",
    city_img: "",
    price: 0,
    images: "",
    amenities: "",
    rating: 4.5,
  });

  // ========== حالة النموذج - إضافة/تعديل غرفة ==========
  const [roomForm, setRoomForm] = useState({
    title: "",
    description: "",
    price: 0,
    images: "",
    amenities: "",
    bed: "",
    guests: 1,
    size: "",
  });

  // ========== جلب المدن عند التحميل ==========
  useEffect(() => {
    const fetchCities = async () => {
      const citiesRef = collection(db, "cities");
      const unsubscribe = onSnapshot(citiesRef, (snapshot) => {
        const citiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCities(citiesData);
      });
      return unsubscribe;
    };
    fetchCities();
  }, []);

  // ========== جلب الفنادق عندما يتم اختيار مدينة ==========
  useEffect(() => {
    if (!selectedCity) return;

    const fetchHotels = async () => {
      const hotelsRef = collection(db, "cities", selectedCity, "hotels");
      const unsubscribe = onSnapshot(hotelsRef, (snapshot) => {
        const hotelsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as AdminHotel[];
        setHotels(hotelsData);
      });
      return unsubscribe;
    };
    fetchHotels();
  }, [selectedCity]);

  // ========== جلب الغرف عندما يتم اختيار فندق ==========
  useEffect(() => {
    if (!selectedCity || !selectedHotel) return;

    const fetchRooms = async () => {
      const roomsRef = collection(
        db,
        "cities",
        selectedCity,
        "hotels",
        selectedHotel,
        "rooms"
      );
      const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
        const roomsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as AdminRoom[];
        setRooms(roomsData);
      });
      return unsubscribe;
    };
    fetchRooms();
  }, [selectedCity, selectedHotel]);

  // ========= إضافة فندق جديد ==========
  const addHotel = async () => {
    if (!selectedCity || !hotelForm.name) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      const hotelsRef = collection(db, "cities", selectedCity, "hotels");
      const cityName = cities.find(c => c.id === selectedCity)?.name || "مدينة";
      
      await addDoc(hotelsRef, {
        name: hotelForm.name,
        description: hotelForm.description,
        location: hotelForm.location,
        city: cityName,
        city_img: hotelForm.city_img,
        price: hotelForm.price,
        rating: hotelForm.rating,
        images: hotelForm.images.split(",").map(img => img.trim()).filter(img => img),
        amenities: hotelForm.amenities.split(",").map(a => a.trim()).filter(a => a),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      toast.success("✅ تم إضافة الفندق بنجاح! سيظهر على الموقع قريباً");
      setHotelForm({
        name: "",
        description: "",
        location: "",
        city_img: "",
        price: 0,
        images: "",
        amenities: "",
        rating: 4.5,
      });
    } catch (error) {
      console.error("❌ خطأ:", error);
      toast.error("فشل إضافة الفندق");
    }
  };

  // ========= إضافة غرفة جديدة ==========
  const addRoom = async () => {
    if (!selectedCity || !selectedHotel || !roomForm.title) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      const roomsRef = collection(
        db,
        "cities",
        selectedCity,
        "hotels",
        selectedHotel,
        "rooms"
      );
      await addDoc(roomsRef, {
        ...roomForm,
        images: roomForm.images.split(",").map(img => img.trim()),
        amenities: roomForm.amenities.split(",").map(a => a.trim()),
        guests: parseInt(roomForm.guests.toString()),
        createdAt: new Date().toISOString(),
      });
      
      toast.success("✅ تم إضافة الغرفة بنجاح!");
      setRoomForm({
        title: "",
        description: "",
        price: 0,
        images: "",
        amenities: "",
        bed: "",
        guests: 1,
        size: "",
      });
    } catch (error) {
      console.error("❌ خطأ:", error);
      toast.error("فشل إضافة الغرفة");
    }
  };

  // ========= حذف فندق ==========
  const deleteHotel = async (hotelId: string) => {
    if (!window.confirm("هل تأكد من حذف هذا الفندق؟")) return;

    try {
      await deleteDoc(
        doc(db, "cities", selectedCity, "hotels", hotelId)
      );
      toast.success("✅ تم حذف الفندق بنجاح!");
    } catch (error) {
      console.error("❌ خطأ:", error);
      toast.error("فشل حذف الفندق");
    }
  };

  // ========= حذف غرفة ==========
  const deleteRoom = async (roomId: string) => {
    if (!window.confirm("هل تأكد من حذف هذه الغرفة؟")) return;

    try {
      await deleteDoc(
        doc(db, "cities", selectedCity, "hotels", selectedHotel, "rooms", roomId)
      );
      toast.success("✅ تم حذف الغرفة بنجاح!");
    } catch (error) {
      console.error("❌ خطأ:", error);
      toast.error("فشل حذف الغرفة");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-primary">🏨 لوحة تحكم الفنادق</h1>

        {/* ========= اختيار المدينة والفندق ========= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-3 block">اختر المدينة</Label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedHotel("");
              }}
              className="w-full p-3 border border-border rounded-lg bg-background"
            >
              <option value="">-- اختر مدينة --</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </Card>

          {selectedCity && (
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-3 block">اختر الفندق</Label>
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background"
              >
                <option value="">-- اختر فندق --</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </Card>
          )}
        </div>

        {/* ========= التبويبات ========= */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("hotels")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "hotels"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🏨 الفنادق
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "rooms"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🛏️ الغرف
          </button>
        </div>

        {/* ========= إضافة الفنادق ========= */}
        {activeTab === "hotels" && selectedCity && (
          <div className="space-y-8">
            <Card className="p-8 bg-card border border-border">
              <h2 className="text-2xl font-bold mb-6">➕ إضافة فندق جديد</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label>اسم الفندق *</Label>
                  <Input
                    placeholder="مثال: فور سيزونز نايل بلازا"
                    value={hotelForm.name}
                    onChange={(e) =>
                      setHotelForm({ ...hotelForm, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>الموقع الجغرافي *</Label>
                  <Input
                    placeholder="مثال: جاردن سيتي، القاهرة"
                    value={hotelForm.location}
                    onChange={(e) =>
                      setHotelForm({ ...hotelForm, location: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>السعر الأساسي (EGP) *</Label>
                  <Input
                    type="number"
                    placeholder="850"
                    value={hotelForm.price}
                    onChange={(e) =>
                      setHotelForm({ ...hotelForm, price: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label>التقييم (1-5)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={hotelForm.rating}
                    onChange={(e) =>
                      setHotelForm({ ...hotelForm, rating: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label>الوصف *</Label>
                <Textarea
                  placeholder="وصف الفندق والمميزات الرئيسية..."
                  value={hotelForm.description}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="mb-6">
                <Label>الصور (رابط لكل صورة، مفصول بفاصلة)</Label>
                <Textarea
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  value={hotelForm.images}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, images: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <Label>صورة المدينة (غلاف الفندق)</Label>
                <Input
                  placeholder="https://example.com/city-image.jpg"
                  value={hotelForm.city_img}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, city_img: e.target.value })
                  }
                />
              </div>

              <div className="mb-6">
                <Label>المرافق (مفصول بفاصلة)</Label>
                <Textarea
                  placeholder="مسبح خاص, واي فاي مجاني, سبا, إفطار مجاني"
                  value={hotelForm.amenities}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, amenities: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <Button
                onClick={addHotel}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-lg"
              >
                ➕ إضافة الفندق
              </Button>
            </Card>

            {/* ========= قائمة الفنادق الموجودة ========= */}
            <div>
              <h2 className="text-2xl font-bold mb-6">📋 الفنادق الموجودة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hotels.map((hotel) => (
                  <Card key={hotel.id} className="p-6 bg-card border border-border">
                    <h3 className="text-xl font-bold mb-2">{hotel.name}</h3>
                    <p className="text-muted-foreground mb-3">{hotel.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-primary">
                        {hotel.price} EGP
                      </span>
                      <span className="text-yellow-500">⭐ {hotel.rating}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedHotel(hotel.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        تعديل
                      </Button>
                      <Button
                        onClick={() => deleteHotel(hotel.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        حذف
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========= إضافة الغرف ========= */}
        {activeTab === "rooms" && selectedCity && selectedHotel && (
          <div className="space-y-8">
            <Card className="p-8 bg-card border border-border">
              <h2 className="text-2xl font-bold mb-6">➕ إضافة غرفة جديدة</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label>اسم الغرفة *</Label>
                  <Input
                    placeholder="مثال: جناح ملكي مطل على البحر"
                    value={roomForm.title}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>السعر (EGP) *</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={roomForm.price}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, price: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label>نوع السرير</Label>
                  <Input
                    placeholder="سرير كينج"
                    value={roomForm.bed}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, bed: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>المساحة (متر مربع)</Label>
                  <Input
                    placeholder="120"
                    value={roomForm.size}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, size: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>عدد الضيوف</Label>
                  <Input
                    type="number"
                    placeholder="2"
                    value={roomForm.guests}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, guests: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label>الوصف</Label>
                <Textarea
                  placeholder="وصف الغرفة والمميزات..."
                  value={roomForm.description}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <Label>الصور (مفصول بفاصلة)</Label>
                <Textarea
                  placeholder="https://example.com/room1.jpg, https://example.com/room2.jpg"
                  value={roomForm.images}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, images: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="mb-6">
                <Label>المرافق (مفصول بفاصلة)</Label>
                <Textarea
                  placeholder="واي فاي, تكييف, ميني بار, شرفة، جاكوزي"
                  value={roomForm.amenities}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, amenities: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <Button
                onClick={addRoom}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-lg"
              >
                ➕ إضافة الغرفة
              </Button>
            </Card>

            {/* ========= قائمة الغرف الموجودة ========= */}
            <div>
              <h2 className="text-2xl font-bold mb-6">📋 الغرف الموجودة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <Card key={room.id} className="p-6 bg-card border border-border">
                    <h3 className="text-xl font-bold mb-2">{room.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {room.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <span>💰 {room.price} EGP</span>
                      <span>📏 {room.size} م²</span>
                      <span>🛏️ {room.bed}</span>
                      <span>👥 {room.guests} ضيوف</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedHotel(room.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                      >
                        تعديل
                      </Button>
                      <Button
                        onClick={() => deleteRoom(room.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-sm"
                      >
                        حذف
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
