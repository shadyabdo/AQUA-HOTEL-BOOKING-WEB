// ============================================================================
// 🚀 INTEGRATION GUIDE - دليل التطبيق العملي
// ============================================================================

/**
 * هذا الملف يوضح:
 * 1. كيف تستخدم AdminDashboard لإضافة بيانات
 * 2. كيف تستخدم App.tsx لعرض البيانات
 * 3. كيف يتم الربط بينهما في الوقت الفعلي
 */

// ============================================================================
// 📋 الحالة 1: إضافة مدينة جديدة (من Dashboard)
// ============================================================================

/**
 * المستخدم: المسؤول
 * الملف: AdminDashboard.tsx
 * الدالة: addCity()
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function addNewCity(cityName: string, imageUrl: string) {
  try {
    // ⭐ الخطوة 1: إنشاء مرجع الـ Collection
    const citiesRef = collection(db, 'cities');

    // ⭐ الخطوة 2: إضافة المدينة
    const docRef = await addDoc(citiesRef, {
      name: cityName,                    // "القاهرة"
      image: imageUrl,                   // https://...
      isFeatured: true,
      createdAt: serverTimestamp(),     // Firebase timestamp
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ تم إضافة مدينة: ${cityName}`);
    return docRef.id;                   // إرجاع ID المدينة الجديدة
  } catch (error) {
    console.error('❌ خطأ في إضافة المدينة:', error);
    throw error;
  }
}

// ============================================================================
// 📋 الحالة 2: عرض المدن على الموقع (من App.tsx)
// ============================================================================

/**
 * المستخدم: الزائر
 * الملف: App.tsx (HomePage)
 * الدالة: setupCities()
 * 
 * هذا يحدث تلقائياً عند تحميل الصفحة الرئيسية
 */

import { query, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export function useCitiesListener() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⭐ الخطوة 1: إنشاء الاستعلام
    const q = query(collection(db, 'cities'));

    // ⭐ الخطوة 2: فتح القناة
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // ✅ عند أول تحميل + كل تغيير
        const citiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`✅ تم تحديث المدن: ${citiesData.length} مدينة`);
        setCities(citiesData);
        setLoading(false);

        /**
         * 🎯 النتيجة:
         * - إذا أضاف المسؤول مدينة جديدة من Dashboard
         * - Firebase يرسل تنبيه فوراً
         * - setCities() يحدّث الـ state
         * - React يعاد render المكون
         * - المستخدم يرى المدينة الجديدة! ✨
         */
      },
      (error) => {
        console.error('❌ خطأ في جلب المدن:', error);
        setLoading(false);
      }
    );

    // ⭐ الخطوة 3: تنظيف عند unmount
    return () => {
      console.log('🔌 إغلاق القناة');
      unsubscribe();
    };
  }, []);

  return { cities, loading };
}

// ============================================================================
// 📋 الحالة 3: إضافة فندق (من Dashboard، اختيار المدينة أولاً)
// ============================================================================

/**
 * المسار: Dashboard → اختيار مدينة → ملء form → إضافة فندق
 */

import type { Hotel } from './types';

export async function addHotelUnderCity(
  cityId: string,
  hotelData: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    // ⭐ لاحظ: الفندق يُضاف كـ SUBCOLLECTION داخل المدينة
    const hotelsRef = collection(db, 'cities', cityId, 'hotels');

    const docRef = await addDoc(hotelsRef, {
      ...hotelData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ تم إضافة فندق: ${hotelData.name}`);
    console.log(`📍 المسار: cities/${cityId}/hotels/${docRef.id}`);

    return docRef.id;
  } catch (error) {
    console.error('❌ خطأ في إضافة الفندق:', error);
    throw error;
  }
}

// ============================================================================
// 📋 الحالة 4: عرض الفنادق حسب المدينة (من CityHotelsPage)
// ============================================================================

/**
 * المستخدم يضغط على "القاهرة" من الصفحة الرئيسية
 * ينتقل إلى CityHotelsPage.tsx
 * يريد رؤية جميع فنادق القاهرة فقط
 */

export function useHotelsInCity(cityId: string) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityId) return;

    // ⭐ استعلام الفنادق تحت المدينة المحددة فقط
    const hotelsRef = collection(db, 'cities', cityId, 'hotels');
    const q = query(hotelsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hotelsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ فنادق المدينة: ${hotelsData.length} فندق`);
      setHotels(hotelsData);
      setLoading(false);

      /**
       * 🎯 التطبيق:
       * - المستخدم يدخل قائمة فنادق القاهرة
       * - يرى فنادق القاهرة فقط (بفضل cityId)
       * - إذا أضاف المسؤول فندق جديد للقاهرة من Dashboard
       * - يظهر تلقائياً في قائمة المستخدم! ✨
       */
    });

    return () => unsubscribe();
  }, [cityId]);

  return { hotels, loading };
}

// ============================================================================
// 📋 الحالة 5: إضافة غرف تحت فندق (من Dashboard)
// ============================================================================

/**
 * المسؤول يختار:
 * 1. مدينة
 * 2. فندق تحت تلك المدينة
 * 3. ثم يضيف غرف تحت الفندق
 */

import type { Room } from './types';

