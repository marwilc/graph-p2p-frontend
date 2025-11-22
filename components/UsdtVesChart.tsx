"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useP2PPriceContext } from '@/app/contexts/P2PPriceContext';

export function UsdtVesChart() {
  const { dailyPrices, loading, error } = useP2PPriceContext();

  if (loading && dailyPrices.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-zinc-400">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (dailyPrices.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-zinc-400">No hay datos disponibles aún</div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={dailyPrices}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="date" 
            stroke="#a1a1aa"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
          />
          <YAxis 
            stroke="#a1a1aa"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            label={{ value: '1 USDT = X VES', angle: -90, position: 'insideLeft', fill: '#a1a1aa' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgb(24, 24, 27)',
              border: '1px solid rgb(39, 39, 42)',
              borderRadius: '8px',
              color: '#e4e4e7',
            }}
            formatter={(value: number) => [`1 USDT = ${value.toFixed(2)} VES`, 'Precio']}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#60a5fa" 
            strokeWidth={3}
            dot={{ fill: '#60a5fa', r: 5 }}
            activeDot={{ r: 8, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
