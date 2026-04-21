// ============================================================================
// 🎯 HOW THE SYSTEM WORKS UNDER THE HOOD - شرح عميق للنظام
// ============================================================================

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ المسار الكامل: من الداشبورد → الداتا بيز → الموقع                      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// ============================================================================
// 1️⃣ المرحلة الأولى: ADMIN DASHBOARD (لوحة التحكم)
// ============================================================================

/**
 * الداشبورد لديه 3 خطوات:
 * 
 * ✅ الخطوة 1: اختيار المدينة
 *    - المسؤول يختار مدينة من dropdown
 *    - مثال: selectedCity = "B8WKkb8..." (city ID)
 * 
 * ✅ الخطوة 2: إضافة فندق جديد
 *    - ملء النموذج: name, description, price, images, amenities, rating
 *    - الضغط على زر "إضافة الفندق"
 *    - الكود يعمل:
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

// الكود الذي يضيف الفندق من الداشبورد:
const addHotelToFirestore = async (cityId: string, hotelData: any) => {
  try {
    // ⭐ لاحظ: الفندق يُضاف كـ SUBCOLLECTION داخل المدينة
    const hotelsRef = collection(db, 'cities', cityId, 'hotels');
    
    const docRef = await addDoc(hotelsRef, {
      // البيانات التي أدخلها المسؤول
      name: hotelData.name,                           // "فندق فور سيزونز"
      description: hotelData.description,
      location: hotelData.location,                   // "جاردن سيتي"
      price: hotelData.price,                        // 850
      rating: hotelData.rating,                      // 4.9
      images: hotelData.images,                      // [url1, url2, ...]
      amenities: hotelData.amenities,                // ["مسبح", "واي فاي", ...]
      city_img: hotelData.city_img,
      
      // البيانات التي نضيفها تلقائياً
      city: 'القاهرة',                              // ⭐ من cityId
      createdAt: new Date().toISOString(),          // ⭐ timestamp للترتيب
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ تم حفظ الفندق بـ ID:', docRef.id);
    // النتيجة: cities/B8WKkb8.../hotels/wYhOSTI8... ✅
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الفندق:', error);
  }
};

/**
 * 🎯 المهم جداً: لاحظ أن الفندق يتم حفظه كـ SUBCOLLECTION
 * 
 * قبل الحفظ: 
 *   cities/
 *     B8WKkb8...
 * 
 * بعد الحفظ:
 *   cities/
 *     B8WKkb8.../
 *       hotels/
 *         wYhOSTI8... ← الفندق الجديد
 *           {name: "فور سيزونز", price: 850, ...}
 */

// ============================================================================
// 2️⃣ المرحلة الثانية: FIREBASE FIRESTORE (قاعدة البيانات)
// ============================================================================

/**
 * عند إضافة الفندق، Firestore يفعل التالي:
 * 
 * 1. ✅ حفظ البيانات في مكان مشفر (encrypted)
 * 2. ✅ التحقق من firestore.rules هل أنت مسموح لك؟
 * 3. ✅ تشغيل المستمعين (listeners) الذين في انتظار التغييرات
 * 4. ✅ إرسال تنبيه لكل صفحة "هناك بيانات جديدة!"
 */

/**
 * الـ Firestore Rules تقول:
 * 
 * match /cities/{cityId}/hotels/{hotelId} {
 *   allow read: if true;              // أي شخص يقرأ
 *   allow write: if isAdmin();        // Admin فقط يكتب ✅
 * }
 * 
 * فإذا كان المستخدم ليس Admin، سيرفع Firestore الطلب:
 * ❌ "You don't have permission to write to this database"
 */

// ============================================================================
// 3️⃣ المرحلة الثالثة: WEBSITE (الموقع/الصفحة الرئيسية)
// ============================================================================

/**
 * الموقع "في انتظار" التغييرات الجديدة باستخدام onSnapshot
 * 
 * هذا هو السر! 🔑
 * 
 * بدلاً من:
 *   - جلب البيانات مرة واحدة (getDocs) ✗
 * 
 * نستخدم:
 *   - فتح "قناة اتصال دائمة" (onSnapshot) ✅
 */

