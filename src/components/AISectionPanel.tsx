import { useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Plane, Calendar, ShieldCheck, MapPin, Check } from 'lucide-react';
import { useCountryAI, AISection } from '@/hooks/useCountryAI';
import { supabase } from '@/integrations/supabase/client';

const ALL_SECTIONS: AISection[] = ['overview', 'cities', 'visa', 'transport', 'climate', 'insights'];

interface Props {
    countryCode: string;
    countryName: string;
    section: AISection;
    passportName?: string;
}

export const AISectionPanel = ({ countryCode, countryName, section, passportName }: Props) => {
    const { data, loading, error, refresh } = useCountryAI({
        countryCode, countryName, section, passportName, enabled: true,
    });

    // Pre-warm OTHER sections in the background so tab switches feel instant.
    useEffect(() => {
        if (!countryCode || !countryName) return;
        const others = ALL_SECTIONS.filter(s => s !== section);
        const TTL_MS = 1000 * 60 * 60 * 24 * 7;
        others.forEach((s, i) => {
            const key = `ai:country:${countryCode}:${s}${s === 'visa' && passportName ? `:${passportName}` : ''}`;
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const entry = JSON.parse(raw);
                    if (Date.now() - entry.at < TTL_MS) return;
                }
            } catch { /* ignore */ }
            setTimeout(() => {
                supabase.functions.invoke('country-tab-ai', {
                    body: { countryCode, countryName, section: s, passportName },
                }).then(({ data: res }) => {
                    if (res?.ok) {
                        try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: res.data })); } catch { /* ignore */ }
                    }
                }).catch(() => { /* ignore */ });
            }, 400 * (i + 1));
        });
    }, [countryCode, countryName, passportName, section]);

    return (
        <div className="liquid-card relative overflow-hidden rounded-3xl p-5">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/90">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Insights · {section}
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="liquid-pill rounded-full p-1.5 text-white/60 hover:text-white disabled:opacity-40"
                    aria-label="Refresh AI data"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && !data && (
                <div className="flex flex-col items-center justify-center py-8 text-white/40">
                    <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="text-[10px] uppercase tracking-widest">Asking AI…</span>
                </div>
            )}

            {error && !loading && (
                <div className="flex items-center gap-2 rounded-2xl bg-amber-400/10 p-3 text-sm text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="text-xs">AI temporarily unavailable. Try again later.</span>
                </div>
            )}

            {data && !loading && <SectionBody section={section} data={data} />}
        </div>
    );
};

