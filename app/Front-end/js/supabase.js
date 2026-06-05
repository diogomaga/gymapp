import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lê variáveis de ambiente (injetadas por /env.js) ou usa fallback
const SUPABASE_URL  = window.ENV_SUPABASE_URL || 'https://uepyxgizdwvdwhclsmcc.supabase.co';
const SUPABASE_KEY  = window.ENV_SUPABASE_KEY || 'sb_publishable_aVjht0ulBEZ5VpYAC4Twxg_CXTYN2r0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Mock Auth (para testes locais) ──────────────────────
let mockUser = JSON.parse(localStorage.getItem('mockUser'));

export async function signUp(email, password, name) {
  if (!email || !password || !name) {
    return { error: { message: 'Preenche todos os campos' } };
  }

  mockUser = {
    id: 'mock-' + Date.now(),
    email,
    user_metadata: { name },
    created_at: new Date().toISOString()
  };

  localStorage.setItem('mockUser', JSON.stringify(mockUser));
  localStorage.setItem('mockPassword', password);

  return { data: { user: mockUser }, error: null };
}

export async function signIn(email, password) {
  const stored = JSON.parse(localStorage.getItem('mockUser'));
  const storedPassword = localStorage.getItem('mockPassword');

  if (!stored || stored.email !== email || storedPassword !== password) {
    return { error: { message: 'Email ou password incorretos' } };
  }

  mockUser = stored;
  return { data: { user: mockUser }, error: null };
}

export async function signOut() {
  mockUser = null;
  localStorage.removeItem('mockUser');
  localStorage.removeItem('mockPassword');
  window.location.href = '/index.html';
}

export async function getUser() {
  if (!mockUser) {
    mockUser = JSON.parse(localStorage.getItem('mockUser'));
  }
  return mockUser;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  return {
    id: user.id,
    name: user.user_metadata?.name || 'Utilizador',
    created_at: user.created_at
  };
}

// ── Workout helpers ───────────────────────────────────

export async function saveWorkoutSession({ name, duration_min, exercises }) {
  // Mock: guardar em localStorage
  const sessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]');
  const session = {
    id: 'session-' + Date.now(),
    user_id: mockUser?.id,
    name,
    duration_min,
    exercises,
    created_at: new Date().toISOString()
  };
  sessions.push(session);
  localStorage.setItem('workoutSessions', JSON.stringify(sessions));

  return { data: session };
}

export async function getWorkoutHistory(limit = 10) {
  const sessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]');
  return sessions.filter(s => s.user_id === mockUser?.id).slice(-limit);
}

// ── Chat helpers ──────────────────────────────────────

export async function saveChatMessage(role, content) {
  const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
  messages.push({
    id: 'msg-' + Date.now(),
    user_id: mockUser?.id,
    role,
    content,
    created_at: new Date().toISOString()
  });
  localStorage.setItem('chatMessages', JSON.stringify(messages));
}

export async function getChatHistory(limit = 50) {
  const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
  return messages.filter(m => m.user_id === mockUser?.id).slice(-limit);
}

// ── Progress photos helpers ───────────────────────────

export async function uploadProgressPhoto(file, analysis) {
  const photos = JSON.parse(localStorage.getItem('progressPhotos') || '[]');

  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = (e) => {
      photos.push({
        id: 'photo-' + Date.now(),
        user_id: mockUser?.id,
        photo_url: e.target.result,
        ai_analysis: analysis,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('progressPhotos', JSON.stringify(photos));
      resolve({ data: photos[photos.length - 1] });
    };
    reader.readAsDataURL(file);
  });
}

export async function getProgressPhotos() {
  const photos = JSON.parse(localStorage.getItem('progressPhotos') || '[]');
  return photos.filter(p => p.user_id === mockUser?.id);
}
