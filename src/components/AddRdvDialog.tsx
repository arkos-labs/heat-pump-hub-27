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
  // On cherche des RDV existants dans le même secteur (2 premiers chiffres du Code Postal)
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

          {/* OPTIMISATION VISUELLE */}
          {suggestions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm mb-2">
              <p className="font-semibold text-green-800 flex items-center gap-1">
                🌱 Optimisation Tournée (Même secteur) :
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectSuggestion(s.date)}
                    className="cursor-pointer bg-white border border-green-300 px-2 py-1 rounded text-green-700 hover:bg-green-100 transition-colors text-xs"
                  >
                    📅 {new Date(s.date).toLocaleDateString('fr-FR')} <br />
                    (Avec {s.clientName} - {s.clientZip})
                  </div>
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

          {/* Type fixed to installation (hidden from user or shown as text) */}
          <div className="space-y-2">
            <Label>Type de rendez-vous</Label>
            <div className="p-2 border rounded-md bg-muted text-muted-foreground text-sm">
              Installation
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
