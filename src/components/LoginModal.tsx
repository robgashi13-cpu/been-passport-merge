import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { useUser } from '@/contexts/UserContext';
import { countries, getCountryByCode } from '@/data/countries';
import { availablePassports } from '@/data/visaMatrix';
import { User, Mail, Lock, Globe, LogIn, UserPlus, LogOut, X } from 'lucide-react';
import { AchievementList } from './Achievements';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
    const { login, signup, isLoggedIn, user, logout, updatePassword } = useUser();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passportCode, setPassportCode] = useState('DE');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Profile View States
    const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');
    const [newPassword, setNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await updatePassword(newPassword);
        setIsLoading(false);
        if (success) {
            setNewPassword('');
            setIsChangingPassword(false);
            setSuccessMessage('Password updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } else {
            setError('Failed to update password');
        }
    };

    // Body scroll lock (Web only - Native handles this differently and might freeze)
    useEffect(() => {
        if (Capacitor.isNativePlatform()) return;

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const success = await login(email, password);
                if (success) {
                    onClose();
                } else {
                    setError('Invalid credentials. Please try again.');
                }
            } else {
                const result = await signup(name, email, password, passportCode);
                if (result.success) {
                    if (result.message) {
                        setMode('login');
                        setSuccessMessage(result.message);
                    } else {
                        onClose();
                    }
                } else {
                    setError(result.message || 'Signup failed. Please try again.');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        onClose();
    };

    // If logged in, show profile
    if (isLoggedIn && user) {
        const passport = getCountryByCode(user.passportCode);

        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-start justify-center p-0 sm:p-4 sm:pt-16">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

                <div className="relative bg-[#0a0a0a] w-full h-full sm:h-auto sm:max-w-md sm:max-h-[90vh] rounded-none sm:rounded-3xl border-0 sm:border sm:border-white/10 shadow-2xl overflow-hidden flex flex-col animate-zoom-in">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0 bg-white/5">
                        <h2 className="font-display text-xl font-bold text-white">Profile</h2>
                        <button onClick={onClose} className="absolute top-16 right-6 z-50 p-3 bg-black/60 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm" aria-label="Close profile">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-6 space-y-6">

                            {/* Profile Header Card */}
                            <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
                                </div>

                                <div className="relative flex flex-col items-center text-center">
                                    {/* Avatar */}
                                    <div className="relative mb-4">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[3px]">
                                            <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-4xl font-bold text-white/80">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Name & Email */}
                                    <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
                                    <p className="text-sm text-white/50 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {user.email}
                                    </p>

                                    {/* Passport Badge */}
                                    <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                                        <span className="text-xl">{passport?.flagEmoji}</span>
                                        <span className="text-sm font-medium text-white/80">{passport?.name} Passport</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                                    <div className="font-display text-3xl font-bold text-white">{user.visitedCountries.length}</div>
                                    <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Countries Visited</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                                    <div className="font-display text-3xl font-bold text-white">{user.bucketList.length}</div>
                                    <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Bucket List</div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="bg-white/5 rounded-xl p-1 flex gap-1">
                                <button
                                    onClick={() => setActiveTab('stats')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={() => setActiveTab('achievements')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'achievements' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                                >
                                    Achievements
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'stats' ? (
                                <div className="space-y-4">
                                    {/* Change Password */}
                                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                        {isChangingPassword ? (
                                            <form onSubmit={handleChangePassword} className="p-4 space-y-3">
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                                                    <input
                                                        type="password"
                                                        placeholder="New Password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30"
                                                        required
                                                        minLength={6}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsChangingPassword(false); setNewPassword(''); setError(''); }}
                                                        className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading}
                                                        className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                                                    >
                                                        {isLoading ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setIsChangingPassword(true)}
                                                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
                                            >
                                                <div className="p-2 bg-white/5 rounded-lg">
                                                    <Lock className="w-4 h-4 text-white/60" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">Change Password</div>
                                                    <div className="text-xs text-white/60">Update your account password</div>
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    {/* Success/Error Messages */}
                                    {successMessage && (
                                        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 text-center animate-fade-in">
                                            {successMessage}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 text-center animate-fade-in">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <AchievementList visitedCountries={user.visitedCountries} />
                            )}
                        </div>
                    </div>

                    {/* Footer - Sign Out */}
                    <div className="p-4 border-t border-white/10 bg-white/5 flex-shrink-0">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-[#0a0a0a] w-full max-w-2xl min-h-[500px] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-zoom-in">
                {/* Header */}
                <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold via-gold-dark to-transparent rounded-full p-[1px]">
                            <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                                <img src="/logo.png" alt="WanderPass" className="w-6 h-6 object-contain" />
                            </div>
                        </div>
                        <h2 className="font-display font-bold text-xl text-white">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col justify-center">

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 rounded-lg transition-colors ${mode === 'login' ? 'bg-white text-black' : 'bg-white/10'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-2 rounded-lg transition-colors ${mode === 'signup' ? 'bg-white text-black' : 'bg-white/10'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-border/50 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-white/20"
                                    required
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-border/50 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-white/20"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-border/50 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-white/20"
                                required
                            />
                        </div>

                        {mode === 'signup' && (
                            <div>
                                <label className="block text-sm text-muted-foreground mb-2">
                                    Select Your Passport
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <select
                                        value={passportCode}
                                        onChange={(e) => setPassportCode(e.target.value)}
                                        className="w-full bg-white/5 border border-border/50 rounded-xl py-3 pl-11 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                                    >
                                        {availablePassports
                                            .map(code => getCountryByCode(code))
                                            .filter((c): c is NonNullable<typeof c> => !!c)
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(country => (
                                                <option key={country.code} value={country.code} className="text-black">
                                                    {country.flagEmoji} {country.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 text-center animate-fade-in">
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : mode === 'login' ? (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground mt-4">
                        {mode === 'login'
                            ? "Don't have an account? Click Sign Up above"
                            : "Already have an account? Click Sign In above"
                        }
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};
