const fs = require('fs');
const path = require('path');

const store = {
  models: [
    { id: 'm1', name: 'Alimak Horizon A1', manufacturer: 'Alimak', site: 'Downtown Tower' },
    { id: 'm2', name: 'Alimak Skyline A2', manufacturer: 'Alimak', site: 'Riverfront Mall' },
    { id: 'm3', name: 'GondolaTech G1', manufacturer: 'GondolaTech', site: 'Seaview Residences' }
  ],
  subsystems: [
    { id: 's1', name: 'Hoist' },
    { id: 's2', name: 'Travel / Trolley' },
    { id: 's3', name: 'Power' }
  ],
  symptoms: [
    { id: 'sym1', subsystemId: 's1', title: "Hoist won't raise" },
    { id: 'sym2', subsystemId: 's1', title: 'Hoist raises slowly' },
    { id: 'sym3', subsystemId: 's2', title: 'Trolley does not travel' },
    { id: 'sym4', subsystemId: 's3', title: 'No power at pendant' },
    { id: 'sym5', subsystemId: 's3', title: 'Breaker trips on start' }
  ],
  components: [
    { id: 'c1', modelId: 'm1', subsystemId: 's1', name: 'Main hoist motor', partNumber: 'A1-HM-220', location: 'Hoist frame', notes: 'Check motor temp and insulation resistance.' },
    { id: 'c2', modelId: 'm1', subsystemId: 's1', name: 'Up contactor', partNumber: 'A1-CT-UP', location: 'Control cabinet', notes: 'Inspect contacts for pitting.' },
    { id: 'c3', modelId: 'm2', subsystemId: 's2', name: 'Travel drive inverter', partNumber: 'A2-INV-TRV', location: 'Trolley housing', notes: 'Verify parameter set matches model.' },
    { id: 'c4', modelId: 'm3', subsystemId: 's2', name: 'Trolley encoder', partNumber: 'G1-ENC-TRV', location: 'Drive shaft', notes: 'Alignment critical after replacement.' },
    { id: 'c5', modelId: 'm3', subsystemId: 's3', name: 'Pendant cable reel', partNumber: 'G1-PCR-15', location: 'Machine room side wall', notes: 'Inspect slip rings for wear.' },
    { id: 'c6', modelId: 'm2', subsystemId: 's3', name: 'Main disconnect breaker', partNumber: 'A2-MDB-80', location: 'Control cabinet', notes: 'Confirm correct rating and torque.' },
    { id: 'c7', modelId: 'm1', subsystemId: 's2', name: 'Trolley limit switch', partNumber: 'A1-LS-TRV', location: 'Runway end stops', notes: 'Adjust lever arm to spec.' }
  ],
  safetyNotes: [
    { id: 'sn1', text: 'Isolate power and lock out before opening control cabinet.' },
    { id: 'sn2', text: 'Test fall arrest anchor points before approaching the edge.' },
    { id: 'sn3', text: 'Use tag line to prevent sway when hoist is disabled.' }
  ],
  flows: [
    {
      id: 'f1',
      modelIds: ['m1', 'm2'],
      subsystemId: 's1',
      symptomId: 'sym1',
      likelyCauses: [
        { component: 'Up contactor coil open circuit', probability: 0.35 },
        { component: 'Up limit engaged / faulty', probability: 0.25 },
        { component: 'Main hoist motor overload tripped', probability: 0.2 },
        { component: 'Pendant up button stuck', probability: 0.2 }
      ],
      checks: [
        { text: 'Verify pendant up command present at PLC input.', detail: 'Measure 24Vdc at input X3.2 when pressing up.' },
        { text: 'Inspect up contactor coil resistance.', detail: 'Expect 120-180Ω; replace if open or shorted.' },
        { text: 'Check up limit switch status.', detail: 'Mechanically reset and observe input transition.' }
      ],
      safety: ['sn1', 'sn2']
    },
    {
      id: 'f2',
      modelIds: ['m1', 'm3'],
      subsystemId: 's2',
      symptomId: 'sym3',
      likelyCauses: [
        { component: 'Travel inverter in fault mode', probability: 0.4 },
        { component: 'Encoder feedback lost', probability: 0.3 },
        { component: 'Trolley brake stuck on', probability: 0.2 },
        { component: 'Travel limit engaged', probability: 0.1 }
      ],
      checks: [
        { text: 'Check inverter display for faults.', detail: 'Reset and record code; confirm run command present.' },
        { text: 'Inspect encoder wiring at terminal strip.', detail: 'Re-seat connectors; verify shield grounding.' },
        { text: 'Manually release brake to verify free travel.', detail: 'Use proper lifting/locking to avoid movement.' }
      ],
      safety: ['sn2']
    },
    {
      id: 'f3',
      modelIds: ['m2', 'm3'],
      subsystemId: 's3',
      symptomId: 'sym4',
      likelyCauses: [
        { component: 'Pendant E-stop engaged', probability: 0.35 },
        { component: 'Pendant cable reel slip ring dirty', probability: 0.25 },
        { component: 'Control transformer fuse open', probability: 0.2 },
        { component: 'Main disconnect off', probability: 0.2 }
      ],
      checks: [
        { text: 'Confirm pendant E-stop circuit continuity.', detail: 'Bypass temporarily for testing only if site rules allow.' },
        { text: 'Inspect pendant cable reel brushes.', detail: 'Clean with contact cleaner; check spring tension.' },
        { text: 'Measure control transformer secondary.', detail: 'Expect 230/24 Vac depending on model.' }
      ],
      safety: ['sn1', 'sn3']
    },
    {
      id: 'f4',
      modelIds: ['m1', 'm2', 'm3'],
      subsystemId: 's3',
      symptomId: 'sym5',
      likelyCauses: [
        { component: 'Phase-to-ground fault on control circuit', probability: 0.4 },
        { component: 'Inverter inrush causing nuisance trip', probability: 0.25 },
        { component: 'Loose neutral on supply', probability: 0.2 },
        { component: 'Water ingress in pendant', probability: 0.15 }
      ],
      checks: [
        { text: 'Insulation resistance test on control wiring.', detail: 'Test between phases/ground at 500V where allowed.' },
        { text: 'Ramp inverter with pre-charge.', detail: 'Use soft-start procedure per OEM bulletin.' },
        { text: 'Inspect pendant for moisture.', detail: 'Dry and replace seals before returning to service.' }
      ],
      safety: ['sn1']
    }
  ],
  jobs: []
};

