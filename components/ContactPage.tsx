import React from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess } from "@/src/lib/swal";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess("تم الإرسال!", "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 text-[#4F46E5]"
          >
            تواصل معنا
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="w-24 h-1.5 bg-[#4F46E5] mx-auto rounded-full mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            نحن هنا لمساعدتكم في أي وقت. لا تترددوا في التواصل معنا بخصوص أي استفسارات أو شكاوى.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="bg-card p-8 rounded-[2rem] shadow-xl border border-border/50 hover:border-[#4F46E5]/20 transition-all group">
              <h2 className="text-2xl font-bold mb-8">معلومات التواصل</h2>

              <div className="space-y-6">
                <a href="https://wa.me/201210686336" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group/item hover:bg-muted/50 p-2 -mx-2 rounded-xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] group-hover/item:bg-[#4F46E5] group-hover/item:text-white transition-all">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">اتصل بنا</p>
                    <p className="font-bold text-lg" dir="ltr">01210686336</p>
                  </div>
                </a>

                <a href="mailto:shadyabdowd2020@gmail.com" className="flex items-center gap-4 group/item hover:bg-muted/50 p-2 -mx-2 rounded-xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover/item:bg-secondary group-hover/item:text-white transition-all">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-bold text-lg">shadyabdowd2020@gmail.com</p>
                  </div>
                </a>

                <div className="flex items-center gap-4 group/item">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover/item:bg-accent group-hover/item:text-white transition-all">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">العنوان</p>
                    <p className="font-bold text-lg">طنطا ، العجيزي ، مساكن الشباب</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <p className="text-sm text-muted-foreground mb-4">تابعنا على</p>
                <div className="flex gap-4">
                  {[
                    { icon: Instagram, color: "hover:bg-pink-500" },
                    { icon: Facebook, color: "hover:bg-blue-600" },
                    { icon: Twitter, color: "hover:bg-sky-500" }
                  ].map((social, i) => (
                    <a
                      key={i}
                      href="#"
                      className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground transition-all hover:text-white ${social.color}`}
                    >
                      <social.icon size={20} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Iframe */}
            <div className="h-[250px] bg-muted rounded-[2rem] overflow-hidden relative group border border-border/50 shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d603.8385614406886!2d31.007415175488564!3d30.767323809434238!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f7c900292edb77%3A0x68b0d2df327761bc!2z2KfZhNi52KzZitiy2Yog2YXYs9in2YPZhiDYp9mE2LTYqNin2Kg!5e0!3m2!1sar!2seg!4v1776789849603!5m2!1sar!2seg"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card p-10 rounded-[2rem] shadow-2xl border border-border"
          >
            <h2 className="text-2xl font-bold mb-8 text-right">أرسل لنا رسالة</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold mr-1">الاسم بالكامل</label>
                  <Input
                    required
                    className="h-14 bg-muted/30 border-none focus:ring-2 focus:ring-[#4F46E5]/50 text-right"
                    placeholder="أدخل اسمك"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold mr-1">البريد الإلكتروني</label>
                  <Input
                    required
                    type="email"
                    className="h-14 bg-muted/30 border-none focus:ring-2 focus:ring-[#4F46E5]/50 text-right"
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold mr-1">الموضوع</label>
                <Input
                  required
                  className="h-14 bg-muted/30 border-none focus:ring-2 focus:ring-[#4F46E5]/50 text-right"
                  placeholder="كيف يمكننا مساعدتك؟"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold mr-1">الرسالة</label>
                <Textarea
                  required
                  rows={6}
                  className="bg-muted/30 border-none focus:ring-2 focus:ring-[#4F46E5]/50 text-right resize-none"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-[#4F46E5] text-[#4F46E5]-foreground font-black text-lg rounded-2xl hover:bg-[#4F46E5]/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3"
              >
                إرسال الآن
                <Send size={20} className="rotate-180" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
