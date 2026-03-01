"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
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
import { motion, AnimatePresence } from "framer-motion";
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

// ---------- helpers ----------
const formatK = (n) => {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ---------- chart colors ----------
const PIE_COLORS_TRAFFIC = ["#1a1a1a", "#555555", "#aaaaaa"];
const PIE_COLORS_MONETIZE = ["#1a1a1a", "#444444", "#888888", "#bbbbbb"];
const SCATTER_COLORS = { 主力遊戲: "#1a1a1a", 聊天互動: "#555555", 企劃活動: "#888888", 精華剪輯: "#bbbbbb" };

// ---------- mock data ----------
const ALL_TREND = Array.from({ length: 90 }).map((_, i) => ({
  day: i + 1,
  acv: Math.round((260 + i * 1.2) + Math.round(35 * Math.sin(i / 4))),
  followers: 40 + Math.round(8 * Math.sin(i / 3) + i * 0.2),
  clips: Math.max(0, Math.round(6 + 2 * Math.sin(i / 2))),
}));
const RANGE_MAP = { "7d": 7, "30d": 30, "90d": 90 };

const MOCK = {
  channel: { name: "nayabnb", platform: "Twitch", stage: "成長期中段", core: "陪伴型互動＋主力遊戲", oneLiner: "目前不是流量問題，而是成長結構尚未爆發。" },
  kpis: {
    subGrowthRate: { value: 0.18, label: "訂閱成長率", unit: "MoM" },
    avgConcurrent: { value: 315, label: "歷史平均觀看", unit: "ACV" }, // 預設值
    retentionProxy: { value: 0.56, label: "黏著指標", unit: "Proxy" },
    chatEngagement: { value: 0.62, label: "互動率", unit: "Index" },
    monetization: { value: 0.48, label: "變現效率", unit: "Index", warning: "過度依賴單一來源" },
  },
  traffic: [{ name: "既有粉絲回流", value: 52 }, { name: "平台推薦", value: 33 }, { name: "外部導流", value: 15 }],
  contentMix: [
    { type: "主力遊戲", share: 46, stability: 80, growth: 58 },
    { type: "聊天互動", share: 34, stability: 78, growth: 36 },
    { type: "企劃活動", share: 12, stability: 42, growth: 84 },
    { type: "精華剪輯", share: 8, stability: 35, growth: 76 },
  ],
  contentMatrix: [
    { name: "主力遊戲", x: 58, y: 80, z: 46 }, { name: "聊天互動", x: 36, y: 78, z: 34 },
    { name: "企劃活動", x: 84, y: 42, z: 12 }, { name: "精華剪輯", x: 76, y: 35, z: 8 },
  ],
  risks: [
    { subject: "內容疲乏", A: 68 }, { subject: "平台依賴", A: 62 }, { subject: "情緒消耗", A: 73 },
    { subject: "競爭模仿", A: 55 }, { subject: "成長天花板", A: 70 },
  ],
  monetization: [{ name: "訂閱", value: 55 }, { name: "打賞", value: 22 }, { name: "廣告", value: 13 }, { name: "贊助/合作", value: 10 }],
  phases: [
    { title: "Phase 1｜穩定基本盤", goal: "提高新觀眾滲透率＋留存", bullets: ["固定主力內容", "每週至少 2 支精華", "開場 60 秒鉤子模板"], kpi: ["留存 +5%", "外部導流 +20%"] },
    { title: "Phase 2｜製造爆點", goal: "建立談資與話題事件", bullets: ["月度挑戰企劃", "設計可剪輯橋段", "同量級合作串台"], kpi: ["爆款剪輯 ≥2/月", "新觀眾 +15%"] },
  ],
};

// ---------- UI primitives ----------
function Card({ className = "", children }) {
  return <div className={`rounded-2xl border border-neutral-200/70 bg-white/80 shadow-sm backdrop-blur ${className}`}>{children}</div>;
}
function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-100 p-4">
      <div>
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        {subtitle && <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
function CardBody({ className = "", children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
function Pill({ icon: Icon, label, pulse = false }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/70 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
      {pulse && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
      {Icon && !pulse && <Icon className="h-3.5 w-3.5 text-neutral-500" />}
      <span>{label}</span>
    </div>
  );
}
function MiniStat({ icon: Icon, label, value, sub, warning, pulseHighlight }) {
  return (
    <Card className={`p-4 flex flex-col justify-center transition-all hover:shadow-md ${pulseHighlight ? 'ring-1 ring-red-400/50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-neutral-200/70 bg-neutral-50 p-2 shrink-0">
          <Icon className={`h-5 w-5 ${pulseHighlight ? 'text-red-500' : 'text-neutral-700'}`} />
        </div>
        <div className="flex flex-col">
          <div className="text-xs text-neutral-500 font-medium">{label}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-neutral-900">{value}</span>
            {sub && <span className={`text-xs ${pulseHighlight ? 'text-red-500 font-semibold' : 'text-neutral-400'}`}>{sub}</span>}
          </div>
          {warning && (
            <div className="mt-2 inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200/50">
              <AlertTriangle className="h-3 w-3" /> {warning}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none rounded-xl border border-neutral-200/70 bg-white pl-4 pr-10 py-2 text-sm font-medium text-neutral-700 shadow-sm outline-none transition-colors hover:bg-neutral-50 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 cursor-pointer">
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}
const ScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-neutral-200/70 bg-white p-3 text-xs shadow-lg backdrop-blur">
        <div className="mb-2 font-bold text-neutral-900 border-b border-neutral-100 pb-1">{d.name}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-neutral-500">成長性</span><span className="font-medium text-right text-neutral-900">{d.x}</span>
          <span className="text-neutral-500">穩定度</span><span className="font-medium text-right text-neutral-900">{d.y}</span>
          <span className="text-neutral-500">占比</span><span className="font-medium text-right text-neutral-900">{d.z}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// ---------- main ----------
export default function WarRoomNayabnb() {
  const [range, setRange] = useState("30d");
  const [mode, setMode] = useState("overview");
  
  // 新增：存放 API 抓回來的 Twitch 即時資料
  const [twitchData, setTwitchData] = useState(null);

  useEffect(() => {
    async function fetchTwitch() {
      try {
        const res = await fetch('/api/twitch');
        if (!res.ok) throw new Error('API 回應錯誤');
        const data = await res.json();
        setTwitchData(data);
      } catch (error) {
        console.error("抓取即時資料失敗:", error);
      }
    }
    
    fetchTwitch();
    // 設定每 60 秒自動更新一次
    const interval = setInterval(fetchTwitch, 60000);
    return () => clearInterval(interval);
  }, []);

  const trendData = useMemo(() => ALL_TREND.slice(-(RANGE_MAP[range] ?? 30)), [range]);

  // 動態決定要顯示的「觀看人數」與「副標題」
  const displayViewers = twitchData?.isLive ? twitchData.currentViewers : MOCK.kpis.avgConcurrent.value;
  const viewersLabel = twitchData?.isLive ? "同時觀看人數" : "平均同時觀看";
  const viewersSub = twitchData?.isLive ? "LIVE 當前觀眾" : "ACV";
  const viewersWarning = twitchData && !twitchData.isLive ? "頻道目前離線中" : "";

  const header = (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-3 shadow-sm">
          <LayoutDashboard className="h-6 w-6 text-neutral-900" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
              戰情室｜{MOCK.channel.name}
            </h1>
            <Pill icon={Target} label={`定位：${MOCK.channel.core}`} />
            {/* 如果正在直播，顯示紅點標籤 */}
            {twitchData?.isLive && <Pill pulse label="LIVE 放送中" />}
          </div>
          <div className="text-sm text-neutral-600 font-medium">
            {twitchData?.isLive ? `直播標題：${twitchData.streamTitle}` : MOCK.channel.oneLiner}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={range} onChange={setRange} options={[{ value: "7d", label: "近 7 天" }, { value: "30d", label: "近 30 天" }, { value: "90d", label: "近 90 天" }]} />
        <Select value={mode} onChange={setMode} options={[{ value: "overview", label: "總覽" }, { value: "traffic", label: "流量" }, { value: "content", label: "內容" }, { value: "risks", label: "風險" }, { value: "plan", label: "作戰計畫" }]} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">
        {header}
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MiniStat icon={TrendingUp} label={MOCK.kpis.subGrowthRate.label} value={`${Math.round(MOCK.kpis.subGrowthRate.value * 100)}%`} sub={MOCK.kpis.subGrowthRate.unit} />
          
          {/* 動態更新的觀看人數卡片 */}
          <MiniStat 
            icon={Users} 
            label={viewersLabel} 
            value={formatK(displayViewers)} 
            sub={viewersSub} 
            warning={viewersWarning} 
            pulseHighlight={twitchData?.isLive} 
          />
          
          <MiniStat icon={Activity} label={MOCK.kpis.retentionProxy.label} value={`${Math.round(MOCK.kpis.retentionProxy.value * 100)}%`} sub={MOCK.kpis.retentionProxy.unit} />
          <MiniStat icon={Flame} label={MOCK.kpis.chatEngagement.label} value={`${Math.round(MOCK.kpis.chatEngagement.value * 100)}%`} sub={MOCK.kpis.chatEngagement.unit} />
          <MiniStat icon={Wallet} label={MOCK.kpis.monetization.label} value={`${Math.round(MOCK.kpis.monetization.value * 100)}%`} sub={MOCK.kpis.monetization.unit} warning={MOCK.kpis.monetization.warning} />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {mode === "overview" && <OverviewPanel trendData={trendData} />}
            {mode === "traffic" && <TrafficPanel trendData={trendData} />}
            {mode === "content" && <ContentPanel />}
            {mode === "risks" && <RisksPanel />}
            {mode === "plan" && <PlanPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- panels (與上一版相同) ----------
function OverviewPanel({ trendData }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader title="成長趨勢" subtitle="ACV（平均同時觀看）與追隨成長" right={<div className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-600"><BarChart3 className="h-3.5 w-3.5" />Trend</div>} />
        <CardBody className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line yAxisId="left" type="monotone" dataKey="acv" stroke="#171717" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="ACV" />
              <Line yAxisId="right" type="monotone" dataKey="followers" stroke="#a3a3a3" strokeWidth={2} dot={false} name="新追蹤" />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="指揮官判讀" subtitle="冷靜、可執行的戰情結論" right={<ShieldAlert className="h-4 w-4 text-neutral-500" />} />
        <CardBody className="space-y-4">
          <div className="rounded-xl border border-neutral-200/70 bg-neutral-50 p-4 text-sm text-neutral-800 shadow-inner">
            <div className="font-semibold text-neutral-900 flex items-center gap-2"><Target className="w-4 h-4 text-blue-600" />核心判斷</div>
            <div className="mt-3 leading-relaxed">
              {MOCK.channel.oneLiner}
              <div className="mt-2 text-neutral-600 border-t border-neutral-200/70 pt-2">建議優先順序：<span className="font-medium text-neutral-900">留存 → 外部導流 → 爆點企劃。</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200/70 bg-white p-4">
            <div className="text-xs font-bold tracking-wide text-neutral-500 uppercase">本週優先任務</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-800 marker:text-neutral-400">
              <li>固定直播開場鉤子（60 秒內交代目標＋今天亮點）</li>
              <li>挑 2 段可剪輯橋段：高張力/高情緒/高互動</li>
            </ul>
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
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5' }} />
              <Pie data={MOCK.traffic} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} paddingAngle={2}>
                {MOCK.traffic.map((_, idx) => <Cell key={idx} fill={PIE_COLORS_TRAFFIC[idx % PIE_COLORS_TRAFFIC.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader title="外部導流與剪輯產量" subtitle="把『可被分享』做成固定工序" />
        <CardBody className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5' }} />
              <Area type="monotone" dataKey="clips" stroke="#171717" strokeWidth={2} fill="#171717" fillOpacity={0.05} name="剪輯支數" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card className="xl:col-span-3">
        <CardHeader title="戰情結論" subtitle="如何優化成長結構" />
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-bold text-neutral-900"><Target className="h-5 w-5 text-red-500" /> 問題定義</div><div className="mt-2 text-sm text-neutral-600 leading-relaxed">流量基數足夠，但缺乏高效率轉化結構。</div></div>
          <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-bold text-neutral-900"><Flame className="h-5 w-5 text-orange-500" /> 破局手段</div><div className="mt-2 text-sm text-neutral-600 leading-relaxed">固定每週「可剪輯橋段」產線：賭注、挑戰、懲罰、里程碑儀式。</div></div>
          <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-bold text-neutral-900"><TrendingUp className="h-5 w-5 text-green-500" /> 成功指標</div><div className="mt-2 text-sm text-neutral-600 leading-relaxed">外部導流提升、剪輯帶來新觀眾，ACV 逐步抬升並更穩定。</div></div>
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
        <CardBody className="h-[360px] flex flex-col">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis type="number" dataKey="x" name="成長性" domain={[0, 100]} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} label={{ value: "← 成長性 →", position: "insideBottom", offset: -10, fontSize: 12, fill: '#737373' }} />
              <YAxis type="number" dataKey="y" name="穩定度" domain={[0, 100]} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} label={{ value: "穩定度", angle: -90, position: "insideLeft", fontSize: 12, fill: '#737373' }} />
              <ZAxis type="number" dataKey="z" range={[100, 400]} name="占比" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
              {MOCK.contentMatrix.map((d) => <Scatter key={d.name} name={d.name} data={[d]} fill={SCATTER_COLORS[d.name] ?? "#555555"} fillOpacity={0.8} />)}
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-4 px-4 justify-center">
            {MOCK.contentMatrix.map((d) => <div key={d.name} className="flex items-center gap-2 text-xs font-medium text-neutral-700"><div className="h-3 w-3 rounded-full shadow-inner" style={{ background: SCATTER_COLORS[d.name] }} />{d.name}</div>)}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="內容結構占比" subtitle="把『企劃/剪輯』拉高，做成成長引擎" />
        <CardBody className="space-y-4">
          {MOCK.contentMix.map((c) => (
            <div key={c.type} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100/50">
              <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-neutral-900">{c.type}</div><div className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">{c.share}%</div></div>
              <div className="space-y-3"><Bar label="穩定度" value={c.stability} color="bg-neutral-800" /><Bar label="成長性" value={c.growth} color="bg-neutral-400" /></div>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card className="xl:col-span-3">
        <CardHeader title="內容調整建議" subtitle="留存 → 外部導流 → 爆點企劃" />
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AdviceBox icon={Target} title="守住基本盤" text="主力內容保持可預測節奏：固定時段、固定主題，降低觀眾認知成本。" />
          <AdviceBox icon={Flame} title="加上可剪輯橋段" text="每場直播安排 2–3 個『可被截短』的高張力節點：賭注、倒數、挑戰、懲罰。" />
          <AdviceBox icon={Crown} title="把梗做成IP" text="固定口頭禪/儀式/音效與視覺符號，讓新觀眾一眼記得你。" />
        </CardBody>
      </Card>
    </div>
  );
}

function RisksPanel() {
  const riskScore = useMemo(() => Math.round(MOCK.risks.reduce((acc, r) => acc + r.A, 0) / MOCK.risks.length), []);
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader title="風險雷達" subtitle={`整體風險指數：${riskScore}/100`} />
        <CardBody className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={MOCK.risks} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e5e5e5" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#525252' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5' }} />
              <Radar dataKey="A" stroke="#171717" fill="#171717" strokeWidth={2} fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader title="風險處置清單" subtitle="用作戰手冊把風險變成流程" right={<AlertTriangle className="h-4 w-4 text-neutral-500" />} />
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RiskCard icon={AlertTriangle} title="內容疲乏" bullets={["每週新增 1 個小規則（賭注/挑戰）", "每月固定 1 次大企劃", "回顧最強片段，複用其結構"]} />
          <RiskCard icon={ShieldAlert} title="平台依賴" bullets={["剪輯短影片固定上架節奏", "社群貼文導流到直播", "建立 email/Discord 回流通道"]} />
          <RiskCard icon={Flame} title="情緒消耗" bullets={["設計低能耗節目：聊天/Q&A", "工作週期化（休息日固定）", "重大企劃前後留緩衝"]} />
          <RiskCard icon={TrendingUp} title="成長天花板" bullets={["提升新觀眾占比：合作 + 剪輯", "把『梗』變成IP辨識", "分層內容：核心盤 + 爆款引流"]} />
        </CardBody>
      </Card>
      <Card className="xl:col-span-3">
        <CardHeader title="變現結構分析" subtitle="檢查是否單一收入過度集中" right={<Wallet className="h-4 w-4 text-neutral-500" />} />
        <CardBody className="grid grid-cols-1 gap-6 md:grid-cols-2 items-center">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5' }} />
                <Pie data={MOCK.monetization} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} paddingAngle={2}>
                  {MOCK.monetization.map((_, idx) => <Cell key={idx} fill={PIE_COLORS_MONETIZE[idx % PIE_COLORS_MONETIZE.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200/70 bg-neutral-50 p-5 text-sm shadow-inner">
              <div className="font-bold text-neutral-900 flex items-center gap-2"><Activity className="w-4 h-4" /> 策略判讀</div>
              <div className="mt-3 leading-relaxed text-neutral-700">若「訂閱」佔比長期 &gt; 60%，頻道成長會被核心粉絲數量限制。<div className="mt-2 text-neutral-900 font-medium">目標：把贊助/合作占比提升至 20% 以上，降低單一來源風險。</div></div>
            </div>
            <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold tracking-wide text-neutral-500 uppercase">下一步（可立即執行）</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-800 marker:text-neutral-400">
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
        <Card key={p.title} className="flex flex-col">
          <CardHeader title={p.title} subtitle={p.goal} />
          <CardBody className="space-y-4 flex-1 flex flex-col">
            <div className="rounded-xl border border-neutral-200/70 bg-neutral-50 p-4 flex-1">
              <div className="text-xs font-bold tracking-wide text-neutral-500 uppercase">行動目標</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-800 marker:text-neutral-400">
                {p.bullets.map((b, idx) => <li key={idx}>{b}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-200/70 bg-white p-4">
              <div className="text-xs font-bold tracking-wide text-neutral-500 uppercase mb-3">預期 KPI</div>
              <div className="flex flex-wrap gap-2">
                {p.kpi.map((k) => <span key={k} className="rounded-md border border-neutral-200/70 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">{k}</span>)}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
      <Card className="xl:col-span-3">
        <CardHeader title="本週作戰排程（建議）" subtitle="把抽象戰略變成日程與產線" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
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
function Bar({ label, value, color = "bg-neutral-800" }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-neutral-600 mb-1.5"><span>{label}</span><span>{value}</span></div>
      <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden"><div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${clamp(value, 0, 100)}%` }} /></div>
    </div>
  );
}
function AdviceBox({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 text-sm font-bold text-neutral-900"><div className="p-1.5 bg-neutral-100 rounded-lg"><Icon className="h-4 w-4 text-neutral-700" /></div>{title}</div>
      <div className="mt-3 text-sm text-neutral-600 leading-relaxed">{text}</div>
    </div>
  );
}
function RiskCard({ icon: Icon, title, bullets }) {
  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-bold text-neutral-900"><Icon className="h-4 w-4 text-neutral-600" />{title}</div>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 marker:text-neutral-400">{bullets.map((b, idx) => <li key={idx}>{b}</li>)}</ul>
    </div>
  );
}
function ScheduleDay({ day, title, items }) {
  return (
    <div className="rounded-xl border border-neutral-200/70 bg-neutral-50 p-4">
      <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2"><div className="text-sm font-black tracking-wider text-neutral-900 uppercase">{day}</div><div className="text-xs font-medium text-neutral-500">{title}</div></div>
      <ul className="space-y-2 text-sm text-neutral-700">{items.map((it, idx) => <li key={idx} className="rounded-lg border border-neutral-100 bg-white px-3 py-2 shadow-sm flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-neutral-300 before:rounded-full before:mr-2">{it}</li>)}</ul>
    </div>
  );
}
