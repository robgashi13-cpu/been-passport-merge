import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { useUser } from '@/contexts/UserContext';
import { countries, getCountryByCode } from '@/data/countries';
import { availablePassports } from '@/data/visaMatrix';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { User, Mail, Lock, Globe, LogIn, UserPlus, LogOut, X, Camera as CameraIcon, Loader2 } from 'lucide-react';
import { AchievementList } from './Achievements';
import { scanPhotoLibrary } from '@/services/photoScanner';
import { findNearestCountry } from '@/services/countryService';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
    const { login, signup, isLoggedIn, user, logout, updatePassword, visitedCountries, updateVisitedCountries } = useUser();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passportCode, setPassportCode] = useState('DE');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStats, setScanStats] = useState<{ found: number, new: number } | null>(null);

    // Profile View States (Hoisted)
    const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');
    const [newPassword, setNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { updateAvatar } = useUser();
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [newAvatarUrl, setNewAvatarUrl] = useState('');

    const handleNativePhotoPick = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 70,
                allowEditing: true,
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt
            });

            if (image.base64String) {
                const dataUrl = `data:image/${image.format};base64,${image.base64String}`;
                setIsLoading(true);
                const success = await updateAvatar(dataUrl);
                setIsLoading(false);

                if (success) {
                    setSuccessMessage('Profile picture updated!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                    setError('Failed to save profile picture');
                }
            }
        } catch (e) {
            console.error("User cancelled or failed to load photo", e);
        }
    };

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
            <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-20">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

                <div className="relative bg-[#0a0a0a] w-full max-w-2xl min-h-[500px] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-zoom-in">
                    <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                        <h2 className="font-display text-2xl font-bold">Profile</h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                        <div className="text-center mb-6">
                            <div className="relative w-24 h-24 mx-auto mb-4 group">
                                <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-white/50" />
                                    )}
                                </div>
                                <button
                                    onClick={handleNativePhotoPick}
                                    className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 border border-black hover:bg-blue-400 transition-colors shadow-lg"
                                >
                                    <CameraIcon className="w-3 h-3 text-white" />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold">{user.name}</h3>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            Stats
                        </button>
                        <button
                            onClick={() => setActiveTab('achievements')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'achievements' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            Achievements
                        </button>
                    </div>

                    {activeTab === 'stats' ? (
                        <>
                            <div className="bg-white/5 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{passport?.flagEmoji}</span>
                                    <div>
                                        <div className="font-medium">{passport?.name} Passport</div>
                                        <div className="text-sm text-muted-foreground">
                                            {user.visitedCountries.length} countries visited
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-4 text-center">
                                    <div className="font-display text-2xl font-bold">{user.visitedCountries.length}</div>
                                    <div className="text-xs text-muted-foreground">Countries</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 text-center">
                                    <div className="font-display text-2xl font-bold">{user.bucketList.length}</div>
                                    <div className="text-xs text-muted-foreground">Bucket List</div>
                                </div>

                            </div>

                            {/* Photo Scanner */}
                            <div className="bg-gradient-card rounded-xl p-4 mb-6 border border-white/10">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <CameraIcon className="w-4 h-4 text-blue-400" />
                                    Auto-Fill from Photos
                                </h4>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Scan your photo library to automatically find countries you've visited.
                                    We only read location metadata locally.
                                </p>

                                {scanStats ? (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center mb-3">
                                        <p className="text-green-400 font-medium">Scan Complete!</p>
                                        <p className="text-xs text-green-300/80">
                                            Found {scanStats.found} locations. Added {scanStats.new} new countries.
                                        </p>
                                        <button
                                            onClick={() => setScanStats(null)}
                                            className="mt-2 text-[10px] underline"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (!Capacitor.isNativePlatform()) {
                                                setError("Photo scanning is only available on the mobile app.");
                                                setTimeout(() => setError(''), 3000);
                                                return;
                                            }
                                            setIsScanning(true);
                                            try {
                                                const locations = await scanPhotoLibrary();
                                                console.log("Scanned locations:", locations.length);

                                                const newCountries = new Set<string>();
                                                const currentSet = new Set(visitedCountries);

                                                locations.forEach(loc => {
                                                    const countryCode = findNearestCountry(loc.latitude, loc.longitude);
                                                    if (countryCode && !currentSet.has(countryCode)) {
                                                        newCountries.add(countryCode);
                                                        currentSet.add(countryCode); // Prevent adding duplicates in this run
                                                    }
                                                });

                                                if (newCountries.size > 0) {
                                                    updateVisitedCountries([...visitedCountries, ...Array.from(newCountries)]);
                                                }

                                                setScanStats({
                                                    found: locations.length,
                                                    new: newCountries.size
                                                });

                                            } catch (e) {
                                                console.error(e);
                                                setError("Failed to scan photos. Please check permissions.");
                                            } finally {
                                                setIsScanning(false);
                                            }
                                        }}
                                        disabled={isScanning}
                                        className="w-full py-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all font-medium flex items-center justify-center gap-2"
                                    >
                                        {isScanning ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Scanning Library...
                                            </>
                                        ) : (
                                            "Scan All Photos"
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Account Settings / Change Password */}
                            <div className="mb-6 border-t border-white/10 pt-6">
                                <h4 className="text-sm font-bold text-white mb-3">Account Settings</h4>
                                {isChangingPassword ? (
                                    <form onSubmit={handleChangePassword} className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-white/30"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsChangingPassword(false);
                                                    setNewPassword('');
                                                    setError('');
                                                }}
                                                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="w-full flex items-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                                    >
                                        <div className="p-2 bg-white/5 rounded-lg">
                                            <Lock className="w-4 h-4 text-white/60" />
                                        </div>
                                        <span className="text-sm font-medium">Change Password</span>
                                    </button>
                                )}
                                {successMessage && (
                                    <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 text-center animate-fade-in">
                                        {successMessage}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="mb-6">
                            <AchievementList visitedCountries={user.visitedCountries} />
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-white/10 bg-white/5 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
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
