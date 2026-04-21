// ============================================================================
// 🔗 REAL-TIME SYNC EXAMPLE - مثال عملي للربط الفوري بين الثلاثة
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  query,
  collectionGroup,
  orderBy,
  limit,
  onSnapshot,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { City, Hotel, Room } from './types';

/**
 * 🎯 هذا المثال يوضح:
 * 1. كيف Dashboard يضيف بيانات
 * 2. كيف Firestore يحفظ ويعدّل
 * 3. كيف Website يستقبل فوراً ويعرض
 */

// ============================================================================
// 📊 من Dashboard: إضافة فندق جديد
// ============================================================================

export async function addNewHotel(
  cityId: string,
  hotelData: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    console.log(`📝 إضافة فندق جديد في المدينة: ${cityId}`);

    // ⭐ الخطوة 1: إنشاء مرجع الـ subcollection
    const hotelsRef = collection(db, 'cities', cityId, 'hotels');

    // ⭐ الخطوة 2: إضافة الفندق مع البيانات الكاملة
    const docRef = await addDoc(hotelsRef, {
      // بيانات من Dashboard
      name: hotelData.name,
      description: hotelData.description,
      location: hotelData.location,
      price: hotelData.price,
      rating: hotelData.rating,
      images: hotelData.images,
      amenities: hotelData.amenities,
      city_img: hotelData.city_img,
      city: hotelData.city,

      // Metadata تلقائي
      createdAt: serverTimestamp(), // ← Firebase timestamp (أفضل للترتيب)
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ تم إضافة الفندق بـ ID: ${docRef.id}`);
    console.log(`📍 المسار: cities/${cityId}/hotels/${docRef.id}`);

    // ⭐ الخطوة 3: إرجاع الـ ID للـ state (اختياري)
    return docRef.id;
  } catch (error) {
    // ❌ معالجة الأخطاء الذكية
    handleFirestoreError(error, OperationType.CREATE, 'hotels');
    return null;
  }
}

// ============================================================================
// 🎧 من Website: الاستماع للفنادق الجديدة (Real-time)
// ============================================================================

export function useLatestHotels(cityId?: string) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        setLoading(true);

        // ⭐ البحث عن الفنادق
        let q;

        if (cityId) {
          // إذا كانت هناك مدينة محددة: جلب فنادق تلك المدينة فقط
          const hotelsRef = collection(db, 'cities', cityId, 'hotels');
          q = query(
            hotelsRef,
            orderBy('createdAt', 'desc'),
            limit(10)
          );
        } else {
          // بدون مدينة: جلب جميع الفنادق (Collection Group)
          q = query(
            collectionGroup(db, 'hotels'),
            orderBy('createdAt', 'desc'),
            limit(4)
          );
        }

        // ⭐ فتح القناة: "إذا تغيرت الفنادق، أخبرني فوراً"
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            // ✅ Callback عند التغيير
            console.log(`✅ تحديث الفنادق: ${snapshot.docs.length} فندق`);

            const hotelsData = snapshot.docs.map((doc) => {
              // تحويل Firebase Timestamp إلى ISO string
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
              } as Hotel;
            });

            // تحديث الواجهة تلقائياً
            setHotels(hotelsData);
            setError(null);
            setLoading(false);
          },

          // ❌ معالج الأخطاء
          (err) => {
            console.error('❌ خطأ في جلب الفنادق:', err);
            handleFirestoreError(err, OperationType.LIST, 'hotels');
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.error('❌ Error setting up listener:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    setupListener();

    // ⭐ تنظيف: إغلاق القناة عند unmount أو تغيير cityId
    return () => {
      if (unsubscribe) {
        console.log('🔌 إغلاق القناة (تنظيف الموارد)');
        unsubscribe();
      }
    };
  }, [cityId]); // تشغيل مجدداً عند تغيير cityId

  return { hotels, loading, error };
}

// ============================================================================
// 🎧 من Website: الاستماع للغرف (مثال متقدم)
// ============================================================================

export function useHotelRooms(cityId: string, hotelId: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityId || !hotelId) return;

    // ⭐ مسار الـ subcollection: cities/{cityId}/hotels/{hotelId}/rooms
    const roomsRef = collection(db, 'cities', cityId, 'hotels', hotelId, 'rooms');
    const q = query(roomsRef, orderBy('price', 'asc'));

    // فتح القناة
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];

      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cityId, hotelId]);

  return { rooms, loading };
}

// ============================================================================
// 🎲 الدالة الشاملة: إضافة كل شيء (City → Hotel → Rooms)
// ============================================================================

export async function addCompleteHotel(
  cityId: string,
  hotelData: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>,
  roomsData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<boolean> {
  try {
    // ⭐ الخطوة 1: إضافة الفندق
    const hotelId = await addNewHotel(cityId, hotelData);
    if (!hotelId) throw new Error('فشل إضافة الفندق');

    console.log(`✅ تم إضافة الفندق: ${hotelData.name}`);

    // ⭐ الخطوة 2: إضافة الغرف تحت الفندق
    const roomsRef = collection(
      db,
      'cities',
      cityId,
      'hotels',
      hotelId,
      'rooms'
    );

    for (const room of roomsData) {
      await addDoc(roomsRef, {
        ...room,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    console.log(`✅ تم إضافة ${roomsData.length} غرفة`);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'hotels_and_rooms');
    return false;
  }
}

// ============================================================================
// 🎯 مثال الاستخدام في React Component
// ============================================================================

export function HotelListComponent() {
  const { hotels, loading, error } = useLatestHotels();

  if (loading) {
    return <div>⏳ جاري تحميل الفنادق...</div>;
  }

  if (error) {
    return <div>❌ خطأ: {error}</div>;
  }

  if (hotels.length === 0) {
    return <div>📭 لا توجد فنادق حالياً</div>;
  }

  return (
    <div className="hotels-list">
      <h2>🏨 أحدث الفنادق ({hotels.length})</h2>
      
      {hotels.map((hotel) => (
        <div key={hotel.id} className="hotel-card">
          <h3>{hotel.name}</h3>
          <p>{hotel.description}</p>
          <p>💰 السعر: {hotel.price} EGP</p>
          <p>⭐ التقييم: {hotel.rating}/5</p>
          
          {/* الصور */}
          {hotel.images && hotel.images.length > 0 && (
            <img src={hotel.images[0]} alt={hotel.name} />
          )}
          
          {/* المرافق */}
          {hotel.amenities && (
            <div className="amenities">
              {hotel.amenities.map((amenity) => (
                <span key={amenity} className="tag">
                  {amenity}
                </span>
              ))}
            </div>
          )}
          
          {/* وقت الإنشاء */}
          <small>
            {new Date(hotel.createdAt).toLocaleDateString('ar-EG')}
          </small>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 🏗️ مثال: إضافة فندق من Dashboard
// ============================================================================

export function AddHotelForm({ cityId }: { cityId: string }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    city: '',
    price: 0,
    rating: 4.5,
    images: '',
    amenities: '',
    city_img: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hotelData: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      description: formData.description,
      location: formData.location,
      city: formData.city,
      price: formData.price,
      rating: formData.rating,
      images: formData.images.split(',').map((url) => url.trim()),
      amenities: formData.amenities.split(',').map((a) => a.trim()),
      city_img: formData.city_img,
    };

    // ⭐ هذا الـ call سيؤدي إلى:
    // 1. إضافة الفندق في Firebase
    // 2. Firebase يرسل تنبيه
    // 3. HotelListComponent يستقبل البيانات الجديدة
    // 4. الموقع يعاد render مع الفندق الجديد 🎉
    
    const success = await addNewHotel(cityId, hotelData);

    if (success) {
      alert('✅ تم إضافة الفندق بنجاح!');
      // فارغ النموذج
      setFormData({
        name: '',
        description: '',
        location: '',
        city: '',
        price: 0,
        rating: 4.5,
        images: '',
        amenities: '',
        city_img: '',
      });
    } else {
      alert('❌ فشل إضافة الفندق');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="اسم الفندق"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        placeholder="الوصف"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        required
      />
      {/* ... باقي الحقول ... */}
      <button type="submit">إضافة الفندق</button>
    </form>
  );
}

// ============================================================================
// 📈 مثال متقدم: Firestore Listener Optimization
// ============================================================================

/**
 * 🎓 نصيحة: كيف تتجنب المشاكل الشائعة
 * 
 * ❌ المشكلة 1: فتح الكثير من الـ Listeners
 *    ✅ الحل: استخدم useEffect cleanup function
 * 
 * ❌ المشكلة 2: عدم التعامل مع الأخطاء
 *    ✅ الحل: استخدم error callback في onSnapshot
 * 
 * ❌ المشكلة 3: عدم تحويل Timestamps بشكل صحيح
 *    ✅ الحل: استخدم .toDate().toISOString()
 * 
 * ❌ المشكلة 4: عدم استخدام Indexes
 *    ✅ الحل: اتبع اقتراحات Firebase Console
 */

export default {
  addNewHotel,
  useLatestHotels,
  useHotelRooms,
  addCompleteHotel,
  HotelListComponent,
  AddHotelForm,
};
