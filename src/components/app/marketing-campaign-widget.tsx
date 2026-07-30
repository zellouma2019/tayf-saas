"use client";

import { useState } from "react";
import { Megaphone, Target, TrendingUp, DollarSign, BarChart3, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDA } from "@/lib/print-config";

type CampaignType = "discount" | "seasonal" | "loyalty" | "launch";
type CampaignStatus = "active" | "completed" | "draft";

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  reach: number;
  engagementRate: number;
  conversions: number;
  budgetSpent: number;
  budgetTotal: number;
}

const TYPE_CONFIG: Record<CampaignType, { label: string; icon: typeof Megaphone; color: string; bg: string; bar: string }> = {
  discount: { label: "خصومات", icon: DollarSign, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", bar: "bg-rose-400" },
  seasonal: { label: "عروض موسمية", icon: Target, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", bar: "bg-amber-400" },
  loyalty: { label: "ولاء العملاء", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", bar: "bg-emerald-400" },
  launch: { label: "إطلاق خدمة", icon: Rocket, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", bar: "bg-violet-400" },
};

const STATUS_MAP: Record<CampaignStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "نشط", variant: "default" },
  completed: { label: "مكتملة", variant: "secondary" },
  draft: { label: "مسودة", variant: "outline" },
};

const CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "خصم نهاية الموسم", type: "discount", status: "active", reach: 12500, engagementRate: 4.7, conversions: 312, budgetSpent: 35000, budgetTotal: 50000 },
  { id: "c2", name: "عرض رمضان المبارك", type: "seasonal", status: "active", reach: 18700, engagementRate: 6.2, conversions: 528, budgetSpent: 50000, budgetTotal: 75000 },
  { id: "c3", name: "برنامج النقاط الذهبية", type: "loyalty", status: "completed", reach: 8900, engagementRate: 8.1, conversions: 445, budgetSpent: 20000, budgetTotal: 20000 },
  { id: "c4", name: "إطلاق خدمة الطباعة ثلاثية الأبعاد", type: "launch", status: "draft", reach: 0, engagementRate: 0, conversions: 0, budgetSpent: 0, budgetTotal: 60000 },
];

function MiniBarChart({ campaigns }: { campaigns: Campaign[] }) {
  const maxVal = Math.max(...campaigns.map((c) => c.reach), 1);

  return (
    <svg viewBox="0 0 280 80" className="w-full h-20" preserveAspectRatio="none">
      {campaigns.map((c, i) => {
        const heightPct = c.reach > 0 ? Math.max((c.reach / maxVal) * 70, 6) : 4;
        const x = 20 + i * 65;
        const color = TYPE_CONFIG[c.type].bar;
        return (
          <g key={c.id}>
            <rect
              x={x}
              y={70 - heightPct}
              width={40}
              height={heightPct}
              rx={4}
              className={color}
              opacity={c.status === "draft" ? 0.3 : 0.85}
            />
            {c.reach > 0 && (
              <text x={x + 20} y={70 - heightPct - 4} textAnchor="middle" className="fill-muted-foreground text-[8px] font-bold">
                {(c.reach / 1000).toFixed(1)}k
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function MarketingCampaignWidget() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalCampaigns = CAMPAIGNS.length;
  const activeCampaigns = CAMPAIGNS.filter((c) => c.status === "active").length;
  const totalBudget = CAMPAIGNS.reduce((s, c) => s + c.budgetSpent, 0);
  const avgRoi =
    CAMPAIGNS.filter((c) => c.conversions > 0).length > 0
      ? Math.round(
          CAMPAIGNS.filter((c) => c.conversions > 0).reduce((s, c) => s + c.engagementRate * c.conversions, 0) /
            CAMPAIGNS.filter((c) => c.conversions > 0).length
        )
      : 0;

  return (
    <Card className="rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            الحملات التسويقية
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
            {activeCampaigns} نشطة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Summary Row */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "إجمالي الحملات", value: totalCampaigns, icon: BarChart3, color: "text-slate-600 dark:text-slate-400" },
            { label: "نشطة", value: activeCampaigns, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "الميزانية", value: formatDA(totalBudget), icon: DollarSign, color: "text-amber-600 dark:text-amber-400", isText: true },
            { label: "متوسط العائد", value: `${avgRoi}%`, icon: Target, color: "text-violet-600 dark:text-violet-400", isText: true },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg bg-muted/40 border border-border/30 p-2 text-center">
              <stat.icon className={`h-3 w-3 ${stat.color} mx-auto mb-1`} />
              <p className={`text-xs font-bold ${stat.isText ? "text-[11px]" : ""}`}>{stat.value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mini Bar Chart */}
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            مقارنة الوصول بين الحملات
          </p>
          <MiniBarChart campaigns={CAMPAIGNS} />
          <div className="flex gap-2 mt-1">
            {CAMPAIGNS.map((c) => (
              <div key={c.id} className="flex-1 text-center">
                <p className="text-[8px] text-muted-foreground truncate">{c.name.split(" ").slice(0, 2).join(" ")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Cards */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {CAMPAIGNS.map((campaign) => {
            const typeConf = TYPE_CONFIG[campaign.type];
            const statusConf = STATUS_MAP[campaign.status];
            const isHovered = hoveredId === campaign.id;
            const TypeIcon = typeConf.icon;
            const budgetPct = campaign.budgetTotal > 0 ? (campaign.budgetSpent / campaign.budgetTotal) * 100 : 0;

            return (
              <div
                key={campaign.id}
                onMouseEnter={() => setHoveredId(campaign.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`rounded-xl border p-3 transition-all duration-200 hover:shadow-sm ${
                  isHovered ? "bg-muted/50 border-primary/20" : "bg-card border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${typeConf.bg} flex items-center justify-center`}>
                      <TypeIcon className={`h-3.5 w-3.5 ${typeConf.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{campaign.name}</p>
                      <p className="text-[10px] text-muted-foreground">{typeConf.label}</p>
                    </div>
                  </div>
                  <Badge variant={statusConf.variant} className="text-[10px] font-medium px-2 py-0.5">
                    {statusConf.label}
                  </Badge>
                </div>

                {campaign.status !== "draft" && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">الوصول</p>
                        <p className="text-xs font-bold">{campaign.reach.toLocaleString("ar-SA-u-nu-latn")}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">التفاعل</p>
                        <p className="text-xs font-bold">{campaign.engagementRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">التحويلات</p>
                        <p className="text-xs font-bold">{campaign.conversions}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{formatDA(campaign.budgetSpent)} / {formatDA(campaign.budgetTotal)}</span>
                      <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all duration-500" style={{ width: `${budgetPct}%` }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
