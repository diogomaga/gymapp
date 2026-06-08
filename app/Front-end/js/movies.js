// ── Sugestões pré-definidas ──────────────────────────
const suggestions = {
  filme: [
    { title: 'Clube da Luta', tmdb: 550, emoji: '🤜' },
    { title: 'Inception', tmdb: 27205, emoji: '🌀' },
    { title: 'Matrix', tmdb: 603, emoji: '💊' },
    { title: 'Interestelar', tmdb: 157336, emoji: '🚀' },
  ],
  serie: [
    { title: 'Breaking Bad', tmdb: 1396, emoji: '⚗️' },
    { title: 'The Office', tmdb: 18594, emoji: '📎' },
    { title: 'Game of Thrones', tmdb: 1399, emoji: '👑' },
    { title: 'Stranger Things', tmdb: 66732, emoji: '🔴' },
  ]
};

let currentType = 'filme';
const BASE_URL = 'https://myembed.biz';

// ── Elements ──────────────────────────────────────────
const tabs = document.querySelectorAll('.movie-tab');
const idInput = document.getElementById('movie-id');
const searchBtn = document.getElementById('movie-search-btn');
const playerContainer = document.getElementById('movie-player');
const suggestionsContainer = document.getElementById('suggestions');

// ── Tab switching ─────────────────────────────────────
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('movie-tab--active'));
    tab.classList.add('movie-tab--active');
    currentType = tab.dataset.type;
    idInput.value = '';
    idInput.placeholder = currentType === 'filme'
      ? 'TMDb ID (550) ou IMDb (tt0137523)'
      : 'TMDb ID (1396) ou IMDb (tt0903747)';
    renderSuggestions();
    clearPlayer();
  });
});

// ── Render suggestions ────────────────────────────────
function renderSuggestions() {
  const items = suggestions[currentType];
  suggestionsContainer.innerHTML = items.map(item => `
    <div class="movie-card" onclick="loadMovie('${item.tmdb}')">
      <div class="movie-card-emoji">${item.emoji}</div>
      <div class="movie-card-title">${item.title}</div>
      <div class="movie-card-type">${currentType === 'filme' ? '🍿 Filme' : '📺 Série'}</div>
    </div>
  `).join('');
}

// ── Load movie/series ─────────────────────────────────
function loadMovie(id) {
  if (!id) return;

  const url = `${BASE_URL}/${currentType}/${id}`;
  playerContainer.innerHTML = `
    <iframe
      src="${url}"
      frameborder="0"
      allowfullscreen
      loading="lazy"
    ></iframe>
  `;

  // Scroll to player
  playerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Clear player ──────────────────────────────────────
function clearPlayer() {
  playerContainer.innerHTML = '<div class="movie-player-empty">Selecciona um filme ou série</div>';
}

// ── Search button ─────────────────────────────────────
searchBtn.addEventListener('click', () => {
  const id = idInput.value.trim();
  if (id) {
    loadMovie(id);
  }
});

// ── Enter key ─────────────────────────────────────────
idInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const id = idInput.value.trim();
    if (id) loadMovie(id);
  }
});

// ── Initialize ────────────────────────────────────────
renderSuggestions();
