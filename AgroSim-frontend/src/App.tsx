import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { DashboardPage } from "./pages/DashboardPages.tsx";
import { RegionPage } from "./pages/RegionPage.tsx";
import { WeatherDataPage } from "./pages/WeatherDataPage.tsx";
import { ComparisonPage } from "./pages/ComparisonPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { PrivateRoute } from "./components/auth/PrivateRoute.tsx";

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
                        <Route path="/weather" element={<WeatherDataPage />} />
                        <Route path="/comparison" element={<ComparisonPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App