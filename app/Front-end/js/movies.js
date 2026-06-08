const TMDB_KEY = window.ENV_TMDB_KEY || '';
const BASE_EMBED = 'https://myembed.biz';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

let currentType = 'movie';
let searchTimeout;

const tabs = document.querySelectorAll('.movie-tab');
const searchInput = document.getElementById('movie-search');
const searchBtn = document.getElementById('movie-search-btn');
const playerContainer = document.getElementById('player-container');
const resultsContainer = document.getElementById('results-container');

// ── Tab switching ─────────────────────────────────────
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('movie-tab--active'));
    tab.classList.add('movie-tab--active');
    currentType = tab.dataset.type;
    searchInput.value = '';
    searchInput.placeholder = currentType === 'movie'
      ? 'Procura um filme...'
      : 'Procura uma série...';
    clearResults();
  });
});

// ── Search ────────────────────────────────────────────
async function searchMovies(query) {
  if (!query.trim()) {
    clearResults();
    return;
  }

  if (!TMDB_KEY) {
    showError('TMDb API key não configurada');
    return;
  }

  resultsContainer.innerHTML = '<div class="movie-loading">A procurar...</div>';

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/${currentType}?query=${encodeURIComponent(query)}&api_key=${TMDB_KEY}`
    );

    if (!response.ok) {
      throw new Error('Erro ao procurar');
    }

    const data = await response.json();
    displayResults(data.results || []);
  } catch (err) {
    showError('Erro ao procurar: ' + err.message);
  }
}

// ── Display results ───────────────────────────────────
function displayResults(results) {
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div class="movie-empty">Nenhum resultado encontrado</div>';
    return;
  }

  const filtered = results.filter(item => {
    const poster = currentType === 'movie' ? item.poster_path : item.poster_path;
    return poster; // Só mostra items com poster
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = '<div class="movie-empty">Nenhuma imagem disponível</div>';
    return;
  }

  resultsContainer.innerHTML = `
    <div class="movie-grid">
      ${filtered.map(item => `
        <div class="movie-item" onclick="loadMedia(${item.id})">
          <img
            src="${TMDB_IMG}${item.poster_path}"
            alt="${item.title || item.name}"
            loading="lazy"
          />
        </div>
      `).join('')}
    </div>
  `;
}

// ── Load movie/series ─────────────────────────────────
function loadMedia(tmdbId) {
  const url = `${BASE_EMBED}/${currentType === 'movie' ? 'filme' : 'serie'}/${tmdbId}`;

  playerContainer.classList.add('active');
  resultsContainer.classList.remove('active');

  document.getElementById('movie-player').innerHTML = `
    <iframe
      src="${url}"
      frameborder="0"
      allowfullscreen
      loading="lazy"
    ></iframe>
  `;

  // Scroll to player
  setTimeout(() => {
    playerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ── Clear results ─────────────────────────────────────
function clearResults() {
  playerContainer.classList.remove('active');
  resultsContainer.classList.add('active');
  resultsContainer.innerHTML = '<div class="movie-empty">Procura por um filme ou série</div>';
  document.getElementById('movie-player').innerHTML = '<div style="padding: 20px; color: #999;">Selecciona um filme ou série</div>';
}

// ── Show error ────────────────────────────────────────
function showError(msg) {
  resultsContainer.innerHTML = `<div class="movie-empty">${msg}</div>`;
}

// ── Event listeners ───────────────────────────────────
searchBtn.addEventListener('click', () => {
  searchMovies(searchInput.value);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    searchMovies(searchInput.value);
  }
});

// Debounced search
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  if (searchInput.value.length > 2) {
    searchTimeout = setTimeout(() => {
      searchMovies(searchInput.value);
    }, 500);
  }
});

// Show welcome message if no key
if (!TMDB_KEY) {
  resultsContainer.innerHTML = `
    <div class="movie-empty">
      <p>⚠️ TMDb API key não configurada</p>
      <p style="font-size: 0.85rem; margin-top: 12px;">Adiciona TMDB_API_KEY no .env para procurar filmes</p>
    </div>
  `;
}
