import { baseApi } from '../../store/api/baseApi';
import type {LocationSearchResponse, Region, RegionCreate, RegionsResponse} from '../../types';

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
        searchLocation: builder.query<LocationSearchResponse, { query: string; country_code?: string }>({
            query: ({ query, country_code = 'ua' }) =>
                `/regions/search?query=${encodeURIComponent(query)}&country_code=${country_code}`,
        }),
    }),
});

export const {
    useGetRegionsQuery,
    useGetRegionQuery,
    useCreateRegionMutation,
    useLazySearchLocationQuery,
} = regionsApi;