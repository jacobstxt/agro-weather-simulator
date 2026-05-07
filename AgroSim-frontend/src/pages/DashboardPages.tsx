import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useGetRegionsQuery } from '../features/regions/regionsApi';
import { useGetSimulationCountQuery } from '../features/weather/weatherApi';


const mockStats = {
    alerts: 2,
    avgMoisture: 47,
};

const mockAlerts = [
    {
        id: 1,
        severity: 'critical' as const,
        message: 'Поле Тернопіль — ґрунт висихає занадто швидко (-8.2 мм/день). Потрібне зрошення.',
    },
    {
        id: 2,
        severity: 'warning' as const,
        message: 'Поле Рівне — швидкість висихання наближається до порогу (-1.8 мм/день). Спостерігати.',
    },
];

export function DashboardPage() {
    const { data, isLoading, error } = useGetRegionsQuery({});
    const { data: simCount } = useGetSimulationCountQuery();

    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold">Головна</h1>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Поля" value={data?.total ?? 0} />
                <StatCard label="Симуляції" value={simCount?.total ?? '—'} />
                <StatCard label="Алерти" value={mockStats.alerts} valueClass="text-red-400" />
                <StatCard label="Сер. вологість" value={`${mockStats.avgMoisture} мм`} />
            </div>


            <section>
                <h2 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">
                    ВАШІ ПОЛЯ
                </h2>

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                        Помилка завантаження даних
                    </div>
                )}

                {data && data.regions.length === 0 && (
                    <div className="bg-neutral-800/30 border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center">
                        <p className="text-gray-300 text-lg">У вас ще немає полів</p>
                        <p className="text-gray-500 text-sm mt-1">Натисніть "Додати поле" щоб створити перше</p>
                    </div>
                )}

                {data && data.regions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.regions.map((region) => (
                            <Link
                                key={region.id}
                                to={`/regions/${region.id}`}
                                className="group flex flex-col bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-neutral-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/20"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="text-lg font-semibold">{region.name}</h3>
                                    <ArrowUpRight
                                        size={18}
                                        className="text-gray-600 group-hover:text-emerald-400 transition-colors duration-200 shrink-0 mt-0.5"
                                    />
                                </div>
                                <p className="text-sm text-gray-400 mb-4">
                                    {region.soil_type} · {region.area_ha} га · {region.latitude.toFixed(1)}°N
                                </p>
                                <div>
                                    <StatusBadge status="normal" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>


            <section>
                <h2 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">
                    АКТИВНІ АЛЕРТИ
                </h2>
                <div className="space-y-3">
                    {mockAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
                                alert.severity === 'critical'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-amber-500/10 border-amber-500/30'
                            }`}
                        >
              <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  }`}
              />
                            <p className="text-sm text-gray-200">{alert.message}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}



type FieldStatus = 'normal' | 'needs-water' | 'watch';

function StatusBadge({ status }: { status: FieldStatus }) {
    const styles = {
        normal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        'needs-water': 'bg-red-500/15 text-red-400 border-red-500/30',
        watch: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };

    const labels = {
        normal: 'Норма',
        'needs-water': 'Потрібна вода',
        watch: 'Спостереження',
    };

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
    );
}

function StatCard({
                      label,
                      value,
                      valueClass = '',
                  }: {
    label: string;
    value: string | number;
    valueClass?: string;
}) {
    return (
        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-2">{label}</p>
            <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
        </div>
    );
}