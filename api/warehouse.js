export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get credentials from environment variables
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;
        const TENANT_ID = process.env.TENANT_ID;
        const WORKBOOK_ID = process.env.WORKBOOK_ID;

        // Validate environment variables
        if (!CLIENT_ID || !CLIENT_SECRET || !TENANT_ID || !WORKBOOK_ID) {
            return res.status(500).json({ error: 'Missing environment variables' });
        }

        // Parse incoming data
        const submission = req.body;
        
        // Validate required fields
        if (!submission.job_number || !submission.po_number || !submission.line_items) {
            return res.status(400).json({ 
                error: 'Missing required fields: job_number, po_number, line_items' 
            });
        }

        // Get access token
        const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET, TENANT_ID);
        
        // Write to API_Submissions sheet
        await writeToSubmissions(accessToken, submission, WORKBOOK_ID);
        
        // Process line items
        const results = [];
        for (const lineItem of submission.line_items) {
            try {
                const result = await update
