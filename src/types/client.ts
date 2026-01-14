export type ClientStatus = 'nouveau' | 'contacte' | 'rdv_planifie' | 'en_cours' | 'termine';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  type: 'installation' | 'visite_technique' | 'suivi';
  status?: 'planifie' | 'termine' | 'annule';
  notes?: string;
}

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  codePostal: string;
  status: ClientStatus;
  typeLogement: 'maison' | 'appartement';
  surface: number;
  typeChauffageActuel: string;
  puissanceEstimee?: string;
  source?: string;
  notes?: string;
  rdvs: Appointment[];
  createdAt: string;
  technicalData?: {
    liaison: {
      distance: number | string; // max 10m
      hauteurSousPlafond: number | string;
      largeurPorte: number | string; // min 65cm
      typeEscalier: string;
      largeurEscalier?: number | string; // Nouveau
    };
    groupeExterieur: {
      typeSupport: string;
    };
    ballons: {
      distanceCapteurBallon?: number | string; // max 18m
      distancePacBallon?: number | string; // 1m
      type: string; // 'solaire' | 'electrique' | 'thermodynamique' | 'ssc' ...
      hauteurPlafondRequis?: number | string;
      distanceEntreBallons?: number | string; // Nouveau
    };
    elec: {
      alimentation: 'monophase' | 'triphase';
      typeCouverture: string;
    };
    audit: {
      videoTableauElectrique: boolean;
      videoChaudiere: boolean;
    };
    qhare_info?: any;
    // Nouveaux champs pour le formulaire "Pose Client"
    visite?: {
      typeIsolation?: string;
      typeRadiateurs?: string;
      emplacementInterieur?: string; // Nouveau
      largeurDisponible?: number | string; // Nouveau
      typeMur?: string; // Nouveau
      obstacles?: string; // Nouveau
      surfaceChauffee?: number | string;
      temperatureSouhaitee?: number | string;
      emplacementChaudiere?: string;
      emplacementPacExterieur?: string; // Détails texte
      distancePacIntExt?: number | string; // Redondant avec liaison.distance mais explicite
      kva?: string;
      isolationCombles?: string; // "Ventilé ? Type ?"
      isolationPlancherBas?: string;
      imprimante?: boolean;
      commentaire?: string; // Nouveau: Champ libre fin de formulaire
    };
  };
}

export const statusLabels: Record<ClientStatus, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  rdv_planifie: 'RDV Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
};

export const statusColors: Record<ClientStatus, string> = {
  nouveau: 'bg-primary/10 text-primary',
  contacte: 'bg-warning/10 text-warning',
  rdv_planifie: 'bg-accent/10 text-accent',
  en_cours: 'bg-primary/20 text-primary',
  termine: 'bg-success/10 text-success',
};
