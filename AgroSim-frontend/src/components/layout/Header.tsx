import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, LogOut, ArrowRight, ChevronDown, User } from 'lucide-react';
import { logout } from '../../store/authSlice';
import { useGetMeQuery } from '../../features/auth/authApi';
import type { RootState } from '@/store';

interface AppHeaderProps {
    variant: 'app';
    onAddField: () => void;
}

interface LandingHeaderProps {
    variant: 'landing';
}

type HeaderProps = AppHeaderProps | LandingHeaderProps;

const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
        isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
    }`;

function UserMenu() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { data: user } = useGetMeQuery();

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const initials = user
        ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
        : '??';

    const fullName = user ? `${user.first_name} ${user.last_name}` : '...';

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
            >
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                </div>
                <span className="text-sm text-neutral-300 hidden md:block">{fullName}</span>
                <ChevronDown size={14} className={`text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-700">
                        <div className="text-sm font-medium text-white">{fullName}</div>
                        <div className="text-xs text-neutral-500 mt-0.5 truncate">{user?.email}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition"
                    >
                        <LogOut size={15} /> Вийти
                    </button>
                </div>
            )}
        </div>
    );
}

export function Header(props: HeaderProps) {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const isLanding = props.variant === 'landing';

    return (
        <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
            isLanding
                ? 'border-white/10 bg-black/40 h-20'
                : 'border-neutral-800 bg-neutral-900/95 py-4'
        }`}>
            <div className={`flex items-center justify-between ${
                isLanding
                    ? 'max-w-7xl mx-auto px-6 lg:px-10 h-full'
                    : 'max-w-screen-2xl mx-auto px-10'
            }`}>

                {/* Logo */}
                <div className="flex items-center gap-10">
                    {isLanding ? (
                        <Link to="/" className="flex items-center gap-3">
                            <div>
                                <div className="font-bold tracking-tight text-lg">AgroSim</div>
                                <div className="text-xs text-neutral-500">Smart agriculture platform</div>
                            </div>
                        </Link>
                    ) : (
                        <>
                            <NavLink to="/" className="font-bold text-lg tracking-tight text-white hover:text-emerald-400 transition">
                                AgroSim
                            </NavLink>
                            <nav className="flex gap-1">
                                <NavLink to="/dashboard" end className={navItemClass}>Головна</NavLink>
                                <NavLink to="/weather" className={navItemClass}>Погодні дані</NavLink>
                                <NavLink to="/comparison" className={navItemClass}>Порівняння</NavLink>
                            </nav>
                        </>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {isLanding ? (
                        isAuthenticated ? (
                            <Link to="/dashboard" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-sm font-semibold transition flex items-center gap-2">
                                Dashboard <ArrowRight size={15} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white transition">
                                    <User size={15} /> Увійти
                                </Link>
                                <Link to="/register" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-sm font-semibold transition">
                                    Почати
                                </Link>
                            </>
                        )
                    ) : (
                        <>
                            <button
                                onClick={(props as AppHeaderProps).onAddField}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
                            >
                                <Plus size={16} /> Додати поле
                            </button>
                            <UserMenu />
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}