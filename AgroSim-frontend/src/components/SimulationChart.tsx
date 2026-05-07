import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { SimulationResult } from '../types';

interface SimulationChartProps {
    simulation: SimulationResult;
}

type Tab = 'moisture' | 'temperature';

export function SimulationChart({ simulation }: SimulationChartProps) {
    const [activeTab, setActiveTab] = useState<Tab>('moisture');

    // Recharts потребує масив об'єктів — перетворюємо три окремих масиви в один
    const chartData = simulation.time.map((t, i) => ({
        day: Math.round(t),
        moisture: parseFloat(simulation.moisture[i].toFixed(2)),
        temperature: parseFloat(simulation.temperature[i].toFixed(2)),
    }));

    const tabs: { key: Tab; label: string; unit: string; color: string }[] = [
        { key: 'moisture', label: 'Вологість', unit: 'мм', color: '#10b981' },
        { key: 'temperature', label: 'Температура', unit: '°C', color: '#f59e0b' },
    ];

    const active = tabs.find((t) => t.key === activeTab)!;

    return (
        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-6">
            {/* Заголовок і мета-інфо */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-semibold">Симуляція #{simulation.simulation_id}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(simulation.created_at).toLocaleString('uk-UA')}
                    </p>
                </div>
                <span className="text-sm text-gray-400">{simulation.time.length} точок</span>
            </div>

            {/* Таби */}
            <div className="flex gap-1 mb-6 bg-neutral-900/60 rounded-lg p-1 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                            activeTab === tab.key
                                ? 'bg-neutral-700 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Графік */}
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="day"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'День', position: 'insideBottomRight', offset: -8, fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        label={{ value: active.unit, angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                        formatter={(value) => [`${value} ${active.unit}`, active.label]}
                        labelFormatter={(label) => `День ${label}`}
                    />
                    <Line
                        type="monotone"
                        dataKey={activeTab}
                        stroke={active.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}