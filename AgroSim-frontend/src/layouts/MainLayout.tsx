import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AddRegionModal } from '../components/region/AddRegionModal';

export function MainLayout() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
            <Header variant="app" onAddField={() => setIsModalOpen(true)} />

            <main className="flex-1 max-w-screen-2xl w-full mx-auto px-10 py-10">
                <Outlet />
            </main>

            <Footer variant="app" />

            <AddRegionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}