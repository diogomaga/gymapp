import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = window.ENV_SUPABASE_URL;
const SUPABASE_KEY  = window.ENV_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Auth helpers ──────────────────────────────────────

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } },
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

// ── Workout helpers ───────────────────────────────────

export async function saveWorkoutSession({ name, duration_min, exercises }) {
  const user = await getUser();
  if (!user) return { error: 'Não autenticado' };

  // Cria a sessão
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert({ user_id: user.id, name, duration_min })
    .select()
    .single();

  if (error) return { error };

  // Guarda exercícios e séries
  for (const ex of exercises) {
    const { data: sessionEx } = await supabase
      .from('session_exercises')
      .insert({ session_id: session.id, exercise_name: ex.name, muscle_group: ex.muscle })
      .select()
      .single();

    if (sessionEx && ex.sets?.length) {
      const setsData = ex.sets.map((s, i) => ({
        exercise_id: sessionEx.id,
        set_number: i + 1,
        reps: s.reps || null,
        weight_kg: s.weight || null,
      }));
      await supabase.from('exercise_sets').insert(setsData);
    }
  }

  return { data: session };
}

export async function getWorkoutHistory(limit = 10) {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('workout_sessions')
    .select('*, session_exercises(*, exercise_sets(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ── Chat helpers ──────────────────────────────────────

export async function saveChatMessage(role, content) {
  const user = await getUser();
  if (!user) return;
  await supabase.from('chat_messages').insert({ user_id: user.id, role, content });
}

export async function getChatHistory(limit = 50) {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(limit);
  return data || [];
}

// ── Progress photos helpers ───────────────────────────

export async function uploadProgressPhoto(file, analysis) {
  const user = await getUser();
  if (!user) return { error: 'Não autenticado' };

  const fileName = `${user.id}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('progress-photos')
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) return { error: uploadError };

  const { data: { publicUrl } } = supabase.storage
    .from('progress-photos')
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('progress_photos')
    .insert({ user_id: user.id, photo_url: publicUrl, ai_analysis: analysis })
    .select()
    .single();

  return { data, error };
}

export async function getProgressPhotos() {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return data || [];
}
