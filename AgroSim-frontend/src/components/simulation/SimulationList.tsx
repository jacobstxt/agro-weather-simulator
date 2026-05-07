import { useGetRegionSimulationsQuery } from '../../features/weather/weatherApi';
import type { SimulationListItem } from '../../types';

interface SimulationListProps {
    regionId: number;
    selectedId: number | null;
    onSelect: (simulation: SimulationListItem) => void;
}

export function SimulationList({ regionId, selectedId, onSelect }: SimulationListProps) {
    const { data, isLoading, error } = useGetRegionSimulationsQuery({ regionId });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                Помилка завантаження симуляцій
            </div>
        );
    }

    if (!data || data.simulations.length === 0) {
        return (
            <div className="bg-neutral-800/30 border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">Симуляцій ще немає</p>
                <p className="text-gray-500 text-xs mt-1">Натисніть "Нова симуляція" щоб запустити першу</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {data.simulations.map((sim) => (
                <button
                    key={sim.id}
                    onClick={() => onSelect(sim)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                        selectedId === sim.id
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                            : 'bg-neutral-800/50 border-neutral-700/50 text-gray-300 hover:border-neutral-600'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Симуляція #{sim.id}</span>
                        <span className="text-xs text-gray-500">{sim.days} днів</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(sim.created_at).toLocaleString('uk-UA')}
                    </div>
                </button>
            ))}
        </div>
    );
}