import { query, collectionGroup, orderBy, limit, onSnapshot } from 'firebase/firestore';

// الكود الموجود في App.tsx (HomePage)
const setupHotels = async () => {
  // ⭐ البحث عن جميع الفنادق من جميع المدن (Collection Group Query)
  const hotelsQ = query(
    collectionGroup(db, 'hotels'),                // ← البحث في كل hotels subcollection
    orderBy('createdAt', 'desc'),                // ← الأحدث أولاً
    limit(4)                                      // ← أول 4 فنادق
  );

  // ⭐ فتح القناة: "إذا تغيرت البيانات أخبرني فوراً"
  const unsubscribe = onSnapshot(
    hotelsQ,
    
    // الـ callback عند التغيير
    (snapshot) => {
      console.log('✅ بيانات جديدة من Firebase!');
      
      const hotels = snapshot.docs.map(doc => ({
        id: doc.id,                               // ID الفندق
        ...doc.data()                             // البيانات: name, price, images, ...
      }));
      
      // ⭐ تحديث الواجهة تلقائياً (React re-renders)
      setLatestHotels(hotels);
      
      // الآن المستخدم يرى الفندق الجديد على الصفحة! 🎉
    },
    
    // معالج الأخطاء
    (error) => {
      console.error('❌ خطأ في جلب الفنادق:', error);
      // إذا حدث خطأ (مثل نقص الصلاحيات)، نعالجه بذكاء
    }
  );

  // ⭐ إغلاق القناة عند مغادرة الصفحة (توفير الموارد)
  return unsubscribe;
};

/**
 * 🎯 لاحظ التدفق الزمني:
 * 
 * الثانية 0:00  - المسؤول يضغط "إضافة الفندق" من الداشبورد
 * الثانية 0:01  - الفندق يُحفظ في Firebase
 * الثانية 0:02  - Firebase يرسل تنبيه لكل onSnapshot listeners
 * الثانية 0:03  - الموقع يستقبل التنبيه ويحدّث الواجهة
 * الثانية 0:04  - المستخدم يرى الفندق الجديد! ✅
 * 
 * الكل في أقل من نصف ثانية!
 */

// ============================================================================
// 🔑 السر الأساسي: Collection Group Queries
// ============================================================================

/**
 * المشكلة القديمة: الفنادق موزعة في subcollections مختلفة
 * 
 *   cities/
 *     B8WKkb8.../hotels/wYhOSTI8.../  ← فندق في القاهرة
 *     XVHQz1Z.../hotels/aPuE4Wx.../   ← فندق في الإسكندرية
 *     ayneHBZ.../hotels/p0wzd4M.../   ← فندق في مرسى مطروح
 * 
 * الحل: collectionGroup('hotels')
 * 
 *   ✅ يبحث عن جميع "hotels" في أي مكان
 *   ✅ يجمعهم في نتيجة واحدة
 *   ✅ يرتبهم حسب الشروط (orderBy, limit, etc.)
 * 
 * القواعد المطلوبة:
 * 
 *   match /{path=**}/hotels/{hotelId} {
 *     allow read: if true;  // ← يسمح للموقع أن يجد جميع الفنادق
 *   }
 */

// ============================================================================
// 📊 الخلاصة: الربط الثلاثي (THE GOLDEN TRIANGLE)
// ============================================================================

/**
 * 
 *    ┌─────────────────┐
 *    │ ADMIN DASHBOARD │
 *    │  (مسؤول يضيف)   │
 *    └────────┬────────┘
 *             │ addDoc(hotels)
 *             ▼
 *    ┌─────────────────────────┐
 *    │ FIREBASE FIRESTORE      │
 *    │ (قاعدة البيانات)        │
 *    │ cities/hotels/rooms     │
 *    └────────┬────────────────┘
 *             │ onSnapshot listener
 *             ▼
 *    ┌──────────────────┐
 *    │ WEBSITE/APP      │
 *    │ (المستخدم يرى)   │
 *    └──────────────────┘
 * 
 * 
 * الربط:
 * 1. Dashboard → Firebase: استخدام addDoc() + cityId
 * 2. Firebase ↔ Website: استخدام onSnapshot() + collectionGroup()
 * 3. Rules: تحكم على من يمكنه قراءة/كتابة
 */

