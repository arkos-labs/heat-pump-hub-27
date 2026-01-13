
import { supabase } from '@/lib/supabaseClient';
import { Client, Appointment } from '@/types/client';

export const clientService = {
    // Mettre à jour les infos client (Audit technique, Statut, etc.)
    async updateClient(clientId: string, updates: Partial<Client>) {
        // Liste blanche des colonnes autorisées pour éviter les erreurs "Column not found"
        // On construit un objet propre uniquement avec ce qui existe en base
        const payload: any = {};

        // Champs directs (snake_case en DB = camelCase en JS si identique, sinon mapping)
        if (updates.nom !== undefined) payload.nom = updates.nom;
        if (updates.prenom !== undefined) payload.prenom = updates.prenom;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.telephone !== undefined) payload.telephone = updates.telephone;
        if (updates.adresse !== undefined) payload.adresse = updates.adresse;
        if (updates.ville !== undefined) payload.ville = updates.ville;
        if (updates.surface !== undefined) payload.surface = updates.surface;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.notes !== undefined) payload.notes = updates.notes;

        // Champs avec mapping (camelCase -> snake_case)
        if (updates.codePostal !== undefined) payload.code_postal = updates.codePostal;
        if (updates.typeLogement !== undefined) payload.type_logement = updates.typeLogement;
        if (updates.typeChauffageActuel !== undefined) payload.type_chauffage_actuel = updates.typeChauffageActuel;

        // Champ technical_data
        if (updates.technicalData !== undefined) {
            payload.technical_data = updates.technicalData;
        }

        // On ignore délibérément : id, createdAt, rdvs (géré via appointments), puissanceEstimee (pas de colonne)

        const { data, error } = await supabase
            .from('clients')
            .update(payload)
            .eq('id', clientId)
            .select()
            .single();

        if (error) {
            console.error("Supabase Update Error:", error);
            throw error;
        }
        return data;
    },

    // Ajouter un RDV (Pour simplifier, on va stocker les RDV dans une colonne jsonb 'appointments' sur la table client, ou créer une table à part)
    // Vu que je n'ai pas créé de table 'appointments', je vais ajouter une colonne 'appointments' JSONB à la table clients pour stocker la liste.
    async addAppointment(clientId: string, appointment: Appointment) {
        // 1. Récupérer les RDV existants
        const { data: client, error: fetchError } = await supabase
            .from('clients')
            .select('appointments')
            .eq('id', clientId)
            .single();

        if (fetchError) throw fetchError;

        const currentAppointments = client.appointments || [];
        const newAppointments = [...currentAppointments, appointment];

        // 2. Mettre à jour avec le nouveau RDV
        const { data, error } = await supabase
            .from('clients')
            .update({
                appointments: newAppointments,
                status: 'rdv_planifie' // On change le statut automatiquement
            })
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
