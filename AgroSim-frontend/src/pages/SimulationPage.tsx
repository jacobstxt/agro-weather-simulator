import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetRegionQuery } from '../features/regions/regionsApi';
import { useGetSimulationQuery, weatherApi } from '../features/weather/weatherApi';
import { useDispatch } from 'react-redux';
import { SimulationList } from '../components/SimulationList';
import { SimulationChart } from '../components/SimulationChart';
import { RunSimulationModal } from '../components/RunSimulationModal';
import type { SimulationListItem, SimulationResult } from '../types';

export function SimulationPage() {
    const [searchParams] = useSearchParams();
    const regionId = Number(searchParams.get('region'));

    const [selectedSim, setSelectedSim] = useState<SimulationListItem | null>(null);
    const [freshResult, setFreshResult] = useState<SimulationResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch = useDispatch();

    // Завантажуємо інфо про регіон для заголовка
    const { data: region } = useGetRegionQuery(regionId, { skip: !regionId });

    // Завантажуємо повні дані симуляції коли обрано зі списку
    const { data: loadedSim, isFetching: isLoadingSim } = useGetSimulationQuery(selectedSim?.id!, {
        skip: selectedSim === null,
    });

    // Показуємо або щойно завершену симуляцію, або завантажену зі списку
    const displayedSim = freshResult ?? loadedSim ?? null;

    const handleSimDone = (result: SimulationResult) => {
        setFreshResult(result);
        setSelectedSim(null);
        // Інвалідуємо кеш списку — SimulationList автоматично перезавантажить дані
        dispatch(weatherApi.util.invalidateTags(['Simulation']));
    };

    // Якщо не передано region у URL — просимо вибрати
    if (!regionId) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-gray-300 text-lg">Регіон не обрано</p>
                <p className="text-gray-500 text-sm mt-2">
                    Перейди на <a href="/" className="text-emerald-400 hover:underline">Dashboard</a> і натисни "Simulate" на потрібному полі
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Simulation</h1>
                    {region && (
                        <p className="text-gray-400 mt-1 text-sm">
                            {region.name} · {region.soil_type} · {region.area_ha} га
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition"
                >
                    + Нова симуляція
                </button>
            </div>

            {/* Основний layout: список ліворуч, графік праворуч */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* Список симуляцій */}
                <div>
                    <h2 className="text-xs font-semibold tracking-widest text-gray-400 mb-3">
                        ПОПЕРЕДНІ СИМУЛЯЦІЇ
                    </h2>
                    <SimulationList
                        regionId={regionId}
                        selectedId={selectedSim?.id ?? null}
                        onSelect={(sim) => {
                            setSelectedSim(sim);
                            setFreshResult(null);
                        }}
                    />
                </div>

                {/* Графік */}
                <div>
                    {isLoadingSim && (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
                        </div>
                    )}

                    {!isLoadingSim && displayedSim && (
                        <SimulationChart simulation={displayedSim} />
                    )}

                    {!isLoadingSim && !displayedSim && (
                        <div className="flex flex-col items-center justify-center h-64 bg-neutral-800/30 border-2 border-dashed border-neutral-700 rounded-2xl">
                            <p className="text-gray-400">Оберіть симуляцію зі списку</p>
                            <p className="text-gray-500 text-sm mt-1">або запусти нову</p>
                        </div>
                    )}
                </div>
            </div>

            <RunSimulationModal
                regionId={regionId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDone={handleSimDone}
            />
        </div>
    );
}