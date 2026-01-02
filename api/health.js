// Health check endpoint for Vercel
module.exports = function handler(req, res) {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        endpoints: {
            reportError: '/api/report-error'
        }
    })
}
