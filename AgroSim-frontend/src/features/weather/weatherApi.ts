import { baseApi } from '../../store/api/baseApi';
import type {
    SimulationRequest,
    RegionSimulationsResponse,
    SimulationResult,
    TaskStatus,
} from '../../types';

export const weatherApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        runSimulation: builder.mutation<{ task_id: number; status: string }, SimulationRequest>({
            query: (body) => ({
                url: '/weather/simulate',
                method: 'POST',
                body,
            }),
        }),

        getSimulationStatus: builder.query<TaskStatus, number>({
            query: (taskId) => `/weather/simulate/status/${taskId}`,
        }),

        getSimulation: builder.query<SimulationResult, number>({
            query: (simulationId) => `/weather/simulate/${simulationId}`,
        }),

        getRegionSimulations: builder.query<RegionSimulationsResponse, { regionId: number; skip?: number; limit?: number }>({
            query: ({ regionId, skip = 0, limit = 10 }) =>
                `/weather/simulate/region/${regionId}?skip=${skip}&limit=${limit}`,
            providesTags: ['Simulation'],
        }),

        getSimulationCount: builder.query<{ total: number }, void>({
            query: () => '/weather/simulate/count',
            providesTags: ['Simulation'],
        }),
    }),
});

export const {
    useRunSimulationMutation,
    useGetSimulationStatusQuery,
    useGetSimulationQuery,
    useGetRegionSimulationsQuery,
    useGetSimulationCountQuery,
} = weatherApi;