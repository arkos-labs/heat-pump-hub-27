import { Client, ClientStatus, statusLabels } from '@/types/client';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Mail,
  MapPin,
  Home,
  Thermometer,
  Calendar,
  FileText,
  Plus,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TechnicalAuditForm } from './TechnicalAuditForm';

interface ClientDetailProps {
  client: Client;
  onStatusChange: (status: ClientStatus) => void;
  onAddRdv: () => void;
  onUpdateClient: (updatedClient: Client) => void;
}

export function ClientDetail({ client, onStatusChange, onAddRdv, onUpdateClient }: ClientDetailProps) {
  const appointmentTypeLabels = {
    visite_technique: 'Visite technique',
    installation: 'Installation',
    suivi: 'Suivi',
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {client.prenom} {client.nom}
          </h2>
          <p className="text-muted-foreground">
            Client depuis le{' '}
            {new Date(client.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="flex gap-2">
          {client.status === 'en_cours' && (
            <Button
              onClick={() => {
                if (confirm('Confirmer la fin du chantier ? Le dossier sera archivé.')) {
                  onStatusChange('termine');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Terminer Chantier
            </Button>
          )}

          <Select value={client.status} onValueChange={(v) => onStatusChange(v as ClientStatus)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Informations Globales</TabsTrigger>
          <TabsTrigger value="technical">Audit Technique</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          {/* Coordonnées */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.telephone}`} className="text-primary hover:underline">
                  {client.telephone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                  {client.email}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{client.adresse}</p>
                  <p className="text-muted-foreground">
                    {client.codePostal} {client.ville}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identifiant Qhare (Manuel) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Synchronisation Qhare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <label htmlFor="qhare-id" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    ID Qhare
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="qhare-id"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Ex: 1683214"
                      defaultValue={(() => {
                        if (!client.notes) return '';
                        const match = client.notes.match(/ID Qhare:\s*([a-zA-Z0-9-]+)/);
                        return match ? match[1] : '';
                      })()}
                      onBlur={(e) => {
                        const newId = e.target.value;
                        let newNotes = client.notes || '';

                        // Regex pour trouver l'ID existant
                        const regex = /ID Qhare:\s*([a-zA-Z0-9-]+)/;

                        if (regex.test(newNotes)) {
                          // On remplace l'ID existant
                          newNotes = newNotes.replace(regex, `ID Qhare: ${newId}`);
                        } else {
                          // On l'ajoute (avec un saut de ligne si notes non vides)
                          newNotes = newNotes ? `${newNotes}\nID Qhare: ${newId}` : `ID Qhare: ${newId}`;
                        }

                        onUpdateClient({ ...client, notes: newNotes });
                      }}
                    />
                  </div>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Le numéro à la fin de l'URL du client sur Qhare (ex: leads/<b>1683214</b>/edit).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails du chantier */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Détails du chantier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">
                      {client.typeLogement === 'maison' ? 'Maison' : 'Appartement'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 flex items-center justify-center text-muted-foreground text-sm font-bold">
                    m²
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surface</p>
                    <p className="font-medium">{client.surface} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Chauffage actuel</p>
                    <p className="font-medium">{client.typeChauffageActuel}</p>
                  </div>
                </div>
                {client.puissanceEstimee && (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 flex items-center justify-center text-muted-foreground text-sm font-bold">
                      kW
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Puissance estimée</p>
                      <p className="font-medium">{client.puissanceEstimee}</p>
                    </div>
                  </div>
                )}
              </div>
              {client.notes && (
                <div className="pt-3 border-t">
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p>{client.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rendez-vous */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Rendez-vous</CardTitle>
              <Button size="sm" onClick={onAddRdv}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {client.rdvs.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Aucun rendez-vous planifié
                </p>
              ) : (
                <div className="space-y-3">
                  {client.rdvs.map((rdv) => (
                    <div
                      key={rdv.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Calendar className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {new Date(rdv.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                          <span className="text-sm text-muted-foreground">
                            {rdv.time}
                          </span>
                        </div>
                        <p className="text-sm text-primary">
                          {appointmentTypeLabels[rdv.type]}
                        </p>
                        {rdv.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rdv.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="mt-4">
          <TechnicalAuditForm
            client={client}
            onSave={(technicalData) => onUpdateClient({ ...client, technicalData })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
