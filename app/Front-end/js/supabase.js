import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lê variáveis de ambiente (injetadas por /env.js) ou usa fallback
const SUPABASE_URL  = window.ENV_SUPABASE_URL || 'https://uepyxgizdwvdwhclsmcc.supabase.co';
const SUPABASE_KEY  = window.ENV_SUPABASE_KEY || 'sb_publishable_aVjht0ulBEZ5VpYAC4Twxg_CXTYN2r0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Auth helpers ──────────────────────────────────────

export async function signUp(email, password, name) {
  try {
    // 1. Faz signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }

    // 2. Cria o perfil manualmente se o trigger não funcionar
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name: name || 'Utilizador'
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return { data, error: null };
  } catch (err) {
    console.error('Signup exception:', err);
    return { data: null, error: err };
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Sign in exception:', err);
    return { data: null, error: err };
  }
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error('Get user error:', error);
    return user;
  } catch (err) {
    console.error('Get user exception:', err);
    return null;
  }
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get profile error:', error);
    }

    return data || {
      id: user.id,
      name: user.user_metadata?.name || 'Utilizador'
    };
  } catch (err) {
    console.error('Get profile exception:', err);
    return {
      id: user.id,
      name: user.user_metadata?.name || 'Utilizador'
    };
  }
}

// ── Workout helpers ───────────────────────────────────

export async function saveWorkoutSession({ name, duration_min, exercises }) {
  const user = await getUser();
  if (!user) return { error: 'Não autenticado' };

  try {
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, name, duration_min })
      .select()
      .single();

    if (error) return { error };

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
  } catch (err) {
    console.error('Save workout error:', err);
    return { error: err };
  }
}

export async function getWorkoutHistory(limit = 10) {
  const user = await getUser();
  if (!user) return [];

  try {
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, session_exercises(*, exercise_sets(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch (err) {
    console.error('Get workout history error:', err);
    return [];
  }
}

// ── Chat helpers ──────────────────────────────────────

export async function saveChatMessage(role, content) {
  const user = await getUser();
  if (!user) return;

  try {
    await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, role, content });
  } catch (err) {
    console.error('Save chat message error:', err);
  }
}

export async function getChatHistory(limit = 50) {
  const user = await getUser();
  if (!user) return [];

  try {
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit);
    return data || [];
  } catch (err) {
    console.error('Get chat history error:', err);
    return [];
  }
}

// ── Progress photos helpers ───────────────────────────

export async function uploadProgressPhoto(file, analysis) {
  const user = await getUser();
  if (!user) return { error: 'Não autenticado' };

  try {
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
  } catch (err) {
    console.error('Upload progress photo error:', err);
    return { error: err };
  }
}

export async function getProgressPhotos() {
  const user = await getUser();
  if (!user) return [];

  try {
    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Get progress photos error:', err);
    return [];
  }
}
