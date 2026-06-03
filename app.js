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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getMessaging,
  getToken
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

const loginBox = document.getElementById("loginBox");
const appBox = document.getElementById("appBox");
const userInfo = document.getElementById("userInfo");

registerBtn.onclick = async () => {
  await createUserWithEmailAndPassword(
    auth,
    email.value,
    password.value
  );
};

loginBtn.onclick = async () => {
  await signInWithEmailAndPassword(
    auth,
    email.value,
    password.value
  );
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    loginBox.hidden = true;
    appBox.hidden = false;
    userInfo.textContent = `Eingeloggt als ${user.email}`;
    loadWorkouts();
  } else {
    loginBox.hidden = false;
    appBox.hidden = true;
  }
});

saveWorkoutBtn.onclick = async () => {
  if (!currentUser) return;

  await addDoc(collection(db, "workouts"), {
    userId: currentUser.uid,
    exercise: exercise.value,
    value: Number(value.value),
    unit: unit.value,
    createdAt: serverTimestamp()
  });

  value.value = "";
};

function loadWorkouts() {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, snapshot => {
    workoutList.innerHTML = "";

    let total = 0;
    let count = 0;

    snapshot.forEach(doc => {
      const data = doc.data();

      const item = document.createElement("div");
      item.className = "workoutItem";
      item.textContent = `${data.exercise}: ${data.value} ${data.unit}`;

      workoutList.appendChild(item);

      total += data.value || 0;
      count++;
    });

    stats.textContent = `Einträge: ${count} | Gesamtwert: ${total}`;
  });
}

enablePushBtn.onclick = async () => {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("Push wurde nicht erlaubt.");
    return;
  }

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: "DEIN_PUBLIC_VAPID_KEY"
  });

  console.log("Push Token:", token);

  await addDoc(collection(db, "pushTokens"), {
    userId: currentUser.uid,
    token,
    createdAt: serverTimestamp()
  });

  alert("Push aktiviert.");
};
