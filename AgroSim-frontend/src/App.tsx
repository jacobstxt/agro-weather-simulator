import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { RegionPage } from "./pages/region/RegionPage.tsx";
import { LoginPage } from "./pages/auth/LoginPage.tsx";
import { RegisterPage } from "./pages/auth/RegisterPage.tsx";
import { PrivateRoute } from "./components/auth/PrivateRoute.tsx";
import { DashboardPage } from './pages/dashboard/DashboardPage.tsx';
import { useSelector } from 'react-redux';
import type { RootState } from './store/index.ts';

function App() {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<PrivateRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/regions/:id" element={<RegionPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App