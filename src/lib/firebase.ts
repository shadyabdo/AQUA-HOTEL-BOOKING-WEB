import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, sendEmailVerification, updateProfile } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDocFromServer, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  collectionGroup, 
  orderBy, 
  limit, 
  addDoc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// المطور: استخدام Force Long Polling لضمان استقرار الاتصال 100% في البيئات المقيدة
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // @ts-ignore
  databaseId: firebaseConfig.firestoreDatabaseId || "(default)"
});

export const auth = getAuth(app);

export const ADMIN_EMAILS = ["otdragoze@gmail.com", "shadyabdowd2020@gmail.com"];

export const isAdmin = () => {
  const user = auth.currentUser;
  return user && user.emailVerified && user.email && ADMIN_EMAILS.includes(user.email);
};

export const sendVerificationEmail = async () => {
  if (auth.currentUser) {
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error) {
      console.error("Error sending verification email:", error);
      return { success: false, error };
    }
  }
  return { success: false, error: "No user logged in" };
};

export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: { userId: auth.currentUser?.uid, email: auth.currentUser?.email },
    operationType, path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// ============================================
// 📍 Functions لجلب البيانات من Firestore
// ============================================

export const getCitiesListener = (callback: (cities: any[]) => void) => {
  const citiesRef = collection(db, 'cities');
  return onSnapshot(citiesRef, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => { console.error("Cities listener error:", error); callback([]); });
};

export const getHotelsInCityListener = (cityId: string, callback: (hotels: any[]) => void) => {
  const hotelsRef = collection(db, 'cities', cityId, 'hotels');
  return onSnapshot(hotelsRef, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, cityId, ...doc.data() })));
  }, (error) => { console.error("Hotels in city listener error:", error); callback([]); });
};

export const getRoomsInHotelListener = (cityId: string, hotelId: string, callback: (rooms: any[]) => void) => {
  const roomsRef = collection(db, 'cities', cityId, 'hotels', hotelId, 'rooms');
  return onSnapshot(roomsRef, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, hotelId, cityId, ...doc.data() })));
  }, (error) => { console.error("Rooms listener error:", error); callback([]); });
};

export const getAllHotels = async () => {
  try {
    const hotelsSnapshot = await getDocs(collectionGroup(db, 'hotels'));
    const allHotels: any[] = [];
    hotelsSnapshot.docs.forEach(hotelDoc => {
      const data = hotelDoc.data();
      const images =
        Array.isArray(data.images) && data.images.length > 0 ? data.images :
        Array.isArray(data.Hotel_img) && data.Hotel_img.length > 0 ? data.Hotel_img :
        data.image ? [data.image] : [];
      const amenities =
        Array.isArray(data.amenities) && data.amenities.length > 0 ? data.amenities :
        Array.isArray(data['المرافق']) && data['المرافق'].length > 0 ? data['المرافق'] : [];
      
      let cityId = data.cityId;
      if (!cityId && hotelDoc.ref.parent.parent) {
        cityId = hotelDoc.ref.parent.parent.id;
      }

      allHotels.push({ 
        id: hotelDoc.id, 
        cityId: cityId || '',
        ...data,
        images,
        amenities
      });
    });
    return allHotels;
  } catch (error) { 
    console.error("getAllHotels error:", error);
    return []; 
  }
};

export const getFeaturedCitiesListener = (callback: (cities: any[]) => void) => {
  const q = query(collection(db, 'cities'), where('isFeatured', '==', true));
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (error) => { console.error("Featured cities error:", error); callback([]); });
};

export const fetchTopDeals = async () => {
  try {
    const allHotels = await getAllHotels();
    const sorted = allHotels.sort((a, b) => (a.price || 0) - (b.price || 0));
    return sorted.slice(0, 6);
  } catch (error) {
    console.error("Top deals error:", error);
    return [];
  }
};

export const getAllRooms = async () => {
  try {
    const allRooms: any[] = [];
    
    // 1. Fetch from 'rooms'
    try {
      const roomsGroupQuery = query(collectionGroup(db, 'rooms'));
      const roomsSnapshot = await getDocs(roomsGroupQuery);
      roomsSnapshot.docs.forEach(roomDoc => {
        const hotelId = roomDoc.ref.parent.parent?.id || roomDoc.data().hotelId || roomDoc.data().Hotel_id || '';
        const cityId = roomDoc.ref.parent.parent?.parent?.parent?.id || '';
        allRooms.push({ 
          id: roomDoc.id, 
          hotelId, 
          cityId, 
          ...roomDoc.data() 
        });
      });
    } catch (e) { /* ignore index error */ }

    // 2. Fetch from 'Rooms'
    try {
      const roomsGroupQuery2 = query(collectionGroup(db, 'Rooms'));
      const roomsSnapshot2 = await getDocs(roomsGroupQuery2);
      roomsSnapshot2.docs.forEach(roomDoc => {
        const hotelId = roomDoc.ref.parent.parent?.id || roomDoc.data().hotelId || roomDoc.data().Hotel_id || '';
        const cityId = roomDoc.ref.parent.parent?.parent?.parent?.id || '';
        allRooms.push({ 
          id: roomDoc.id, 
          hotelId, 
          cityId, 
          ...roomDoc.data() 
        });
      });
    } catch (e) { /* ignore index error */ }

    return allRooms;
  } catch (error) { return []; }
};

