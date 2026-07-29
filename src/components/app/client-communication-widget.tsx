"use client";

import { motion } from "framer-motion";

interface Message {
  id: number;
  name: string;
  initials: string;
  msg: string;
  time: string;
  unread: boolean;
}

const MESSAGES: Message[] = [
  { id: 1, name: "أحمد بن علي", initials: "أب", msg: "هل الطلب جاهز؟ أحتاجه غداً صباحاً", time: "منذ 5 دقائق", unread: true },
  { id: 2, name: "فاطمة الزهراء", initials: "فز", msg: "أريد تعديل الطباعة على الوجهين", time: "منذ 20 دقيقة", unread: true },
  { id: 3, name: "محمد الأمين", initials: "مع", msg: "شكراً لكم، الجودة ممتازة", time: "منذ ساعة", unread: true },
  { id: 4, name: "خديجة بوعلام", initials: "خب", msg: "ممكن تقديم عرض سعر للطباعة بالجملة؟", time: "منذ 3 ساعات", unread: false },
  { id: 5, name: "يوسف حمداني", initials: "يح", msg: "تم استلام الطلب، شكراً جزيلاً", time: "أمس", unread: false },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function ClientCommunicationWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-base">💬</span>
          تواصل العملاء
        </h3>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
          12 رسالة جديدة
        </span>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          5 ردود معلقة
        </span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {MESSAGES.map((m) => (
          <motion.div
            key={m.id}
            variants={item}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer ${
              m.unread ? "bg-sky-50/60 dark:bg-sky-900/15" : ""
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {m.initials}
              </div>
              {m.unread && (
                <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-sky-500 rounded-full border-2 border-white dark:border-zinc-900" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold truncate ${m.unread ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {m.name}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex-shrink-0 mr-2">
                  {m.time}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{m.msg}</p>
            </div>

            {m.unread && (
              <button className="flex-shrink-0 self-center text-[10px] font-medium px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors">
                رد سريع
              </button>
            )}
          </motion.div>
        ))}
      </motion.div>

      <button className="w-full mt-4 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline py-1 transition-colors">
        عرض الكل
      </button>
    </motion.div>
  );
}
