import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/features/auth/authApi';
import { setCredentials } from '@/features/auth/authSlice';

export function LoginPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [login, { isLoading }] = useLoginMutation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login({ email, password }).unwrap();
            dispatch(setCredentials(result.access_token));
            navigate('/');
        } catch (err: unknown) {
            const apiError = err as { data?: { detail?: string } };
            setError(apiError?.data?.detail ?? "Помилка з'єднання");
        }
    };

    return (
        <div className="min-h-screen flex bg-neutral-900">
            {/* Ліва сторона — місце для фото */}
            <div className="hidden lg:block flex-1 bg-neutral-950" />

            {/* Права сторона — форма */}
            <div className="flex-1 flex items-center justify-center px-8">
                <div className="w-full max-w-sm">
                    <h1 className="text-xl font-bold text-white mb-1">Вхід до системи</h1>
                    <p className="text-sm text-neutral-500 mb-6">Введи свої облікові дані</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-xs text-neutral-400">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-9 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-xs text-neutral-400">Пароль</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-9 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        {error && <p className="text-sm text-red-400">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-9 w-full rounded-lg bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Завантаження...' : 'Увійти'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-neutral-500">
                        Немає акаунту?{' '}
                        <Link to="/register" className="text-emerald-400 hover:text-emerald-300">
                            Зареєструватись
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}