export const createBooking = async (bookingData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), { 
      status: 'pending', 
      ...bookingData, 
      createdAt: serverTimestamp() 
    });
    return docRef.id;
  } catch (error) { throw error; }
};

/**
 * إضافة أو إزالة فندق من المفضلة
 * تم تحسين معالجة الأخطاء والتأكد من وجود البيانات
 */
export const toggleFavorite = async (userId: string, hotel: any) => {
  if (!userId || !hotel?.id) {
    console.error("❌ Missing userId or hotel.id in toggleFavorite", { userId, hotelId: hotel?.id });
    throw new Error("Missing identification data");
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    const hotelData = {
      hotelId: hotel.id,
      cityId: hotel.cityId || "",
      name: hotel.name || "فندق",
      image: hotel.images?.[0] || hotel.image || "https://picsum.photos/seed/hotel/800/600",
      location: hotel.location || "",
      city: hotel.city || "",
      rating: hotel.rating || 0,
      price: hotel.price || 0,
    };

    if (userSnap.exists()) {
      const data = userSnap.data();
      let favs = data.favorites || [];
      const exists = favs.find((f: any) => f.hotelId === hotel.id || f.id === hotel.id);
      
      if (exists) {
        favs = favs.filter((f: any) => f.hotelId !== hotel.id && f.id !== hotel.id);
        await updateDoc(userRef, { favorites: favs });
        console.log(`✅ Removed from favorites: ${hotel.id}`);
        return false;
      } else {
        favs.push({ ...hotelData, addedAt: new Date().toISOString() });
        await updateDoc(userRef, { favorites: favs });
        console.log(`✅ Added to favorites: ${hotel.id}`);
        return true;
      }
    } else {
      await setDoc(userRef, { uid: userId, favorites: [{ ...hotelData, addedAt: new Date().toISOString() }] }, { merge: true });
      return true;
    }
  } catch (error) {
    console.error("❌ Error in toggleFavorite:", error);
    throw error;
  }
};

export const getFavoritesListener = (userId: string, callback: (favorites: any[]) => void) => {
  if (!userId) return () => {};
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data().favorites || []);
    } else {
      callback([]);
    }
  }, (error) => { console.error("Favorites listener error:", error); callback([]); });
};

export const getCouponsListener = (callback: (coupons: any[]) => void) => {
  const couponsRef = collection(db, 'coupons');
  return onSnapshot(couponsRef, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => { console.error("Coupons listener error:", error); callback([]); });
};

// ============================================
// 💰 Wallet & Balance Management
// ============================================

/**
 * جلب رصيد المستخدم الحالي
 */
export const getUserBalance = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().walletBalance || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error getting user balance:", error);
    return 0;
  }
};

/**
 * تحديث رصيد المستخدم (خصم أو إضافة)
 */
export const updateUserBalance = async (userId: string, amount: number) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { 
      uid: userId, 
      walletBalance: increment(amount) 
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user balance:", error);
    throw error;
  }
};

/**
 * إلغاء حجز واسترداد المبلغ للمحفظة
 */
export const cancelBooking = async (bookingId: string, userId: string) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) throw new Error("الحجز غير موجود");
    
    const bookingData = bookingSnap.data();
    if (bookingData.status === 'cancelled') throw new Error("الحجز ملغي بالفعل");
    
    // استرداد المبلغ للمحفظة
    const refundAmount = bookingData.price || 0;
    await updateUserBalance(userId, refundAmount);
    
    // تحديث حالة الحجز
    await updateDoc(bookingRef, { 
      status: 'cancelled', 
      updatedAt: serverTimestamp(),
      cancelledAt: serverTimestamp() 
    });
    
    return { success: true, refundAmount };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};
/**
 * تحديث صورة الملف الشخصي
 */
export const updateUserProfileImage = async (userId: string, photoURL: string) => {
  if (!userId) return;
  try {
    // Only update Firestore since base64 is too long for Firebase Auth profile (limit 2048 chars)
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { photoURL }, { merge: true });
    
    return photoURL;
  } catch (error) {
    console.error("Error updating profile image:", error);
    throw error;
  }
};

