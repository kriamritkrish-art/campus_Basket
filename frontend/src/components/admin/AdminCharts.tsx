'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface RevenueTrendProps {
  data: Array<{
    date: string;
    revenue: number;
    orders?: number;
    aov?: number;
    cumulativeRevenue?: number;
    food?: number;
    fruits?: number;
    laundry?: number;
    essentials?: number;
  }>;
  metric?: 'revenue' | 'orders' | 'cumulative';
}

export function RevenueTrendChart({ data, metric = 'revenue' }: RevenueTrendProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
        No sales revenue records found in this date range.
      </div>
    );
  }

  const formattedData = data.map((d) => {
    let displayDate = d.date;
    if (d.date && d.date.includes('-')) {
      const parts = d.date.split('-');
      displayDate = `${parts[2] || ''}/${parts[1] || ''}`;
      if (!parts[2]) displayDate = parts.slice(1).join('/');
    }
    return {
      ...d,
      displayDate
    };
  });

  const dataKey = metric === 'orders' ? 'orders' : metric === 'cumulative' ? 'cumulativeRevenue' : 'revenue';
  const strokeColor = metric === 'orders' ? '#2563EB' : metric === 'cumulative' ? '#7C3AED' : '#4F9D32';
  const gradId = `grad_${metric}`;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.28} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
          <XAxis dataKey="displayDate" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => (metric === 'orders' ? `${v}` : `₹${v}`)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#17202A',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
            }}
            formatter={(value: any) => [
              metric === 'orders' ? `${value} Orders` : `₹${Number(value).toLocaleString('en-IN')}`,
              metric === 'orders' ? 'Volume' : metric === 'cumulative' ? 'Cumulative GMV' : 'Daily Gross'
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Service Multi-Trend Stacked Area Chart (Food, Fruits, Laundry, Essentials)
 */
export function ServiceTrendChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
        No service breakdown records available.
      </div>
    );
  }

  const formatted = data.map((d) => {
    let displayDate = d.date;
    if (d.date && d.date.includes('-')) {
      const parts = d.date.split('-');
      displayDate = `${parts[2] || ''}/${parts[1] || ''}`;
      if (!parts[2]) displayDate = parts.slice(1).join('/');
    }
    return { ...d, displayDate };
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
          <XAxis dataKey="displayDate" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#17202A',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
            }}
            formatter={(value: any, name: any) => [
              `₹${Number(value).toLocaleString('en-IN')}`,
              String(name || '').charAt(0).toUpperCase() + String(name || '').slice(1)
            ]}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span className="text-xs font-semibold text-slate-600 capitalize">{value}</span>}
          />
          <Area type="monotone" dataKey="food" stackId="1" stroke="#4F9D32" fill="#4F9D32" fillOpacity={0.6} />
          <Area type="monotone" dataKey="fruits" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
          <Area type="monotone" dataKey="essentials" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.6} />
          <Area type="monotone" dataKey="laundry" stackId="1" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 24-Hour Campus Purchasing Velocity (Peak Hours)
 */
export function HourlyVelocityChart({ data }: { data: Array<{ hour: string; label: string; orders: number; revenue: number }> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 w-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
        No hourly velocity logs found.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
          <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#17202A',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
            }}
            formatter={(val: any, name: any) => [
              name === 'orders' ? `${val} Orders` : `₹${Number(val).toLocaleString('en-IN')}`,
              name === 'orders' ? 'Order Volume' : 'Revenue'
            ]}
          />
          <Bar dataKey="orders" fill="#2563EB" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CategoryBarProps {
  data: Array<{ name: string; revenue: number; orders: number }>;
  onSelectCategory?: (categoryName: string) => void;
}

const CATEGORY_COLORS = ['#4F9D32', '#2563EB', '#F59E0B', '#7C3AED', '#DC2626'];

export function CategoryBarChart({ data, onSelectCategory }: CategoryBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
        No category performance data found.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
          <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#17202A',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
          />
          <Bar
            dataKey="revenue"
            radius={[6, 6, 0, 0]}
            onClick={(entry: any) => {
              if (onSelectCategory && entry?.name) {
                onSelectCategory(String(entry.name));
              }
            }}
            cursor="pointer"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DistributionPieProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
}

export function DistributionPieChart({
  data,
  colors = ['#4F9D32', '#2563EB', '#F59E0B', '#7C3AED', '#DC2626', '#64748B']
}: DistributionPieProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-56 w-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />;
  }

  const filtered = data.filter((d) => d.value > 0);

  if (filtered.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-medium">
        No distribution metrics to display.
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            innerRadius={45}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {filtered.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '10px',
              fontSize: '11px',
              color: '#17202A',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-[11px] text-slate-600 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HallDistributionProps {
  data: Array<{ hallName: string; revenue: number; orders: number }>;
}

export function HallDistributionChart({ data }: HallDistributionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 w-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
        No residence hall distribution data available.
      </div>
    );
  }

  const topHalls = data.slice(0, 6);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={topHalls}
          margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
          <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => `₹${v}`} />
          <YAxis type="category" dataKey="hallName" stroke="#64748B" fontSize={11} width={90} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#17202A',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#2563EB" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
