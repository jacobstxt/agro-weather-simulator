import { useGetRegionsQuery } from './regionsApi';

export function RegionsList() {
    const { data, isLoading, error } = useGetRegionsQuery({});

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                Помилка завантаження даних
            </div>
        );
    }

    if (!data || data.regions.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500 text-lg">У вас ще немає полів</p>
                <p className="text-gray-400 text-sm mt-1">Додайте перше поле щоб почати</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Мої поля</h2>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
          {data.total} {data.total === 1 ? 'поле' : 'полів'}
        </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.regions.map((region) => (
                    <div
                        key={region.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-green-300 transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">{region.name}</h3>
                            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-medium">
                #{region.id}
              </span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                                <span className="w-24 text-gray-400">Ґрунт:</span>
                                <span className="font-medium text-gray-700">{region.soil_type}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <span className="w-24 text-gray-400">Площа:</span>
                                <span className="font-medium text-gray-700">{region.area_ha} га</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <span className="w-24 text-gray-400">📍 Координати:</span>
                            </div>
                            <div className="text-gray-500 text-xs pl-24 -mt-1">
                                {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}