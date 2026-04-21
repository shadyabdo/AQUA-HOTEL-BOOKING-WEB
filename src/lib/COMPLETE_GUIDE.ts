// ============================================================================
// 🎨 VISUAL GUIDE - دليل بصري شامل للنظام
// ============================================================================

/**
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ المسار الكامل من A إلى Z: كيف يعمل النظام تحت الغطاء                │
 * └────────────────────────────────────────────────────────────────────────┘
 */

// ============================================================================
// 1️⃣ الهيكل الهرمي: كيف تنظم البيانات
// ============================================================================

/**
 * 📁 Firestore Database Structure
 * 
 * ┌─ Firestore
 * │
 * ├─ 📂 cities/  (Top-level collection)
 * │   │
 * │   ├─ 📋 B8WKkb8...  (القاهرة - ID تلقائي)
 * │   │   │
 * │   │   ├─ name: "القاهرة"
 * │   │   ├─ image: "https://..."
 * │   │   └─ 📂 hotels/  (Subcollection)
 * │   │       │
 * │   │       ├─ 📋 wYhOSTI8...  (الفندق - ID تلقائي)
 * │   │       │   │
 * │   │       │   ├─ name: "فور سيزونز نايل بلازا"
 * │   │       │   ├─ price: 850
 * │   │       │   ├─ rating: 4.9
 * │   │       │   ├─ images: [url1, url2, ...]
 * │   │       │   ├─ amenities: ["مسبح", "واي فاي", ...]
 * │   │       │   ├─ createdAt: "2026-04-17T..."  ⭐
 * │   │       │   │
 * │   │       │   └─ 📂 rooms/  (Subcollection تحت الفندق)
 * │   │       │       │
 * │   │       │       ├─ 📋 7BNeTRx...  (الغرفة - ID تلقائي)
 * │   │       │       │   ├─ title: "جناح ملكي"
 * │   │       │       │   ├─ price: 500
 * │   │       │       │   ├─ images: [...]
 * │   │       │       │   ├─ amenities: ["شرفة", "جاكوزي"]
 * │   │       │       │   └─ createdAt: "2026-04-17T..."
 * │   │       │       │
 * │   │       │       └─ 📋 Pwte9hw...  (غرفة أخرى)
 * │   │       │           └─ ...
 * │   │       │
 * │   │       └─ 📋 aPuE4Wx...  (فندق آخر)
 * │   │           └─ ...
 * │   │
 * │   ├─ 📋 XVHQz1Z...  (الإسكندرية)
 * │   │   └─ 📂 hotels/
 * │   │       └─ ...
 * │   │
 * │   └─ 📋 ayneHBZ...  (مرسى مطروح)
 * │       └─ ...
 * │
 * ├─ 📂 bookings/  (Top-level collection)
 * │   ├─ 📋 booking1
 * │   ├─ 📋 booking2
 * │   └─ ...
 * │
 * └─ 📂 users/  (Top-level collection)
 *     ├─ 📋 user1
 *     ├─ 📋 user2
 *     └─ ...
 */

// ============================================================================
// 2️⃣ التدفق الزمني: ما يحدث ثانية بثانية
// ============================================================================

