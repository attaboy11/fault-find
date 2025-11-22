const state = {
  models: [],
  subsystems: [],
  symptoms: [],
  components: [],
  jobs: [],
  safetyNotes: [],
  selectedModel: '',
  selectedSubsystem: '',
  selectedSymptom: ''
};

const els = {};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

function cacheElements() {
  els.navButtons = Array.from(document.querySelectorAll('.nav-btn'));
  els.panels = {
    fault: document.getElementById('panel-fault'),
    parts: document.getElementById('panel-parts'),
    jobs: document.getElementById('panel-jobs')
  };
  els.modelSelect = document.getElementById('modelSelect');
  els.subsystemSelect = document.getElementById('subsystemSelect');
  els.symptomSelect = document.getElementById('symptomSelect');
  els.notesInput = document.getElementById('notesInput');
  els.runFault = document.getElementById('run-fault');
  els.faultResults = document.getElementById('fault-results');

  els.partsModel = document.getElementById('partsModel');
  els.partsSubsystem = document.getElementById('partsSubsystem');
  els.partsSearch = document.getElementById('partsSearch');
  els.partsList = document.getElementById('partsList');

  els.jobSite = document.getElementById('jobSite');
  els.jobModel = document.getElementById('jobModel');
  els.jobReported = document.getElementById('jobReported');
  els.jobDiagnosis = document.getElementById('jobDiagnosis');
  els.jobNotes = document.getElementById('jobNotes');
  els.saveJob = document.getElementById('saveJob');
  els.jobsList = document.getElementById('jobsList');
}

function showPanel(name) {
  Object.keys(els.panels).forEach(key => {
    if (key === name) {
      els.panels[key].classList.remove('hidden');
    } else {
      els.panels[key].classList.add('hidden');
    }
  });

  els.navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === name);
  });
}

function renderModelOptions() {
  const options = ['<option value="">Select model</option>'].concat(
    state.models.map(m => `<option value="${m.id}">${m.name}</option>`)
  ).join('');
  els.modelSelect.innerHTML = options;
  els.partsModel.innerHTML = ['<option value="">All models</option>', options].join('');
  els.jobModel.innerHTML = options;
}

function renderSubsystemOptions() {
  const options = ['<option value="">Select subsystem</option>'].concat(
    state.subsystems.map(s => `<option value="${s.id}">${s.name}</option>`)
  ).join('');
  els.subsystemSelect.innerHTML = options;
  els.partsSubsystem.innerHTML = ['<option value="">All subsystems</option>', options].join('');
}

function renderSymptomOptions() {
  const filtered = state.symptoms.filter(sym => !state.selectedSubsystem || sym.subsystemId === state.selectedSubsystem);
  const options = ['<option value="">Select symptom</option>'].concat(
    filtered.map(s => `<option value="${s.id}">${s.title}</option>`)
  ).join('');
  els.symptomSelect.innerHTML = options;
}

function getSymptomTitle(id) {
  const sym = state.symptoms.find(s => s.id === id);
  return sym ? sym.title : 'Selected symptom';
}

function renderFaultResults(result) {
  if (!result || !result.length) {
    els.faultResults.innerHTML = '<p>No fault flows found for this selection.</p>';
    els.faultResults.classList.remove('hidden');
    return;
  }

  const safetyLookup = Object.fromEntries(state.safetyNotes.map(n => [n.id, n.text]));
  const parts = result.map(flow => {
    const causes = flow.likelyCauses.map(c => {
      const pct = c.probability ? ` (${Math.round(c.probability * 100)}%)` : '';
      return `<li>${c.component}${pct}</li>`;
    }).join('');

    const checks = flow.checks.map((c, idx) => {
      return `<label class="check"><input type="checkbox"> ${c.text}<small>${c.detail}</small></label>`;
    }).join('');

    const safety = flow.safety.map(id => `<li>${safetyLookup[id] || id}</li>`).join('');

    return `
      <article class="card">
        <h3>${getSymptomTitle(flow.symptomId)}</h3>
        <h4>Likely causes</h4>
        <ol>${causes}</ol>
        <h4>Checks</h4>
        <div class="checks">${checks}</div>
        <h4>Safety</h4>
        <ul>${safety}</ul>
        <details><summary>Raw flow</summary><pre>${JSON.stringify(flow, null, 2)}</pre></details>
      </article>
    `;
  }).join('');

  els.faultResults.innerHTML = parts;
  els.faultResults.classList.remove('hidden');
}

async function runFaultAnalysis() {
  if (!state.selectedModel || !state.selectedSubsystem || !state.selectedSymptom) {
    alert('Please select model, subsystem, and symptom first.');
    return;
  }
  const params = new URLSearchParams({
    modelId: state.selectedModel,
    subsystemId: state.selectedSubsystem,
    symptomId: state.selectedSymptom,
    notes: els.notesInput.value || ''
  });
  const flows = await fetchJson(`/api/faults?${params.toString()}`);
  renderFaultResults(flows);
}

