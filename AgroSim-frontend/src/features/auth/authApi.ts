import { baseApi } from '@/store/api/baseApi';

interface LoginRequest {
    email: string;
    password: string;
}

interface RegisterRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface UserProfile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (data) => ({
                url: '/auth/register',
                method: 'POST',
                body: data,
            }),
        }),
        getMe: builder.query<UserProfile, void>({
            query: () => '/auth/me',
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation, useGetMeQuery } = authApi;