/**
 * إضافة معاملة مالية للسجل
 */
export const addTransaction = async (userId: string, transaction: {
  type: 'booking' | 'topup' | 'refund' | 'payment' | 'transfer',
  amount: number,
  description: string,
  method: string
}) => {
  if (!userId) {
    console.warn("Attempted to add transaction without userId");
    return;
  }
  try {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    await addDoc(transactionsRef, {
      ...transaction,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding transaction for user", userId, ":", error);
  }
};

/**
 * استماع لمعاملات المستخدم
 */
export const getTransactionsListener = (userId: string, callback: (transactions: any[]) => void) => {
  if (!userId) return () => {};
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.error("Transactions listener error:", error);
    callback([]);
  });
};

// ============================================
// 💬 Reviews & Comments Management
// ============================================

/**
 * إضافة تقييم لفندق
 */
export const addHotelReview = async (cityId: string, hotelId: string, review: {
  userId: string,
  userName: string,
  userPhoto?: string,
  rating: number,
  comment: string,
  emoji: string
}) => {
  try {
    const reviewsRef = collection(db, 'cities', cityId, 'hotels', hotelId, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      ...review,
      createdAt: serverTimestamp()
    });
    
    // تحديث عدد التقييمات في الفندق نفسه (إختياري لكن مفيد)
    // نضعها في try-catch منفصلة لضمان نجاح إضافة التقييم حتى لو فشل تحديث بيانات الفندق
    try {
      const hotelRef = doc(db, 'cities', cityId, 'hotels', hotelId);
      const hotelSnap = await getDoc(hotelRef);
      if (hotelSnap.exists()) {
        const hotelData = hotelSnap.data();
        const currentCount = hotelData.reviewsCount || hotelData.reviews || 0;
        const currentRating = hotelData.rating || 0;
        
        // حساب التقييم الجديد (متوسط تقريبي)
        const newRating = ((currentRating * currentCount) + review.rating) / (currentCount + 1);
        
        await updateDoc(hotelRef, {
          reviewsCount: currentCount + 1,
          rating: Number(newRating.toFixed(1))
        });
      }
    } catch (updateError) {
      console.warn("Could not update hotel metadata, but review was saved:", updateError);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding hotel review:", error);
    throw error;
  }
};

/**
 * استماع لتقييمات الفندق
 */
export const getHotelReviewsListener = (cityId: string, hotelId: string, callback: (reviews: any[]) => void) => {
  const reviewsRef = collection(db, 'cities', cityId, 'hotels', hotelId, 'reviews');
  const q = query(reviewsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.error("Hotel reviews listener error:", error);
    callback([]);
  });
};

/**
 * إضافة تعليق لمقال
 */
export const addArticleComment = async (articleId: string, comment: {
  userId: string,
  userName: string,
  userPhoto?: string,
  text: string
}) => {
  try {
    const commentsRef = collection(db, 'Articles', articleId, 'comments');
    const docRef = await addDoc(commentsRef, {
      ...comment,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding article comment:", error);
    throw error;
  }
};

/**
 * استماع لتعليقات المقال
 */
export const getArticleCommentsListener = (articleId: string, callback: (comments: any[]) => void) => {
  const commentsRef = collection(db, 'Articles', articleId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.error("Article comments listener error:", error);
    callback([]);
  });
};

/**
 * استماع لعدد الأشخاص الذين وجدوا المقال مفيداً
 */
export const getArticleHelpfulCountListener = (articleId: string, callback: (count: number) => void) => {
  const feedbackRef = collection(db, 'Articles', articleId, 'feedback');
  const q = query(feedbackRef, where('isHelpful', '==', true));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Helpful count listener error:", error);
    callback(0);
  });
};

/**
 * استماع لبيانات التفاعل مع المقال (الأشخاص الذين صوتوا)
 */
export const getArticleFeedbackListener = (articleId: string, callback: (feedback: any[]) => void) => {
  const feedbackRef = collection(db, 'Articles', articleId, 'feedback');
  const q = query(feedbackRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.error("Article feedback listener error:", error);
    callback([]);
  });
};

/**
 * إرسال تقييم الفائدة لمقال (Was this helpful?)
 */
export const submitArticleFeedback = async (articleId: string, feedback: {
  userId?: string,
  userName?: string,
  userPhoto?: string,
  isHelpful: boolean,
  comment?: string
}) => {
  try {
    const feedbackRef = collection(db, 'Articles', articleId, 'feedback');
    await addDoc(feedbackRef, {
      ...feedback,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error submitting article feedback:", error);
  }
};
