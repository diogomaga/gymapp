import { signIn, signUp } from './supabase.js';

const form          = document.getElementById('login-form');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameField     = document.getElementById('name-field');
const nameInput     = document.getElementById('name');
const togglePwd     = document.getElementById('toggle-password');
const submitBtn     = form.querySelector('.lsubmit-btn');
const formMessage   = document.getElementById('form-message');
const toggleMode    = document.getElementById('toggle-mode');

let isSignup = false;

togglePwd.addEventListener('click', () => {
  const hidden = passwordInput.type === 'password';
  passwordInput.type = hidden ? 'text' : 'password';
  togglePwd.textContent = hidden ? 'Ocultar' : 'Ver';
});

toggleMode.addEventListener('click', (e) => {
  e.preventDefault();
  isSignup = !isSignup;
  nameField.hidden = !isSignup;
  submitBtn.textContent = isSignup ? 'CRIAR CONTA' : 'ENTRAR';
  toggleMode.textContent = isSignup ? 'Já tenho conta' : 'Criar conta';
  toggleMode.closest('p').firstChild.textContent = isSignup
    ? 'Já tens conta? '
    : 'Ainda não tens conta? ';
  formMessage.textContent = '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = emailInput.value.trim();
  const password = passwordInput.value;
  const name     = nameInput.value.trim();

  if (!email || !password) {
    formMessage.textContent = 'Preenche o email e a password.';
    return;
  }
  if (isSignup && !name) {
    formMessage.textContent = 'Introduz o teu nome.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = isSignup ? 'A CRIAR CONTA…' : 'A ENTRAR…';
  formMessage.textContent = '';

  const result = isSignup
    ? await signUp(email, password, name)
    : await signIn(email, password);

  console.log('Auth result:', result);

  if (result.error) {
    const errorMsg = result.error.message || JSON.stringify(result.error);
    console.error('Auth error:', errorMsg);
    formMessage.textContent = translateError(errorMsg);
    submitBtn.disabled = false;
    submitBtn.textContent = isSignup ? 'CRIAR CONTA' : 'ENTRAR';
    return;
  }

  if (isSignup) {
    formMessage.textContent = 'Conta criada! Verifica o teu email para confirmar.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'CRIAR CONTA';
  } else {
    window.location.href = './pages/activity.html';
  }
});

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou password incorretos.';
  if (msg.includes('Email not confirmed'))       return 'Confirma o teu email antes de entrar.';
  if (msg.includes('User already registered'))   return 'Este email já está registado.';
  if (msg.includes('Password should be'))        return 'A password deve ter pelo menos 6 caracteres.';
  return msg;
}
