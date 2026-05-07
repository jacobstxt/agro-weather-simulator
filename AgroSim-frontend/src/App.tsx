import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {MainLayout} from "./layouts/MainLayout.tsx";
import {DashboardPage} from "./pages/DashboardPages.tsx";
import {RegionPage} from "./pages/RegionPage.tsx";
import {WeatherDataPage} from "./pages/WeatherDataPage.tsx";
import {ComparisonPage} from "./pages/ComparisonPage.tsx";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/regions/:id" element={<RegionPage />} />
                    <Route path="/weather" element={<WeatherDataPage />} />
                    <Route path="/comparison" element={<ComparisonPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App
