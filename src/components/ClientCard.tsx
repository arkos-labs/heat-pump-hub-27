import { Client } from '@/types/client';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MapPin, Calendar, Home } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  isSelected?: boolean;
}

export function ClientCard({ client, onClick, isSelected }: ClientCardProps) {
  // Trouver le PROCHAIN RDV (Aujourd'hui ou futur)
  // On trie pour prendre le plus proche dans le futur
  const upcomingRdvs = (client.rdvs || [])
    .filter(rdv => {
      if (!rdv.date) return false;
      // On inclut aujourd'hui (début de journée)
      const rdvDate = new Date(rdv.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return rdvDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextRdv = upcomingRdvs[0];

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${isSelected ? 'ring-2 ring-primary shadow-md border-l-primary' : 'border-l-transparent'
        }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="font-semibold text-foreground truncate">
              {client.prenom} {client.nom}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{client.ville} {client.codePostal && `(${client.codePostal.substring(0, 2)})`}</span>
            </div>
          </div>
          <StatusBadge status={client.status} />
        </div>

        {/* SECTION DATE RDV - Mise en avant "Colonne" */}
        {nextRdv ? (
          <div className="mb-3 mt-1 bg-blue-50 border border-blue-100 rounded-md p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Calendar className="h-4 w-4" />
              <span className="font-bold text-sm">
                {new Date(nextRdv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-xs text-blue-600">
                ({nextRdv.time})
              </span>
            </div>
            <div className="text-[10px] uppercase font-bold text-blue-400 bg-white px-1.5 py-0.5 rounded border border-blue-100">
              {nextRdv.type === 'installation' ? 'INSTALLATION' : 'RDV'}
            </div>
          </div>
        ) : (
          <div className="mb-2 h-1" /> /* Spacer if no RDV */
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Home className="h-3 w-3" />
            <span>
              {client.typeLogement === 'maison' ? 'Maison' : 'Appart.'}
              {client.surface > 0 && ` • ${client.surface} m²`}
            </span>
          </div>
          {/* 
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span>{client.telephone}</span>
          </div> 
          */}
        </div>
      </CardContent>
    </Card>
  );
}
