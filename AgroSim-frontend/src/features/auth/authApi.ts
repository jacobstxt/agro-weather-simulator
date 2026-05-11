import { baseApi } from '@/store/api/baseApi';

interface LoginRequest {
    username: string; // FastAPI OAuth2 приймає 'username', передаємо email
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

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => {
                const body = new URLSearchParams();
                body.append('username', credentials.username);
                body.append('password', credentials.password);
                return {
                    url: '/auth/login',
                    method: 'POST',
                    body,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                };
            },
        }),
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (data) => ({
                url: '/auth/register',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;