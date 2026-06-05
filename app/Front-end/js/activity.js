import { getUser, getProfile, signOut } from './supabase.js';

// ── Auth guard ────────────────────────────────────────
const user = await getUser();
if (!user) {
  window.location.href = '../index.html';
}

// ── Greeting ──────────────────────────────────────────
const greetingEl = document.getElementById('act-greeting-name');
const avatarInitials = document.querySelector('.avatar-initials');

const profile = await getProfile();
const displayName = profile?.name ?? user?.user_metadata?.name ?? 'Utilizador';
const initials    = displayName.slice(0, 2).toUpperCase();

if (greetingEl) {
  const hour   = new Date().getHours();
  const prefix = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';
  greetingEl.textContent = `${prefix}, ${displayName.split(' ')[0]}`;
}
if (avatarInitials) avatarInitials.textContent = initials;

// ── Workouts per day ──────────────────────────────────
const workoutPlans = {
  1: { // Segunda
    title: 'Peito e Bíceps',
    desc: 'Bíceps frescos e cheios de força',
    exercises: [
      { name: 'Supino Inclinado (Halteres ou Máquina)', muscle: 'Peito Superior', sets: 4, reps_min: 8, reps_max: 10, notes: 'Lembra-te das omoplatas juntas!' },
      { name: 'Supino Reto (Barra)', muscle: 'Peito', sets: 3, reps_min: 8, reps_max: 10 },
      { name: 'Peck Deck (Aberturas na Máquina)', muscle: 'Peito', sets: 3, reps_min: 10, reps_max: 12 },
      { name: 'Curl de Bíceps com Barra (reta ou W)', muscle: 'Bíceps', sets: 4, reps_min: 8, reps_max: 10, notes: 'Põe peso nisso, estás fresco!' },
      { name: 'Curl Martelo com Halteres', muscle: 'Bíceps', sets: 3, reps_min: 10, reps_max: 12 },
    ]
  },
  2: { // Terça
    title: 'Costas e Tríceps',
    desc: 'Tríceps frescos',
    exercises: [
      { name: 'Puxada Alta na Frente (Lat Pulldown)', muscle: 'Costas', sets: 4, reps_min: 8, reps_max: 10 },
      { name: 'Remada Curvada (Barra) ou Remada Baixa (Triângulo)', muscle: 'Costas', sets: 3, reps_min: 8, reps_max: 10 },
      { name: 'Pulldown com Braços Esticados (Corda)', muscle: 'Costas', sets: 3, reps_min: 10, reps_max: 12 },
      { name: 'Tríceps Testa (com barra W ou Halteres)', muscle: 'Tríceps', sets: 4, reps_min: 8, reps_max: 10 },
      { name: 'Tríceps na Polia (com Corda)', muscle: 'Tríceps', sets: 3, reps_min: 10, reps_max: 12 },
    ]
  },
  3: { // Quarta, Domingo
    title: 'Pernas Completas',
    desc: 'Treino completo de pernas',
    exercises: [
      { name: 'Agachamento (Livre, Hack ou Máquina Smith)', muscle: 'Pernas', sets: 4, reps_min: 8, reps_max: 10 },
      { name: 'Leg Press', muscle: 'Pernas', sets: 3, reps_min: 10, reps_max: 12 },
      { name: 'Cadeira Extensora', muscle: 'Pernas', sets: 3, reps_min: 12, reps_max: 15 },
      { name: 'Mesa ou Cadeira Flexora', muscle: 'Pernas', sets: 3, reps_min: 10, reps_max: 12 },
      { name: 'Gémeos (Panturrilhas)', muscle: 'Panturrilhas', sets: 4, reps_min: 15, reps_max: 15 },
    ]
  },
  4: { // Sábado
    title: 'Ombros e Abdominais',
    desc: 'Ombros, lembrete de peito e core',
    exercises: [
      { name: 'Crossover na Polia (Foco no peito)', muscle: 'Peito', sets: 3, reps_min: 12, reps_max: 15, notes: 'O teu choque extra de peito' },
      { name: 'Desenvolvimento com Halteres (Sentado)', muscle: 'Ombros', sets: 4, reps_min: 8, reps_max: 10 },
      { name: 'Elevação Lateral com Halteres', muscle: 'Ombros', sets: 4, reps_min: 12, reps_max: 15 },
      { name: 'Crucifixo Invertido (Máquina ou Halteres)', muscle: 'Ombros Traseiros', sets: 3, reps_min: 12, reps_max: 12 },
      { name: 'Abdominal Crunch na Máquina (ou no cabo)', muscle: 'Abdominais', sets: 3, reps_min: 15, reps_max: 20 },
    ]
  },
};

// Map weekday to plan
const DAY_TO_PLAN = { 0: 3, 1: 1, 2: 2, 3: 3, 4: 1, 5: 2, 6: 4 };

// ── Day selector & current day ─────────────────────────
const now          = new Date();
const DAY_LABELS   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const daySelectorEl = document.getElementById('day-selector');
let selectedDay    = now.getDay();
let currentPlanId  = DAY_TO_PLAN[selectedDay];

for (let offset = -2; offset <= 4; offset++) {
  const d = new Date(now);
  d.setDate(now.getDate() + offset);

  const btn = document.createElement('button');
  btn.className = 'day-btn' + (offset === 0 ? ' day-btn--active' : '');
  btn.setAttribute('role', 'listitem');
  if (offset === 0) btn.setAttribute('aria-current', 'date');

  btn.innerHTML = `
    <span class="day-label">${DAY_LABELS[d.getDay()]}</span>
    <span class="day-num">${d.getDate()}</span>
  `;

  btn.addEventListener('click', async () => {
    daySelectorEl.querySelectorAll('.day-btn').forEach((b) => {
      b.classList.remove('day-btn--active');
      b.removeAttribute('aria-current');
    });
    btn.classList.add('day-btn--active');
    btn.setAttribute('aria-current', 'date');

    selectedDay = d.getDay();
    currentPlanId = DAY_TO_PLAN[selectedDay];
    renderWorkout();
  });

  daySelectorEl.appendChild(btn);
}

