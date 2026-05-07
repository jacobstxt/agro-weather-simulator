import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useCreateRegionMutation, useLazySearchLocationQuery } from '../features/regions/regionsApi';
import type { RegionCreate } from '../types';

interface AddRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const emptyForm: RegionCreate = {
    name: '',
    latitude: 0,
    longitude: 0,
    soil_type: '',
    area_ha: 0,
};

export function AddRegionModal({ isOpen, onClose }: AddRegionModalProps) {
    const [form, setForm] = useState<RegionCreate>(emptyForm);
    const [searchQuery, setSearchQuery] = useState('');
    const [createRegion, { isLoading: isCreating, error }] = useCreateRegionMutation();
    const [triggerSearch, { data: searchResults, isFetching: isSearching }] = useLazySearchLocationQuery();

    // Закрити по Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);


    useEffect(() => {
        if (isOpen) {
            setForm(emptyForm);
            setSearchQuery('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSearch = () => {
        if (searchQuery.trim().length >= 2) {
            triggerSearch({ query: searchQuery.trim() });
        }
    };

    const handleSelectLocation = (location: any) => {
        setForm({
            ...form,
            name: location.display_name || location.name || searchQuery,
            latitude: location.latitude,
            longitude: location.longitude,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createRegion(form).unwrap();
            onClose();
        } catch (err) {
            console.error('Помилка створення:', err);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
                    <h2 className="text-xl font-bold text-white">Додати нове поле</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                    {/* Location Search */}
                    <Field label={<span className="flex items-center gap-1.5"><Search size={14} />Пошук населеного пункту</span>}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                                placeholder="Львів, Тернопіль, село Зимна Вода..."
                                className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={searchQuery.trim().length < 2 || isSearching}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSearching ? '...' : 'Пошук'}
                            </button>
                        </div>

                        {searchResults && searchResults.results.length > 0 && (
                            <div className="mt-2 bg-neutral-800 border border-neutral-700 rounded-lg max-h-48 overflow-y-auto">
                                {searchResults.results.map((loc, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelectLocation(loc)}
                                        className="w-full text-left px-4 py-3 hover:bg-neutral-700 transition border-b border-neutral-700 last:border-0"
                                    >
                                        <div className="text-white text-sm font-medium">
                                            {loc.display_name}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchResults && searchResults.results.length === 0 && (
                            <div className="mt-2 text-sm text-gray-400">
                                Нічого не знайдено
                            </div>
                        )}

                    </Field>

                    <div className="border-t border-neutral-800 my-4" />

                    <Field label="Назва поля">
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Поле Львівщина"
                            required
                            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Широта">
                            <input
                                type="number"
                                step="0.0001"
                                value={form.latitude || ''}
                                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                                placeholder="49.8397"
                                required
                                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                            />
                        </Field>
                        <Field label="Довгота">
                            <input
                                type="number"
                                step="0.0001"
                                value={form.longitude || ''}
                                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                                placeholder="24.0297"
                                required
                                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                            />
                        </Field>
                    </div>

                    <Field label="Тип ґрунту">
                        <select
                            value={form.soil_type}
                            onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition"
                        >
                            <option value="">Оберіть тип</option>
                            <option value="Чорнозем">Чорнозем</option>
                            <option value="Суглинок">Суглинок</option>
                            <option value="Глина">Глина</option>
                            <option value="Пісок">Пісок</option>
                            <option value="Сірий лісовий">Сірий лісовий</option>
                        </select>
                    </Field>

                    <Field label="Площа (га)">
                        <input
                            type="number"
                            step="0.01"
                            value={form.area_ha || ''}
                            onChange={(e) => setForm({ ...form, area_ha: Number(e.target.value) })}
                            placeholder="50"
                            required
                            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </Field>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                            Помилка створення регіону. Перевірте дані.
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-neutral-700 rounded-lg text-gray-300 hover:bg-white/5 transition"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Створення...' : 'Створити'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
            {children}
        </div>
    );
}