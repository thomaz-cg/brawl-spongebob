# 🧽 Batalha do Fundo do Mar

Jogo de batalha 3v3 estilo Brawl Stars com personagens do Bob Esponja.  
Stack: **HTML + Canvas + Firebase Firestore (ranking online) + Vercel (hospedagem)**

---

## 📁 Estrutura do projeto

```
brawl-spongebob/
├── public/
│   ├── index.html      ← página principal
│   ├── style.css       ← estilos
│   ├── game.js         ← lógica do jogo (Canvas 2D)
│   └── firebase.js     ← ranking online (Firestore)
├── firestore.rules     ← regras de segurança do Firestore
├── firestore.indexes.json
├── vercel.json         ← configuração de deploy
└── .gitignore
```

---

## 🚀 Passo a passo: GitHub + Firebase + Vercel

### 1️⃣  Criar repositório no GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/brawl-spongebob.git
git push -u origin main
```

---

### 2️⃣  Configurar o Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** → dê um nome → crie
3. No menu lateral vá em **Firestore Database** → **Criar banco de dados**
   - Escolha **modo de produção** → selecione a região (ex: `southamerica-east1`)
4. No menu lateral vá em **Configurações do projeto** (ícone de engrenagem) → **Seus aplicativos** → **`</>`** (Web)
   - Registre o app e copie o objeto `firebaseConfig`

5. Abra o arquivo `public/firebase.js` e substitua:

```js
const firebaseConfig = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "SEU_PROJETO.firebaseapp.com",
  projectId:         "SEU_PROJETO",
  storageBucket:     "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId:             "SEU_APP_ID",
};
```

6. Aplique as regras de segurança:
   - No Firestore → **Regras** → cole o conteúdo de `firestore.rules` → **Publicar**

7. Faça o push da atualização:

```bash
git add public/firebase.js
git commit -m "add firebase config"
git push
```

---

### 3️⃣  Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. Clique em **"Add New Project"**
3. Importe o repositório `brawl-spongebob`
4. **Framework Preset**: selecione **"Other"**
5. **Root Directory**: deixe como `.` (raiz)
6. Clique em **Deploy** ✅

A Vercel vai detectar o `vercel.json` e servir tudo da pasta `public/` automaticamente.

Após o deploy você receberá uma URL pública como:
```
https://brawl-spongebob.vercel.app
```

---

## 🎮 Controles

| Tecla | Ação |
|-------|------|
| ⬆ ⬇ ⬅ ➡ ou WASD | Mover personagem |
| ESPAÇO | Atirar |
| Mobile (esquerda) | Joystick virtual |
| Mobile (direita) | Atirar |

## 🧽 Personagens

| Personagem | Velocidade | HP | Dano |
|------------|-----------|-----|------|
| Bob Esponja | ★★★ | 120 | ★★ |
| Patrick | ★ | 200 | ★★★ |
| Lula Molusco | ★★ | 140 | ★★★ |

---

## 🔧 Adicionando mais personagens

Em `game.js`, adicione uma entrada no objeto `CHARS`:

```js
const CHARS = {
  // ...existentes...
  sandy: {
    emoji: "🐿️", speed: 2.8, hp: 150, dmg: 28,
    bspeed: 7, color: "#c8a040", color2: "#a07828",
    bEmoji: "🥊", fr: 32
  },
};
```

E em `index.html` adicione um card na div `#char-select`:

```html
<div class="ccard" id="cc-sandy">
  <span class="cemoji">🐿️</span>
  <div class="cname">Sandy</div>
  <div class="cstat">Vel:★★★ Dano:★★</div>
</div>
```
