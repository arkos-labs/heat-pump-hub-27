
import { supabase } from '@/lib/supabaseClient';
import { Client, Appointment } from '@/types/client';

export const clientService = {
    // Mettre à jour les infos client (Audit technique, Statut, etc.)
    async updateClient(clientId: string, updates: Partial<Client>) {
        // On sépare les données techniques du reste car elles sont dans une colonne JSONB 'technical_data'
        const { technicalData, ...otherFields } = updates;

        const dbUpdates: any = { ...otherFields };

        // Mapping des champs front vers DB
        if (updates.codePostal) dbUpdates.code_postal = updates.codePostal;
        if (updates.typeLogement) dbUpdates.type_logement = updates.typeLogement;
        if (updates.typeChauffageActuel) dbUpdates.type_chauffage_actuel = updates.typeChauffageActuel;
        if (updates.puissanceEstimee) dbUpdates.puissance_estimee = updates.puissanceEstimee;

        // Si on a des données techniques, on les met à jour
        if (technicalData) {
            dbUpdates.technical_data = technicalData;
        }

        // Nettoyage des champs qui n'existent pas en base (camelCase vs snake_case)
        delete dbUpdates.id;
        delete dbUpdates.createdAt;
        delete dbUpdates.rdvs;
        delete dbUpdates.codePostal;
        delete dbUpdates.typeLogement;
        delete dbUpdates.typeChauffageActuel;
        delete dbUpdates.puissanceEstimee; // Assuming this column exists as snake_case

        const { data, error } = await supabase
            .from('clients')
            .update(dbUpdates)
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