/**
 * ⏱️  TIMELINE: إضافة فندق من Dashboard وظهوره على الموقع
 * 
 * 
 * الثانية 0:00 ─ المسؤول يدخل Dashboard
 *              └─ يختار "القاهرة"
 *              └─ يملأ form: name="فندق جديد", price=850
 *              └─ يضغط "إضافة الفندق"
 * 
 * 
 * الثانية 0:01 ─ Dashboard يرسل البيانات
 *              └─ addDoc(collection(db, 'cities', cityId, 'hotels'), {
 *                    name: "فندق جديد",
 *                    price: 850,
 *                    ...
 *                    createdAt: timestamp ← ⭐ مهم للترتيب!
 *                  })
 * 
 * 
 * الثانية 0:02 ─ Firestore يستقبل الطلب
 *              └─ ✅ التحقق من firestore.rules:
 *                 match /cities/{cityId}/hotels/{hotelId} {
 *                   allow write: if isAdmin();  ✅ المسؤول مسموح
 *                 }
 *              └─ ✅ تشفير البيانات وتخزينها في السيرفرات
 *              └─ ✅ تعديل القيمة "__name__" (لـ ordering)
 *              └─ ✅ إنشاء ID تلقائي: wYhOSTI8...
 * 
 * 
 * الثانية 0:03 ─ Firestore يرسل تنبيهات
 *              └─ يبحث عن جميع الـ onSnapshot listeners الذي يستمعون
 *              └─ يجد: App.tsx → useLatestHotels
 *              └─ يرسل: "البيانات تغيرت! هناك فندق جديد"
 * 
 * 
 * الثانية 0:04 ─ الموقع (App.tsx) يستقبل التنبيه
 *              └─ const unsubscribe = onSnapshot(hotelsQ, (snapshot) => {
 *                    const hotels = snapshot.docs.map(...)
 *                    setLatestHotels(hotels) ← ⭐ تحديث الـ state
 *                  })
 *              └─ React يعاد render المكون بالبيانات الجديدة
 *              └─ JSX يحدّث الـ DOM
 * 
 * 
 * الثانية 0:05 ─ المستخدم يرى الفندق الجديد!
 *              └─ الصفحة تظهر الفندق في قائمة "أحدث الفنادق"
 *              └─ المستخدم يشعر أن الموقع "حي" ⚡
 * 
 * 
 * 🎯 المدة الكلية: أقل من نصف ثانية!
 */

// ============================================================================
// 3️⃣ الأكواد المطابقة: كل جزء من النظام
// ============================================================================

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 🏆 الكود المثالي للتكامل الثلاثي                                    │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * 
 * FILE: src/lib/types.ts
 * ─────────────────────────────────────────────────────────────────────
 * 
 * export interface Hotel {
 *   id: string;
 *   name: string;
 *   description: string;
 *   location: string;
 *   city: string;                    // ← من المدينة الأب
 *   city_img?: string;
 *   price: number;
 *   rating: number;
 *   images: string[];
 *   amenities: string[];
 *   createdAt: string;               // ← للترتيب الزمني
 *   updatedAt?: string;
 * }
 * 
 * 
 * FILE: firestore.rules
 * ─────────────────────────────────────────────────────────────────────
 * 
 * match /cities/{cityId} {
 *   allow read: if true;             // ← أي حد يقرأ المدن
 *   allow write: if isAdmin();       // ← Admin فقط يضيف
 * 
 *   match /hotels/{hotelId} {
 *     allow read: if true;           // ← أي حد يقرأ الفنادق
 *     allow write: if isAdmin();     // ← Admin فقط يضيف
 * 
 *     match /rooms/{roomId} {
 *       allow read: if true;
 *       allow write: if isAdmin();
 *     }
 *   }
 * }
 * 
 * // ⭐ مهم: السماح بـ Collection Group Queries
 * match /{path=**}/hotels/{hotelId} {
 *   allow read: if true;             // ← للبحث عن جميع الفنادق
 * }
 * 
 * 
 * FILE: components/AdminDashboard.tsx
 * ─────────────────────────────────────────────────────────────────────
 * 
 * const addHotel = async () => {
 *   // 1. اختيار المدينة
 *   const hotelRef = collection(db, 'cities', selectedCity, 'hotels');
 * 
 *   // 2. إضافة الفندق
 *   await addDoc(hotelRef, {
 *     name: hotelForm.name,
 *     description: hotelForm.description,
 *     price: hotelForm.price,
 *     images: hotelForm.images.split(','),
 *     amenities: hotelForm.amenities.split(','),
 *     rating: hotelForm.rating,
 *     createdAt: new Date().toISOString(),  // ← مهم!
 *   });
 * 
 *   toast.success('✅ تم إضافة الفندق!');
 *   // Firebase سيرسل تنبيه تلقائياً
 * };
 * 
 * 
 * FILE: src/App.tsx (HomePage)
 * ─────────────────────────────────────────────────────────────────────
 * 
 * const setupHotels = async () => {
 *   // 1. إنشاء الاستعلام
 *   const hotelsQ = query(
 *     collectionGroup(db, 'hotels'),     // ← ابحث عن جميع الفنادق
 *     orderBy('createdAt', 'desc'),      // ← الأحدث أولاً
 *     limit(4)                            // ← أول 4
 *   );
 * 
 *   // 2. فتح القناة: استمع للتغييرات
 *   const unsubscribeLatest = onSnapshot(
 *     hotelsQ,
 *     (snapshot) => {
 *       // ← الـ callback عند التغيير (أول مرة + كل تحديث)
 *       const hotels = snapshot.docs.map(doc => ({
 *         id: doc.id,
 *         ...doc.data()
 *       }));
 *       
 *       // 3. تحديث الـ React state
 *       setLatestHotels(hotels);
 *       
 *       // 4. React يعاد render → المستخدم يرى الفندق الجديد!
 *     },
 *     (error) => {
 *       // معالج الأخطاء
 *       console.error('Error:', error);
 *     }
 *   );
 * 
 *   return unsubscribeLatest;  // ← للتنظيف لاحقاً
 * };
 */

