import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Sprout, Code2, BookOpen, GraduationCap } from 'lucide-react';
import { AddRegionModal } from "../components/AddRegionModal.tsx";

export function MainLayout() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const navItemClass = ({ isActive }: { isActive: boolean }) =>
        `px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
            isActive
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-neutral-800 px-10 py-4 sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-sm">
                <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2.5">
                            <span className="font-bold text-lg tracking-tight">AgroSim</span>
                        </div>
                        <nav className="flex gap-1">
                            <NavLink to="/" end className={navItemClass}>Dashboard</NavLink>
                            <NavLink to="/weather" className={navItemClass}>Weather Data</NavLink>
                            <NavLink to="/comparison" className={navItemClass}>Comparison</NavLink>
                        </nav>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
                    >
                        <Plus size={16} /> Add region
                    </button>
                </div>
            </header>

            {/* Main content — росте щоб заповнити простір і притиснути footer донизу */}
            <main className="flex-1 max-w-screen-2xl w-full mx-auto px-10 py-10">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-neutral-800">
                <div className="max-w-screen-2xl mx-auto px-10 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Бренд */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Sprout size={18} className="text-emerald-400" />
                                <span className="font-semibold">AgroSim</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Симуляція вологості ґрунту та температури на основі чисельних методів. Метод Рунге-Кутта 4-го порядку.
                            </p>
                        </div>

                        {/* Методи */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-300">Чисельні методи</h4>
                            <ul className="space-y-1.5 text-sm text-gray-500">
                                <li>Рунге-Кутта 4-го порядку (ОДР)</li>
                                <li>Кубічний сплайн (інтерполяція)</li>
                                <li>Чисельне інтегрування (ГДД)</li>
                                <li>Центральні різниці (алерти)</li>
                            </ul>
                        </div>

                        {/* Університет */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-300">Проект</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li className="flex items-center gap-2">
                                    <GraduationCap size={14} className="text-gray-400 shrink-0" />
                                    ЛНУ ім. Івана Франка
                                </li>
                                <li className="flex items-center gap-2">
                                    <BookOpen size={14} className="text-gray-400 shrink-0" />
                                    Курсовий проект · Чисельні методи
                                </li>
                                <li className="flex items-center gap-2">
                                    <Code2 size={14} className="text-gray-400 shrink-0" />
                                    2025–2026
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-8 pt-6 border-t border-neutral-800 flex items-center justify-between text-xs text-gray-600">
                        <span>© 2026 AgroSim · Всі права захищені</span>
                        <span className="flex items-center gap-1.5">
                            Побудовано на
                            <span className="text-emerald-600">FastAPI</span>·
                            <span className="text-emerald-600">React</span>·
                            <span className="text-emerald-600">Recharts</span>
                        </span>
                    </div>
                </div>
            </footer>

            <AddRegionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}