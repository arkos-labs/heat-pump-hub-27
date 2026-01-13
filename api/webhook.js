import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (Clés Publiques pour l'instant)
const SUBAPASE_URL = 'https://kcrfubblydhfmyozouez.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7cUHMQ_E1Y4iGzS3dMOLIg_Xa6xNg1N';

// Initialisation du client
const supabase = createClient(SUBAPASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;
            console.log('Webhook Qhare Payload:', JSON.stringify(data, null, 2));

            // Mapping des données Qhare vers la structure de la table 'clients'
            // Note: On suppose que la table 'clients' existe et attend ces colonnes.
            const clientToInsert = {
                nom: data.nom || data.lastname || 'Inconnu',
                prenom: data.prenom || data.firstname || '',
                email: data.email || null,
                telephone: data.telephone || data.phone || null,
                adresse: data.adresse || data.address || null,
                ville: data.ville || data.city || null,
                code_postal: data.code_postal || data.zipcode || null, // Attention au nom de la colonne
                source: 'qhare',
                status: 'nouveau', // Statut par défaut
                // Ajout des champs techniques si nécessaire ou stockage du raw data
                notes: `Importé via Webhook. ID Qhare: ${data.id || 'N/A'}`
            };

            // Insertion en base
            const { data: insertedData, error } = await supabase
                .from('clients')
                .insert([clientToInsert])
                .select();

            if (error) {
                console.error('Erreur Supabase:', error);
                // On renvoie quand même un 200 à Qhare pour ne pas bloquer sa queue, mais on loggue l'erreur
                return res.status(200).json({ success: false, error: 'Erreur insertion DB', details: error.message });
            }

            return res.status(200).json({
                success: true,
                message: 'Client sauvegardé dans Supabase',
                client: insertedData
            });

        } catch (error) {
            console.error('Erreur script:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
