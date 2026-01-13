
export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { qhareId, etat, sous_etat, date_pose, date_fin } = req.body;
    const ACCESS_TOKEN = '8G0FCtzJUdLtdsA6Deznd2bc8zhZFzSlz_VxtPtS9Cg';

    if (!qhareId) {
        return res.status(400).json({ error: 'Missing qhareId' });
    }

    console.log(`Updating Qhare Lead ${qhareId} -> Etat: ${etat}, Sous-état: ${sous_etat}, Date Pose: ${date_pose}, Date Fin: ${date_fin}`);

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

        // FIX: Qhare seems to require 'raison_sociale' even if not B2B, or defaults to B2B logic.
        // We explicitly say it's NOT B2B and provide a dummy "Particulier" just in case.
        params.append('btob', '0');
        params.append('raison_sociale', 'Particulier');

        const targetUrl = `https://qhare.fr/api/lead/update?${params.toString()}`;
        console.log('Calling Qhare URL:', targetUrl.replace(ACCESS_TOKEN, 'HIDDEN'));

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Some servers expect this even with empty body
            }
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
