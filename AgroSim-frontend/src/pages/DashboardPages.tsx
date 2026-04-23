import { Link } from 'react-router-dom';
import { useGetRegionsQuery } from '../features/regions/regionsApi';

// Тимчасові моки — тільки для алертів і симуляцій (бекенд ще не має /stats)
const mockStats = {
    simulations: 12,
    alerts: 2,
    avgMoisture: 47,
};

const mockAlerts = [
    {
        id: 1,
        severity: 'critical' as const,
        message: 'Поле Тернопіль — soil drying too fast (-8.2 mm/day). Irrigation needed.',
    },
    {
        id: 2,
        severity: 'warning' as const,
        message: 'Поле Рівне — drying rate approaching threshold (-1.8 mm/day). Monitor.',
    },
];

export function DashboardPage() {
    const { data, isLoading, error } = useGetRegionsQuery({});

    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Regions" value={data?.total ?? 0} />
                <StatCard label="Simulations" value={mockStats.simulations} />
                <StatCard label="Alerts" value={mockStats.alerts} valueClass="text-red-400" />
                <StatCard label="Avg moisture" value={`${mockStats.avgMoisture}mm`} />
            </div>

            {/* YOUR FIELDS */}
            <section>
                <h2 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">
                    YOUR FIELDS
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
                        <p className="text-gray-500 text-sm mt-1">Натисніть "+ Add region" щоб створити перше</p>
                    </div>
                )}

                {data && data.regions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.regions.map((region) => (
                            <div
                                key={region.id}
                                className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-5 hover:border-neutral-600 transition"
                            >
                                <h3 className="text-lg font-semibold mb-1">{region.name}</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {region.soil_type} · {region.area_ha} га · {region.latitude.toFixed(1)}°N
                                </p>
                                <div className="mb-4">
                                    <StatusBadge status="normal" />
                                </div>
                                <Link
                                    to={`/simulation?region=${region.id}`}
                                    className="inline-block px-4 py-2 border border-neutral-600 rounded-lg text-sm hover:bg-white/5 transition"
                                >
                                    Simulate
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ACTIVE ALERTS */}
            <section>
                <h2 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">
                    ACTIVE ALERTS
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

// ——— Допоміжні компоненти ———

type FieldStatus = 'normal' | 'needs-water' | 'watch';

function StatusBadge({ status }: { status: FieldStatus }) {
    const styles = {
        normal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        'needs-water': 'bg-red-500/15 text-red-400 border-red-500/30',
        watch: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };

    const labels = {
        normal: 'Normal',
        'needs-water': 'Needs water',
        watch: 'Watch',
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