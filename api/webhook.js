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

            // Préparation des données Qhare complètes pour stockage
            const qhareInfo = data;

            let resultData;

            // --- LOGIQUE RENDEZ-VOUS ---
            // On cherche une date dans le payload qui pourrait correspondre à un RDV
            // Champs potentiels: date_pose, date_rdv, date_installation, etc.
            const dateRdv = data.date_pose || data.date_rdv || data.date_installation || data.date_visite;

            // On récupère les RDV existants (ou tableau vide)
            let existingAppointments = [];
            if (existingClient && existingClient.appointments && Array.isArray(existingClient.appointments)) {
                existingAppointments = existingClient.appointments;
            }

            let finalAppointments = [...existingAppointments];

            if (dateRdv) {
                console.log("Date de RDV détectée dans le payload Qhare:", dateRdv);
                // On suppose le format YYYY-MM-DD ou DD-MM-YYYY.
                // Pour simplifier, on stocke tel quel si c'est valide, sinon on tente de parser.
                // L'app attend YYYY-MM-DD

                // Vérifier si ce RDV existe déjà pour éviter les doublons (mëme date)
                const alreadyExists = finalAppointments.some(appt => appt.date === dateRdv);

                if (!alreadyExists) {
                    finalAppointments.push({
                        id: `qhare_${Date.now()}`, // ID unique temporaire
                        date: dateRdv,
                        time: "09:00", // Heure par défaut
                        type: "installation", // Type par défaut (ou déduire si possible)
                        status: "planifie",
                        notes: "Synchronisé depuis Qhare"
                    });
                }
            }

            if (existingClient) {
                console.log("Client existant trouvé (ID Supabase:", existingClient.id, ") -> Mise à jour...");

                // On fusionne avec les technical_data existants pour ne pas perdre l'audit
                const currentTechnicalData = existingClient.technical_data || {};
                const newTechnicalData = {
                    ...currentTechnicalData,
                    qhare_info: qhareInfo // On stocke toutes les raw datas de Qhare ici
                };

                // Préparer l'objet d'update
                // On met à jour les infos de contact au cas où elles auraient changé dans Qhare
                const clientToUpdate = {
                    nom: data.nom || data.lastname || existingClient.nom,
                    prenom: data.prenom || data.firstname || existingClient.prenom,
                    email: data.email || existingClient.email,
                    telephone: data.telephone || data.phone || existingClient.telephone,
                    adresse: data.adresse || data.address || existingClient.adresse,
                    ville: data.ville || data.city || existingClient.ville,
                    code_postal: data.code_postal || data.zipcode || existingClient.code_postal,
                    // Si pas de surface, chercher dans champs_perso
                    surface: (data.surface || data.surface_habitable)
                        ? parseFloat(data.surface || data.surface_habitable)
                        : (data.champs_perso && data.champs_perso.find(c => c.nom && c.nom.toLowerCase().includes('surface') || c.variable && c.variable.toLowerCase().includes('surface')))
                            ? parseFloat(data.champs_perso.find(c => c.nom && c.nom.toLowerCase().includes('surface') || c.variable && c.variable.toLowerCase().includes('surface')).valeur)
                            : existingClient.surface,
                    type_chauffage_actuel: data.chauffage || existingClient.type_chauffage_actuel || 'inconnu',
                    technical_data: newTechnicalData,
                    appointments: finalAppointments // <--- MISE A JOUR DES RDV
                    // IMPORTANT: On NE change PAS le statut ici.
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

                // C'est seulement ici qu'on CRÉE le client (une seule fois)
                const clientToInsert = {
                    nom: data.nom || data.lastname || 'Inconnu',
                    prenom: data.prenom || data.firstname || '',
                    email: data.email || null,
                    telephone: data.telephone || data.phone || null,
                    adresse: data.adresse || data.address || null,
                    ville: data.ville || data.city || null,
                    code_postal: data.code_postal || data.zipcode || null,
                    surface: (data.surface || data.surface_habitable)
                        ? parseFloat(data.surface || data.surface_habitable)
                        : (data.champs_perso && data.champs_perso.find(c => c.nom && c.nom.toLowerCase().includes('surface') || c.variable && c.variable.toLowerCase().includes('surface')))
                            ? parseFloat(data.champs_perso.find(c => c.nom && c.nom.toLowerCase().includes('surface') || c.variable && c.variable.toLowerCase().includes('surface')).valeur)
                            : 0,
                    type_chauffage_actuel: data.chauffage || 'inconnu',
                    source: 'qhare',
                    status: 'nouveau', // Statut initial à la création uniquement
                    notes: `Importé via Webhook. ID Qhare: ${data.id || 'N/A'}`,
                    technical_data: {
                        qhare_info: qhareInfo // Stockage initial
                    },
                    appointments: finalAppointments // <--- INSERTION DES RDV
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
