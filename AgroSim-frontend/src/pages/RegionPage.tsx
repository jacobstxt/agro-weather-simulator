import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Ruler, MapPin, Plus } from 'lucide-react';
import { useGetRegionQuery } from '../features/regions/regionsApi';
import { useGetSimulationQuery, weatherApi } from '../features/weather/weatherApi';
import { useDispatch } from 'react-redux';
import { SimulationList } from '../components/SimulationList';
import { SimulationChart } from '../components/SimulationChart';
import { RunSimulationModal } from '../components/RunSimulationModal';
import type { SimulationListItem, SimulationResult } from '../types';

type Tab = 'simulations' | 'weather' | 'alerts';

export function RegionPage() {
    const { id } = useParams<{ id: string }>();
    const regionId = Number(id);

    const [activeTab, setActiveTab] = useState<Tab>('simulations');
    const [selectedSim, setSelectedSim] = useState<SimulationListItem | null>(null);
    const [freshResult, setFreshResult] = useState<SimulationResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch = useDispatch();

    const { data: region, isLoading: isLoadingRegion, error: regionError } = useGetRegionQuery(regionId);

    const { data: loadedSim, isFetching: isLoadingSim } = useGetSimulationQuery(selectedSim?.id!, {
        skip: selectedSim === null,
    });

    const displayedSim = freshResult ?? loadedSim ?? null;

    const handleSimDone = (result: SimulationResult) => {
        setFreshResult(result);
        setSelectedSim(null);
        dispatch(weatherApi.util.invalidateTags(['Simulation']));
    };

    if (isLoadingRegion) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    if (regionError || !region) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-gray-300 text-lg">Поле не знайдено</p>
                <Link to="/" className="inline-flex items-center gap-1 text-emerald-400 hover:underline text-sm mt-2">
                    <ArrowLeft size={15} />Повернутись на Dashboard
                </Link>
            </div>
        );
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'simulations', label: 'Симуляції' },
        { key: 'weather', label: 'Погодні дані' },
        { key: 'alerts', label: 'Алерти' },
    ];

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition">
                <ArrowLeft size={15} /> Dashboard
            </Link>

            {/* Картка регіону */}
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{region.name}</h1>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><Leaf size={14} />{region.soil_type}</span>
                            <span className="flex items-center gap-1.5"><Ruler size={14} />{region.area_ha} га</span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} />{region.latitude.toFixed(4)}°N, {region.longitude.toFixed(4)}°E</span>
                        </div>
                    </div>
                    {activeTab === 'simulations' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition flex-shrink-0"
                        >
                            <Plus size={16} />Нова симуляція
                        </button>
                    )}
                </div>
            </div>

            {/* Таби */}
            <div className="flex gap-1 bg-neutral-800/50 rounded-xl p-1 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                            activeTab === tab.key
                                ? 'bg-neutral-700 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Вміст табів */}
            {activeTab === 'simulations' && (
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
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
            )}

            {activeTab === 'weather' && (
                <div className="flex flex-col items-center justify-center py-20 bg-neutral-800/30 border-2 border-dashed border-neutral-700 rounded-2xl">
                    <p className="text-gray-400">Погодні дані</p>
                    <p className="text-gray-500 text-sm mt-1">Буде реалізовано незабаром</p>
                </div>
            )}

            {activeTab === 'alerts' && (
                <div className="flex flex-col items-center justify-center py-20 bg-neutral-800/30 border-2 border-dashed border-neutral-700 rounded-2xl">
                    <p className="text-gray-400">Алерти</p>
                    <p className="text-gray-500 text-sm mt-1">Буде реалізовано незабаром</p>
                </div>
            )}

            <RunSimulationModal
                regionId={regionId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDone={handleSimDone}
            />
        </div>
    );
}
