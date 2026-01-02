/**
 * API Gateway - Routes queries to appropriate business services
 * Updated: 2025-12-29 18:00:00 EST | Version 1.0.0
 *
 * This gateway is for LOCAL DEVELOPMENT only.
 * In production, each business is deployed independently with no gateway.
 *
 * Features:
 * - Routes queries to the correct business API
 * - Supports cross-business queries (admin only)
 * - Unified health check for all services
 */

require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

// Configuration
const config = {
  port: parseInt(process.env.PORT || '5000'),
  utilitiesUrl: process.env.UTILITIES_URL || 'http://utilities:5100',
  businesses: {
    retirewell: process.env.RETIREWELL_URL || 'http://retirewell-api:5101',
    presentermode: process.env.PRESENTERMODE_URL || 'http://presentermode-api:5102'
  }
};

/**
 * Proxy request to business API
 */
async function proxyToBusiness(business, path, method, body) {
  const url = `${config.businesses[business]}${path}`;

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`Business API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check - aggregates all service health
 */
app.get('/health', async (req, res) => {
  const health = {
    gateway: 'healthy',
    utilities: 'unknown',
    businesses: {}
  };

  // Check utilities
  try {
    const utilitiesRes = await fetch(`${config.utilitiesUrl}/health`);
    health.utilities = utilitiesRes.ok ? 'healthy' : 'unhealthy';
  } catch {
    health.utilities = 'unreachable';
  }

  // Check each business
  for (const [name, url] of Object.entries(config.businesses)) {
    try {
      const businessRes = await fetch(`${url}/health`);
      health.businesses[name] = businessRes.ok ? 'healthy' : 'unhealthy';
    } catch {
      health.businesses[name] = 'unreachable';
    }
  }

  const allHealthy = health.utilities === 'healthy' &&
    Object.values(health.businesses).every(s => s === 'healthy');

  res.status(allHealthy ? 200 : 503).json(health);
});

/**
 * Unified search - routes to specific business
 */
app.post('/api/search', async (req, res) => {
  try {
    const { business, query, k = 5, includeUtilities = true } = req.body;

    if (!business) {
      return res.status(400).json({
        error: 'Business is required',
        availableBusinesses: Object.keys(config.businesses)
      });
    }

    if (!config.businesses[business]) {
      return res.status(404).json({
        error: `Unknown business: ${business}`,
        availableBusinesses: Object.keys(config.businesses)
      });
    }

    const result = await proxyToBusiness(business, '/api/search', 'POST', {
      query,
      k,
      includeUtilities
    });

    res.json({
      business,
      ...result
    });
  } catch (err) {
    console.error('[Gateway] Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add document to specific business
 */
app.post('/api/:business/documents', async (req, res) => {
  try {
    const { business } = req.params;

    if (!config.businesses[business]) {
      return res.status(404).json({
        error: `Unknown business: ${business}`,
        availableBusinesses: Object.keys(config.businesses)
      });
    }

    const result = await proxyToBusiness(business, '/api/documents', 'POST', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get stats for specific business
 */
app.get('/api/:business/stats', async (req, res) => {
  try {
    const { business } = req.params;

    if (!config.businesses[business]) {
      return res.status(404).json({
        error: `Unknown business: ${business}`,
        availableBusinesses: Object.keys(config.businesses)
      });
    }

    const result = await proxyToBusiness(business, '/api/stats', 'GET');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * List all available businesses
 */
app.get('/api/businesses', (req, res) => {
  res.json({
    businesses: Object.keys(config.businesses),
    utilitiesUrl: config.utilitiesUrl
  });
});

/**
 * Utilities stats (direct proxy)
 */
app.get('/api/utilities/stats', async (req, res) => {
  try {
    const response = await fetch(`${config.utilitiesUrl}/api/stats`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(config.port, () => {
  console.log(`[Gateway] Running on port ${config.port}`);
  console.log(`[Gateway] Utilities: ${config.utilitiesUrl}`);
  console.log(`[Gateway] Businesses: ${Object.keys(config.businesses).join(', ')}`);
});

module.exports = app;
