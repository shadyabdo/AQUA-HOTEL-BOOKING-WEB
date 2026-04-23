// ============================================================================
// 📋 UNIFIED TYPES - أنواع موحدة لكل الموقع والداشبورد
// ============================================================================
// الفائدة: ضمان أن الداشبورد والموقع يتحدثان نفس اللغة
// ============================================================================

// ========== المدن ==========
export interface City {
  id: string;
  name: string;                    // مثال: "القاهرة"
  image?: string;                  // صورة غلاف المدينة
  isFeatured?: boolean;           // هل تظهر في الصفحة الرئيسية؟
  createdAt?: string;
  updatedAt?: string;
}

// ========== الفنادق ==========
// ⭐ لاحظ: لا نحفظ cityId هنا لأن الفندق موجود كـ subcollection داخل المدينة
export interface Hotel {
  id: string;
  name: string;                    // مثال: "فور سيزونز"
  description: string;             // وصف الفندق
  location: string;                // مثال: "جاردن سيتي"
  city: string;                    // اسم المدينة (للعرض)
  city_img?: string;              // صورة غلاف الفندق
  price: number;                   // السعر الأساسي (EGP)
  rating: number;                  // التقييم (1-5)
  images: string[];               // صور متعددة للفندق
  amenities: string[];            // المرافق: ["مسبح", "واي فاي", ...]
  createdAt: string;
  updatedAt?: string;
}

// ========== الغرف ==========
export interface Room {
  id: string;
  title: string;                   // مثال: "جناح ملكي"
  description: string;
  price: number;
  size: string;                    // مثال: "120 م²"
  guests: number;                  // عدد الضيوف
  bed: string;                     // مثال: "سرير كينج"
  view?: string;                   // الإطلالة
  images: string[];
  amenities: string[];
  level: 'standard' | 'deluxe' | 'suite' | 'royal';
  details?: string;                // تفاصيل HTML
  createdAt?: string;
  updatedAt?: string;
}

// ========== الحجوزات ==========
export interface Booking {
  id: string;
  userId: string;                  // مرجع للمستخدم
  hotelId: string;                 // مرجع للفندق
  roomId: string;                  // مرجع للغرفة
  cityId: string;                  // مرجع للمدينة
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

// ========== المستخدمون ==========
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  isAdmin?: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}

// ========== الطلب API (للدوال) ==========
export type OperationType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LIST';

// ========== حالة الخطأ الموحدة ==========
export interface FirestoreError {
  code: string;
  message: string;
  operation: OperationType;
  collection: string;
  timestamp: string;
}
