import { getUser, getProfile, saveChatMessage, getChatHistory, uploadProgressPhoto, signOut } from './supabase.js';

// ── Auth guard ────────────────────────────────────────
const user = await getUser();
if (!user) {
  window.location.href = '../index.html';
}

// ── Avatar initials ───────────────────────────────────
const profile = await getProfile();
const displayName = profile?.name ?? user?.user_metadata?.name ?? 'Utilizador';
const avatarEl = document.querySelector('.avatar-initials');
if (avatarEl) avatarEl.textContent = displayName.slice(0, 2).toUpperCase();

// ── Sign out on avatar click ──────────────────────────
document.querySelector('.act-avatar-btn')?.addEventListener('click', () => signOut());

// ── Tab switching ─────────────────────────────────────
document.querySelectorAll('.ai-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('ai-tab--active'));
    document.querySelectorAll('.ai-panel').forEach(p => p.classList.add('ai-panel--hidden'));
    tab.classList.add('ai-tab--active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.remove('ai-panel--hidden');
  });
});

// ── Chat ──────────────────────────────────────────────
const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const chatSend     = document.getElementById('chat-send');
let chatHistory    = [];

function appendMessage(html, role) {
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg--${role}`;
  div.innerHTML  = `<div class="chat-bubble">${html}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function showTyping() {
  const div = appendMessage('<span class="typing-dots"><span></span><span></span><span></span></span>', 'ai');
  div.id = 'typing';
  return div;
}

function removeTyping() {
  document.getElementById('typing')?.remove();
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// Load existing chat history from Supabase
async function loadHistory() {
  const history = await getChatHistory(50);
  for (const msg of history) {
    appendMessage(formatText(msg.content), msg.role === 'model' ? 'ai' : 'user');
    if (msg.role === 'user') {
      chatHistory.push({ role: 'user',  parts: [{ text: msg.content }] });
    } else {
      chatHistory.push({ role: 'model', parts: [{ text: msg.content }] });
    }
  }
}

loadHistory();

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || chatSend.disabled) return;

  chatInput.value = '';
  appendMessage(text, 'user');
  chatSend.disabled = true;
  showTyping();

  try {
    const res  = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory }),
    });
    const data = await res.json();
    removeTyping();

    const reply = data.error || data.reply;
    appendMessage(formatText(reply), 'ai');

    if (!data.error) {
      chatHistory.push({ role: 'user',  parts: [{ text }] });
      chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
      // Persist to Supabase (fire-and-forget)
      saveChatMessage('user', text);
      saveChatMessage('model', data.reply);
    }
  } catch {
    removeTyping();
    appendMessage('Sem ligação ao servidor. Certifica-te que o servidor está a correr.', 'ai');
  } finally {
    chatSend.disabled = false;
    chatInput.focus();
  }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

// ── Photo Analysis ────────────────────────────────────
const photoInput       = document.getElementById('photo-input');
const photoPreview     = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');
const analyzeBtn       = document.getElementById('analyze-btn');
const analysisResult   = document.getElementById('analysis-result');

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    photoPreview.src = e.target.result;
    photoPreview.style.display = 'block';
    photoPlaceholder.style.display = 'none';
    analyzeBtn.disabled = false;
    analysisResult.innerHTML = '';
  };
  reader.readAsDataURL(file);
});

analyzeBtn.addEventListener('click', async () => {
  const file = photoInput.files[0];
  if (!file) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'A ANALISAR...';
  analysisResult.innerHTML = '<div class="analysis-loading">A IA está a analisar a tua foto 🔍</div>';

  const formData = new FormData();
  formData.append('photo', file);

  try {
    const res  = await fetch('/api/analyze', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.error) {
      analysisResult.innerHTML = `<p class="analysis-error">${data.error}</p>`;
    } else {
      const analysisHtml = formatText(data.analysis);
      analysisResult.innerHTML = `<div class="analysis-content">${analysisHtml}</div>`;
      // Save photo + analysis to Supabase Storage (fire-and-forget)
      uploadProgressPhoto(file, data.analysis);
    }
  } catch {
    analysisResult.innerHTML = '<p class="analysis-error">Sem ligação ao servidor. Certifica-te que o servidor está a correr.</p>';
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'ANALISAR';
  }
});
