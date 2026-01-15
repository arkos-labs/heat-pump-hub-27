import { useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';
import { Client, ClientStatus, Appointment } from '@/types/client';
import { supabase } from '@/lib/supabaseClient';
import { clientService } from '@/services/clientService';
import { ClientCard } from '@/components/ClientCard';
import { ClientDetail } from '@/components/ClientDetail';

import { AddRdvDialog } from '@/components/AddRdvDialog';
import { DashboardStats } from '@/components/DashboardStats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { statusLabels } from '@/types/client';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { useSearchParams } from 'react-router-dom';

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]); // Initialize with empty array
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddRdv, setShowAddRdv] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams(); // Add this line

  // Fetch clients from Supabase and auto-update status based on date
  useEffect(() => {
    const loadClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const today = new Date();
          const mappedClients: Client[] = data.map((row: any) => {
            const appointments = row.appointments || [];
            let computedStatus = (row.status as ClientStatus) || 'nouveau';

            // AUTO-STATUS: If status is 'rdv_planifie' BUT the date is TODAY, switch to 'en_cours'
            // This is only a display logic for now.
            const hasRdvToday = appointments.some((rdv: any) => isSameDay(new Date(rdv.date), today));

            if (hasRdvToday && computedStatus === 'rdv_planifie') {
              computedStatus = 'en_cours';
            }

            return {
              id: row.id.toString(),
              nom: row.nom || 'Inconnu',
              prenom: row.prenom || '',
              email: row.email || '',
              telephone: row.telephone || '',
              adresse: row.adresse || '',
              ville: row.ville || '',
              codePostal: row.code_postal || '',
              status: computedStatus,
              typeLogement: row.type_logement || 'maison',
              surface: row.surface || (row.technical_data?.qhare_info?.surface_habitable ? parseFloat(row.technical_data.qhare_info.surface_habitable) : 0),
              typeChauffageActuel: row.type_chauffage_actuel || 'inconnu',
              rdvs: appointments,
              createdAt: row.created_at,
              technicalData: row.technical_data,
              source: row.source,
              notes: row.notes
            };
          });

          // DEDUPLICATION FRONTEND
          // On s'assure de n'afficher qu'une seule fois un même client (basé sur ID Qhare ou Email)
          const uniqueClients: Client[] = [];
          const seenIds = new Set();

          mappedClients.forEach((client) => {
            // 1. Essayer de trouver l'ID Qhare
            let uniqueIdentifier = client.technicalData?.qhare_info?.id;

            // 2. Si pas d'ID Qhare, utiliser l'email
            if (!uniqueIdentifier && client.email) {
              uniqueIdentifier = client.email.toLowerCase();
            }

            // 3. Fallback: ID interne (s'il n'a ni ID Qhare ni email, c'est probablement un vieux test ou un client manuel, on le garde)
            if (!uniqueIdentifier) {
              uniqueIdentifier = `internal_${client.id}`;
            }

            if (!seenIds.has(uniqueIdentifier)) {
              seenIds.add(uniqueIdentifier);
              uniqueClients.push(client);
            }
          });

          setClients(uniqueClients);

          // Deep linking logic: Check if URL has client_id
          const urlClientId = searchParams.get('client_id');
          if (urlClientId) {
            const targetClient = mappedClients.find(c => c.id === urlClientId);
            if (targetClient) {
              setSelectedClient(targetClient);
              // Clean URL optionally or leave it
              // setSearchParams({}); 
            }
          }

        }
      } catch (err) {
        console.error("Erreur chargement Supabase:", err);
        toast.error("Impossible de charger les clients");
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, [searchParams]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      `${client.prenom} ${client.nom} ${client.ville}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;
    const isQhare = client.source === 'qhare';

    return matchesSearch && matchesStatus && isQhare;
  });

  const handleStatusChange = async (status: ClientStatus) => {
    if (!selectedClient) return;

    // Optimistic update
    const updatedClient = { ...selectedClient, status };
    setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);

    try {
      await clientService.updateClient(selectedClient.id, { status });
      toast.success("Statut mis à jour");

      // SYNC QHARE: Si le statut passe à "Terminé", on prévient Qhare
      if (status === 'termine') {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Stratégie plus robuste pour trouver la date de pose :
        // 1. Chercher "installation"
        // 2. Sinon "visite_technique"
        // 3. Sinon le premier RDV de la liste (n'importe lequel)
        let installRdv = updatedClient.rdvs.find(r => r.type === 'installation');
        if (!installRdv) installRdv = updatedClient.rdvs.find(r => r.type === 'visite_technique');
        if (!installRdv && updatedClient.rdvs.length > 0) installRdv = updatedClient.rdvs[0];

        const datePose = installRdv ? installRdv.date : undefined;

        // Formatage français des dates (JJ/MM/AAAA)
        const [ty, tm, td] = today.split('-');
        const todayFr = `${td}/${tm}/${ty}`;

        let datePoseFr = undefined;
        if (datePose) {
          const [y, m, d] = datePose.split('-');
          datePoseFr = `${d}/${m}/${y}`;
        }

        // Message de DEBUG pour l'utilisateur
        toast.info(`Synchro Dates : Début=${datePoseFr || 'Aucune'} / Fin=${todayFr}`);

        // On passe l'ÉTAT principal à "Terminer", on vide le sous-état, et on envoie les DATES
        await syncWithQhare(updatedClient, 'Terminer', 'null', {
          date_fin: todayFr,
          date_pose: datePoseFr
        });
      }

    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du statut");
      // Revert (idealement)
    }
  };

  const handleClientUpdate = async (updatedClientData: Client) => {
    // Check if notes changed and contain audit summary
    const oldClient = clients.find(c => c.id === updatedClientData.id);
    const oldNotes = oldClient?.notes || '';
    const newNotes = updatedClientData.notes || '';

    // Optimistic update
    setClients(clients.map(c => c.id === updatedClientData.id ? updatedClientData : c));
    setSelectedClient(updatedClientData);

    try {
      await clientService.updateClient(updatedClientData.id, updatedClientData);
      toast.success("Informations sauvegardées");

      // SYNC AUDIT TO QHARE
      // SYNC AUDIT TO QHARE
      const OLD_BLOCK_START = "--- ⬇️ AUDIT TECHNIQUE ⬇️ ---";
      const OLD_BLOCK_END = "--- ⬆️ FIN AUDIT ⬆️ ---";

      const NEW_BLOCK_START_REGEX = /\[AUDIT TECHNIQUE PAC - .*?\]/;
      const NEW_BLOCK_END = "[FIN AUDIT]";

      if (newNotes !== oldNotes) {
        let auditBlock = null;

        // 1. Check New Format
        if (NEW_BLOCK_START_REGEX.test(newNotes) && newNotes.includes(NEW_BLOCK_END)) {
          const match = newNotes.match(/\[AUDIT TECHNIQUE PAC - .*?\][\s\S]*?\[FIN AUDIT\]/);
          if (match) auditBlock = match[0];
        }
        // 2. Check Old Format (Fallback)
        else if (newNotes.includes(OLD_BLOCK_START) && newNotes.includes(OLD_BLOCK_END)) {
          // Extract the block
          const regex = new RegExp(`${OLD_BLOCK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${OLD_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
          const match = newNotes.match(regex);
          if (match) auditBlock = match[0];
        }

        if (auditBlock) {
          await syncWithQhare(updatedClientData, undefined, undefined, undefined, auditBlock);
          toast.info("Audit technique envoyé à Qhare (Commentaires)");
        }
      }

    } catch (error: any) {
      console.error(error);
      toast.error(`Erreur sauvegarde: ${error.message || error.details || 'Inconnue'}`);
    }
  }

  // Fonction utilitaire pour extraire l'ID Qhare des notes
  const getQhareId = (client: Client): string | null => {
    if (!client.notes) return null;
    // Cherche le premier groupe de chiffres après "ID Qhare:" (ignore les répétitions de texte)
    const match = client.notes.match(/ID Qhare:.*?(\d+)/i);
    return match ? match[1] : null;
  };

  const syncWithQhare = async (
    client: Client,
    etat: string | undefined,
    sous_etat: string | undefined,
    dates?: { date_pose?: string, date_fin?: string, date_rdv?: string, type_rdv?: string },
    comment?: string
  ) => {
    const qhareId = getQhareId(client);

    if (!qhareId) return;

    // Sécurité: Vérifier que c'est bien des chiffres
    if (!/^\d+$/.test(qhareId)) {
      console.error("ID Invalide detecté:", qhareId);
      return;
    }

    const ACCESS_TOKEN = '8G0FCtzJUdLtdsA6Deznd2bc8zhZFzSlz_VxtPtS9Cg';
    const TARGET_URL = 'https://qhare.fr/api/lead/update';

    // Modifié pour utiliser POST (Standard pour updates)
    // GET renvoyait 404 pour l'endpoint update qui attend probablement un body
    const sendRequest = async (bodyParams: URLSearchParams) => {
      try {
        console.log(`[Sync Qhare] POST Request to ${TARGET_URL}`);

        const res = await fetch(TARGET_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: bodyParams
        });
        const json = await res.json();
        return json;
      } catch (err) {
        console.error("Qhare Direct Fetch Error", err);
        throw err;
      }
    };

    try {
      // 1. CONSTRUCTION PAYLOAD PRINCIPAL
      const params = new URLSearchParams();
      params.append('access_token', ACCESS_TOKEN);
      params.append('id', qhareId);

      if (etat) params.append('etat', etat);
      if (sous_etat !== undefined) params.append('sous_etat', sous_etat);

      // Dates
      // Dates handling - Brute force formats & fields to ensure calendar sync
      if (dates?.date_pose) params.append('date_pose', dates.date_pose);
      if (dates?.date_fin) params.append('date_fin', dates.date_fin);
      if (dates?.type_rdv) params.append('type_rdv', dates.type_rdv); // Add type_rdv param

      if (dates?.date_rdv) {
        // format input: YYYY-MM-DD HH:mm:ss
        const isoParts = dates.date_rdv.split(/[- :]/);
        if (isoParts.length >= 5) {
          const [y, m, d, h, min] = isoParts;

          // Create Date objects to compute End Date (+2 hours duration default)
          const startDateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min));
          const endDateObj = new Date(startDateObj);
          endDateObj.setHours(endDateObj.getHours() + 2);

          const formatISO = (date: Date) => {
            const yy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const mi = String(date.getMinutes()).padStart(2, '0');
            return `${yy}-${mm}-${dd} ${hh}:${mi}:00`;
          };

          const formatFR = (date: Date) => {
            const yy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${dd}/${mm}/${yy}`;
          };
          const formatTime = (date: Date) => {
            const hh = String(date.getHours()).padStart(2, '0');
            const mi = String(date.getMinutes()).padStart(2, '0');
            return `${hh}:${mi}`;
          };

          const isoStart = formatISO(startDateObj);
          const isoEnd = formatISO(endDateObj);

          const frDate = formatFR(startDateObj);
          const frTime = formatTime(startDateObj);
          const frDateTime = `${frDate} ${frTime}`;


          // 4. STRATÉGIE ISO STANDARDISEE (YYYY-MM-DD HH:mm:ss)
          // Plus robuste pour les API que le format FR

          // NB: On ne surcharge PAS date_pose ici si elle a déjà été passée
          if (!dates.date_pose) {
            params.append('date_pose', isoStart);
          }

          params.append('date_installation', isoStart);

          params.append('date_rdv', isoStart);
          params.append('date_rendez_vous', isoStart);
          params.append('start', isoStart);
          params.append('end', isoEnd);

          // Champs date seule / heure seule pour compatibilité legacy
          const [datePart, timePart] = isoStart.split(' ');
          params.append('date', datePart);
          params.append('heure', timePart?.substring(0, 5)); // HH:mm

          toast.info(`Qhare Sync: ${isoStart}`);
        } else {
          // Fallback si pas de date traitée
          if (dates.date_rdv) params.append('date_rdv', dates.date_rdv);
        }
      }

      // Extras Mapping
      params.append('surface_habitable', client.surface ? client.surface.toString() : '');
      params.append('type_logement', client.typeLogement || '');
      params.append('type_chauffage', client.typeChauffageActuel || '');
      params.append('type_toiture', client.technicalData?.elec?.typeCouverture || '');

      // Mandatory Fields for Qhare
      params.append('btob', '0');
      params.append('raison_sociale', 'Particulier');

      console.log("[Sync Qhare] Sending Main Update...", Object.fromEntries(params));
      const resultMain = await sendRequest(params);

      // 2. ENVOI COMMENTAIRE (SÉPARÉ)
      if (comment) {
        console.log("[Sync Qhare] Sending Comment...", comment.substring(0, 50));
        const noteParams = new URLSearchParams();
        noteParams.append('access_token', ACCESS_TOKEN);
        noteParams.append('id', qhareId);
        noteParams.append('commentaire', comment);
        noteParams.append('notes', comment); // Redondance pour sécurité
        // On ne remet PAS l'état ici pour ne pas écraser
        await sendRequest(noteParams);
      }

      // AFFICHAGE REPONSE COMPLETE
      console.log("Qhare Raw Response:", resultMain);
      if (resultMain && (resultMain.success || resultMain.status === 'success' || resultMain.id)) {
        toast.success(`Qhare OK: ${JSON.stringify(resultMain).substring(0, 100)}`);
      } else {
        toast.error(`Echec Qhare (ID: ${qhareId}): ${JSON.stringify(resultMain)}`);
      }

    } catch (e: any) {
      console.error("Erreur sync Qhare", e);
      // On affiche l'ID pour aider au debug
      toast.error(`Erreur synchro Qhare (ID: ${qhareId}): ${e.message || 'Introuvable'}`);
    }
  };

  const handleAddRdv = async (rdvData: Omit<Appointment, 'id'>) => {
    if (!selectedClient) return;

    // 1. Vérification de conflit de date
    const newRdvDate = new Date(rdvData.date);
    const conflictingClient = clients.find(c =>
      c.rdvs.some(r => isSameDay(new Date(r.date), newRdvDate))
    );

    if (conflictingClient) {
      toast.error(`Impossible : ${conflictingClient.prenom} ${conflictingClient.nom} est déjà planifié ce jour-là !`, {
        description: "Un seul chantier/RDV par jour autorisé.",
        duration: 5000,
      });
      return;
    }

    const newRdv: Appointment = {
      ...rdvData,
      id: Date.now().toString(),
    };

    const updatedClient = {
      ...selectedClient,
      rdvs: [...selectedClient.rdvs, newRdv],
      status: 'rdv_planifie' as ClientStatus,
    };

    // Optimistic
    setClients(clients.map((c) =>
      c.id === selectedClient.id ? updatedClient : c
    ));
    setSelectedClient(updatedClient);

    try {
      await clientService.addAppointment(selectedClient.id, newRdv);
      toast.success("Rendez-vous planifié");

      // SYNC QHARE: Sous-état -> Planifier + DATE POSE (Format YYYY-MM-DD standard API)
      // const [y, m, d] = rdvData.date.split('-');
      // const formattedDate = `${d}/${m}/${y}`; 
      // Qhare semble préférer YYYY-MM-DD (ISO) ou timestamps, essayons le format standard HTML

      // SYNC QHARE: FORCE ETAT 'Pose' pour affichage Planning + Date FR
      const [y, m, d] = rdvData.date.split('-');
      const datePoseFr = `${d}/${m}/${y}`;

      await syncWithQhare(selectedClient, 'Pose', 'Planifié', {
        date_pose: datePoseFr, // DD/MM/YYYY
        date_rdv: `${rdvData.date} ${rdvData.time}:00`, // YYYY-MM-DD HH:mm:ss (Gardé pour le calcul interne ISO)
        type_rdv: rdvData.type // ex: installation
      });

    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la planification");
    }
  };

  // Function to mark client as finished
  const handleMarkAsTermine = async (client: Client) => {
    if (!confirm("Confirmer la fin du chantier ? Le client sera archivé dans 'Terminés'.")) return;

    // Update local & DB
    await handleStatusChange('termine');

    // SYNC QHARE: Sous-état -> Terminer
    await syncWithQhare(client, undefined, 'Terminer');
  };

  const handleSimulateJourJ = async () => {
    if (!selectedClient) return;
    if (!confirm("Simuler le Jour J (Démarrage chantier) ?\nCela passera le client en 'En cours' et mettra à jour Qhare.")) return;

    // 1. Update local
    const updatedClient = { ...selectedClient, status: 'en_cours' as ClientStatus };
    setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);

    // 2. Persist to DB
    try {
      await clientService.updateClient(selectedClient.id, { status: 'en_cours' });
      toast.success("Jour J simulé : Client passé 'En cours'");

      // Retrouver la date de pose (stratégie robuste)
      let installRdv = updatedClient.rdvs.find(r => r.type === 'installation');
      if (!installRdv) installRdv = updatedClient.rdvs.find(r => r.type === 'visite_technique');
      if (!installRdv && updatedClient.rdvs.length > 0) installRdv = updatedClient.rdvs[0];

      const datePose = installRdv ? installRdv.date : undefined;

      let datePoseFr = undefined;
      if (datePose) {
        const [y, m, d] = datePose.split('-');
        datePoseFr = `${d}/${m}/${y}`;
      }

      // 3. Sync Qhare -> Installation en cours (Terme plus précis que "En cours")
      await syncWithQhare(updatedClient, undefined, "Installation en cours", {
        date_pose: datePoseFr
      });

    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la simulation");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
                <p className="text-sm text-muted-foreground">
                  Vue d'ensemble de vos installations et rendez-vous.
                </p>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Stats */}
        <DashboardStats clients={clients} />

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contenu principal avec Onglets */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Tabs defaultValue="a_traiter" className="w-full lg:col-span-1">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="a_traiter">À traiter</TabsTrigger>
              <TabsTrigger value="en_cours">En cours</TabsTrigger>
              <TabsTrigger value="termines">Terminés</TabsTrigger>
            </TabsList>

            {/* Onglet À Traiter */}
            <TabsContent value="a_traiter" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Nouveaux & Non planifiés
                </h2>
                <Badge variant="secondary">{clients.filter(c => ['nouveau', 'contacte'].includes(c.status)).length}</Badge>
              </div>

              <div className="space-y-3">
                {filteredClients
                  .filter(c => ['nouveau', 'contacte'].includes(c.status))
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Aucun client à traiter</p>
                  </div>
                ) : (
                  filteredClients
                    .filter(c => ['nouveau', 'contacte'].includes(c.status))
                    .map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClick={() => setSelectedClient(client)}
                        isSelected={selectedClient?.id === client.id}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            {/* Onglet En Cours */}
            <TabsContent value="en_cours" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Planifiés & En installation
                </h2>
                <Badge variant="secondary">{clients.filter(c => ['rdv_planifie', 'en_cours'].includes(c.status)).length}</Badge>
              </div>

              <div className="space-y-3">
                {filteredClients
                  .filter(c => ['rdv_planifie', 'en_cours'].includes(c.status))
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Aucun client en cours</p>
                  </div>
                ) : (
                  filteredClients
                    .filter(c => ['rdv_planifie', 'en_cours'].includes(c.status))
                    .map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClick={() => setSelectedClient(client)}
                        isSelected={selectedClient?.id === client.id}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            {/* Onglet Terminés */}
            <TabsContent value="termines" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Dossiers clôturés
                </h2>
                <Badge variant="secondary">{clients.filter(c => c.status === 'termine').length}</Badge>
              </div>

              <div className="space-y-3">
                {filteredClients
                  .filter(c => c.status === 'termine')
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Aucun client terminé</p>
                  </div>
                ) : (
                  filteredClients
                    .filter(c => c.status === 'termine')
                    .map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClick={() => setSelectedClient(client)}
                        isSelected={selectedClient?.id === client.id}
                      />
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Détail client (Colonne de droite permanente) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {selectedClient ? (
              <ClientDetail
                client={selectedClient}
                onStatusChange={handleStatusChange}
                onAddRdv={() => setShowAddRdv(true)}
                onUpdateClient={handleClientUpdate}
                onSimulateJourJ={handleSimulateJourJ}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg text-muted-foreground bg-muted/30">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium">Sélectionnez un client</p>
                <p className="text-sm">Cliquez sur un client à gauche pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      {selectedClient && (
        <AddRdvDialog
          open={showAddRdv}
          onOpenChange={setShowAddRdv}
          onAdd={handleAddRdv}
          clientName={`${selectedClient.prenom} ${selectedClient.nom}`}
          currentClientZip={selectedClient.codePostal}
          allAppointments={clients.flatMap(c =>
            (c.rdvs || [])
              .filter(r => r.type === 'installation') // On ne regarde que les installations pour grouper ? Ou tout ? Disons installations pour l'instant ou tout. L'utilisateur a dit "quand je veut placer un client pour son instalation".
              // Mais s'il y a une visite technique à côté, c'est bien aussi. Gardons tout.
              .map(r => ({
                date: r.date,
                clientZip: c.codePostal,
                clientName: c.nom
              }))
          )}
        />
      )}
    </div>
  );
};

export default Index;
