import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { Newspaper, User, Calendar, X, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

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

  const categories = ['الكل', ...Array.from(new Set(articles.flatMap(a => a['التصنيفات'] || [])))];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article['عنوان المقالة']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article['محتوى المقالة']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article['الكاتب']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article['التصنيفات']?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'الكل' || article['التصنيفات']?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col bg-background" dir="rtl">
      <div className="container-custom py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-[#151e63] mb-4 tracking-tighter">المدونة السياحية</h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground font-bold max-w-2xl mx-auto">
            اكتشف أحدث المقالات والنصائح حول السفر وأفضل الوجهات السياحية
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-16 relative px-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="ابحث عن مقالة، وجهة، أو نصيحة سفر..."
                className="block w-full bg-white border border-border rounded-2xl py-5 pr-14 pl-12 text-sm font-bold text-[#151e63] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm group-hover:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <div className="p-1 rounded-lg bg-muted hover:bg-primary/10">
                      <X size={18} />
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className={`flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-sm font-black transition-all duration-300 border shadow-sm shrink-0 ${
                isCategoriesOpen || selectedCategory !== 'الكل'
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white text-[#151e63] border-border hover:border-primary hover:text-primary'
              }`}
            >
              <Filter size={20} />
              <span>التصنيفات</span>
              <motion.div
                animate={{ rotate: isCategoriesOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={18} />
              </motion.div>
            </button>
          </div>

          {/* Categories Filter (Collapsible) */}
          <AnimatePresence>
            {isCategoriesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <div className="pt-8 pb-4">
                  <div className="bg-white/50 backdrop-blur-sm border border-border rounded-[2rem] p-6 md:p-8">
                    <div className="flex flex-wrap gap-3">
                      {categories.map((cat, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedCategory(cat);
                            // Optional: Close on select on mobile
                            // if (window.innerWidth < 768) setIsCategoriesOpen(false);
                          }}
                          className={`px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 border ${
                            selectedCategory === cat
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                              : 'bg-white text-muted-foreground border-border hover:border-primary hover:text-primary hover:scale-105'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-muted rounded-3xl h-[400px]"></div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-border shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground/50">
              <Search className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-[#151e63] mb-2">لم نجد نتائج لـ "{searchTerm}"</h2>
            <p className="text-muted-foreground font-bold max-w-sm mx-auto">
              جرب البحث بكلمات مختلفة أو تصفح جميع المقالات
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('الكل'); }}
              className="mt-8 text-primary font-black hover:underline underline-offset-8"
            >
              عرض كافة المقالات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <motion.div 
                key={article.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-border hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-2 duration-300"
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
