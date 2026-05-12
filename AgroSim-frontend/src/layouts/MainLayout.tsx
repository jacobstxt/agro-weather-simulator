import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Code2, BookOpen, GraduationCap } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { AddRegionModal } from '../components/region/AddRegionModal';

export function MainLayout() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
            <Header variant="app" onAddField={() => setIsModalOpen(true)} />

            <main className="flex-1 max-w-screen-2xl w-full mx-auto px-10 py-10">
                <Outlet />
            </main>

            <footer className="mt-20 border-t border-neutral-800">
                <div className="max-w-screen-2xl mx-auto px-10 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">AgroSim</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Симуляція вологості ґрунту та температури на основі чисельних методів. Метод Рунге-Кутта 4-го порядку.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-300">Чисельні методи</h4>
                            <ul className="space-y-1.5 text-sm text-gray-500">
                                <li>Рунге-Кутта 4-го порядку (ОДР)</li>
                                <li>Кубічний сплайн (інтерполяція)</li>
                                <li>Чисельне інтегрування (ГДД)</li>
                                <li>Центральні різниці (алерти)</li>
                            </ul>
                        </div>

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

            <AddRegionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}