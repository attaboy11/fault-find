const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { store } = require('./data/store');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const type = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

function handleApi(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  if (req.method === 'GET') {
    if (pathname === '/api/models') return sendJson(res, store.models);
    if (pathname === '/api/subsystems') return sendJson(res, store.subsystems);
    if (pathname === '/api/symptoms') return sendJson(res, store.symptoms);
    if (pathname === '/api/components') return sendJson(res, store.components);
    if (pathname === '/api/safety') return sendJson(res, store.safetyNotes || []);
    if (pathname === '/api/jobs') return sendJson(res, store.jobs.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    if (pathname === '/api/faults') {
      const { modelId, subsystemId, symptomId } = query;
      const flows = store.flows.filter(flow => {
        const matchesModel = modelId ? flow.modelIds.includes(modelId) : true;
        const matchesSubsystem = subsystemId ? flow.subsystemId === subsystemId : true;
        const matchesSymptom = symptomId ? flow.symptomId === symptomId : true;
        return matchesModel && matchesSubsystem && matchesSymptom;
      });
      return sendJson(res, flows);
    }
  }

  if (req.method === 'POST' && pathname === '/api/jobs') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.socket.destroy();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const newJob = {
          id: `job-${Date.now()}`,
          site: data.site || 'Unknown site',
          modelId: data.modelId || '',
          reported: data.reported || '',
          diagnosis: data.diagnosis || '',
          notes: data.notes || '',
          createdAt: new Date().toISOString()
        };
        store.jobs.push(newJob);
        sendJson(res, newJob, 201);
      } catch (err) {
        sendJson(res, { error: 'Invalid JSON' }, 400);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  if (parsedUrl.pathname.startsWith('/api/')) {
    return handleApi(req, res);
  }

  if (parsedUrl.pathname === '/') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    return serveStatic(filePath, res);
  }

  if (parsedUrl.pathname.startsWith('/public/')) {
    const filePath = path.join(__dirname, parsedUrl.pathname);
    return serveStatic(filePath, res);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`BMU Fault Finder server running on port ${PORT}`);
});