// ============================================================================
// 4️⃣ مقارنة: الطريقة الخاطئة vs الصحيحة
// ============================================================================

/**
 * ❌ الطريقة الخاطئة: عدم الاستماع للتغييرات
 * ────────────────────────────────────────────
 * 
 * const fetchHotels = async () => {
 *   const snapshot = await getDocs(query(collectionGroup(db, 'hotels')));
 *   setHotels(snapshot.docs.map(...));
 * };
 * 
 * useEffect(() => {
 *   fetchHotels();  // ← جلب مرة واحدة عند التحميل
 * }, []);          // ← لا تعاد بعد ذلك
 * 
 * المشكلة:
 * - إذا أضفت فندق من Dashboard، الموقع لن يتحدث!
 * - يجب تحديث الصفحة يدوياً لرؤية الفندق الجديد
 * - تجربة مستخدم سيئة جداً
 * 
 * 
 * ✅ الطريقة الصحيحة: الاستماع للتغييرات الفورية
 * ─────────────────────────────────────────────
 * 
 * const setupHotels = async () => {
 *   const hotelsQ = query(collectionGroup(db, 'hotels'));
 *   
 *   const unsubscribe = onSnapshot(hotelsQ, (snapshot) => {
 *     setLatestHotels(snapshot.docs.map(...));
 *   });
 *   
 *   return unsubscribe;
 * };
 * 
 * useEffect(() => {
 *   const unsubscribe = setupHotels();
 *   return () => unsubscribe();  // ← تنظيف عند unmount
 * }, []);
 * 
 * الفوائد:
 * - أي تغيير في الداتا يظهر فوراً
 * - المستخدم يشعر أن الموقع "حي"
 * - تجربة مستخدم ممتازة
 */

// ============================================================================
// 5️⃣ خريطة الموقع: أين يكون كل شيء
// ============================================================================

/**
 * 📂 Project Structure
 * 
 * src/
 * ├─ 📄 App.tsx
 * │  └─ يحتوي على:
 * │     - setupHotels() ← الاستماع للفنادق (onSnapshot)
 * │     - setupCities() ← الاستماع للمدن (onSnapshot)
 * │     - openBookingModal() ← لفتح نموذج الحجز
 * │
 * ├─ lib/
 * │  ├─ 📄 firebase.ts ← إعدادات Firebase
 * │  ├─ 📄 types.ts ← الأنواع الموحدة (جديد! ✅)
 * │  ├─ 📄 realtime-sync.ts ← دوال الـ Real-time (جديد! ✅)
 * │  └─ 📄 SYSTEM_ARCHITECTURE.md ← الشرح التفصيلي (جديد! ✅)
 * │
 * ├─ components/
 * │  ├─ 📄 AdminDashboard.tsx ← لوحة التحكم (addHotel فيها)
 * │  ├─ 📄 HomePage.tsx ← الصفحة الرئيسية (عرض الفنادق)
 * │  ├─ 📄 CityHotelsPage.tsx ← فنادق مدينة معينة
 * │  ├─ 📄 HotelPage.tsx ← تفاصيل الفندق
 * │  ├─ 📄 RoomDetailsPage.tsx ← تفاصيل الغرفة + الحجز
 * │  └─ ...
 * │
 * ├─ 📄 firestore.rules ← قواعس الأمان (Security)
 * ├─ 📄 firebase-applet-config.json ← إعدادات Firebase
 * └─ ...
 */

// ============================================================================
// 6️⃣ القواعس (Rules) شرح تفصيلي
// ============================================================================

