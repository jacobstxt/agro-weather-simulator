import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { RegionPage } from "./pages/region/RegionPage.tsx";
import { LoginPage } from "./pages/auth/LoginPage.tsx";
import { RegisterPage } from "./pages/auth/RegisterPage.tsx";
import { PrivateRoute } from "./components/auth/PrivateRoute.tsx";
import { DashboardPage } from './pages/dashboard/DashboardPage.tsx';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Публічні маршрути */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Захищені маршрути */}
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