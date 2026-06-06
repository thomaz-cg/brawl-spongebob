// ─────────────────────────────────────────────
//  firebase.js  –  Ranking online via Firestore
//  Substitua os valores abaixo pelos do seu
//  projeto no Firebase Console.
// ─────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDWpgggX9IRA52GLFxkKkCl1Tr29IoXBQc",
  authDomain:        "brawl-spongebob.firebaseapp.com",
  projectId:         "brawl-spongebob",
  storageBucket:     "brawl-spongebob.firebasestorage.app",
  messagingSenderId: "678736498881",
  appId:             "1:678736498881:web:ef5212f7fdf3abe9520440",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const COL = "ranking";

// Expõe no window para o game.js (script clássico) acessar
window.firebaseDB = {

  /** Busca top-10 do ranking */
  async getTop10() {
    try {
      const q   = query(collection(db, COL), orderBy("wins", "desc"), limit(10));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Firebase getTop10:", e);
      return [];
    }
  },

  /** Adiciona ou incrementa vitória de um jogador */
  async addWin(playerName) {
    if (!playerName || playerName.trim() === "") return;
    const name = playerName.trim().slice(0, 16);
    try {
      const q    = query(collection(db, COL), where("name", "==", name), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, COL), { name, wins: 1, updatedAt: Date.now() });
      } else {
        const ref = doc(db, COL, snap.docs[0].id);
        await updateDoc(ref, { wins: snap.docs[0].data().wins + 1, updatedAt: Date.now() });
      }
    } catch (e) {
      console.warn("Firebase addWin:", e);
    }
  },
};

// Carrega ranking assim que o módulo inicia
window.firebaseDB.getTop10().then(rows => {
  const el = document.getElementById("ranking-list");
  if (!el) return;
  if (!rows.length) { el.textContent = "Seja o primeiro! 🏆"; return; }
  const medals = ["🥇","🥈","🥉"];
  el.innerHTML = rows.map((r, i) => `
    <div class="rank-row">
      <span class="rank-pos">${medals[i] ?? `#${i+1}`}</span>
      <span class="rank-name">${r.name}</span>
      <span class="rank-wins">${r.wins}v</span>
    </div>`).join("");
});
