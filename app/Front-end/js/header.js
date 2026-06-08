import { getUser, getProfile } from './supabase.js';

async function setupHeader() {
  const user = await getUser();
  if (!user) return;

  const profile = await getProfile();
  const displayName = profile?.name ?? user?.user_metadata?.name ?? 'Utilizador';
  const initials = displayName.slice(0, 2).toUpperCase();

  // Atualiza o greeting
  const greetingEl = document.querySelector('.act-greeting');
  if (greetingEl && !greetingEl.textContent.includes('🎬') && !greetingEl.textContent.includes('🤖')) {
    const hour = new Date().getHours();
    const prefix = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';
    greetingEl.textContent = `${prefix}, ${displayName.split(' ')[0]}`;
  }

  // Atualiza as iniciais do avatar
  const avatarInitials = document.querySelector('.avatar-initials');
  if (avatarInitials) {
    avatarInitials.textContent = initials;
  }
}

setupHeader();
