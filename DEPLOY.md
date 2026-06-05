# 🚀 Deploy GymApp no Render

A forma mais simples de colocar a app a correr sem terminal é fazer deploy no Render (gratuito).

## Pré-requisitos

1. Conta no GitHub (grátis em https://github.com/join)
2. Conta no Render (grátis em https://render.com)

## Passo 1: Criar Repositório no GitHub

1. Vai a https://github.com/new
2. Nome: `gymapp`
3. Descrição: `Gym workout app with AI coach`
4. Escolhe "Public" ou "Private" (como preferir)
5. Clica **Create repository**
6. Na página seguinte, copia os comandos da secção "…or push an existing repository from the command line"

## Passo 2: Push do código para GitHub

Abre o Terminal (PowerShell) e executa:

```powershell
cd C:\Users\Diogo\Desktop\Ginasio
git remote add origin https://github.com/SEU_USERNAME/gymapp.git
git branch -M main
git push -u origin main
```

(Substitui `SEU_USERNAME` pelo teu username do GitHub)

## Passo 3: Deploy no Render

1. Vai a https://render.com e faz login/sign up
2. Clica **New +** > **Web Service**
3. Clica **Connect** ao lado do seu repositório GitHub `gymapp`
4. Configura:
   - **Name**: `gymapp`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Scroll para baixo, clica **Advanced**
6. Adiciona estas Environment Variables:
   - `GEMINI_API_KEY` = (cola o valor de `.env`)
   - `SUPABASE_URL` = (cola o valor de `.env`)
   - `SUPABASE_ANON_KEY` = (cola o valor de `.env`)
   - `NODE_ENV` = `production`

7. Clica **Create Web Service**

Render vai fazer build e deploy automaticamente. Dentro de ~2 min terás a app a correr em:

```
https://gymapp-<random>.onrender.com
```

## Passo 4: Testa a App

Abre o link e testa:
- Login / Signup
- Página de Treino (com os 4 planos)
- AI Coach (chat + análise de fotos)
- PWA (clica install no navegador)

## Notas

- O plano gratuito do Render hiberna a app depois de 15 min sem atividade (demora ~30s a acordar)
- Todos os dados guardados no Supabase (BD) persistem
- As chaves das APIs estão protegidas no Render (não aparecem no código)

## Futuros updates

Sempre que fizeres mudanças:

```powershell
git add -A
git commit -m "Descrição da mudança"
git push origin main
```

Render vai fazer deploy automaticamente!
