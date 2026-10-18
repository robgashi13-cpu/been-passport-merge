import { useState } from 'react';
import { Plane, ArrowRight, Clock } from 'lucide-react';

const MOCK_FLIGHTS = [
    { id: 'LH456', airline: 'Lufthansa', dest: 'Frankfurt (FRA)', time: '14:30', status: 'On Time', gate: 'B12' },
    { id: 'UA987', airline: 'United', dest: 'New York (JFK)', time: '15:15', status: 'Boarding', gate: 'C4' },
    { id: 'SQ321', airline: 'Singapore Air', dest: 'Singapore (SIN)', time: '16:00', status: 'Delayed', gate: 'A8' },
    { id: 'EK202', airline: 'Emirates', dest: 'Dubai (DXB)', time: '16:45', status: 'On Time', gate: 'B6' },
    { id: 'BA112', airline: 'British Airways', dest: 'London (LHR)', time: '17:20', status: 'On Time', gate: 'D2' },
];

export const FlightBoard = ({ city = "Prishtina" }: { city?: string }) => {
    return (
        <div className="bg-black/90 rounded-xl overflow-hidden border border-white/10 font-mono shadow-2xl animate-fade-in">
            <div className="bg-luxury-charcoal p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Plane className="text-luxury-gold w-6 h-6 rotate-45" />
                    <div>
                        <h3 className="text-luxury-gold font-bold uppercase tracking-widest text-lg">Departures</h3>
                        <p className="text-white/60 text-xs uppercase">{city} International</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="divide-y divide-white/5">
                <div className="grid grid-cols-12 gap-2 p-3 text-xs text-white/50 uppercase tracking-wider">
                    <div className="col-span-2">Flight</div>
                    <div className="col-span-4">Destination</div>
                    <div className="col-span-2 text-right">Time</div>
                    <div className="col-span-1 text-center">Gate</div>
                    <div className="col-span-3 text-right">Status</div>
                </div>

                {MOCK_FLIGHTS.map((flight) => (
                    <div key={flight.id} className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-white/5 transition-colors items-center">
                        <div className="col-span-2 font-bold text-white">{flight.id}</div>
                        <div className="col-span-4 text-white/80 truncate">{flight.dest}</div>
                        <div className="col-span-2 text-right text-luxury-gold font-bold">{flight.time}</div>
                        <div className="col-span-1 text-center text-white/60">{flight.gate}</div>
                        <div className="col-span-3 text-right">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${flight.status === 'On Time' ? 'text-green-400 bg-green-400/10' :
                                    flight.status === 'Delayed' ? 'text-red-400 bg-red-400/10' :
                                        'text-yellow-400 bg-yellow-400/10 animate-pulse'
                                }`}>
                                {flight.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
