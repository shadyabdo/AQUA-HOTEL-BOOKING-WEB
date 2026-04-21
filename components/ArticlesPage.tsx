import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { Newspaper, User, Calendar, X } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Article {
  id: string;
  'عنوان المقالة': string;
  'محتوى المقالة': string;
  'صورة المقالة': string;
  'تاريخ المقالة': string;
  'الكاتب': string;
  'التصنيفات'?: string[];
}

export const ArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'Articles'));
        const snapshot = await getDocs(q);
        setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <div className="flex flex-col bg-background" dir="rtl">
      <div className="container-custom py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-[#151e63] mb-4 tracking-tighter">المدونة السياحية</h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground font-bold max-w-2xl mx-auto">
            اكتشف أحدث المقالات والنصائح حول السفر وأفضل الوجهات السياحية
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-muted rounded-3xl h-[400px]"></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-muted-foreground">لا توجد مقالات حالياً</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(`/article/${article.id}`)}
              >
                <div className="h-56 overflow-hidden relative">
                  <img 
                    src={article['صورة المقالة'] || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05'} 
                    alt={article['عنوان المقالة']} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article['التصنيفات'] && article['التصنيفات'].map((cat, idx) => (
                      <span key={idx} className="bg-[#f0eef5] text-[#4F46E5] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-[#e3dff0]">
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-primary" />
                      <span>{article['الكاتب'] || 'إدارة أكوا'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" />
                      <span>{article['تاريخ المقالة'] || 'حديثاً'}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#151e63] mb-3 line-clamp-2 leading-tight">
                    {article['عنوان المقالة']}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed font-medium">
                    {article['محتوى المقالة']}
                  </p>
                  <div className="mt-6 text-primary font-bold text-sm flex items-center gap-2">
                    اقرأ المزيد
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};
