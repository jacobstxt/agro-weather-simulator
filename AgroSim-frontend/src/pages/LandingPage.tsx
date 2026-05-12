import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
    ArrowRight, BarChart3, Droplets, Thermometer,
    CloudRain, Globe, Cpu, ShieldCheck, TrendingUp, Activity,
    MapPinned,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';


const METRICS = [
    { icon: <Droplets size={18} />, title: 'Вологість',   value: '68%',    color: 'text-sky-400'     },
    { icon: <Thermometer size={18} />, title: 'Температура', value: '18.4°C', color: 'text-orange-400'  },
    { icon: <CloudRain size={18} />,   title: 'Опади',      value: '12 мм',  color: 'text-cyan-400'    },
    { icon: <TrendingUp size={18} />,  title: 'Прогноз',    value: '+12%',   color: 'text-emerald-400' },
];

const CHART_BARS = [30, 40, 55, 42, 60, 70, 58, 74, 65, 82, 76, 90];

const MINI_INFO = [
    { icon: <MapPinned size={15} />, label: 'Локація',   value: 'Україна'      },
    { icon: <Cpu size={15} />,       label: 'Алгоритм',  value: 'Runge-Kutta 4' },
];

const STATS = [
    { number: '12K+', label: 'Симуляцій'      },
    { number: '24',   label: 'Регіони'         },
    { number: 'RK4',  label: 'Чисельний метод' },
];

const FEATURES = [
    { icon: <Droplets size={22} />,   title: 'Симуляція вологості',   desc: 'Моделювання вологості ґрунту на основі чисельних методів.'          },
    { icon: <Thermometer size={22} />, title: 'Температурний аналіз',  desc: 'Аналіз теплового режиму та прогноз розвитку культур.'                },
    { icon: <Globe size={22} />,       title: 'Погодні дані',          desc: 'Інтеграція реальних метеоданих та прогнозів.'                        },
    { icon: <BarChart3 size={22} />,   title: 'Інтерактивні графіки',  desc: 'Детальна візуалізація часових рядів та показників.'                  },
    { icon: <ShieldCheck size={22} />, title: 'Точні алгоритми',       desc: 'Runge-Kutta, spline interpolation та чисельне інтегрування.'          },
    { icon: <Cpu size={22} />,         title: 'AI-аналітика',          desc: 'Розумні рекомендації для оцінки стану полів.'                        },
];

const STEPS = [
    { number: '01', title: 'Обери регіон',      desc: 'Вкажи поле або область для аналізу.'             },
    { number: '02', title: 'Завантаж дані',      desc: 'Імпорт погодних та агрономічних показників.'     },
    { number: '03', title: 'Запусти симуляцію',  desc: 'Обчислення на основі чисельних методів.'         },
    { number: '04', title: 'Отримай прогноз',    desc: 'Аналіз вологості, температури та ризиків.'       },
];



export function LandingPage() {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    return (
        <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_40%)]" />
            </div>

            <Header variant="landing" />

            {/* Hero */}
            <section className="relative z-10 px-6 lg:px-10 pt-24 pb-32">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">

                    {/* Left */}
                    <div>
                       

                        <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-8">
                            Аналізуй
                            <span className="text-emerald-400 block">ґрунт та погоду</span>
                            в реальному часі
                        </h1>

                        <p className="text-lg text-neutral-400 leading-relaxed max-w-xl mb-10">
                            Платформа для симуляції вологості ґрунту, температури та прогнозування стану полів
                            на основі чисельних методів та реальних метеоданих.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-14">
                            {isAuthenticated ? (
                                <Link to="/dashboard" className="px-7 py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-semibold transition flex items-center gap-2 shadow-2xl shadow-emerald-500/20">
                                    Відкрити дашборд <ArrowRight size={17} />
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="px-7 py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-semibold transition flex items-center gap-2 shadow-2xl shadow-emerald-500/20">
                                        Спробувати безкоштовно <ArrowRight size={17} />
                                    </Link>
                                    <Link to="/login" className="px-7 py-4 border border-white/10 hover:border-white/20 bg-white/[0.03] rounded-2xl font-semibold transition">
                                        Увійти
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-8 max-w-xl">
                            {STATS.map((s) => (
                                <div key={s.label}>
                                    <div className="text-3xl font-black">{s.number}</div>
                                    <div className="text-sm text-neutral-500">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

        
                    <div className="relative">
                        <div className="relative bg-neutral-900 border border-white/10 rounded-[32px] p-6 shadow-2xl shadow-black/40">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Активна симуляція</div>
                                    <div className="text-xl font-bold">Львівська область</div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">НАЖИВО</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {METRICS.map((m) => (
                                    <div key={m.title} className="bg-black/30 border border-white/5 rounded-2xl p-4">
                                        <div className={`mb-3 ${m.color}`}>{m.icon}</div>
                                        <div className="text-sm text-neutral-500 mb-1">{m.title}</div>
                                        <div className="text-2xl font-bold">{m.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <div className="text-sm font-medium">Динаміка вологості</div>
                                        <div className="text-xs text-neutral-500">Останні 12 днів</div>
                                    </div>
                                    <Activity size={16} className="text-emerald-400" />
                                </div>

                                <div className="flex items-end gap-2 h-44">
                                    {CHART_BARS.map((h, i) => (
                                        <div
                                            key={i}
                                            style={{ height: `${h}%` }}
                                            className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                {MINI_INFO.map((m) => (
                                    <div key={m.label} className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-2xl p-4">
                                        <div className="text-emerald-400">{m.icon}</div>
                                        <div>
                                            <div className="text-xs text-neutral-500">{m.label}</div>
                                            <div className="text-sm font-medium">{m.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Features */}
            <section className="relative z-10 px-6 lg:px-10 py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-2xl mb-16">
                        <div className="text-emerald-400 text-sm font-semibold mb-3">МОЖЛИВОСТІ</div>
                        <h2 className="text-4xl font-black mb-5">Все для агрономічної аналітики</h2>
                        <p className="text-neutral-400 text-lg">Інструменти для аналізу, симуляції та прогнозування стану полів.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="group bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/5 hover:border-emerald-500/20 rounded-3xl p-7 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-neutral-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="relative z-10 px-6 lg:px-10 py-28 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-emerald-400 text-sm font-semibold mb-4">ЯК ЦЕ ПРАЦЮЄ</div>
                        <h2 className="text-4xl font-black mb-5">Простий процес симуляції</h2>
                        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Від завантаження даних до прогнозування стану поля.</p>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-6">
                        {STEPS.map((s) => (
                            <div key={s.number} className="relative bg-white/[0.03] border border-white/5 rounded-3xl p-8 overflow-hidden">
                                <div className="absolute top-0 right-0 text-[90px] font-black text-white/[0.03] leading-none">{s.number}</div>
                                <div className="relative">
                                    <div className="text-emerald-400 font-bold mb-4">{s.number}</div>
                                    <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                                    <p className="text-neutral-400 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

          
            <Footer variant="landing" />
        </div>
    );
}