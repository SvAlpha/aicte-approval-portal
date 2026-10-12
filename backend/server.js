'use strict';

/**
 * Express / HTTP REST API Server Entry Point (backend/server.js)
 * Enforces server-side JWT authentication and Role-Based Access Control (RBAC)
 * across all College, Evaluator, and AICTEAdmin endpoints.
 */
const http = require('http');
const DatabaseConnection = require('./database/db');
const AuthController = require('./controllers/AuthController');
const ApplicationController = require('./controllers/ApplicationController');
const { authorizeRoles } = require('./middleware/authMiddleware');

const db = DatabaseConnection.getInstance();
const authController = new AuthController(db);
const appController = new ApplicationController(db);

function createServer() {
  return http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 12 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        // 1. Public Health & Technical Reference Endpoints
        if (req.method === 'GET' && pathname === '/api/health') {
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'ok', service: 'AI-Supported AICTE Approval Portal API' }));
          return;
        }

        // 2. Authentication & Session Endpoints
        if (req.method === 'POST' && pathname === '/api/auth/register') {
          const result = authController.registerCollege(payload);
          res.writeHead(result.status);
          res.end(JSON.stringify(result));
          return;
        }

        if (req.method === 'POST' && pathname === '/api/auth/login') {
          const result = authController.login(payload);
          res.writeHead(result.status);
          res.end(JSON.stringify(result));
          return;
        }

        if (req.method === 'GET' && pathname === '/api/auth/me') {
          const result = authController.getSession(token);
          res.writeHead(result.status);
          res.end(JSON.stringify(result));
          return;
        }

        if (req.method === 'POST' && pathname === '/api/auth/logout') {
          const result = authController.logout(token);
          res.writeHead(result.status);
          res.end(JSON.stringify(result));
          return;
        }

        // 3. Role-Isolated Application Listing (GET /api/applications)
        if (req.method === 'GET' && pathname === '/api/applications') {
          const user = authorizeRoles(['College', 'Evaluator', 'AICTEAdmin'], db)(token);
          const allApps = [...db.tables.applications.values()];
          const allClars = [...db.tables.clarification_requests.values()];

          if (user.role === 'College') {
            const college = db.tables.colleges.get(user.id);
            const tracked = college ? college.trackApplicationStatus(allApps, allClars) : [];
            res.writeHead(200);
            res.end(JSON.stringify({ applications: tracked }));
            return;
          }

          if (user.role === 'Evaluator') {
            const evaluator = db.tables.evaluators.get(user.id);
            const assigned = evaluator ? evaluator.viewAssignedApplications(allApps) : [];
            res.writeHead(200);
            res.end(JSON.stringify({ applications: assigned }));
            return;
          }

          if (user.role === 'AICTEAdmin') {
            const admin = db.tables.aicte_admins.get(user.id);
            const statusFilter = urlObj.searchParams.get('status') || 'All';
            const monitored = admin ? admin.monitorApplications(allApps, statusFilter) : allApps;
            res.writeHead(200);
            res.end(JSON.stringify({ applications: monitored }));
            return;
          }
        }

        // 4. College: Submit New Application (POST /api/applications)
        if (req.method === 'POST' && pathname === '/api/applications') {
          const user = authorizeRoles(['College'], db)(token);
          const result = appController.submitApplication(user.id, payload);
          res.writeHead(201);
          res.end(JSON.stringify(result));
          return;
        }

        // 5. College: Re-upload Flagged Document (POST /api/applications/:id/documents/:docId/reupload)
        const reuploadMatch = pathname.match(/^\/api\/applications\/([^/]+)\/documents\/([^/]+)\/reupload$/);
        if (req.method === 'POST' && reuploadMatch) {
          const user = authorizeRoles(['College'], db)(token);
          const [, appId, docId] = reuploadMatch;
          const result = appController.reuploadFlaggedDocument(
            user.id,
            appId,
            docId,
            payload.clarification_id,
            payload.file_url,
            payload.raw_text
          );
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }

        // 6. Evaluator: Raise Clarification (POST /api/applications/:id/clarifications)
        const clarMatch = pathname.match(/^\/api\/applications\/([^/]+)\/clarifications$/);
        if (req.method === 'POST' && clarMatch) {
          const user = authorizeRoles(['Evaluator'], db)(token);
          const [, appId] = clarMatch;
          const result = appController.raiseClarification(
            user.id,
            appId,
            payload.document_id,
            payload.message
          );
          res.writeHead(201);
          res.end(JSON.stringify(result));
          return;
        }

        // 7. Evaluator: Submit Recommendation (POST /api/applications/:id/recommendation)
        const recMatch = pathname.match(/^\/api\/applications\/([^/]+)\/recommendation$/);
        if (req.method === 'POST' && recMatch) {
          const user = authorizeRoles(['Evaluator'], db)(token);
          const [, appId] = recMatch;
          const result = appController.submitEvaluatorRecommendation(
            user.id,
            appId,
            payload.recommendation,
            payload.comments,
            payload.site_visit_confirmed
          );
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }

        // 8. AICTEAdmin: AI Evaluator Match & Assignment (POST /api/applications/:id/assign-evaluator)
        const assignMatch = pathname.match(/^\/api\/applications\/([^/]+)\/assign-evaluator$/);
        if (req.method === 'POST' && assignMatch) {
          const user = authorizeRoles(['AICTEAdmin'], db)(token);
          const [, appId] = assignMatch;
          const result = appController.matchAndAssignEvaluator(
            user.id,
            appId,
            payload.evaluator_id || null
          );
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }

        // 9. AICTEAdmin: Record Binding Final Decision (POST /api/applications/:id/final-decision)
        const finalMatch = pathname.match(/^\/api\/applications\/([^/]+)\/final-decision$/);
        if (req.method === 'POST' && finalMatch) {
          const user = authorizeRoles(['AICTEAdmin'], db)(token);
          const [, appId] = finalMatch;
          const result = appController.recordAdminFinalDecision(
            user.id,
            appId,
            payload.decision,
            payload.reason
          );
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }

        // 10. AICTEAdmin: Analytics & Audit Logs (GET /api/analytics)
        if (req.method === 'GET' && pathname === '/api/analytics') {
          const user = authorizeRoles(['AICTEAdmin'], db)(token);
          const admin = db.tables.aicte_admins.get(user.id);
          const stats = admin.viewAnalytics([...db.tables.applications.values()]);
          res.writeHead(200);
          res.end(JSON.stringify({ analytics: stats, audit_logs: db.tables.audit_logs }));
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      } catch (err) {
        const msg = err.message || 'Internal Server Error';
        const status = msg.startsWith('401')
          ? 401
          : msg.startsWith('403')
          ? 403
          : msg.startsWith('409')
          ? 409
          : 400;
        res.writeHead(status);
        res.end(JSON.stringify({ error: msg }));
      }
    });
  });
}

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`AICTE Approval Portal API listening on port ${PORT}`);
  });
}

module.exports = { createServer, db, authController, appController };
