"use client";

import { useState, useMemo, useCallback } from "react";
import { Copy, Check, Share2, QrCode, Link2, MessageCircle, Phone, Download } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useShop } from "@/lib/shop-context";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const { shop } = useShop();
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const shopUrl = useMemo(() => {
    if (!shop) return "";
    return typeof window !== "undefined"
      ? `${window.location.origin}/s/${shop.slug}`
      : "";
  }, [shop]);

  const customerLink = useMemo(() => {
    if (!shopUrl) return "";
    return shopUrl;
  }, [shopUrl]);

  const qrUrl = useMemo(() => {
    if (!shopUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shopUrl)}&format=png`;
  }, [shopUrl]);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setCopied(true);
      toast.success("تم النسخ!");
      setTimeout(() => { setCopiedField(null); setCopied(false); }, 2000);
    } catch {
      toast.error("فشل النسخ");
    }
  }, []);

  const shareNative = useCallback(async () => {
    if (!navigator.share) {
      copyToClipboard(shopUrl, "link");
      return;
    }
    try {
      const shopName = shop?.name || "طيف";
      await navigator.share({
        title: shopName,
        text: `اطبع مع ${shopName} — سريع وسهل`,
        url: shopUrl,
      });
    } catch {}
  }, [shop, shopUrl, copyToClipboard]);

  if (!shop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <div className="space-y-5" dir="rtl">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-bold">شارك متجرك</h3>
            <p className="text-xs text-muted-foreground mt-1">
              شارك رابط متجرك مع الزبائن
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-3 rounded-xl border bg-card shadow-sm">
              <img
                src={qrUrl}
                alt="QR Code"
                width={160}
                height={160}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Shop Link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">رابط المتجر</label>
            <div className="flex items-center gap-2">
              <Input
                value={customerLink}
                readOnly
                className="text-xs font-mono h-9"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(customerLink, "link")}
                className="shrink-0 h-9 w-9 p-0"
              >
                {copiedField === "link" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* WhatsApp */}
            <Button
              variant="outline"
              className="h-10 text-xs gap-2"
              onClick={() => {
                const msg = `👋 مرحباً! اطلب طباعتك من ${shop.name}\n${customerLink}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
              }}
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              واتساب
            </Button>

            {/* Native Share */}
            <Button
              variant="outline"
              className="h-10 text-xs gap-2"
              onClick={shareNative}
            >
              <Share2 className="h-4 w-4 text-sky-500" />
              مشاركة
            </Button>

            {/* SMS */}
            <Button
              variant="outline"
              className="h-10 text-xs gap-2"
              onClick={() => {
                const msg = `اطلب طباعتك من ${shop.name}: ${customerLink}`;
                window.open(`sms:?body=${encodeURIComponent(msg)}`, "_blank");
              }}
            >
              <Phone className="h-4 w-4 text-violet-500" />
              رسالة SMS
            </Button>

            {/* Copy QR */}
            <Button
              variant="outline"
              className="h-10 text-xs gap-2"
              onClick={() => copyToClipboard(qrUrl, "qr")}
            >
              <QrCode className="h-4 w-4 text-amber-500" />
              {copiedField === "qr" ? "تم نسخ الرابط!" : "نسخ رابط QR"}
            </Button>
          </div>

          {/* Stats hint */}
          <div className="text-center text-[10px] text-muted-foreground/60">
            <QrCode className="h-3 w-3 inline-block mr-1" />
            يمكن للزبائن مسح رمز QR للوصول مباشرة
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