setTimeout(() => {
  const active = daySelectorEl.querySelector('.day-btn--active');
  if (active) {
    const scrollLeft = active.offsetLeft - daySelectorEl.clientWidth / 2 + active.offsetWidth / 2;
    daySelectorEl.scrollTo({ left: scrollLeft, behavior: 'instant' });
  }
}, 0);

// ── Render workout ────────────────────────────────────
function renderWorkout() {
  const plan = workoutPlans[currentPlanId];
  if (!plan) return;

  const contextChips = document.querySelector('.workout-context-chips');
  const contextMeta = document.querySelector('.workout-context-meta');
  const exerciseList = document.getElementById('exercise-list');

  const muscleGroups = [...new Set(plan.exercises.map(e => e.muscle))];
  contextChips.innerHTML = muscleGroups
    .slice(0, 2)
    .map(m => {
      const isBack = m.toLowerCase().includes('costas') || m.toLowerCase().includes('tríceps');
      const isTeal = m.toLowerCase().includes('bíceps') || isBack;
      return `<span class="wchip wchip--${isTeal ? 'teal' : 'coral'}">${m}</span>`;
    })
    .join('');

  contextMeta.textContent = `${plan.exercises.length} exercícios`;

  exerciseList.innerHTML = '';
  plan.exercises.forEach((ex, idx) => {
    const li = document.createElement('li');
    li.className = 'exercise-card';
    li.dataset.id = idx;

    const reps = ex.reps_min === ex.reps_max
      ? `${ex.sets}×${ex.reps_min}`
      : `${ex.sets}×${ex.reps_min}-${ex.reps_max}`;

    const isCoralMuscle = !ex.muscle.toLowerCase().includes('costas') && !ex.muscle.toLowerCase().includes('tríceps') && !ex.muscle.toLowerCase().includes('bíceps');

    li.innerHTML = `
      <span class="ex-num">${idx + 1}</span>
      <div class="ex-thumb">💪</div>
      <div class="ex-info">
        <span class="ex-name">${ex.name}</span>
        <span class="ex-muscle-tag ex-muscle-tag--${isCoralMuscle ? 'coral' : 'teal'}">${ex.muscle}</span>
      </div>
      <div class="ex-right">
        <span class="ex-sets">${reps}</span>
        <svg class="ex-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    `;

    exerciseList.appendChild(li);
  });

  sessionLog = plan.exercises.map(ex =>
    Array.from({ length: ex.sets }, () => ({ reps: '', weight: '' }))
  );
}

let sessionLog = [];

// ── Modal ─────────────────────────────────────────────
const overlay  = document.getElementById('modal-overlay');
const saveBtn  = document.getElementById('save-btn');
const closeBtn = document.getElementById('modal-close');
let currentId  = null;

function openModal(id) {
  const plan = workoutPlans[currentPlanId];
  const ex = plan.exercises[id];
  if (!ex) return;

  currentId = id;

  document.getElementById('modal-hero').setAttribute('data-group', ex.muscle.toLowerCase());
  document.getElementById('modal-emoji').textContent = '💪';
  document.getElementById('modal-ex-name').textContent = ex.name;
  document.getElementById('modal-muscle-chip').textContent = ex.muscle;
  document.getElementById('modal-sets-badge').textContent = `${ex.sets}×${ex.reps_min}${ex.reps_min !== ex.reps_max ? `-${ex.reps_max}` : ''}`;
  document.getElementById('modal-desc').textContent = ex.notes || ex.name;

  const rows = document.getElementById('log-rows');
  rows.innerHTML = '';
  sessionLog[id].forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `
      <span class="log-set-num">${i + 1}</span>
      <input class="log-input" type="number" min="0" placeholder="${ex.reps_max}"
             value="${entry.reps}" data-field="reps" data-set="${i}"
             aria-label="Série ${i + 1} reps" />
      <input class="log-input" type="number" min="0" step="0.5"
             placeholder="kg" value="${entry.weight}"
             data-field="weight" data-set="${i}"
             aria-label="Série ${i + 1} peso" />
    `;
    rows.appendChild(row);
  });

  overlay.removeAttribute('aria-hidden');
  overlay.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('modal-open');
  document.body.style.overflow = '';
  currentId = null;
}

function saveLog() {
  if (currentId === null) return;
  document.querySelectorAll('.log-input').forEach((input) => {
    sessionLog[currentId][+input.dataset.set][input.dataset.field] = input.value;
  });
  saveBtn.textContent = 'GUARDADO! ✓';
  saveBtn.classList.add('save-btn--done');
  setTimeout(() => {
    saveBtn.textContent = 'GUARDAR REGISTO';
    saveBtn.classList.remove('save-btn--done');
  }, 1800);
}

document.getElementById('exercise-list').addEventListener('click', (e) => {
  const card = e.target.closest('.exercise-card');
  if (card) {
    const idx = Array.from(document.getElementById('exercise-list').children).indexOf(card);
    openModal(idx);
  }
});

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
saveBtn.addEventListener('click', saveLog);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── Avatar → sign out ─────────────────────────────────
document.querySelector('.act-avatar-btn').addEventListener('click', () => {
  signOut();
});

// Initial render
renderWorkout();
