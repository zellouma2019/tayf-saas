"use client";

import { MessageCircle } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WhatsAppButtonProps {
  /** When true (admin view), the button is hidden */
  isAdminView?: boolean;
  /** Custom message to pre-fill */
  message?: string;
}

export function WhatsAppButton({
  isAdminView = false,
  message = "مرحباً، أريد الاستفسار عن خدماتكم 🖨️",
}: WhatsAppButtonProps) {
  const { shop } = useShop();

  if (isAdminView) return null;

  const whatsappNumber = shop?.whatsapp || shop?.phone;
  if (!whatsappNumber) return null;

  // Format number: remove spaces, dashes, and leading 0
  const cleanNumber = whatsappNumber.replace(/[\s\-]/g, "").replace(/^0/, "");
  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل عبر واتساب"
          className={
            "fixed bottom-20 left-4 z-40 flex items-center justify-center " +
            "w-14 h-14 rounded-full shadow-lg " +
            "bg-[#25D366] hover:bg-[#20BD5A] text-white " +
            "transition-all duration-300 hover:scale-110 " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2"
          }
        >
          {/* Pulsing ring animation */}
          <span
            className={
              "absolute inset-0 rounded-full bg-[#25D366] " +
              "animate-ping opacity-25"
            }
            aria-hidden="true"
          />
          <MessageCircle className="h-6 w-6 relative z-10" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <span dir="rtl">تواصل معنا عبر واتساب</span>
      </TooltipContent>
    </Tooltip>
  );
}