function renderParts() {
  const term = (els.partsSearch.value || '').toLowerCase();
  const results = state.components.filter(c => {
    const matchesModel = !els.partsModel.value || c.modelId === els.partsModel.value;
    const matchesSubsystem = !els.partsSubsystem.value || c.subsystemId === els.partsSubsystem.value;
    const matchesTerm = !term || [c.name, c.partNumber, c.location].some(v => v.toLowerCase().includes(term));
    return matchesModel && matchesSubsystem && matchesTerm;
  });

  if (!results.length) {
    els.partsList.innerHTML = '<p class="muted">No parts match the current filters.</p>';
    return;
  }

  const parts = results.map(c => {
    const model = state.models.find(m => m.id === c.modelId);
    const subsystem = state.subsystems.find(s => s.id === c.subsystemId);
    return `
      <article class="card">
        <h3>${c.name}</h3>
        <p><strong>P/N:</strong> ${c.partNumber}</p>
        <p><strong>Model:</strong> ${model ? model.name : c.modelId}</p>
        <p><strong>Subsystem:</strong> ${subsystem ? subsystem.name : c.subsystemId}</p>
        <p><strong>Location:</strong> ${c.location}</p>
        <p class="muted">${c.notes}</p>
      </article>
    `;
  }).join('');

  els.partsList.innerHTML = parts;
}

function renderJobs() {
  if (!state.jobs.length) {
    els.jobsList.innerHTML = '<p class="muted">No jobs logged yet.</p>';
    return;
  }
  const jobs = state.jobs
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(job => {
      const model = state.models.find(m => m.id === job.modelId);
      const summary = `Site: ${job.site}\nModel: ${model ? model.name : job.modelId}\nReported: ${job.reported}\nDiagnosis: ${job.diagnosis}\nNotes: ${job.notes}\nCreated: ${new Date(job.createdAt).toLocaleString()}`;
      return `
        <article class="card">
          <header class="card-header">
            <div>
              <p class="muted">${new Date(job.createdAt).toLocaleString()}</p>
              <h3>${job.site || 'Unknown site'}</h3>
            </div>
            <button class="copy" data-summary="${encodeURIComponent(summary)}">Copy summary</button>
          </header>
          <p><strong>Model:</strong> ${model ? model.name : job.modelId}</p>
          <p><strong>Reported:</strong> ${job.reported || 'N/A'}</p>
          <p><strong>Diagnosis:</strong> ${job.diagnosis || 'N/A'}</p>
          <p class="muted">${job.notes || ''}</p>
        </article>
      `;
    }).join('');
  els.jobsList.innerHTML = jobs;

  els.jobsList.querySelectorAll('.copy').forEach(btn => {
    btn.onclick = () => {
      const summary = decodeURIComponent(btn.dataset.summary || '');
      navigator.clipboard.writeText(summary);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy summary'), 1500);
    };
  });
}

async function saveJob() {
  const payload = {
    site: els.jobSite.value,
    modelId: els.jobModel.value,
    reported: els.jobReported.value,
    diagnosis: els.jobDiagnosis.value,
    notes: els.jobNotes.value
  };
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    alert('Failed to save job');
    return;
  }
  const job = await res.json();
  state.jobs.unshift(job);
  renderJobs();
  els.jobSite.value = '';
  els.jobReported.value = '';
  els.jobDiagnosis.value = '';
  els.jobNotes.value = '';
}

async function loadData() {
  const [models, subsystems, symptoms, components, jobs, safetyNotes] = await Promise.all([
    fetchJson('/api/models'),
    fetchJson('/api/subsystems'),
    fetchJson('/api/symptoms'),
    fetchJson('/api/components'),
    fetchJson('/api/jobs'),
    fetchJson('/api/safety')
  ]);
  state.models = models;
  state.subsystems = subsystems;
  state.symptoms = symptoms;
  state.components = components;
  state.jobs = jobs;
  state.safetyNotes = safetyNotes || [];
  renderModelOptions();
  renderSubsystemOptions();
  renderSymptomOptions();
  renderParts();
  renderJobs();
}

function bindEvents() {
  els.navButtons.forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panel));
  });

  els.modelSelect.addEventListener('change', e => {
    state.selectedModel = e.target.value;
  });

  els.subsystemSelect.addEventListener('change', e => {
    state.selectedSubsystem = e.target.value;
    state.selectedSymptom = '';
    renderSymptomOptions();
  });

  els.symptomSelect.addEventListener('change', e => {
    state.selectedSymptom = e.target.value;
  });

  els.runFault.addEventListener('click', runFaultAnalysis);

  els.partsModel.addEventListener('change', renderParts);
  els.partsSubsystem.addEventListener('change', renderParts);
  els.partsSearch.addEventListener('input', renderParts);

  els.saveJob.addEventListener('click', saveJob);
}

(async function init() {
  cacheElements();
  await loadData();
  bindEvents();
})();
