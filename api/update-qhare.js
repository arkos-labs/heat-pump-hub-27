
export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { qhareId, etat, sous_etat, date_pose, date_fin, comment, extras } = req.body;
    const ACCESS_TOKEN = '8G0FCtzJUdLtdsA6Deznd2bc8zhZFzSlz_VxtPtS9Cg';

    if (!qhareId) {
        return res.status(400).json({ error: 'Missing qhareId' });
    }

    console.log(`Updating Qhare Lead ${qhareId} -> Etat: ${etat}, Sous-état: ${sous_etat}, Date Pose: ${date_pose}, Date Fin: ${date_fin}, Commentaire: ${comment ? 'Présent' : 'Non'}, Extras: ${JSON.stringify(extras)}`);

    try {
        // FORCE URL Parameters: This is the most reliable way for this type of API
        const params = new URLSearchParams();
        params.append('access_token', ACCESS_TOKEN);
        params.append('id', qhareId);
        if (etat) params.append('etat', etat);

        // Note: The doc says "sous_etat", ensure strictly this spelling.
        // Check for undefined so we can pass empty string "" to clear the field.
        if (sous_etat !== undefined) params.append('sous_etat', sous_etat);

        // Dates
        if (date_pose) params.append('date_pose', date_pose);
        if (date_fin) params.append('date_fin', date_fin);

        // Comments
        if (comment) params.append('commentaire', comment);

        // Extra fields (dynamic mapping)
        if (extras && typeof extras === 'object') {
            Object.entries(extras).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value);
                }
            });
        }

        // FIX: Qhare seems to require 'raison_sociale' even if not B2B, or defaults to B2B logic.
        // We explicitly say it's NOT B2B and provide a dummy "Particulier" just in case.
        params.append('btob', '0');
        params.append('raison_sociale', 'Particulier');

        // URL de base sans paramètres
        const targetUrl = `https://qhare.fr/api/lead/update`;

        console.log('Calling Qhare URL (POST Body):', targetUrl);

        // On envoie les données dans le CORPS de la requête (Body)
        // C'est indispensable pour les longs textes comme les rapports d'audit.
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString() // URLSearchParams convertit tout seul en format compatible body
        });

        const result = await response.json();
        console.log('Qhare API Response:', JSON.stringify(result));

        if (result.success === false || result.error) {
            return res.status(500).json({ success: false, qhareInfo: result });
        }

        return res.status(200).json({ success: true, data: result });

    } catch (error) {
        console.error('Qhare Update Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
