import { useGetRegionsQuery } from './regionsApi';

export function RegionsList() {
    const { data, isLoading, error } = useGetRegionsQuery({});

    if (isLoading) return <p>Завантаження...</p>;
    if (error) return <p>Помилка завантаження</p>;
    if (!data || data.regions.length === 0) return <p>Немає регіонів</p>;

    return (
        <div>
            <h2>Мої поля ({data.total})</h2>
            <ul>
                {data.regions.map((region) => (
                    <li key={region.id}>
                        <strong>{region.name}</strong> — {region.soil_type}, {region.area_ha} га
                        <br />
                        <small>
                            📍 {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                        </small>
                    </li>
                ))}
            </ul>
        </div>
    );
}