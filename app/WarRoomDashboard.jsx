"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
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
} from "recharts";

/* ---------------- helpers ---------------- */

const formatK = (n) => {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------------- 模擬數據 ---------------- */

const ALL_TREND = Array.from({ length: 90 }).map((_, i) => {
  const base = 250 + i * 1.4;
  const wave = Math.sin(i / 4) * 40;

  return {
    day: i + 1,
    acv: Math.round(base + wave),
    followers: Math.round(40 + i * 0.4 + Math.sin(i / 3) * 6),
    streams: Math.round(3 + Math.sin(i / 6) * 2),
  };
});

const RANGE_MAP = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/* ---------------- KPI ---------------- */

const BASE_KPI = {
  avgConcurrent: 315,
  retention: 0.56,
  chatRate: 0.62,
  monetization: 0.48,
};

/* ---------------- component ---------------- */

export default function WarRoomDashboard() {
  const [range, setRange] = useState("30d");
  const [channels, setChannels] = useState(["nayabnb", "wsx70529"]);
  const [trend, setTrend] = useState([]);

  /* ---------------- data slice ---------------- */

  const rangeTrend = useMemo(() => {
    const len = RANGE_MAP[range];
    return ALL_TREND.slice(-len);
  }, [range]);

  /* ---------------- 成長率計算 ---------------- */

  const growth = useMemo(() => {
    const last30 = ALL_TREND.slice(-30);
    const prev30 = ALL_TREND.slice(-60, -30);

    const avg = (arr) => arr.reduce((a, b) => a + b.acv, 0) / arr.length;

    const g = ((avg(last30) - avg(prev30)) / avg(prev30)) * 100;

    return g.toFixed(1);
  }, []);

  /* ---------------- 異常偵測 ---------------- */

  const anomaly = useMemo(() => {
    const last = ALL_TREND.slice(-7);

    const avg =
      last.reduce((sum, d) => sum + d.streams, 0) / last.length;

    if (avg < 2) return "直播密度過低";
    if (avg > 6) return "直播密度過高";

    return "正常";
  }, []);

  /* ---------------- 自動刷新 ---------------- */

  useEffect(() => {
    setTrend(rangeTrend);

    const timer = setInterval(() => {
      setTrend(rangeTrend);
    }, 30000);

    return () => clearInterval(timer);
  }, [rangeTrend]);

  /* ---------------- traffic pie ---------------- */

  const traffic = [
    { name: "Twitch", value: 68 },
    { name: "Clips", value: 20 },
    { name: "社群", value: 12 },
  ];

  const PIE = ["#222", "#555", "#aaa"];

  return (
    <div className="p-6 space-y-6">

      {/* header */}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex gap-2 items-center">
          <LayoutDashboard /> WarRoom
        </h1>

        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1 border rounded"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}

      <div className="grid grid-cols-4 gap-4">

        <Card icon={<Users />} title="平均觀看">
          {formatK(BASE_KPI.avgConcurrent)}
        </Card>

        <Card icon={<Activity />} title="黏著度">
          {(BASE_KPI.retention * 100).toFixed(0)}%
        </Card>

        <Card icon={<TrendingUp />} title="30日成長">
          {growth}%
        </Card>

        <Card icon={<Crown />} title="變現效率">
          {(BASE_KPI.monetization * 100).toFixed(0)}%
        </Card>

      </div>

      {/* trend chart */}

      <div className="h-80 border rounded p-4">

        <h2 className="mb-2 flex gap-2 items-center">
          <BarChart3 size={18} />
          觀看趨勢
        </h2>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="acv"
              stroke="#888"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

      {/* traffic */}

      <div className="grid grid-cols-2 gap-6">

        <div className="border p-4 rounded">

          <h2 className="flex gap-2 items-center mb-2">
            <Target size={18} />
            流量來源
          </h2>

          <ResponsiveContainer height={250}>
            <PieChart>

              <Pie
                data={traffic}
                dataKey="value"
                outerRadius={90}
              >
                {traffic.map((_, i) => (
                  <Cell key={i} fill={PIE[i]} />
                ))}
              </Pie>

            </PieChart>
          </ResponsiveContainer>

        </div>

        {/* anomaly */}

        <div className="border p-4 rounded">

          <h2 className="flex gap-2 items-center mb-2">
            <ShieldAlert size={18} />
            AI 異常監測
          </h2>

          <div className="text-lg flex gap-2 items-center">

            {anomaly === "正常" ? (
              <>
                <Activity size={18} /> 正常
              </>
            ) : (
              <>
                <AlertTriangle size={18} /> {anomaly}
              </>
            )}

          </div>

        </div>

      </div>

      {/* 多頻道 */}

      <div className="border p-4 rounded">

        <h2 className="flex gap-2 items-center mb-3">
          <Users size={18} />
          多頻道監控
        </h2>

        <div className="grid grid-cols-3 gap-4">

          {channels.map((c) => (
            <div
              key={c}
              className="border rounded p-3"
            >
              <div className="font-semibold">{c}</div>
              <div className="text-sm text-gray-500">
                直播狀態監控
              </div>
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}

/* ---------------- card component ---------------- */

function Card({ icon, title, children }) {
  return (
    <div className="border rounded p-4 flex flex-col gap-2">

      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {title}
      </div>

      <div className="text-2xl font-bold">
        {children}
      </div>

    </div>
  );
}