/**
 * 🔐 firestore.rules - الحارس الأمني
 * 
 * 
 * ┌─ تخيل أن Firestore بنك:
 * │
 * │  - المستخدم العادي: يمكنه قراءة القائمة فقط (read only)
 * │  - الموظف (Admin): يمكنه قراءة وتعديل (read + write)
 * │
 * └─ الـ Rules تحدد هذه الصلاحيات
 * 
 * 
 * // ✅ هذا صحيح:
 * match /cities/{cityId}/hotels/{hotelId} {
 *   allow read: if true;        // ← أي شخص يقرأ
 *   allow write: if isAdmin();  // ← Admin فقط يكتب
 * }
 * 
 * لماذا "isAdmin()"؟ لأنه يتحقق من:
 * 1. هل المستخدم مسجل دخول؟
 * 2. هل البريد الإلكتروني في القائمة المسموح بها؟
 * 3. هل البريد مؤكد (email_verified)?
 * 
 * 
 * // ❌ هذا خطير جداً:
 * match /cities/{cityId}/hotels/{hotelId} {
 *   allow read, write: if true;  // ← أي شخص يقرأ ويكتب!
 * }
 * 
 * المشكلة: أي شخص يمكنه إضافة/تعديل/حذف الفنادق!
 * 
 * 
 * // ⭐ إضافة ضرورية: Collection Group Queries
 * match /{path=**}/hotels/{hotelId} {
 *   allow read: if true;
 * }
 * 
 * لماذا؟ لأن collectionGroup(db, 'hotels') يحتاج هذه الـ rule
 * لكي يعمل صحيح.
 */

// ============================================================================
// 7️⃣ نقاط مهمة جداً
// ============================================================================

/**
 * 🎯 نقاط يجب أن تفهمها جيداً:
 * 
 * 
 * 1. الهيكل الهرمي (Hierarchical)
 *    ✅ cities > hotels > rooms
 *    ❌ لا تحفظ cityId و hotelId في كل record
 * 
 * 
 * 2. الربط عن طريق المسار (Path-based linking)
 *    ✅ cities/{cityId}/hotels/{hotelId}
 *    ❌ لا تحفظ "references" أو "foreign keys"
 * 
 * 
 * 3. Real-time Sync (الاستماع للتغييرات)
 *    ✅ onSnapshot() + setLatestHotels()
 *    ❌ لا تستخدم getDocs() بدون listener
 * 
 * 
 * 4. Timestamps
 *    ✅ createdAt: serverTimestamp()
 *    ❌ لا تستخدم new Date() مباشرة
 * 
 *    لماذا؟ عشان serverTimestamp() يضمن:
 *    - وقت دقيق من الخادم (ليس من الجهاز)
 *    - ترتيب صحيح دائماً
 *    - لا مشاكل في الـ timezone
 * 
 * 
 * 5. Collection Group Queries
 *    ✅ collectionGroup(db, 'hotels')
 *    ❌ لا تحاول جلب من مسار ثابت
 * 
 *    الفائدة: يجد جميع الفنادق في أي مدينة
 *    المسار: cities/[any]/hotels/[any]
 * 
 * 
 * 6. معالجة الأخطاء
 *    ✅ استخدم handleFirestoreError()
 *    ❌ لا تتجاهل الأخطاء
 * 
 *    الأخطاء الشائعة:
 *    - PERMISSION_DENIED: صلاحيات ناقصة
 *    - UNAUTHENTICATED: المستخدم لم يسجل دخول
 *    - FAILED_PRECONDITION: محتاج إنشاء index
 */

export const COMPLETE_GUIDE = `
🎓 ملخص: الفهم الكامل للنظام

النظام يعمل على 3 أركان:

1. ADMIN DASHBOARD (AdminDashboard.tsx)
   - تجميع البيانات من المسؤول
   - إرسالها لـ Firestore عن طريق addDoc()
   - مثال: await addDoc(collection(db, 'cities', cityId, 'hotels'), {...})

2. FIREBASE FIRESTORE (قاعدة البيانات)
   - تخزين البيانات بشكل آمن
   - التحقق من الصلاحيات (firestore.rules)
   - إرسال تنبيهات للـ listeners

3. WEBSITE (App.tsx + Components)
   - الاستماع للتغييرات عن طريق onSnapshot()
   - تحديث الـ React state
   - إعادة render الـ Components

الربط: عن طريق المسار الهرمي + serverTimestamp() + firestore.rules

الفائدة: تحديث فوري بدون تحديث صفحة = تجربة مستخدم ممتازة ✨
`;
