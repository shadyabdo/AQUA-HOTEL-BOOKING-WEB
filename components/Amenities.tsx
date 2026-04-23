import { Wifi, Coffee, Utensils, Car, ShieldCheck, Clock, Waves, Dumbbell, Sparkles, Tv, Wind, Mountain, Sun } from "lucide-react";

// Mapping of amenity names to Lucide icons
const iconMap: Record<string, any> = {
  "واي فاي مجاني": Wifi,
  "واي فاي": Wifi,
  "إفطار فاخر": Coffee,
  "إفطار مجاني": Coffee,
  "مطاعم عالمية": Utensils,
  "مطعم تاريخي": Utensils,
  "مواقف سيارات": Car,
  "أمان 24/7": ShieldCheck,
  "خدمة الغرف": Clock,
  "مسبح خاص": Waves,
  "مسبح": Waves,
  "نادي رياضي": Dumbbell,
  "سبا": Sparkles,
  "تلفاز": Tv,
  "تكييف": Wind,
  "إطلالة بحرية": Sun,
  "إطلالة على الجبل": Mountain,
};

interface AmenitiesProps {
  hotelName?: string;
  items?: string[];
}

export default function Amenities({ hotelName = "أكوا ريزورت", items }: AmenitiesProps) {
  // If no specific items are provided, use a default set
  const displayItems = items && items.length > 0 
    ? items.map(name => ({
        title: name,
        icon: iconMap[name] || Sparkles,
        desc: `استمتع بخدمة ${name} المميزة في ${hotelName}.`
      }))
    : [
        { icon: Wifi, title: "واي فاي مجاني", desc: "ابق على اتصال مع إنترنت عالي السرعة في جميع أنحاء الموقع." },
        { icon: Coffee, title: "إفطار فاخر", desc: "ابدأ يومك ببوفيه إفطار عالمي متنوع." },
        { icon: Utensils, title: "مطاعم عالمية", desc: "استمتع بتجارب طعام فريدة من مطابخ عالمية مختلفة." },
        { icon: Car, title: "مواقف سيارات", desc: "مواقف سيارات آمنة ومجانية لجميع ضيوفنا." },
        { icon: ShieldCheck, title: "أمان 24/7", desc: "نظام أمني متكامل لضمان سلامتك وخصوصيتك." },
        { icon: Clock, title: "خدمة الغرف", desc: "خدمة غرف متاحة على مدار الساعة لتلبية احتياجاتك." },
      ];

  return (
    <section id="amenities" className="py-16 bg-gray-50 mt-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-black mb-12 text-center lg:text-right">لماذا تختار {hotelName}؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayItems.map((item, index) => (
            <div key={index} className="flex gap-5 p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="bg-[#f0f6ff] p-4 rounded-2xl h-fit group-hover:bg-primary group-hover:rotate-12 transition-all">
                <item.icon className="text-[#006ce4] group-hover:text-white" size={28} />
              </div>
              <div>
                <h3 className="font-black text-xl mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
