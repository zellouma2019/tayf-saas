"use client";

import { motion } from "framer-motion";
import { 
  FileText, Image, BookOpen, Copy, CreditCard, Megaphone,
  Sparkles, Clock, ArrowLeft 
} from "lucide-react";
import type { ServiceType } from "@/lib/print-config";
import { formatDA } from "@/lib/print-config";

interface ServiceShowcaseProps {
  selectedService?: ServiceType | null;
  onSelect: (type: string) => void;
}

const SERVICES: {
  type: ServiceType;
  name: string;
  description: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  price: string;
  color: string;
  bgGradient: string;
  features: string[];
  isPopular?: boolean;
}[] = [
  {
    type: "document",
    name: "طباعة مستند",
    description: "تقارير، سير ذاتية، مذكرات",
    emoji: "📄",
    icon: FileText,
    price: "من 5 دج/صفحة",
    color: "text-amber-600 dark:text-amber-400",
    bgGradient: "from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30",
    features: ["ملون وأبيض/أسود", "A4, A3, A5", "تجليد اختياري"],
    isPopular: true,
  },
  {
    type: "photo",
    name: "طباعة صور",
    description: "صور فوتوغرافية بجودة عالية",
    emoji: "🖼️",
    icon: Image,
    price: "من 25 دج",
    color: "text-rose-600 dark:text-rose-400",
    bgGradient: "from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30",
    features: ["مقاسات متعددة", "ورق لامع/مطفي", "تلميع وتحسين"],
  },
  {
    type: "binding",
    name: "تجليد",
    description: "تجليد احترافي للمستندات",
    emoji: "📚",
    icon: BookOpen,
    price: "من 20 دج",
    color: "text-emerald-600 dark:text-emerald-400",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30",
    features: ["تدبيس، لولبي، غراء", "غلاف مقوّى فاخر", "حتى 500 صفحة"],
  },
  {
    type: "copy",
    name: "نسخ مستندات",
    description: "نسخ سريع بأسعار مخفضة",
    emoji: "📋",
    icon: Copy,
    price: "من 4 دج/صفحة",
    color: "text-teal-600 dark:text-teal-400",
    bgGradient: "from-cyan-50 to-sky-50 dark:from-cyan-950/40 dark:to-sky-950/30",
    features: ["أبيض/أسود وملون", "فرز تلقائي", "خصم بالكمية"],
  },
  {
    type: "card",
    name: "بطاقات",
    description: "بطاقات عمل ودعوة وتهنئة",
    emoji: "🪪",
    icon: CreditCard,
    price: "من 30 دج",
    color: "text-orange-600 dark:text-orange-400",
    bgGradient: "from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30",
    features: ["عمل، هوية، دعوة", "ختم ذهبي ونقش", "PVC ومعدني"],
  },
  {
    type: "poster",
    name: "ملصقات",
    description: "ملصقات وإعلانات كبيرة",
    emoji: "📜",
    icon: Megaphone,
    price: "من 50 دج",
    color: "text-orange-600 dark:text-orange-400",
    bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/30",
    features: ["A3 إلى A0", "فينيل وكانفاس", "ألوان حية"],
  },
];

const BORDER_CLASS: Record<string, string> = {
  document: "service-border-document",
  photo: "service-border-photo",
  binding: "service-border-binding",
  copy: "service-border-copy",
  card: "service-border-card",
  poster: "service-border-poster",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function ServiceShowcase({ selectedService, onSelect }: ServiceShowcaseProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="font-bold text-sm">اختر الخدمة يدوياً</h3>
        <span className="text-xs text-muted-foreground">— أو ارفع ملفاً أعلاه</span>
      </div>
      
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {SERVICES.map((svc) => {
          const isSelected = selectedService === svc.type;
          const Icon = svc.icon;
          
          return (
            <motion.button
              key={svc.type}
              variants={item}
              onClick={() => onSelect(svc.type)}
              className={`group relative text-right rounded-2xl p-4 border-2 transition-all duration-200 card-hover-lift btn-ripple hover:shadow-lg ${BORDER_CLASS[svc.type]} ${
                isSelected
                  ? "border-amber-400 bg-amber-50/80 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-card"
                  : "border-l-transparent border-t-transparent border-b-transparent bg-card hover:border-amber-200 dark:hover:border-amber-800"
              }`}
            >
              {/* شارة الأكثر طلباً */}
              {svc.isPopular && (
                <span className="popular-badge">الأكثر طلباً</span>
              )}

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 left-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
              
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${svc.bgGradient} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                <Icon className={`h-5 w-5 ${svc.color}`} />
              </div>
              
              <div className="font-bold text-sm mb-0.5">{svc.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed mb-2">{svc.description}</div>
              
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/60">
                <span className={`text-sm font-bold ${svc.color}`}>{svc.price}</span>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-1">
                {svc.features.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
      
      {/* شريط معلومات سريع */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/40"
      >
        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 shrink-0">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium">جاهز خلال ساعة</span>
        </div>
        <div className="w-px h-4 bg-amber-200 dark:bg-amber-800" />
        <div className="text-xs text-amber-600 dark:text-amber-500">
          خصم <strong>10%</strong> عند 10 نسخ · <strong>15%</strong> عند 50 نسخ
        </div>
      </motion.div>
    </div>
  );
}