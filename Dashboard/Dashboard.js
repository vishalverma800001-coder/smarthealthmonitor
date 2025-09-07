// ===== Google Charts Setup =====
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(drawAllCharts);

// Demo time-series helpers
function hoursAgo(h) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
}

// Demo data generators (replace with live later)
function getPhData() {
  const rows = [];
  for (let i = 23; i >= 0; i--) {
    const ph = 6.8 + Math.sin(i / 4) * 0.5 + (Math.random() * 0.2 - 0.1);
    rows.push([hoursAgo(i), Number(ph.toFixed(2))]);
  }
  return rows;
}
function getTurbidityData() {
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return labels.map((d, i) => [d, Math.max(0.5, 2 + Math.sin(i) * 1.5 + Math.random())]);
}
function getChlorineData() {
  const rows = [];
  for (let i = 23; i >= 0; i--) {
    const cl = 0.7 + Math.cos(i / 5) * 0.15 + (Math.random() * 0.05);
    rows.push([hoursAgo(i), Number(cl.toFixed(3))]);
  }
  return rows;
}
function getRiskData() {
  // Low/Medium/High risk distribution (demo)
  const low = 55 + Math.round(Math.random() * 10);
  const med = 30 + Math.round(Math.random() * 8);
  const high = 100 - low - med;
  return [['Low', low], ['Medium', med], ['High', high]];
}

function drawAllCharts() {
  drawPhChart();
  drawTurbidityChart();
  drawChlorineChart();
  drawRiskChart();
}

function drawPhChart() {
  const data = new google.visualization.DataTable();
  data.addColumn('datetime', 'Time');
  data.addColumn('number', 'pH');
  data.addRows(getPhData());

  const options = {
    legend: { position: 'none' },
    vAxis: { title: 'pH', viewWindow: { min: 6, max: 8.5 } },
    hAxis: { title: 'Time' },
    chartArea: { left: 50, top: 20, width: '85%', height: '70%' },
    lineWidth: 3
  };
  const chart = new google.visualization.LineChart(document.getElementById('phLineChart'));
  chart.draw(data, options);
}

function drawTurbidityChart() {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Day');
  data.addColumn('number', 'NTU');
  data.addRows(getTurbidityData());

  const options = {
    legend: { position: 'none' },
    vAxis: { title: 'NTU' },
    chartArea: { left: 50, top: 20, width: '85%', height: '70%' },
  };
  const chart = new google.visualization.ColumnChart(document.getElementById('turbidityBarChart'));
  chart.draw(data, options);
}

function drawChlorineChart() {
  const data = new google.visualization.DataTable();
  data.addColumn('datetime', 'Time');
  data.addColumn('number', 'mg/L');
  data.addRows(getChlorineData());

  const options = {
    legend: { position: 'none' },
    vAxis: { title: 'mg/L' },
    hAxis: { title: 'Time' },
    chartArea: { left: 50, top: 20, width: '85%', height: '70%' },
    lineWidth: 3
  };
  const chart = new google.visualization.LineChart(document.getElementById('chlorineLineChart'));
  chart.draw(data, options);
}

function drawRiskChart() {
  const data = google.visualization.arrayToDataTable([['Risk', 'Value'], ...getRiskData()]);
  const options = {
    pieHole: 0.45,
    legend: { position: 'right' },
    chartArea: { left: 10, top: 10, width: '90%', height: '80%' },
  };
  const chart = new google.visualization.PieChart(document.getElementById('riskPieChart'));
  chart.draw(data, options);
}

// Redraw on resize so charts stay responsive
window.addEventListener('resize', () => {
  if (typeof google === 'object') drawAllCharts();
});

// ===== Tabs =====
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.tab;
    tabs.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${id}`).classList.add('active');
  });
});

// ===== Alerts (Demo) =====
const alertsKey = 'shm_alerts_v1';
const alertsList = document.getElementById('alertsList');

function loadAlerts() {
  return JSON.parse(localStorage.getItem(alertsKey) || '[]');
}
function saveAlerts(arr) {
  localStorage.setItem(alertsKey, JSON.stringify(arr));
}
function renderAlerts() {
  const items = loadAlerts();
  alertsList.innerHTML = items.length
    ? items.map((a, i) => `
      <li>
        <div>
          <div class="title">${a.title}</div>
          <div class="meta">${a.level} • ${a.time}</div>
        </div>
        <button class="btn danger" data-del="${i}">Dismiss</button>
      </li>
    `).join('')
    : '<li><div>No alerts.</div></li>';
}
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-del]')) {
    const idx = Number(e.target.getAttribute('data-del'));
    const items = loadAlerts(); items.splice(idx, 1); saveAlerts(items); renderAlerts();
  }
});
document.getElementById('injectAlertDemo').addEventListener('click', () => {
  const now = new Date().toLocaleString();
  const demo = {
    title: 'High Turbidity Detected',
    level: 'Warning',
    time: now
  };
  const items = loadAlerts(); items.unshift(demo); saveAlerts(items); renderAlerts();
});
renderAlerts();

// ===== Data Entry + Table (LocalStorage) =====
const entriesKey = 'shm_entries_v1';
const tbody = document.querySelector('#entriesTable tbody');
const form = document.getElementById('entryForm');
const statusEl = document.getElementById('formStatus');
const search = document.getElementById('search');
const clearAllBtn = document.getElementById('clearAll');

function loadEntries() {
  return JSON.parse(localStorage.getItem(entriesKey) || '[]');
}
function saveEntries(arr) {
  localStorage.setItem(entriesKey, JSON.stringify(arr));
}
function addEntry(obj) {
  const arr = loadEntries();
  arr.unshift(obj);
  saveEntries(arr);
}
function removeEntry(index) {
  const arr = loadEntries();
  arr.splice(index, 1);
  saveEntries(arr);
}
function renderTable(filter = '') {
  const data = loadEntries().filter(e => {
    const s = (e.name + ' ' + e.symptoms + ' ' + e.water).toLowerCase();
    return s.includes(filter.toLowerCase());
  });
  tbody.innerHTML = data.length
    ? data.map((e, i) => `
      <tr>
        <td>${data.length - i}</td>
        <td>${e.name}</td>
        <td>${e.symptoms}</td>
        <td><span class="badge">${e.water}</span></td>
        <td>${e.date}</td>
        <td><button class="btn danger" data-remove="${i}">Delete</button></td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" class="muted">No entries yet.</td></tr>`;
}
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-remove]')) {
    const idx = Number(e.target.getAttribute('data-remove'));
    removeEntry(idx);
    renderTable(search.value);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const symptoms = document.getElementById('symptoms').value.trim();
  const water = document.getElementById('water').value;

  if (!name || !symptoms || !water) {
    statusEl.textContent = 'Please fill all fields.'; return;
  }
  const entry = {
    name, symptoms, water,
    date: new Date().toLocaleString()
  };
  addEntry(entry);
  form.reset();
  statusEl.textContent = 'Saved!';
  renderTable(search.value);
  // Optional: create a warning alert based on water condition
  if (water === 'Dirty') {
    const items = loadAlerts();
    items.unshift({ title: `Manual Report: Dirty water (${name})`, level: 'Info', time: new Date().toLocaleString() });
    saveAlerts(items); renderAlerts();
  }
});

search.addEventListener('input', () => renderTable(search.value));
clearAllBtn.addEventListener('click', () => {
  if (confirm('Clear all saved entries?')) {
    saveEntries([]); renderTable('');
  }
});

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Initial render
renderTable();