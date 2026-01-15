import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Appointment } from '@/types/client';
import { Truck, Calendar } from 'lucide-react';

interface SimplifiedAppointment {
  date: string;
  clientZip: string;
  clientName: string;
}

interface AddRdvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (rdv: Omit<Appointment, 'id'>) => void;
  clientName: string;
  currentClientZip?: string;
  allAppointments?: SimplifiedAppointment[];
}

export function AddRdvDialog({ open, onOpenChange, onAdd, clientName, currentClientZip = '', allAppointments = [] }: AddRdvDialogProps) {
  const [formData, setFormData] = useState<{
    date: string;
    time: string;
    type: 'installation' | 'visite_technique' | 'suivi';
    notes: string;
  }>({
    date: '',
    time: '09:00',
    type: 'installation',
    notes: '',
  });

  // LOGIQUE D'OPTIMISATION DE TOURNEE
  const suggestions = allAppointments.filter(rdv => {
    if (!currentClientZip || !rdv.clientZip || !rdv.date) return false;

    const targetDept = currentClientZip.substring(0, 2);
    const rdvDept = rdv.clientZip.substring(0, 2);

    // On ne suggère que les dates futures ou aujourd'hui
    const isFuture = new Date(rdv.date) >= new Date(new Date().setHours(0, 0, 0, 0));

    return targetDept === rdvDept && isFuture;
  }).slice(0, 3); // On garde les 3 plus proches

  const handleSelectSuggestion = (date: string) => {
    setFormData({ ...formData, date });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData as any);
    setFormData({
      date: '',
      time: '09:00',
      type: 'installation',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau RDV - {clientName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* OPTIMISATION VISUELLE - VERSION PRO */}
          {suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 text-sm">Tournées détectées à proximité</p>
                  <p className="text-xs text-blue-600">Optimisez vos trajets en groupant les RDV</p>
                </div>
              </div>

              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSuggestion(s.date)}
                    className="w-full flex items-center justify-between bg-white hover:bg-blue-50 border border-blue-100 p-2 rounded-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">{new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p className="text-xs text-gray-500">avec {s.clientName}</p>
                      </div>
                    </div>
                    <div className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {s.clientZip}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type de rendez-vous</Label>
            <div className="p-2 border rounded-md bg-muted text-muted-foreground text-sm">
              Installation (Défaut)
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Informations pour ce RDV..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Planifier le RDV</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
