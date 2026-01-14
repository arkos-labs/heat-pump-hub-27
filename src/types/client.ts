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
      distance: number; // max 10m
      hauteurSousPlafond: number;
      largeurPorte: number; // min 65cm
      typeEscalier: 'droit' | 'L' | 'colimacon' | 'autre';
      largeurEscalier?: number; // Nouveau
    };
    groupeExterieur: {
      typeSupport: 'dalle_beton' | 'equerres' | 'big_foot';
    };
    ballons: {
      distanceCapteurBallon?: number; // max 18m
      distancePacBallon?: number; // 1m
      type: 'solaire' | 'electrique' | 'thermodynamique';
      hauteurPlafondRequis?: number;
      distanceEntreBallons?: number; // Nouveau
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
      largeurDisponible?: number; // Nouveau
      typeMur?: string; // Nouveau
      obstacles?: string; // Nouveau
      surfaceChauffee?: number;
      temperatureSouhaitee?: number;
      emplacementChaudiere?: string;
      emplacementPacExterieur?: string; // Détails texte
      distancePacIntExt?: number; // Redondant avec liaison.distance mais explicite
      kva?: string;
      isolationCombles?: string; // "Ventilé ? Type ?"
      isolationPlancherBas?: string;
      imprimante?: boolean;
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