// ============================================================================
// 🎓 مثال عملي: إضافة فندق ورؤيته على الموقع
// ============================================================================

/**
 * السيناريو:
 * 1. المسؤول يدخل Dashboard
 * 2. يختار "القاهرة"
 * 3. يملأ form: اسم="فور سيزونز نايل بلازا", السعر=850
 * 4. يضغط "إضافة الفندق"
 * 
 * ما يحدث "تحت الغطاء":
 */

const CompleteExample = {
  // ========= STEP 1: Dashboard يرسل البيانات ==========
  adminAction: async () => {
    const cityId = 'B8WKkb8...'; // مثال: ID القاهرة
    
    // إضافة الفندق
    const hotelsRef = collection(db, 'cities', cityId, 'hotels');
    await addDoc(hotelsRef, {
      name: 'فندق فور سيزونز نايل بلازا',
      price: 850,
      // ... البيانات الأخرى
      createdAt: new Date().toISOString(),
    });
    
    // النتيجة: cities/B8WKkb8.../hotels/wYhOSTI8... ✅
  },

  // ========= STEP 2: Firebase يخزن ويرسل تنبيه ==========
  firebaseAction: () => {
    /**
     * Firebase يفعل:
     * 1. ✅ تشفير البيانات وتخزينها
     * 2. ✅ التحقق من firestore.rules (هل Admin؟)
     * 3. ✅ إرسال تنبيه لكل onSnapshot listeners
     * 4. ✅ تعديل timestamp آخر للـ collection
     */
  },

  // ========= STEP 3: الموقع يستقبل ويعرض ==========
  websiteAction: () => {
    /**
     * App.tsx (HomePage) يستقبل التنبيه:
     * 
     * onSnapshot callback يُنادى مع:
     * {
     *   docs: [
     *     {
     *       id: 'wYhOSTI8...',
     *       data: {
     *         name: 'فندق فور سيزونز نايل بلازا',
     *         price: 850,
     *         images: [...],
     *         amenities: [...],
     *         createdAt: '2026-04-17T...'
     *       }
     *     },
     *     ... الفنادق الأخرى
     *   ]
     * }
     * 
     * React يعدّل state:
     * setLatestHotels([...])
     * 
     * Component يعاد render مع البيانات الجديدة
     * المستخدم يرى الفندق الجديد في الصفحة الرئيسية! 🎉
     */
  }
};

// ============================================================================
// 💡 نصائح مهمة جداً
// ============================================================================

/**
 * 1️⃣ استخدم Types موحدة (types.ts)
 *    ❌ لا تكتب name أحياناً و title مرات أخرى
 *    ✅ استخدم interface موحدة لكل Collection
 * 
 * 2️⃣ استخدم الـ Hierarchical Structure
 *    ❌ لا تحفظ cityId و hotelId في كل record
 *    ✅ استخدم subcollections: cities/{cityId}/hotels/{hotelId}
 * 
 * 3️⃣ استخدم onSnapshot بدلاً من getDocs
 *    ❌ getDocs: جلب مرة واحدة، ثم البيانات قديمة
 *    ✅ onSnapshot: استمع للتغييرات فوراً
 * 
 * 4️⃣ اغلق Listeners عند الانتهاء
 *    ❌ ترك listeners مفتوحة يهدر الموارد
 *    ✅ return () => unsubscribe() في useEffect cleanup
 * 
 * 5️⃣ استخدم Collection Group Rules
 *    ❌ لا تنسى match /{path=**}/hotels/{hotelId}
 *    ✅ أضفها لتسمح بـ collectionGroup queries
 */

export default CompleteExample;