function readFaultLibrary() {
  const libraryPath = path.join(__dirname, 'fault_library.json');
  if (!fs.existsSync(libraryPath)) return [];
  try {
    const raw = fs.readFileSync(libraryPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load external fault library', err);
    return [];
  }
}

function ensureModelId(name, manufacturer = 'Unknown', site = '') {
  const existing = store.models.find((m) => m.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  const id = `lib-m-${store.models.length + 1}`;
  store.models.push({ id, name, manufacturer, site });
  return id;
}

function ensureSubsystemId(name) {
  const existing = store.subsystems.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  const id = `lib-s-${store.subsystems.length + 1}`;
  store.subsystems.push({ id, name });
  return id;
}

function ensureSymptomId(subsystemId, title) {
  const existing = store.symptoms.find(
    (s) => s.subsystemId === subsystemId && s.title.toLowerCase() === title.toLowerCase()
  );
  if (existing) return existing.id;
  const id = `lib-sym-${store.symptoms.length + 1}`;
  store.symptoms.push({ id, subsystemId, title });
  return id;
}

function ensureSafetyIds(safetyTexts = []) {
  return safetyTexts.map((text) => {
    const existing = store.safetyNotes.find((note) => note.text.toLowerCase() === text.toLowerCase());
    if (existing) return existing.id;
    const id = `lib-sn-${store.safetyNotes.length + 1}`;
    store.safetyNotes.push({ id, text });
    return id;
  });
}

function normalizeFaultLibrary() {
  const library = readFaultLibrary();
  if (!library.length) return;

  library.forEach((entry, idx) => {
    const modelId = ensureModelId(entry.model_or_range || 'Generic BMU', entry.manufacturer || 'Unknown');
    const subsystemId = ensureSubsystemId(entry.subsystem || 'General');
    const symptomId = ensureSymptomId(subsystemId, entry.symptom_title || `Library symptom ${idx + 1}`);
    const safety = ensureSafetyIds(entry.safety_hazards_and_warnings || []);

    const causes = (entry.typical_root_causes || []).map((component, index, arr) => {
      const probability = arr.length ? Number((1 / arr.length).toFixed(2)) : undefined;
      return { component, probability };
    });

    const checks = [
      ...(entry.diagnostic_checks_step_by_step || []).map((text) => ({ text, detail: '' })),
      ...(entry.recommended_corrective_actions || []).map((text) => ({ text: `Recommended: ${text}`, detail: '' }))
    ];

    const flowId = `lib-f-${store.flows.length + 1}`;
    const modelIds = Array.from(new Set([modelId, ...store.models.map((m) => m.id)]));

    store.flows.push({
      id: flowId,
      modelIds,
      subsystemId,
      symptomId,
      likelyCauses: causes,
      checks,
      safety
    });
  });
}

normalizeFaultLibrary();

module.exports = { store };
