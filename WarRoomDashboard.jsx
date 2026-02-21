"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Crown,
  Flame,
  LayoutDashboard,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

/**
 * Apple-ish design tokens
 */
const APPLE = {
  bg: "#F5F5F7",
  card: "#FFFFFF",
  text: "#1D1D1F",
  sub: "#6E6E73",
  line: "#D2D2D7",
  blue: "#0071E3",
  green: "#1A7F37",
  amber: "#B98900",
  red: "#B3261E",
};

// ---------- helpers ----------
const formatK = (n) => {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const statusFromScore = (score01) => {
  if (score01 >= 0.72) return { label: "健康", tone: "GOOD" };
  if (score01 >= 0.45) return { label: "注意", tone: "AMBER" };
  return { label: "風險", tone: "RISK" };
};

const toneClass = (tone) => {
  if (tone === "GOOD") return "bg-[#E8F7EE] text-[#1A7F37]";
  if (tone === "AMBER") return "bg-[#FFF4D6] text-[#8A6A00]";
  return "bg-[#FDECEC] text-[#B3261E]";
};

// ---------- chart colors (Apple minimal) ----------
const PIE_COLORS_TRAFFIC = [APPLE.text, "#8E8E93", "#C7C7CC"];
const PIE_COLORS_MONETIZE = [APPLE.text, "#7D7D82", "#B0B0B5", "#D1D1D6"];
const SCATTER_COLORS = {
  主力遊戲: APPLE.text,
  聊天互動: "#6E6E73",
  企劃活動: "#8E8E93",
  精華剪輯: "#C7C7CC",
};

// ---------- mock data ----------
const ALL_TREND = Array.from({ length: 90 }).map((_, i) => {
  const day = i + 1;
  const base = 260 + i * 1.2;
  const wave = Math.round(35 * Math.sin(i / 4));
  const acv = Math.round(base + wave);
  const followers = 40 + Math.round(8 * Math.sin(i / 3) + i * 0.2);
  const clips = Math.max(0, Math.round(6 + 2 * Math.sin(i / 2)));
  return { day, acv, followers, clips };
});

const RANGE_MAP = { "7d": 7, "30d": 30, "90d": 90 };

const MOCK = {
  channel: {
    name: "nayabnb",
    platform: "Twitch",
    stage: "成長期中段",
    core: "陪伴型互動＋主力遊戲",
    oneLiner: "目前不是流量問題，而是成長結構尚未爆發。",
  },
  kpis: {
    subGrowthRate: { value: 0.18, label: "訂閱成長率", unit: "MoM" },
    avgConcurrent: { value: 315, label: "平均同時觀看", unit: "ACV" },
    retentionProxy: { value: 0.56, label: "黏著指標", unit: "Proxy" },
    chatEngagement: { value: 0.62, label: "互動率", unit: "Index" },
    monetization: { value: 0.48, label: "變現效率", unit: "Index" },
  },
  traffic: [
    { name: "既有粉絲回流", value: 52 },
    { name: "平台推薦", value: 33 },
    { name: "外部導流", value: 15 },
  ],
  contentMix: [
    { type: "主力遊戲", share: 46, stability: 80, growth: 58 },
    { type: "聊天互動", share: 34, stability: 78, growth: 36 },
    { type: "企劃活動", share: 12, stability: 42, growth: 84 },
    { type: "精華剪輯", share: 8, stability: 35, growth: 76 },
  ],
  contentMatrix: [
    { name: "主力遊戲", x: 58, y: 80, z: 46 },
    { name: "聊天互動", x: 36, y: 78, z: 34 },
    { name: "企劃活動", x: 84, y: 42, z: 12 },
    { name: "精華剪輯", x: 76, y: 35, z: 8 },
  ],
  risks: [
    { subject: "內容疲乏", A: 68 },
    { subject: "平台依賴", A: 62 },
    { subject: "情緒消耗", A: 73 },
    { subject: "競爭模仿", A: 55 },
    { subject: "成長天花板", A: 70 },
  ],
  monetization: [
    { name: "訂閱", value: 55 },
    { name: "打賞", value: 22 },
    { name: "廣告", value: 13 },
    { name: "贊助/合作", value: 10 },
  ],
  phases: [
    {
      title: "Phase 1｜穩定基本盤（1–2個月）",
      goal: "提高新觀眾滲透率＋留存",
      bullets: [
        "固定主力內容（避免頻繁換主題）",
        "每週至少 2 支精華剪輯（高密度笑點/衝突點）",
        "直播前 60 秒開場固定模板：主題 → 今天目標 → 鉤子事件",
      ],
      kpi: ["留存 +5~10%", "外部導流 +20%", "ACV 穩定上行"],
    },
    {
      title: "Phase 2｜製造爆點（3–6個月）",
      goal: "建立談資與話題事件",
      bullets: [
        "月度企劃：連續挑戰 / 觀眾投票路線 / 連動串台",
        "設計『可剪輯』橋段：關卡賭注、懲罰、里程碑儀式感",
        "合作名單分級：同量級 70%＋上位曝光 30%",
      ],
      kpi: ["爆款剪輯 ≥2/月", "新觀眾占比 +15%", "合作導流 +30%"],
    },
    {
      title: "Phase 3｜品牌化（6–12個月）",
      goal: "IP 固化與可複製變現",
      bullets: [
        "建立專屬口頭禪/儀式、視覺標識、固定音效",
        "開啟商品化測試：貼圖、週邊、小額會員福利",
        "社群文化規則：新手歡迎、內梗字典、回流機制",
      ],
      kpi: ["合作/贊助占比 ≥20%", "會員留存提升", "品牌搜尋量上升"],
    },
  ],
};

// ---------- UI primitives (Apple minimal) ----------
function Card({ className = "", children }) {
  return (
    <div
      className={
        "rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] " +
        className
      }
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 px-7 py-6 border-b border-[#E5E5EA]">
      <div>
        <div className="text-sm font-semibold text-[#1D1D1F]">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-xs text-[#6E6E73]">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
function CardBody({ className = "", children }) {
  return <div className={"px-7 py-6 " + className}>{children}</div>;
}

function Pill({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-[#1D1D1F] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {Icon ? <Icon className="h-4 w-4 text-[#6E6E73]" /> : null}
      <span className="text-[#1D1D1F]">{label}</span>
    </div>
  );
}

function StatusPill({ tone, label }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneClass(tone)}`}>
      {label}
    </span>
  );
}

function MiniStat({ icon: Icon, label, value, sub, status }) {
  return (
    <Card className="hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition">
      <div className="px-7 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#F5F5F7] p-3">
              <Icon className="h-5 w-5 text-[#1D1D1F]" />
            </div>
            <div>
              <div className="text-xs text-[#6E6E73]">{label}</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-[#1D1D1F]">
                {value}
              </div>
              {sub ? <div className="mt-2 text-xs text-[#0071E3]">{sub}</div> : null}
            </div>
          </div>
          {status ? <StatusPill tone={status.tone} label={status.label} /> : null}
        </div>
      </div>
    </Card>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-2xl bg-white px-4 py-2 pr-10 text-sm text-[#1D1D1F] shadow-[0_2px_12px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-[#0071E3]/25"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E6E73]" />
    </div>
  );
}

// Custom Scatter Tooltip
const ScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-2xl bg-white px-4 py-3 text-xs shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
        <div className="font-semibold text-[#1D1D1F]">{d.name}</div>
        <div className="mt-1 text-[#6E6E73]">成長性：{d.x}</div>
        <div className="text-[#6E6E73]">穩定度：{d.y}</div>
        <div className="text-[#6E6E73]">占比：{d.z}%</div>
      </div>
    );
  }
  return null;
};

// ---------- main ----------
export default function WarRoomNayabnb() {
  const [range, setRange] = useState("30d");
  const [mode, setMode] = useState("overview");

  const trendData = useMemo(() => {
    const days = RANGE_MAP[range] ?? 30;
    return ALL_TREND.slice(-days);
  }, [range]);

  const kpiScores = useMemo(() => {
    const { kpis } = MOCK;
    return {
      subGrowthRate: clamp(kpis.subGrowthRate.value / 0.3, 0, 1),
      avgConcurrent: clamp(kpis.avgConcurrent.value / 600, 0, 1),
      retentionProxy: clamp(kpis.retentionProxy.value, 0, 1),
      chatEngagement: clamp(kpis.chatEngagement.value, 0, 1),
      monetization: clamp(kpis.monetization.value, 0, 1),
    };
  }, []);

  const header = (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <LayoutDashboard className="h-6 w-6 text-[#1D1D1F]" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
              戰情室 · {MOCK.channel.name}
            </div>
            <Pill icon={Crown} label={`${MOCK.channel.platform} · ${MOCK.channel.stage}`} />
            <Pill icon={CalendarDays} label={`觀測窗：${range.toUpperCase()}`} />
          </div>
          <div className="mt-2 text-sm text-[#6E6E73]">{MOCK.channel.oneLiner}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill icon={Target} label={`定位：${MOCK.channel.core}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={range}
          onChange={setRange}
          options={[
            { value: "7d", label: "近 7 天" },
            { value: "30d", label: "近 30 天" },
            { value: "90d", label: "近 90 天" },
          ]}
        />
        <Select
          value={mode}
          onChange={setMode}
          options={[
            { value: "overview", label: "總覽" },
            { value: "traffic", label: "流量" },
            { value: "content", label: "內容" },
            { value: "risks", label: "風險" },
            { value: "plan", label: "作戰計畫" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: APPLE.bg }}>
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        {header}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <MiniStat
            icon={TrendingUp}
            label={MOCK.kpis.subGrowthRate.label}
            value={`${Math.round(MOCK.kpis.subGrowthRate.value * 100)}%`}
            sub={MOCK.kpis.subGrowthRate.unit}
            status={statusFromScore(kpiScores.subGrowthRate)}
          />
          <MiniStat
            icon={Users}
            label={MOCK.kpis.avgConcurrent.label}
            value={formatK(MOCK.kpis.avgConcurrent.value)}
            sub={MOCK.kpis.avgConcurrent.unit}
            status={statusFromScore(kpiScores.avgConcurrent)}
          />
          <MiniStat
            icon={Activity}
            label={MOCK.kpis.retentionProxy.label}
            value={`${Math.round(MOCK.kpis.retentionProxy.value * 100)}%`}
            sub={MOCK.kpis.retentionProxy.unit}
            status={statusFromScore(kpiScores.retentionProxy)}
          />
          <MiniStat
            icon={Flame}
            label={MOCK.kpis.chatEngagement.label}
            value={`${Math.round(MOCK.kpis.chatEngagement.value * 100)}%`}
            sub={MOCK.kpis.chatEngagement.unit}
            status={statusFromScore(kpiScores.chatEngagement)}
          />
          <MiniStat
            icon={Wallet}
            label={MOCK.kpis.monetization.label}
            value={`${Math.round(MOCK.kpis.monetization.value * 100)}%`}
            sub={MOCK.kpis.monetization.unit}
            status={statusFromScore(kpiScores.monetization)}
          />
        </motion.div>

        {mode === "overview" && <OverviewPanel trendData={trendData} />}
        {mode === "traffic" && <TrafficPanel trendData={trendData} />}
        {mode === "content" && <ContentPanel />}
        {mode === "risks" && <RisksPanel />}
        {mode === "plan" && <PlanPanel />}
      </div>
    </div>
  );
}

// ---------- panels ----------
function OverviewPanel({ trendData }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader
          title="成長趨勢"
          subtitle="ACV（平均同時觀看）與追隨成長"
          right={
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F7] px-3 py-2 text-xs text-[#6E6E73]">
              <BarChart3 className="h-4 w-4" />
              Trend
            </div>
          }
        />
        <CardBody className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid stroke={APPLE.line} strokeDasharray="0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: APPLE.sub }} axisLine={{ stroke: APPLE.line }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: APPLE.sub }} axisLine={{ stroke: APPLE.line }} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: APPLE.sub }} axisLine={{ stroke: APPLE.line }} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 16, border: "1px solid #E5E5EA" }}
                labelStyle={{ color: APPLE.sub }}
              />
              <Line yAxisId="left" type="monotone" dataKey="acv" stroke={APPLE.text} strokeWidth={2} dot={false} name="ACV" />
              <Line yAxisId="right" type="monotone" dataKey="followers" stroke={APPLE.blue} strokeWidth={2} dot={false} name="新追蹤" />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="指揮官判讀"
          subtitle="冷靜、可執行的戰情結論"
          right={<ShieldAlert className="h-4 w-4 text-[#6E6E73]" />}
        />
        <CardBody className="space-y-4">
          <div className="rounded-2xl bg-[#F5F5F7] p-5 text-sm">
            <div className="font-semibold text-[#1D1D1F]">核心判斷</div>
            <div className="mt-2 leading-relaxed text-[#1D1D1F]">
              {MOCK.channel.oneLiner}
              <br />
              <span className="text-[#6E6E73]">建議優先順序：留存 → 外部導流 → 爆點企劃。</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="text-xs font-semibold text-[#6E6E73]">本週優先任務</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#1D1D1F]">
              <li>固定直播開場鉤子（60 秒內交代目標＋今天亮點）</li>
              <li>挑 2 段可剪輯橋段：高張力/高情緒/高互動</li>
              <li>設定單一外部導流管道（短影片或社群貼文）</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="text-xs font-semibold text-[#6E6E73]">短期成功指標</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-[#F5F5F7] p-3">留存 +5%</div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">新觀眾 +10%</div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">爆點剪輯 1 支</div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">合作洽談 1 位</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function TrafficPanel({ trendData }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader title="流量來源結構" subtitle="回流 / 推薦 / 外部導流" />
        <CardBody className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E5E5EA" }} />
              <Pie
                data={MOCK.traffic}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                labelLine={false}
              >
                {MOCK.traffic.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS_TRAFFIC[idx % PIE_COLORS_TRAFFIC.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="外部導流與剪輯產量" subtitle="把『可被分享』做成固定工序" />
        <CardBody className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid stroke={APPLE.line} strokeDasharray="0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: APPLE.sub }} axisLine={{ stroke: APPLE.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: APPLE.sub }} axisLine={{ stroke: APPLE.line }} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E5E5EA" }} />
              <Area
                type="monotone"
                dataKey="clips"
                stroke={APPLE.text}
                strokeWidth={2}
                fill={APPLE.blue}
                fillOpacity={0.10}
                name="剪輯支數"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader title="戰情結論" subtitle="如何把回流型頻道轉成擴散型" />
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <AdviceBox icon={Target} title="問題定義" text="新觀眾占比偏低，流量以熟粉回流為主，成長呈緩坡。" />
          <AdviceBox icon={Flame} title="破局手段" text="固定每週『可剪輯橋段』產線：賭注、挑戰、懲罰、里程碑儀式。" />
          <AdviceBox icon={TrendingUp} title="成功指標" text="外部導流提升、剪輯帶來新觀眾，ACV 逐步抬升並更穩定。" />
        </CardBody>
      </Card>
    </div>
  );
}

function ContentPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader title="內容貢獻矩陣" subtitle="X=成長性、Y=穩定度、泡泡大小=占比" />
        <CardBody className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid stroke={APPLE.line} strokeDasharray="0" />
              <XAxis
                type="number"
                dataKey="x"
                name="成長性"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: APPLE.sub }}
                axisLine={{ stroke: APPLE.line }}
                tickLine={false}
                label={{ value: "成長性", position: "insideBottom", offset: -2, fontSize: 12, fill: APPLE.sub }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="穩定度"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: APPLE.sub }}
                axisLine={{ stroke: APPLE.line }}
                tickLine={false}
                label={{ value: "穩定度", angle: -90, position: "insideLeft", fontSize: 12, fill: APPLE.sub }}
              />
              <ZAxis type="number" dataKey="z" range={[60, 220]} name="占比" />
              <Tooltip content={<ScatterTooltip />} />
              {MOCK.contentMatrix.map((d) => (
                <Scatter key={d.name} name={d.name} data={[d]} fill={SCATTER_COLORS[d.name] ?? APPLE.sub} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap gap-3">
            {MOCK.contentMatrix.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-[#6E6E73]">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: SCATTER_COLORS[d.name] }} />
                {d.name}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="內容結構占比" subtitle="把『企劃/剪輯』拉高，做成成長引擎" />
        <CardBody className="space-y-3">
          {MOCK.contentMix.map((c) => (
            <div key={c.type} className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[#1D1D1F]">{c.type}</div>
                <div className="text-xs text-[#6E6E73]">{c.share}%</div>
              </div>
              <div className="mt-4 space-y-3">
                <Bar label="穩定度" value={c.stability} />
                <Bar label="成長性" value={c.growth} />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader title="內容調整建議" subtitle="先結構、再爆點、最後品牌化" />
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <AdviceBox icon={Target} title="守住基本盤" text="主力內容保持可預測節奏：固定時段、固定主題，降低觀眾認知成本。" />
          <AdviceBox icon={Flame} title="加上可剪輯橋段" text="每場直播安排 2–3 個『可被截短』的高張力節點：賭注、倒數、挑戰、懲罰。" />
          <AdviceBox icon={Crown} title="把梗做成IP" text="固定口頭禪/儀式/音效與視覺符號，讓新觀眾一眼記得你。" />
        </CardBody>
      </Card>
    </div>
  );
}

function RisksPanel() {
  const riskScore = useMemo(() => {
    const avg = MOCK.risks.reduce((acc, r) => acc + r.A, 0) / MOCK.risks.length;
    return Math.round(avg);
  }, []);
  const riskStatus = statusFromScore(clamp(1 - riskScore / 100, 0, 1));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader
          title="風險雷達"
          subtitle={`總風險：${riskScore}/100（越高越危險）`}
          right={<StatusPill tone={riskStatus.tone} label={riskStatus.label} />}
        />
        <CardBody className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={MOCK.risks}>
              <PolarGrid stroke={APPLE.line} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: APPLE.sub }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: APPLE.sub }} />
              <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E5E5EA" }} />
              <Radar dataKey="A" stroke={APPLE.text} fill={APPLE.blue} strokeWidth={2} fillOpacity={0.12} />
            </RadarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="風險處置清單" subtitle="用作戰手冊把風險變成流程" right={<AlertTriangle className="h-4 w-4 text-[#6E6E73]" />} />
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RiskCard icon={AlertTriangle} title="內容疲乏" bullets={["每週新增 1 個小規則（賭注/挑戰）", "每月固定 1 次大企劃", "回顧最強片段，複用其結構"]} />
          <RiskCard icon={ShieldAlert} title="平台依賴" bullets={["剪輯短影片固定上架節奏", "社群貼文導流到直播", "建立 email/Discord 回流通道"]} />
          <RiskCard icon={Flame} title="情緒消耗" bullets={["設計低能耗節目：聊天/Q&A", "工作週期化（休息日固定）", "重大企劃前後留緩衝"]} />
          <RiskCard icon={TrendingUp} title="成長天花板" bullets={["提升新觀眾占比：合作 + 剪輯", "把『梗』變成IP辨識", "分層內容：核心盤 + 爆款引流"]} />
        </CardBody>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader title="變現結構" subtitle="檢查是否單一收入過度集中" right={<Wallet className="h-4 w-4 text-[#6E6E73]" />} />
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E5E5EA" }} />
                <Pie
                  data={MOCK.monetization}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {MOCK.monetization.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS_MONETIZE[idx % PIE_COLORS_MONETIZE.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-[#F5F5F7] p-5 text-sm">
              <div className="font-semibold text-[#1D1D1F]">策略判讀</div>
              <div className="mt-2 leading-relaxed text-[#1D1D1F]">
                若「訂閱」佔比長期 &gt; 60%，頻道成長會被核心粉絲數量限制。
                <br />
                <span className="text-[#6E6E73]">目標：把贊助/合作占比提升至 20% 以上，降低單一來源風險。</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="text-xs font-semibold text-[#6E6E73]">下一步（可立即執行）</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#1D1D1F]">
                <li>建立「合作提案一頁紙」：受眾、平均ACV、過往精華、合作形式</li>
                <li>固定每月 2 次「可品牌置入」橋段（不突兀）</li>
                <li>把精華剪輯做成「商業案例庫」</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function PlanPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {MOCK.phases.map((p) => (
        <Card key={p.title}>
          <CardHeader title={p.title} subtitle={p.goal} />
          <CardBody className="space-y-4">
            <div className="rounded-2xl bg-[#F5F5F7] p-5">
              <div className="text-xs font-semibold text-[#6E6E73]">行動</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#1D1D1F]">
                {p.bullets.map((b, idx) => <li key={idx}>{b}</li>)}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="text-xs font-semibold text-[#6E6E73]">KPI</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.kpi.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-[#F5F5F7] px-3 py-1 text-xs text-[#1D1D1F]"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}

      <Card className="xl:col-span-3">
        <CardHeader title="本週作戰排程（建議）" subtitle="把抽象戰略變成日程與產線" />
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <ScheduleDay day="Mon" title="剪輯產線" items={["挑片段", "列出3個鉤子", "出1支短剪"]} />
          <ScheduleDay day="Wed" title="直播爆點" items={["挑戰/賭注", "里程碑儀式", "觀眾投票"]} />
          <ScheduleDay day="Fri" title="合作推進" items={["聯絡2位", "對齊主題", "定下時間"]} />
          <ScheduleDay day="Sun" title="戰情回顧" items={["ACV/留存", "剪輯成效", "下週調整"]} />
        </CardBody>
      </Card>
    </div>
  );
}

// ---------- small components ----------
function Bar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-[#6E6E73]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-[#E5E5EA]">
        <div className="h-2 rounded-full" style={{ width: `${clamp(value, 0, 100)}%`, background: APPLE.text, opacity: 0.72 }} />
      </div>
    </div>
  );
}

function AdviceBox({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl bg-[#F5F5F7] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-2 text-sm text-[#6E6E73]">{text}</div>
    </div>
  );
}

function RiskCard({ icon: Icon, title, bullets }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]">
        <Icon className="h-4 w-4 text-[#6E6E73]" />
        {title}
      </div>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#1D1D1F]">
        {bullets.map((b, idx) => <li key={idx}>{b}</li>)}
      </ul>
    </div>
  );
}

function ScheduleDay({ day, title, items }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#1D1D1F]">{day}</div>
        <div className="text-xs text-[#6E6E73]">{title}</div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-[#1D1D1F]">
        {items.map((it, idx) => (
          <li key={idx} className="rounded-xl bg-[#F5F5F7] px-3 py-2">{it}</li>
        ))}
      </ul>
    </div>
  );
}
