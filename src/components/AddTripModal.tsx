import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, Plane, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/data/countries';
import { TripEntry } from '@/data/trips';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

interface AddTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCountryCode?: string;
}

export const AddTripModal = ({ isOpen, onClose, initialCountryCode }: AddTripModalProps) => {
    const { addTrip } = useUser();
    const [countryCode, setCountryCode] = useState(initialCountryCode || '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [cityName, setCityName] = useState('');
    const [notes, setNotes] = useState('');
    const [transportMode, setTransportMode] = useState<string>('plane');

    useEffect(() => {
        if (initialCountryCode) setCountryCode(initialCountryCode);
    }, [initialCountryCode]);

    // Body scroll lock
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const country = countries.find(c => c.code === countryCode);
        if (!country) return;

        const newTrip: TripEntry = {
            id: uuidv4(),
            countryCode,
            countryName: country.name,
            cityName: cityName || undefined,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            transportMode: transportMode as any,
            notes: notes || undefined,
            createdAt: new Date(),
        };

        addTrip(newTrip);
        toast.success(`Trip to ${country.name} added!`);
        onClose();

        // Reset form
        setCountryCode('');
        setStartDate('');
        setEndDate('');
        setCityName('');
        setNotes('');
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg max-h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-zoom-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <div>
                        <h2 className="text-xl font-display font-bold">Add Trip</h2>
                        <p className="text-sm text-muted-foreground">Log a past or future trip</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

                    <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Select onValueChange={setCountryCode} value={countryCode}>
                            <SelectTrigger id="country" className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] z-[10002]">
                                {countries.sort((a, b) => a.name.localeCompare(b.name)).map(country => (
                                    <SelectItem key={country.code} value={country.code}>
                                        <span className="flex items-center gap-2">
                                            <span>{country.flagEmoji}</span>
                                            <span>{country.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="city">City (Optional)</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="city"
                                placeholder="e.g. Paris"
                                className="pl-9 bg-white/5 border-white/10"
                                value={cityName}
                                onChange={e => setCityName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <input
                                id="startDate"
                                type="date"
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:dark]"
                                required
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <input
                                id="endDate"
                                type="date"
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:dark]"
                                required
                                value={endDate}
                                min={startDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="transport">Transport Mode</Label>
                        <Select onValueChange={setTransportMode} value={transportMode}>
                            <SelectTrigger id="transport" className="bg-white/5 border-white/10">
                                <div className="flex items-center gap-2">
                                    <Plane className="w-4 h-4" />
                                    <SelectValue placeholder="Select mode" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="z-[10002]">
                                <SelectItem value="plane">Plane</SelectItem>
                                <SelectItem value="train">Train</SelectItem>
                                <SelectItem value="car">Car</SelectItem>
                                <SelectItem value="bus">Bus</SelectItem>
                                <SelectItem value="boat">Boat</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Memorable moments..."
                            className="bg-white/5 border-white/10 min-h-[80px]"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-6 rounded-xl">
                        <Save className="w-5 h-5 mr-2" />
                        Save Trip
                    </Button>

                </form>
            </div>
        </div>,
        document.body
    );
};
