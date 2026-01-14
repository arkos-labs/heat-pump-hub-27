import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
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
            // 1. Chercher si le client existe déjà (Via ID Qhare dans les notes OU Email)
            const qhareId = data.id;
            let existingClient = null;

            if (qhareId) {
                // Recherche par ID Qhare dans les notes
                const { data: foundById } = await supabase
                    .from('clients')
                    .select('*')
                    .ilike('notes', `%ID Qhare: ${qhareId}%`)
                    .maybeSingle(); // Use maybeSingle to avoid error if not found

                existingClient = foundById;
            }

            if (!existingClient && data.email) {
                // Fallback: Recherche par Email
                const { data: foundByEmail } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('email', data.email)
                    .maybeSingle();

                existingClient = foundByEmail;
            }

            let resultData;

            if (existingClient) {
                console.log("Client existant trouvé (ID Supabase:", existingClient.id, ") -> Mise à jour...");

                // Préparer l'objet d'update (On ne touche PAS au statut sauf si on veut le forcer, 
                // mais ici on veut surtout éviter de créer des doublons 'nouveau')
                const clientToUpdate = {
                    nom: data.nom || data.lastname || existingClient.nom,
                    prenom: data.prenom || data.firstname || existingClient.prenom,
                    email: data.email || existingClient.email,
                    telephone: data.telephone || data.phone || existingClient.telephone,
                    adresse: data.adresse || data.address || existingClient.adresse,
                    ville: data.ville || data.city || existingClient.ville,
                    code_postal: data.code_postal || data.zipcode || existingClient.code_postal,
                    // On ne met PAS à jour le statut, on garde celui en cours (sauf logique spécifique)
                    // status: existingClient.status 
                };

                const { data: updatedData, error: updateError } = await supabase
                    .from('clients')
                    .update(clientToUpdate)
                    .eq('id', existingClient.id)
                    .select();

                if (updateError) throw updateError;
                resultData = updatedData;

            } else {
                console.log("Nouveau Client -> Insertion...");

                // Insertion en base (Nouveau client)
                const clientToInsert = {
                    nom: data.nom || data.lastname || 'Inconnu',
                    prenom: data.prenom || data.firstname || '',
                    email: data.email || null,
                    telephone: data.telephone || data.phone || null,
                    adresse: data.adresse || data.address || null,
                    ville: data.ville || data.city || null,
                    code_postal: data.code_postal || data.zipcode || null,
                    source: 'qhare',
                    status: 'nouveau', // Nouveau par défaut
                    notes: `Importé via Webhook. ID Qhare: ${data.id || 'N/A'}`
                };

                const { data: insertedData, error: insertError } = await supabase
                    .from('clients')
                    .insert([clientToInsert])
                    .select();

                if (insertError) throw insertError;
                resultData = insertedData;
            }

            // --- AUTO-REPONSE QHARE: Passer en "À planifier" ---
            if (data.id) {
                try {
                    const ACCESS_TOKEN = '8G0FCtzJUdLtdsA6Deznd2bc8zhZFzSlz_VxtPtS9Cg';
                    const params = new URLSearchParams();
                    params.append('access_token', ACCESS_TOKEN);
                    params.append('id', data.id);
                    params.append('sous_etat', 'À planifier'); // Orthographe exacte confirmée

                    // Champs techniques pour éviter les erreurs de validation Qhare
                    params.append('btob', '0');
                    params.append('raison_sociale', 'Particulier');

                    const updateUrl = `https://qhare.fr/api/lead/update?${params.toString()}`;
                    console.log('Auto-Update Qhare (À planifier) ->', updateUrl.replace(ACCESS_TOKEN, 'HIDDEN'));

                    // Appel non-bloquant
                    fetch(updateUrl).then(r => r.json()).then(resQhare => {
                        console.log("Réponse Qhare Auto-Update:", resQhare);
                    }).catch(err => console.error("Erreur Auto-Update Qhare:", err));

                } catch (e) {
                    console.error("Erreur configuration Auto-Update", e);
                }
            }
            // ---------------------------------------------------

            return res.status(200).json({
                success: true,
                message: 'Client traité avec succès (Mise à jour ou Création)',
                client: resultData
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
