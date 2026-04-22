import { baseApi } from '../../store/api/baseApi';
import type { Region, RegionCreate, RegionsResponse } from '../../types';

export const regionsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getRegions: builder.query<RegionsResponse, { skip?: number; limit?: number }>({
            query: ({ skip = 0, limit = 20 } = {}) => `/regions/?skip=${skip}&limit=${limit}`,
            providesTags: ['Region'],
        }),
        getRegion: builder.query<Region, number>({
            query: (id) => `/regions/${id}`,
            providesTags: ['Region'],
        }),
        createRegion: builder.mutation<Region, RegionCreate>({
            query: (body) => ({
                url: '/regions/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Region'],
        }),
    }),
});

export const {
    useGetRegionsQuery,
    useGetRegionQuery,
    useCreateRegionMutation,
} = regionsApi;