export async function addRoomUnderHotel(
  cityId: string,
  hotelId: string,
  roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    // ⭐ الغرفة تُضاف كـ SUBCOLLECTION داخل الفندق
    const roomsRef = collection(
      db,
      'cities',
      cityId,
      'hotels',
      hotelId,
      'rooms'
    );

    const docRef = await addDoc(roomsRef, {
      ...roomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ تم إضافة غرفة: ${roomData.title}`);
    console.log(
      `📍 المسار: cities/${cityId}/hotels/${hotelId}/rooms/${docRef.id}`
    );

    return docRef.id;
  } catch (error) {
    console.error('❌ خطأ في إضافة الغرفة:', error);
    throw error;
  }
}

// ============================================================================
// 📋 الحالة 6: عرض غرف فندق معين (من HotelPage أو RoomDetailsPage)
// ============================================================================

/**
 * المستخدم يضغط على فندق
 * يريد رؤية جميع الغرف المتاحة في هذا الفندق
 */

export function useRoomsInHotel(cityId: string, hotelId: string) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityId || !hotelId) return;

    // ⭐ استعلام الغرف تحت الفندق المحدد
    const roomsRef = collection(
      db,
      'cities',
      cityId,
      'hotels',
      hotelId,
      'rooms'
    );
    const q = query(roomsRef, orderBy('price', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ غرف الفندق: ${roomsData.length} غرفة`);
      setRooms(roomsData);
      setLoading(false);

      /**
       * 🎯 التطبيق:
       * - المستخدم يرى جميع غرف الفندق
       * - مرتبة حسب السعر (الأرخص أولاً)
       * - إذا أضاف المسؤول غرفة جديدة من Dashboard
       * - تظهر تلقائياً في القائمة! ✨
       */
    });

    return () => unsubscribe();
  }, [cityId, hotelId]);

  return { rooms, loading };
}

// ============================================================================
// 📋 الحالة 7: البحث الشامل (جميع الفنادق من جميع المدن)
// ============================================================================

/**
 * من App.tsx - الصفحة الرئيسية
 * تريد عرض "أحدث الفنادق" من جميع المدن
 */

import { collectionGroup } from 'firebase/firestore';

export function useAllHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⭐ collectionGroup: يبحث عن جميع "hotels" subcollections
    const q = query(
      collectionGroup(db, 'hotels'),
      orderBy('createdAt', 'desc'),
      limit(4)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hotelsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ أحدث الفنادق: ${hotelsData.length}`);
      setHotels(hotelsData);
      setLoading(false);

      /**
       * 🎯 السحر هنا:
       * - يجلب فنادق من جميع المدن
       * - يرتبها من الأحدث
       * - يأخذ أول 4 فقط
       * 
       * المسارات:
       * - cities/B8WKkb8.../hotels/wYhOSTI8...
       * - cities/XVHQz1Z.../hotels/aPuE4Wx...
       * - cities/ayneHBZ.../hotels/p0wzd4M...
       * - ...
       * 
       * collectionGroup يجمعهم جميعاً في نتيجة واحدة!
       */
    });

    return () => unsubscribe();
  }, []);

  return { hotels, loading };
}

// ============================================================================
// 🎓 الخلاصة: كيف يعمل كل شيء معاً
// ============================================================================

/**
 * 
 * ┌──────────────────────────────────────────────────────────────┐
 * │ التدفق الكامل                                               │
 * └──────────────────────────────────────────────────────────────┘
 * 
 * 
 * 1️⃣  المسؤول يدخل Dashboard
 *     └─ يختار مدينة
 *     └─ يضيف فندق جديد
 *     └─ يضغط "إضافة"
 * 
 *         ↓
 * 
 * 2️⃣  addHotelUnderCity() يعمل
 *     └─ إنشاء subcollection
 *     └─ إضافة البيانات مع serverTimestamp()
 *     └─ Firebase يحفظ البيانات
 * 
 *         ↓
 * 
 * 3️⃣  Firebase يرسل تنبيهات
 *     └─ يبحث عن جميع الـ listeners
 *     └─ يجد: useAllHotels()
 *     └─ يجد: useHotelsInCity(cityId)
 *     └─ يرسل: "البيانات تغيرت!"
 * 
 *         ↓
 * 
 * 4️⃣  React Components تستقبل التنبيهات
 *     └─ App.tsx → setHotels() → re-render
 *     └─ CityHotelsPage.tsx → setHotels() → re-render
 * 
 *         ↓
 * 
 * 5️⃣  المستخدم يرى الفندق الجديد!
 *     └─ في الصفحة الرئيسية
 *     └─ في قائمة فنادق المدينة
 *     └─ في المشهد (كل مكان يعرض الفندق الجديد)
 * 
 * 
 * 🎯 المدة: أقل من 1 ثانية! ⚡
 * 🎉 بدون تحديث صفحة يدوي!
 */

// ============================================================================
// 📊 النصائح الذهبية
// ============================================================================

/**
 * 1. استخدم Types موحدة
 *    ✅ import type { Hotel, Room, City } from './types';
 * 
 * 2. استخدم serverTimestamp() دائماً
 *    ✅ createdAt: serverTimestamp()
 *    ❌ createdAt: new Date().toISOString()
 * 
 * 3. اغلق Listeners عند الانتهاء
 *    ✅ return () => unsubscribe();
 *    ❌ لا تتركها مفتوحة
 * 
 * 4. معالجة الأخطاء
 *    ✅ try-catch + handleFirestoreError()
 *    ❌ لا تتجاهل الأخطاء
 * 
 * 5. استخدم Hierarchical Structure
 *    ✅ cities > hotels > rooms
 *    ❌ لا تخزن foreign keys
 * 
 * 6. استخدم collectionGroup للبحث الشامل
 *    ✅ collectionGroup(db, 'hotels')
 *    ❌ لا تحاول البحث من مسار واحد
 */

export const INTEGRATION_EXAMPLES = {
  addNewCity,
  useCitiesListener,
  addHotelUnderCity,
  useHotelsInCity,
  addRoomUnderHotel,
  useRoomsInHotel,
  useAllHotels,
};
