import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/features/auth/authApi';
import { setCredentials } from '@/features/auth/authSlice';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';


export function LoginPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [login, { isLoading }] = useLoginMutation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login({ email, password }).unwrap();
            dispatch(setCredentials(result.access_token));
            navigate('/dashboard');
        } catch (err: unknown) {
            const apiError = err as { data?: { detail?: string } };
            setError(apiError?.data?.detail ?? "Невірний email або пароль");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex">

            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-neutral-950 items-end p-14">
                <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-emerald-500/20 blur-3xl rounded-full" />
                <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-sky-500/10 blur-3xl rounded-full" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <span className="font-bold text-lg">AgroSim</span>
                    </div>
                    <h2 className="text-4xl font-black leading-tight mb-4">
                        Приєднуйся<br />
                        <span className="text-emerald-400">до платформи</span>
                    </h2>
                    <p className="text-neutral-500 max-w-xs leading-relaxed">
                        Безкоштовний доступ до симуляцій, аналітики та прогнозів для твоїх полів.
                    </p>
                </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center px-6 lg:px-16 relative">
                <Link
                    to="/"
                    className="absolute top-8 left-8 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition"
                >
                    <ArrowLeft size={15} /> Головна
                </Link>
                <div className="w-full max-w-sm">

                    {/* Mobile logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
                        <span className="font-bold">AgroSim</span>
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-2xl font-black mb-1.5">Вхід до системи</h1>
                        <p className="text-sm text-neutral-500">Введи свої облікові дані</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-400">Email</label>
                            <input
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl px-4 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-400">Пароль</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl px-4 pr-11 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Завантаження...' : <><span>Увійти</span><ArrowRight size={15} /></>}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-neutral-600">
                        Немає акаунту?{' '}
                        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition">
                            Зареєструватись
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}