import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getMessaging,
  getToken
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTDz0R8WkY4ov8_28JMpe0jVmSD05oJb4",
  authDomain: "sport-project-301c2.firebaseapp.com",
  databaseURL: "https://sport-project-301c2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sport-project-301c2",
  storageBucket: "sport-project-301c2.firebasestorage.app",
  messagingSenderId: "743420630517",
  appId: "1:743420630517:web:c99cdf9dcd7699aa37fcbc",
  measurementId: "G-BG3SE17BB7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let unsubscribeWorkouts = null;

const loginBox = document.getElementById("loginBox");
const appBox = document.getElementById("appBox");
const userInfo = document.getElementById("userInfo");
const statusMessage = document.getElementById("statusMessage");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const exerciseInput = document.getElementById("exercise");
const valueInput = document.getElementById("value");
const unitInput = document.getElementById("unit");
const saveWorkoutBtn = document.getElementById("saveWorkoutBtn");
const workoutList = document.getElementById("workoutList");
const stats = document.getElementById("stats");
const enablePushBtn = document.getElementById("enablePushBtn");

setStatus(`Firebase initialisiert: ${firebaseConfig.projectId}`);

registerBtn.addEventListener("click", async () => {
  await runFirebaseAction("Registrierung", async () => {
    await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  });
});

loginBtn.addEventListener("click", async () => {
  await runFirebaseAction("Login", async () => {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  });
});

logoutBtn.addEventListener("click", async () => {
  await runFirebaseAction("Logout", async () => {
    await signOut(auth);
  });
});

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (unsubscribeWorkouts) {
    unsubscribeWorkouts();
    unsubscribeWorkouts = null;
  }

  if (user) {
    loginBox.hidden = true;
    appBox.hidden = false;
    userInfo.textContent = `Eingeloggt als ${user.email}`;
    setStatus("Firebase Auth verbunden. Lade Firestore-Daten ...");
    loadWorkouts();
  } else {
    loginBox.hidden = false;
    appBox.hidden = true;
    workoutList.innerHTML = "";
    stats.textContent = "";
    setStatus("Nicht eingeloggt. Firebase ist initialisiert.");
  }
});

saveWorkoutBtn.addEventListener("click", async () => {
  if (!currentUser) {
    setStatus("Bitte zuerst einloggen.", true);
    return;
  }

  if (!valueInput.value) {
    setStatus("Bitte einen Wert für das Training eingeben.", true);
    return;
  }

  await runFirebaseAction("Training speichern", async () => {
    await addDoc(collection(db, "workouts"), {
      userId: currentUser.uid,
      exercise: exerciseInput.value,
      value: Number(valueInput.value),
      unit: unitInput.value,
      createdAt: serverTimestamp()
    });

    valueInput.value = "";
  });
});

function loadWorkouts() {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );

  unsubscribeWorkouts = onSnapshot(q, snapshot => {
    workoutList.innerHTML = "";

    let total = 0;
    let count = 0;

    snapshot.forEach(doc => {
      const data = doc.data();

      const item = document.createElement("div");
      item.className = "workoutItem";

      const icon = document.createElement("span");
      icon.className = "workoutIcon";
      icon.textContent = getExerciseIcon(data.exercise);

      const content = document.createElement("span");

      const name = document.createElement("span");
      name.className = "workoutName";
      name.textContent = data.exercise;

      const meta = document.createElement("span");
      meta.className = "workoutMeta";
      meta.textContent = `${data.value} ${data.unit}`;

      content.append(name, meta);
      item.append(icon, content);
      workoutList.appendChild(item);

      total += data.value || 0;
      count++;
    });

    if (count === 0) {
      workoutList.innerHTML = `<div class="emptyState">Noch keine Trainings gespeichert. Trag dein erstes Workout ein!</div>`;
    }

    stats.textContent = `Einträge: ${count} · Gesamtwert: ${total}`;
    setStatus(`Firestore verbunden. ${count} Trainingseinträge geladen.`);
  }, error => {
    showFirebaseError("Firestore laden", error);
  });
}

enablePushBtn.addEventListener("click", async () => {
  if (!currentUser) {
    setStatus("Bitte zuerst einloggen.", true);
    return;
  }

  await runFirebaseAction("Push aktivieren", async () => {
    if (!firebaseConfig.messagingSenderId) {
      throw new Error("Firebase Messaging ist nicht konfiguriert.");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      throw new Error("Push wurde nicht erlaubt.");
    }

    const vapidKey = "DEIN_PUBLIC_VAPID_KEY";

    if (vapidKey === "DEIN_PUBLIC_VAPID_KEY") {
      throw new Error("Bitte zuerst den öffentlichen Web-Push-VAPID-Key in app.js eintragen.");
    }

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: "BJedoQzwYnHdUMlK7HW7Zabu64927HoibICRtwKD0xjoTadWCk7AMM7IDu9X1cBY5oqm3L5rUWrKEIcol0QdRPE"
    });

    console.log("Push Token:", token);

    await addDoc(collection(db, "pushTokens"), {
      userId: currentUser.uid,
      token,
      createdAt: serverTimestamp()
    });
  });
});

async function runFirebaseAction(label, action) {
  setStatus(`${label} läuft ...`);

  try {
    await action();
    setStatus(`${label} erfolgreich.`);
  } catch (error) {
    showFirebaseError(label, error);
  }
}

function showFirebaseError(label, error) {
  console.error(`${label} fehlgeschlagen:`, error);
  setStatus(`${label} fehlgeschlagen: ${getReadableFirebaseError(error)}`, true);
}

function getExerciseIcon(exercise) {
  const icons = {
    "Liegestütze": "💪",
    "Kniebeugen": "⚡",
    "Plank": "🔥",
    "Joggen": "🏃"
  };

  return icons[exercise] || "✓";
}

function getReadableFirebaseError(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "Diese E-Mail ist bereits registriert.",
    "auth/invalid-email": "Die E-Mail-Adresse ist ungültig.",
    "auth/invalid-credential": "E-Mail oder Passwort ist falsch.",
    "auth/weak-password": "Das Passwort muss mindestens 6 Zeichen haben.",
    "auth/configuration-not-found": "Firebase Authentication ist für dieses Projekt noch nicht aktiviert.",
    "permission-denied": "Firestore-Regeln blockieren den Zugriff. Prüfe die Rules in der Firebase Console.",
    "failed-precondition": "Firestore benötigt vermutlich einen Index für diese Abfrage. Öffne den Link in der Browser-Konsole und erstelle den Index."
  };

  return messages[code] || error?.message || "Unbekannter Firebase-Fehler.";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

window.firebaseDebug = {
  app,
  auth,
  db,
  enableFirestoreNetwork: () => enableNetwork(db),
  disableFirestoreNetwork: () => disableNetwork(db)
};
