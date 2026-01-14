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
import { ClientDocuments } from './ClientDocuments';

interface ClientDetailProps {
  client: Client;
  onStatusChange: (status: ClientStatus) => void;
  onAddRdv: () => void;
  onUpdateClient: (updatedClient: Client) => void;
  onSimulateJourJ: () => void;
}

export function ClientDetail({ client, onStatusChange, onAddRdv, onUpdateClient, onSimulateJourJ }: ClientDetailProps) {
  const appointmentTypeLabels = {
    visite_technique: 'Visite technique',
    installation: 'Installation',
    suivi: 'Suivi',
  };

  const renderQhareField = (label: string, value: any) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{String(value)}</span>
      </div>
    );
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

        <div className="flex gap-2 flex-wrap">
          {/* Bouton de Simulation Jour J (Visible si RDV Planifié) */}
          {client.status === 'rdv_planifie' && (
            <Button
              variant="secondary"
              className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={onSimulateJourJ}
            >
              🚀 Simuler Jour J
            </Button>
          )}

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informations Globales</TabsTrigger>
          <TabsTrigger value="technical">🔧 Visite Technique</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
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

          {/* Informations Complémentaires (Qhare) */}
          {/* Informations Complémentaires (Qhare) */}
          {client.technicalData?.qhare_info && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Dossier Qhare (Complet)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">

                {/* 1. INFORMATIONS CONTACT & ADMINISTRATIF */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    📝 Informations Client & Administratif
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                    {renderQhareField("Civilité", client.technicalData.qhare_info.civilite)}
                    {renderQhareField("Email", client.technicalData.qhare_info.email)}
                    {renderQhareField("Téléphone Fixe", client.technicalData.qhare_info.telephone_fixe || client.technicalData.qhare_info.tel_fixe)}

                    {renderQhareField("Département", client.technicalData.qhare_info.departement)}
                    {renderQhareField("Ville", client.technicalData.qhare_info.ville)}
                    {renderQhareField("Source Lead", client.technicalData.qhare_info.source)}

                    {renderQhareField("État Qhare", client.technicalData.qhare_info.etat)}
                    {renderQhareField("Sous-État", client.technicalData.qhare_info.sous_etat)}
                    {renderQhareField("Affectation", client.technicalData.qhare_info.affectation)}

                    {renderQhareField("Email MPR", client.technicalData.qhare_info.email_mpr)}
                    {renderQhareField("Zone (H1/H2/H3)", client.technicalData.qhare_info.zone)}
                    {renderQhareField("N° Dossier MPR", client.technicalData.qhare_info.numero_dossier_mpr || client.technicalData.qhare_info.num_dossier_mpr)}
                  </div>
                </div>

                {/* 2. AVIS D'IMPOSITION */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    💶 Avis d'Imposition
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                    {renderQhareField("Numéro Fiscal 1", client.technicalData.qhare_info.numero_fiscal_1 || client.technicalData.qhare_info.num_fiscal_1)}
                    {renderQhareField("Référence Avis 1", client.technicalData.qhare_info.reference_avis_1 || client.technicalData.qhare_info.ref_avis_1)}
                    {renderQhareField("RFR 1", client.technicalData.qhare_info.revenu_fiscal_reference_1 || client.technicalData.qhare_info.rfr_1)}

                    {renderQhareField("Numéro Fiscal 2", client.technicalData.qhare_info.numero_fiscal_2 || client.technicalData.qhare_info.num_fiscal_2)}
                    {renderQhareField("Nombre de Parts", client.technicalData.qhare_info.nombre_parts || client.technicalData.qhare_info.nb_parts)}
                    {renderQhareField("Personnes Foyer", client.technicalData.qhare_info.nombre_personnes || client.technicalData.qhare_info.personnes_foyer)}

                    {renderQhareField("Précarité", client.technicalData.qhare_info.precarite)}
                    {renderQhareField("MaPrimeRenov", client.technicalData.qhare_info.couleur_mpr || client.technicalData.qhare_info.maprimerenov)}
                  </div>
                </div>

                {/* 3. LOGEMENT & TECHNIQUE */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    🏠 Logement & Technique
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                    {renderQhareField("Statut Occupation", client.technicalData.qhare_info.proprietaire || client.technicalData.qhare_info.statut_occupation)}
                    {renderQhareField("Propriétaire Occupant", client.technicalData.qhare_info.proprietaire_occupant)}
                    {renderQhareField("Bâtiment de France", client.technicalData.qhare_info.batiment_de_france || client.technicalData.qhare_info.bdf)}

                    {renderQhareField("Type de Maison", client.technicalData.qhare_info.type_maison)}
                    {renderQhareField("Combles", client.technicalData.qhare_info.type_combles)}
                    {renderQhareField("Sol Combles", client.technicalData.qhare_info.sol_combles || client.technicalData.qhare_info.sol_combles_beton)}

                    {renderQhareField("Surface Habitable", client.technicalData.qhare_info.surface_habitable || client.technicalData.qhare_info.surface)}
                    {renderQhareField("Surface Murs Ext.", client.technicalData.qhare_info.surface_murs_exterieurs)}
                    {renderQhareField("Nombre de Pièces", client.technicalData.qhare_info.nombre_pieces || client.technicalData.qhare_info.nb_pieces)}

                    {renderQhareField("Chauffage Actuel", client.technicalData.qhare_info.chauffage || client.technicalData.qhare_info.mode_chauffage || client.technicalData.qhare_info.type_chauffage)}
                    {renderQhareField("Type Toiture", client.technicalData.qhare_info.type_toiture)}
                    {renderQhareField("Année Chaudière", client.technicalData.qhare_info.annee_chaudiere)}

                    {renderQhareField("Année Construction", client.technicalData.qhare_info.annee_construction)}
                    {renderQhareField("Numéro Parcelle", client.technicalData.qhare_info.numero_parcelle)}
                  </div>
                </div>

                {/* 5. COMMENTAIRES QHARE (1, 2, 3) */}
                {(client.technicalData.qhare_info.commentaire_1 || client.technicalData.qhare_info.commentaire_2 || client.technicalData.qhare_info.commentaire_3) && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                      💬 Commentaires
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {client.technicalData.qhare_info.commentaire_1 && <p>1: {client.technicalData.qhare_info.commentaire_1}</p>}
                      {client.technicalData.qhare_info.commentaire_2 && <p>2: {client.technicalData.qhare_info.commentaire_2}</p>}
                      {client.technicalData.qhare_info.commentaire_3 && <p>3: {client.technicalData.qhare_info.commentaire_3}</p>}
                    </div>
                  </div>
                )}

                {/* 6. BTOB INFO (Si présent) */}
                {(client.technicalData.qhare_info.btob === 1 || client.technicalData.qhare_info.btob === "1") && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                      🏢 Infos Société (BtoB)
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {renderQhareField("Raison Sociale", client.technicalData.qhare_info.raison_sociale)}
                      {renderQhareField("SIRET", client.technicalData.qhare_info.numero_siret)}
                      {renderQhareField("Code Pays", client.technicalData.qhare_info.code_pays)}
                    </div>
                  </div>
                )}

                {/* 4. CHAMPS PERSONNALISES (Si disponibles) */}
                {Array.isArray(client.technicalData.qhare_info.champs_perso) && client.technicalData.qhare_info.champs_perso.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2">Champs Personnalisés</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                      {client.technicalData.qhare_info.champs_perso.map((champ: any, idx: number) => (
                        renderQhareField(champ.nom || champ.name || champ.variable, champ.valeur || champ.value)
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          )}

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
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Chauffage actuel</p>
                    <p className="font-medium">
                      {(client.typeChauffageActuel && client.typeChauffageActuel !== 'inconnu')
                        ? client.typeChauffageActuel
                        : (client.technicalData?.qhare_info?.chauffage || "Inconnu")
                      }
                    </p>
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
                      <p className="whitespace-pre-wrap">
                        {client.notes
                          .replace(/\[AUDIT TECHNIQUE PAC[\s\S]*?\[FIN AUDIT\]/g, '') // Masquer l'audit
                          .replace(/--- ⬇️ AUDIT TECHNIQUE ⬇️ ---[\s\S]*?--- ⬆️ FIN AUDIT ⬆️ ---/g, '') // Masquer ancien audit
                          .trim() || <span className="italic opacity-50">Aucune note (Audit masqué)</span>}
                      </p>
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

        <TabsContent value="documents" className="mt-4">
          <ClientDocuments clientId={client.id} />
        </TabsContent>

        <TabsContent value="technical" className="mt-4">
          <TechnicalAuditForm
            client={client}
            onSave={(technicalData) => {
              // On met à jour les données techniques
              let updatedClient = {
                ...client,
                technicalData: technicalData
              };

              // Création du résumé pour les notes (Format simple)
              const todayStr = new Date().toLocaleDateString('fr-FR');
              const visite = technicalData.visite;

              const summaryValues = [
                `[VISITE TECHNIQUE - ${todayStr}]`,
                `Surface: ${visite?.surfaceChauffee || '?'}m² - T°: ${visite?.temperatureSouhaitee || '?'}°C`,
                `Isolation: ${visite?.typeIsolation || 'Non renseigné'}`,
                `Radiateurs: ${visite?.typeRadiateurs || '?'}`,
                `Elec: ${technicalData.elec.alimentation} - ${visite?.kva || '?'} kVA`,
                `[FIN VISITE]`
              ];

              const newFormattedBlock = summaryValues.join('\n');
              let newNotes = client.notes || '';

              // Regex pour remplacer l'ancien bloc s'il existe
              const blockRegex = /\[VISITE TECHNIQUE - .*?\][\s\S]*?\[FIN VISITE\]/;

              if (blockRegex.test(newNotes)) {
                newNotes = newNotes.replace(blockRegex, newFormattedBlock);
              } else {
                newNotes = newNotes ? `${newNotes}\n\n${newFormattedBlock}` : newFormattedBlock;
              }

              updatedClient.notes = newNotes;
              onUpdateClient(updatedClient);
            }}
          />
        </TabsContent>
      </Tabs>
    </div >
  );
}
