
export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { qhareId, etat, sous_etat } = req.body;
    const ACCESS_TOKEN = '8G0FCtzJUdLtdsA6Deznd2bc8zhZFzSlz_VxtPtS9Cg';

    if (!qhareId) {
        return res.status(400).json({ error: 'Missing qhareId' });
    }

    console.log(`Updating Qhare Lead ${qhareId} -> Etat: ${etat}, Sous-état: ${sous_etat}`);

    try {
        // Construction de l'URL avec les query params car l'API Qhare semble fonctionner en POST mais avec des params
        // ou en Body x-www-form-urlencoded. La doc dit "Parametre ...", souvent c'est du form-data ou urlencoded.
        // On va tenter en JSON body standard d'abord, si echec on tentera URL search params.

        // Tentative 1: URL Search Params (souvent le cas avec les API PHP/Legacy décrite comme ça)
        const params = new URLSearchParams();
        params.append('access_token', ACCESS_TOKEN);
        params.append('id', qhareId);
        if (etat) params.append('etat', etat);
        if (sous_etat) params.append('sous_etat', sous_etat);

        // On essaie d'envoyer en x-www-form-urlencoded
        const response = await fetch('https://qhare.fr/api/lead/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        const result = await response.json();
        console.log('Qhare API Response:', result);

        if (result.success === false || result.error) {
            // Si échec, on renvoie l'erreur
            return res.status(500).json({ success: false, qhareInfo: result });
        }

        return res.status(200).json({ success: true, data: result });

    } catch (error) {
        console.error('Qhare Update Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
