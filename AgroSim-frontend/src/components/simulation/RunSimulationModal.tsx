import { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { useRunSimulationMutation, useGetSimulationStatusQuery } from '../../features/weather/weatherApi';
import type { SimulationRequest, SimulationResult } from '../../types';

interface RunSimulationModalProps {
    regionId: number;
    isOpen: boolean;
    onClose: () => void;
    onDone: (result: SimulationResult) => void;
}

const defaultForm: Omit<SimulationRequest, 'region_id'> = {
    days: 30,
    initial_moisture: 50,
    initial_temp: 15,
    daily_rain: 5,
    solar_radiation: 200,
};

export function RunSimulationModal({ regionId, isOpen, onClose, onDone }: RunSimulationModalProps) {
    const [form, setForm] = useState(defaultForm);
    const [taskId, setTaskId] = useState<number | null>(null);
    const [progressStep, setProgressStep] = useState(0);

    const [runSimulation, { isLoading: isStarting }] = useRunSimulationMutation();

    // Polling — запитуємо статус кожну секунду, але тільки якщо є taskId
    const { data: taskStatus } = useGetSimulationStatusQuery(taskId!, {
        skip: taskId === null,
        pollingInterval: 1000,
    });

    const isPolling = taskId !== null;

    // Коли симуляція завершилась — передаємо результат батьківському компоненту
    useEffect(() => {
        if (taskStatus?.status === 'done' && taskStatus.result) {
            onDone({
                simulation_id: taskStatus.result.simulation_id,
                region_id: regionId,
                created_at: new Date().toISOString(),
                time: taskStatus.result.time,
                moisture: taskStatus.result.moisture,
                temperature: taskStatus.result.temperature,
            });
            setTaskId(null);
            onClose();
        }
    }, [taskStatus]);

    // Скидаємо стан при закритті
    useEffect(() => {
        if (!isOpen) {
            setForm(defaultForm);
            setTaskId(null);
        }
    }, [isOpen]);

    // Прогрес — симулюємо відсотки на основі часу (бекенд не повертає прогрес)
    const progressSteps = ['Запуск...', 'Завантаження погодних даних...', 'Виконання симуляції...', 'Збереження результатів...'];

    useEffect(() => {
        if (!isPolling) {
            setProgressStep(0);
            return;
        }
        const interval = setInterval(() => {
            setProgressStep((prev) => Math.min(prev + 1, progressSteps.length - 1));
        }, 1500);
        return () => clearInterval(interval);
    }, [isPolling]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await runSimulation({ ...form, region_id: regionId }).unwrap();
        setTaskId(result.task_id);
    };

    const isError = taskStatus?.status === 'error';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={!isPolling ? onClose : undefined}
        >
            <div
                className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">Нова симуляція</h2>
                    {!isPolling && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="px-6 py-5">
                    {/* Прогрес-бар під час polling */}
                    {isPolling && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-300">{progressSteps[progressStep]}</span>
                                <Loader2 size={14} className="text-emerald-400 animate-spin" />
                            </div>
                            <div className="w-full bg-neutral-800 rounded-full h-2">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                                    style={{ width: `${((progressStep + 1) / progressSteps.length) * 90}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Не закривай вікно — зачекай кілька секунд</p>
                        </div>
                    )}

                    {/* Помилка */}
                    {isError && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                            Помилка симуляції: {taskStatus?.error ?? 'невідома помилка'}
                        </div>
                    )}

                    {/* Форма — приховуємо під час polling */}
                    {!isPolling && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Кількість днів" hint="від 1 до 365">
                                <input
                                    type="number"
                                    value={form.days}
                                    min={1} max={365}
                                    onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
                                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg h-10 px-3 text-sm outline-none focus:border-neutral-500 transition"
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Початкова вологість" hint="мм">
                                    <input
                                        type="number"
                                        value={form.initial_moisture}
                                        min={0} max={500}
                                        onChange={(e) => setForm({ ...form, initial_moisture: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg h-10 px-3 text-sm outline-none focus:border-neutral-500 transition"
                                    />
                                </Field>
                                <Field label="Початкова температура" hint="°C">
                                    <input
                                        type="number"
                                        value={form.initial_temp}
                                        min={-50} max={60}
                                        onChange={(e) => setForm({ ...form, initial_temp: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg h-10 px-3 text-sm outline-none focus:border-neutral-500 transition"
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Добові опади" hint="мм/день">
                                    <input
                                        type="number"
                                        value={form.daily_rain}
                                        min={0} max={200}
                                        onChange={(e) => setForm({ ...form, daily_rain: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg h-10 px-3 text-sm outline-none focus:border-neutral-500 transition"
                                    />
                                </Field>
                                <Field label="Сонячна радіація" hint="Вт/м²">
                                    <input
                                        type="number"
                                        value={form.solar_radiation}
                                        min={0} max={1000}
                                        onChange={(e) => setForm({ ...form, solar_radiation: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg h-10 px-3 text-sm outline-none focus:border-neutral-500 transition"
                                    />
                                </Field>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 border border-neutral-700 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition"
                                >
                                    Скасувати
                                </button>
                                <button
                                    type="submit"
                                    disabled={isStarting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-medium transition disabled:opacity-50"
                                >
                                    {isStarting
                                        ? <><Loader2 size={15} className="animate-spin" />Запуск...</>
                                        : <><Plus size={15} />Запустити</>
                                    }
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                {hint && <span className="text-xs text-gray-500">{hint}</span>}
            </div>
            {children}
        </div>
    );
}