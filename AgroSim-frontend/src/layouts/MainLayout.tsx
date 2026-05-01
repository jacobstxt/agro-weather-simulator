import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import {AddRegionModal} from "../components/AddRegionModal.tsx";

export function MainLayout() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const navItemClass = ({ isActive }: { isActive: boolean }) =>
        `px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-neutral-900 text-white">
            <header className="border-b border-neutral-800 px-8 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <h1 className="font-bold text-lg leading-tight">
                            AgroSim
                        </h1>
                        <nav className="flex gap-2">
                            <NavLink to="/" end className={navItemClass}>Dashboard</NavLink>
                            <NavLink to="/simulation" className={navItemClass}>Simulation</NavLink>
                            <NavLink to="/weather" className={navItemClass}>Weather Data</NavLink>
                            <NavLink to="/comparison" className={navItemClass}>Comparison</NavLink>
                        </nav>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 border border-neutral-700 rounded-lg hover:bg-white/5 transition"
                    >
                        + Add region
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-8">
                <Outlet />
            </main>


            <footer className="border-t border-neutral-800 px-8 py-6 mt-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-400">
                        © 2026 Weather Simulator · Numerical Methods Course Project
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span className="text-gray-500">
                            ЛНУ ім. І. Франка
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