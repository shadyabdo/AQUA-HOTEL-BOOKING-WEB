import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { User, Calendar, ArrowRight, BookOpen, ChevronDown, ChevronUp, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Article } from './ArticlesPage';
import { auth, getArticleFeedbackListener, submitArticleFeedback } from '../src/lib/firebase';
import { ThumbsUp, ThumbsDown, Send, CheckCircle2, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/src/lib/swal';

interface TocItem {
  id: string;
  title: string;
  index: number;
}

/**
 * Parses article content and extracts section headings that start with "-".
 * Returns both the processed HTML (with anchor IDs) and the TOC items list.
 */
function parseArticleContent(rawContent: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let sectionIndex = 0;

  // Split into lines to process each one
  const lines = rawContent.split('\n');

  const processedLines = lines.map((line) => {
    const trimmed = line.trim();

    // Match lines that start with "-" followed by text (section headings)
    if (/^-\s*\S/.test(trimmed)) {
      const sectionTitle = trimmed.replace(/^-\s*/, '').trim();
      const sectionId = `section-${sectionIndex}`;
      sectionIndex++;

      toc.push({ id: sectionId, title: sectionTitle, index: sectionIndex - 1 });

      // Replace the raw line with a styled heading anchor (inline scroll-margin-top for reliability)
      return `<h2 id="${sectionId}" class="article-section-heading" style="scroll-margin-top:110px">${sectionTitle}</h2>`;
    }

    // Regular line → convert to paragraph/br
    return line;
  });

  const html = processedLines.join('\n').replace(/\n(?!<h2)/g, '<br/>');

  return { html, toc };
}

export default function ArticleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [processedHtml, setProcessedHtml] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // New States for Feedback
  const [allFeedback, setAllFeedback] = useState<any[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'Articles', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as Article;
          setArticle(data);

          const rawContent = data['محتوى المقالة'] || '';
          const { html, toc: parsedToc } = parseArticleContent(rawContent);
          setProcessedHtml(html);
          setToc(parsedToc);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setAllFeedback([]); // Clear previous article's feedback
    const unsub = getArticleFeedbackListener(id, (data) => {
      setAllFeedback(data);
    });
    return () => unsub();
  }, [id]);

  const handleFeedback = async (isHelpful: boolean) => {
    if (!id) return;
    setFeedbackGiven(isHelpful ? 'yes' : 'no');
    
    // Auto-submit if it's "Yes" and no comment needed immediately
    if (isHelpful) {
      setIsSubmittingFeedback(true);
      await submitArticleFeedback(id, {
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'قارئ',
        userPhoto: auth.currentUser?.photoURL || undefined,
        isHelpful: true,
        comment: ''
      });
      setIsSubmittingFeedback(false);
      setShowFeedbackThanks(true);
    }
  };

  const submitFullFeedback = async () => {
    if (!id || !feedbackGiven) return;
    setIsSubmittingFeedback(true);
    try {
      await submitArticleFeedback(id, {
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'قارئ',
        userPhoto: auth.currentUser?.photoURL || undefined,
        isHelpful: feedbackGiven === 'yes',
        comment: feedbackComment
      });
      setShowFeedbackThanks(true);
    } catch (err) {
      showError("خطأ", "حدث خطأ أثناء الإرسال");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Highlight active TOC item on scroll
  useEffect(() => {
    if (toc.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      let current: string | null = null;

      for (const item of toc) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollY) {
          current = item.id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToSection = (sectionId: string) => {
    // Close TOC first, then scroll after brief delay so layout settles
    setTocOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-black text-[#151e63] mb-4">المقالة غير موجودة</h2>
        <button onClick={() => navigate('/articles')} className="text-[#4F46E5] font-bold">العودة للمدونة</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-32" dir="rtl">

      {/* ─── Hero Image ─────────────────────────────────────────── */}
      <div className="relative h-[60vh] min-h-[400px] max-h-[600px] w-full">
        <img
          src={article['صورة المقالة'] || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05'}
          alt={article['عنوان المقالة']}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151e63]/90 via-[#151e63]/40 to-transparent" />

        <div className="absolute top-8 right-8 z-10">
          <button
            onClick={() => navigate('/articles')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/40 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-bold transition-all"
          >
            <ArrowRight size={20} /> العودة للمدونة
          </button>
        </div>

        <div className="absolute bottom-12 left-0 right-0">
          <div className="container mx-auto px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight max-w-4xl"
            >
              {article['عنوان المقالة']}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center justify-between gap-6"
            >
              {/* Categories - Now on the Right in RTL */}
              <div className="flex flex-wrap gap-2">
                {article['التصنيفات'] && article['التصنيفات'].map((cat, idx) => (
                  <span key={idx} className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-white/20">
                    {cat}
                  </span>
                ))}
              </div>

              {/* Meta Info (Author/Date) - Now on the Left in RTL */}
              <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-bold text-white/90">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <User size={18} />
                  <span>{article['الكاتب'] || 'إدارة أكوا'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <Calendar size={18} />
                  <span>{article['تاريخ المقالة'] || 'حديثاً'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Table of Contents Button (floating, only if TOC exists) ── */}
      {toc.length > 0 && (
        <div className="sticky top-4 z-50 flex justify-center mt-4 px-4">
          <div className="w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#d6d6e7]/60 shadow-xl shadow-[#e3dff0]/60 overflow-hidden"
            >
              {/* TOC Toggle Button */}
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#f0eef5]/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-md">
                    <List size={18} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8b8fb5] font-semibold">محتويات المقال</p>
                    <p className="text-sm text-[#151e63] font-black">{toc.length} أقسام</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#4F46E5]">
                  <span className="text-xs font-bold text-[#8b8fb5] group-hover:text-[#4F46E5] transition-colors">
                    {tocOpen ? 'إخفاء' : 'عرض الأقسام'}
                  </span>
                  <motion.div
                    animate={{ rotate: tocOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown size={20} className="text-[#4F46E5]" />
                  </motion.div>
                </div>
              </button>

              {/* TOC Items (collapsible) */}
              <AnimatePresence initial={false}>
                {tocOpen && (
                  <motion.div
                    key="toc-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[#d6d6e7]/50 px-6 py-3 flex flex-col gap-1">
                      {toc.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl transition-all group/item ${
                            activeSection === item.id
                              ? 'bg-[#f0eef5] text-[#4F46E5]'
                              : 'hover:bg-gray-50 text-[#4b4f7a]'
                          }`}
                        >
                          {/* Number badge */}
                          <span
                            className={`flex-shrink-0 w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                              activeSection === item.id
                                ? 'bg-[#4F46E5] text-white shadow-md shadow-[#b0a8d0]/40'
                                : 'bg-[#f0f0f8] text-[#4F46E5] group-hover/item:bg-[#e3dff0]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-sm leading-snug">{item.title}</span>
                          {activeSection === item.id && (
                            <motion.div
                              layoutId="toc-active-indicator"
                              className="mr-auto w-1.5 h-1.5 rounded-full bg-[#4F46E5]"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}

      {/* ─── Article Content ────────────────────────────────────── */}
      <div className="container mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto bg-white rounded-[3rem] p-8 md:p-16 border border-[#d6d6e7]/50 shadow-2xl shadow-indigo-50/50"
        >
          <style>{`
            .article-section-heading {
              font-size: 1.5rem;
              font-weight: 900;
              color: #151e63;
              margin-top: 2.5rem;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 3px solid #4F46E5;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              scroll-margin-top: 110px;
            }
            .article-section-heading::before {
              content: '';
              display: inline-block;
              width: 10px;
              height: 10px;
              min-width: 10px;
              background: linear-gradient(135deg, #4F46E5, #7C3AED);
              border-radius: 3px;
              margin-left: 0.5rem;
            }
          `}</style>
          <div
            ref={contentRef}
            className="prose prose-lg md:prose-xl max-w-none rtl prose-headings:font-black prose-p:font-medium prose-p:leading-relaxed text-[#5a5e9a] text-right prose-a:text-[#4F46E5]"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* ─── Feedback Section ("Was this helpful?") ────────────── */}
          <div className="mt-20 pt-12 border-t border-gray-100 text-center">
            <AnimatePresence mode="wait">
              {!showFeedbackThanks ? (
                <motion.div 
                  key="feedback-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-black text-[#151e63] tracking-tighter">هل وجدت هذه المقالة مفيدة؟</h3>
                  
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                      onClick={() => handleFeedback(true)}
                      className={cn(
                        "w-full sm:w-auto h-16 px-10 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all",
                        feedbackGiven === 'yes' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-500"
                      )}
                    >
                      <ThumbsUp size={20} /> نعم، شكراً!
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className={cn(
                        "w-full sm:w-auto h-16 px-10 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all",
                        feedbackGiven === 'no' ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500"
                      )}
                    >
                      <ThumbsDown size={20} /> ليس تماماً
                    </button>
                  </div>

                  {feedbackGiven === 'no' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-xl mx-auto space-y-4"
                    >
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="كيف يمكننا تحسين هذا المقال؟ (اختياري)"
                        className="w-full h-32 p-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium text-sm resize-none border-2 focus:border-[#4F46E5] outline-none"
                      />
                      <Button 
                        onClick={submitFullFeedback}
                        disabled={isSubmittingFeedback}
                        className="w-full h-14 bg-[#4F46E5] text-white rounded-2xl font-black"
                      >
                        إرسال ملاحظاتي
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="feedback-thanks"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-8"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-100">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-[#151e63] tracking-tighter">شكراً على تقييمك!</h3>
                  <p className="text-[#777aaf] font-bold">رأيك يساعدنا على تحسين محتوانا بشكل أفضل.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ─── Feedback Profiles Section (Replaces Static Stats) ── */}
        <div className="max-w-4xl mx-auto mt-20 space-y-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-[#4F46E5]">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#151e63] tracking-tighter">تفاعلات القراء</h2>
                <p className="text-[#777aaf] font-bold text-sm">{allFeedback.length} أشخاص شاركوا رأيهم</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allFeedback.length > 0 ? (
              allFeedback.map((fb) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={fb.id} 
                  className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 border-indigo-50">
                    <img 
                      src={fb.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fb.userName || fb.id}`} 
                      alt={fb.userName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-[#151e63] text-sm truncate">{fb.userName || 'مستخدم أكوا'}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      {fb.isHelpful ? (
                        <span className="text-emerald-500 flex items-center gap-1"><ThumbsUp size={10} /> وجدها مفيدة</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><ThumbsDown size={10} /> لم يجدها مفيدة</span>
                      )}
                    </p>
                  </div>
                  {fb.comment && (
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors cursor-help" title={fb.comment}>
                       <Send size={14} className="rotate-180" />
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="md:col-span-2 py-16 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-[#777aaf] font-bold">لا توجد تفاعلات بعد. كن أول من يشارك رأيه!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