const SectionBody = ({ section, data }: { section: AISection; data: any }) => {
    if (section === 'overview') return (
        <div className="space-y-4">
            {data.summary && <p className="text-[14px] leading-relaxed text-white/85">{data.summary}</p>}
            {!!data.funFacts?.length && (
                <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Fun facts</div>
                    {data.funFacts.map((f: string, i: number) => (
                        <div key={i} className="flex gap-2 text-sm text-white/80"><span className="text-violet-300">•</span>{f}</div>
                    ))}
                </div>
            )}
            {!!data.publicHolidays?.length && (
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50"><Calendar className="h-3.5 w-3.5" /> Holidays</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {data.publicHolidays.map((h: any, i: number) => (
                            <div key={i} className="liquid-pill flex items-center justify-between rounded-2xl px-3 py-2">
                                <span className="truncate pr-3 text-xs text-white/85">{h.name}</span>
                                <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60">{h.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    if (section === 'cities') return (
        <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{data.topCities?.length || 0} key cities</div>
            <div className="grid gap-2 sm:grid-cols-2">
                {data.topCities?.map((c: any, i: number) => (
                    <div key={i} className="liquid-pill rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-3 w-3 text-cyan-300" />
                            <span className="text-sm font-bold text-white">{c.name}</span>
                            {c.region && <span className="text-[10px] text-white/50">· {c.region}</span>}
                        </div>
                        <p className="text-xs text-white/65 leading-snug">{c.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    if (section === 'visa') return (
        <div className="space-y-4">
            {data.policySummary && (
                <div className="rounded-2xl bg-cyan-400/10 p-4">
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300"><ShieldCheck className="h-3.5 w-3.5" /> Policy</div>
                    <p className="text-sm text-white/90">{data.policySummary}</p>
                    {data.maxStayDays && <div className="mt-2 text-xs text-white/60">Up to <b className="text-white">{data.maxStayDays}</b> days</div>}
                </div>
            )}
            {!!data.requirements?.length && (
                <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Requirements</div>
                    {data.requirements.map((r: string, i: number) => (
                        <div key={i} className="flex gap-2 py-1 text-sm text-white/80"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-300 shrink-0" />{r}</div>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
                {data.processingTime && <Pill label="Processing" value={data.processingTime} />}
                {data.approxFeeUsd && <Pill label="Fee" value={data.approxFeeUsd} />}
            </div>
            {data.eVisaUrl && (
                <a href={data.eVisaUrl} target="_blank" rel="noreferrer" className="liquid-pill block rounded-2xl px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-cyan-300 hover:text-white">Official e-Visa Portal ↗</a>
            )}
        </div>
    );

    if (section === 'transport') return (
        <div className="space-y-4">
            {!!data.mainAirports?.length && (
                <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Airports</div>
                    {data.mainAirports.map((a: any, i: number) => (
                        <div key={i} className="liquid-pill flex items-center gap-3 rounded-2xl p-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/15"><Plane className="h-4 w-4 text-cyan-300" /></div>
                            <div className="min-w-0 flex-1">
                                <div className="font-mono text-sm font-bold text-white">{a.code}</div>
                                <div className="truncate text-xs text-white/60">{a.name} · {a.city}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
                {data.drivingSide && <Pill label="Drives" value={data.drivingSide} />}
                {data.publicTransport && <Pill label="Transit" value={data.publicTransport} />}
            </div>
            {!!data.rideHailingApps?.length && (
                <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Ride apps</div>
                    <div className="flex flex-wrap gap-2">
                        {data.rideHailingApps.map((a: string, i: number) => <span key={i} className="liquid-pill rounded-full px-3 py-1 text-xs text-white/85">{a}</span>)}
                    </div>
                </div>
            )}
            {data.domesticTravelTips && <p className="text-xs leading-relaxed text-white/70">{data.domesticTravelTips}</p>}
        </div>
    );

    if (section === 'climate') return (
        <div className="space-y-4">
            {data.summary && <p className="text-sm leading-relaxed text-white/85">{data.summary}</p>}
            {data.bestTimeToVisit && (
                <div className="rounded-2xl bg-amber-400/10 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Best time</div>
                    <div className="mt-1 text-base font-semibold text-white">{data.bestTimeToVisit}</div>
                </div>
            )}
            {!!data.seasons?.length && (
                <div className="grid gap-2 sm:grid-cols-2">
                    {data.seasons.map((s: any, i: number) => (
                        <div key={i} className="liquid-pill rounded-2xl p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">{s.name}</span>
                                {s.tempRangeC && <span className="font-mono text-[10px] text-amber-300">{s.tempRangeC}</span>}
                            </div>
                            {s.months && <div className="text-[10px] text-white/50">{s.months}</div>}
                            {s.description && <p className="mt-1 text-xs text-white/70">{s.description}</p>}
                        </div>
                    ))}
                </div>
            )}
            {!!data.packingTips?.length && (
                <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Pack</div>
                    <div className="flex flex-wrap gap-2">
                        {data.packingTips.map((t: string, i: number) => <span key={i} className="liquid-pill rounded-full px-3 py-1 text-xs text-white/85">{t}</span>)}
                    </div>
                </div>
            )}
            {!!data.warnings?.length && (
                <div className="rounded-2xl bg-rose-400/10 p-3">
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-300"><AlertTriangle className="h-3.5 w-3.5" /> Watch</div>
                    {data.warnings.map((w: string, i: number) => <div key={i} className="text-xs text-white/80">• {w}</div>)}
                </div>
            )}
        </div>
    );

    if (section === 'insights') return (
        <div className="space-y-4">
            {data.economy && <Block label="Economy" body={data.economy} />}
            {data.safety && <Block label="Safety" body={data.safety} />}
            {data.culture && <Block label="Culture" body={data.culture} />}
            {!!data.etiquette?.length && (
                <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Etiquette</div>
                    {data.etiquette.map((e: string, i: number) => (
                        <div key={i} className="flex gap-2 py-1 text-sm text-white/80"><span className="text-violet-300">•</span>{e}</div>
                    ))}
                </div>
            )}
            {!!data.religion?.length && (
                <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Religion</div>
                    <div className="space-y-2">
                        {data.religion.map((r: any, i: number) => (
                            <div key={i}>
                                <div className="mb-1 flex justify-between text-xs"><span className="text-white/80">{r.name}</span><span className="text-white/50">{r.percentage}%</span></div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5"><div className="h-full bg-gradient-to-r from-cyan-300 to-violet-300" style={{ width: `${r.percentage}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {!!data.famousFor?.length && (
                <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Famous for</div>
                    <div className="flex flex-wrap gap-2">
                        {data.famousFor.map((f: string, i: number) => <span key={i} className="liquid-pill rounded-full px-3 py-1 text-xs text-white/85">{f}</span>)}
                    </div>
                </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
                {data.gdpPerCapitaUsd && <Pill label="GDP/cap" value={data.gdpPerCapitaUsd} />}
                {data.hdi && <Pill label="HDI" value={data.hdi} />}
            </div>
        </div>
    );

    return null;
};

const Pill = ({ label, value }: { label: string; value: string }) => (
    <div className="liquid-pill rounded-2xl p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
        <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
    </div>
);

const Block = ({ label, body }: { label: string; body: string }) => (
    <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
        <p className="text-sm leading-relaxed text-white/85">{body}</p>
    </div>
);
