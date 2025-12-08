import { createPortal } from 'react-dom';
import { X, Trophy, Globe, Lock, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCountryByCode, countries, getTopPassports } from '@/data/countries';
import { getVisaRequirementFromMatrix, availablePassports } from '@/data/visaMatrix';
import { VISA_SUBSTITUTIONS, getVisaPowerGroups } from '@/data/visaSubstitutions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PassportDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userPassportCode?: string | null;
    passportScore: number;
    passportRank?: number;
    heldVisas?: string[];
}

export const PassportDetailsModal = ({ isOpen, onClose, userPassportCode, passportScore, passportRank, heldVisas = [] }: PassportDetailsModalProps) => {
    // Body scroll lock when modal is open
    useEffect(() => {
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

    const passportCountry = userPassportCode ? getCountryByCode(userPassportCode) : null;
    const topPassports = getTopPassports(100); // Get more to find user rank context if needed

    // Calculate substitutions
    const powerGroups = getVisaPowerGroups(heldVisas || []);
    const substitutedDestinations = new Set<string>();
    powerGroups.forEach(group => {
        const dests = VISA_SUBSTITUTIONS[group] || [];
        dests.forEach(d => substitutedDestinations.add(d));
    });

    // Filter visa free and voa
    const accessList = countries
        .map(c => {
            if (!userPassportCode) return null;
            if (c.code === userPassportCode) return null;
            const matrixReq = getVisaRequirementFromMatrix(userPassportCode, c.code);
            let effectiveReq = matrixReq?.requirement;
            let note = matrixReq?.notes;

            // Check substitution
            if (effectiveReq === 'visa-required' && (substitutedDestinations.has(c.code) || heldVisas.includes(c.code))) {
                effectiveReq = 'visa-free'; // Treat as visa-free (or equivalent accessible status)
                note = 'Unlocked by Held Visa';
            }

            return { country: c, req: { requirement: effectiveReq, notes: note } };
        })
        .filter(item => item && (item.req?.requirement === 'visa-free' || item.req?.requirement === 'visa-on-arrival' || item.req?.requirement === 'eta'))
        .sort((a, b) => (a?.country.name || '').localeCompare(b?.country.name || ''));

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="relative bg-[#0a0a0a] w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[85vh] rounded-none sm:rounded-2xl border-0 sm:border sm:border-white/10 shadow-2xl flex flex-col animate-zoom-in overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between bg-gradient-to-r from-luxury-charcoal to-black">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-4xl shadow-inner border border-white/10">
                            {passportCountry?.flagEmoji || '🌍'}
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-2xl text-white">{passportCountry?.name || 'Global'} Passport</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className="bg-luxury-gold/20 text-luxury-gold px-2 py-0.5 rounded-full border border-luxury-gold/30">
                                    Rank #{passportRank || '-'}
                                </span>
                                <span className="text-white/60">{passportScore} Score</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <Tabs defaultValue="access" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 h-12 mb-6">
                            <TabsTrigger value="access">Visa Free Access</TabsTrigger>
                            <TabsTrigger value="rankings">Global Rankings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="access" className="mt-0 space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                                <span>Destination ({accessList.length})</span>
                                <span>Status</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {accessList.map((item) => (
                                    <div key={item?.country.code} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item?.country.flagEmoji}</span>
                                            <span className="font-medium text-white text-sm">{item?.country.name}</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${item?.req?.requirement === 'visa-free' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {item?.req?.requirement === 'visa-free' ? 'Visa Free' : 'On Arrival'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="rankings" className="mt-0 space-y-2 animate-fade-in">
                            {topPassports.map((p, idx) => {
                                const isUser = p.code === userPassportCode;
                                return (
                                    <div
                                        key={p.code}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUser
                                            ? 'bg-luxury-gold/10 border-luxury-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                            : 'bg-white/5 border-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-lg ${idx < 3 ? 'text-luxury-gold bg-luxury-gold/10' : 'text-white/60 bg-white/5'
                                                }`}>
                                                #{p.passportRank}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{p.flagEmoji}</span>
                                                <span className={`font-medium ${isUser ? 'text-luxury-gold' : 'text-white'}`}>
                                                    {p.name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-white/60" />
                                            <span className="font-bold text-white">{p.visaFreeDestinations}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>,
        document.body
    );
};
