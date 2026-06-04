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
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported
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

const publicVapidKey = "BJedoQzwYnHdUMlK7HW7Zabu64927HoibICRtwKD0xjoTadWCk7AMM7IDu9X1cBY5oqm3L5rUWrKEIcol0QdRPE";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let messagingServiceWorkerRegistration = null;
let unsubscribeForegroundMessages = null;

let currentUser = null;
let isAdminMode = false;
let unsubscribeWorkouts = null;
let unsubscribeWorkoutFeed = null;
let unsubscribeComparisonWorkouts = null;
let unsubscribeCurrentUserProfile = null;
let unsubscribeUsers = null;
let unsubscribeAdminUsers = null;
let unsubscribeAdminTeams = null;
let unsubscribeAdminWorkouts = null;
let workoutsCache = [];
let workoutHistoryCache = [];
let comparisonWorkoutsCache = [];
let usersCache = new Map();
let adminUsersCache = [];
let adminProfileUsersCache = [];
let adminWorkoutUsersCache = [];
let adminTeamsCache = [];
let currentUserTeamIds = [];
let workoutFeedInitialized = false;
const seenWorkoutFeedIds = new Set();
const PERSONAL_WORKOUT_HISTORY_LIMIT = 5;
const TEAM_WORKOUT_FEED_LIMIT = 3;
const TEAM_WORKOUT_QUERY_LIMIT = 100;
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "102938";
const FAVORITE_EXERCISES_STORAGE_KEY = "sporthubFavoriteExercises";

const exerciseCatalog = [
  { name: "Liegestütze", unit: "Wiederholungen", icon: "💪" },
  { name: "Kniebeugen", unit: "Wiederholungen", icon: "⚡" },
  { name: "Plank", unit: "Sekunden", icon: "🔥" },
  { name: "Joggen", unit: "Kilometer", icon: "🏃" },
  { name: "Burpees", unit: "Wiederholungen", icon: "💥" },
  { name: "Sit-ups", unit: "Wiederholungen", icon: "🧱" },
  { name: "Crunches", unit: "Wiederholungen", icon: "🔁" },
  { name: "Ausfallschritte", unit: "Wiederholungen", icon: "🦵" },
  { name: "Mountain Climbers", unit: "Wiederholungen", icon: "⛰️" },
  { name: "Jumping Jacks", unit: "Wiederholungen", icon: "⭐" },
  { name: "Klimmzüge", unit: "Wiederholungen", icon: "🧗" },
  { name: "Dips", unit: "Wiederholungen", icon: "🏋️" },
  { name: "Bankdrücken", unit: "Kilogramm", icon: "🏋️" },
  { name: "Kreuzheben", unit: "Kilogramm", icon: "🏋️" },
  { name: "Rudern", unit: "Minuten", icon: "🚣" },
  { name: "Radfahren", unit: "Kilometer", icon: "🚴" },
  { name: "Schwimmen", unit: "Meter", icon: "🏊" },
  { name: "Seilspringen", unit: "Minuten", icon: "🪢" },
  { name: "Yoga", unit: "Minuten", icon: "🧘" },
  { name: "Pilates", unit: "Minuten", icon: "🧘" },
  { name: "Hampelmänner", unit: "Wiederholungen", icon: "🤸" },
  { name: "Wandsitz", unit: "Sekunden", icon: "🧱" },
  { name: "Boxen", unit: "Minuten", icon: "🥊" },
  { name: "Spazieren", unit: "Kilometer", icon: "🚶" },
  { name: "Treppensteigen", unit: "Etagen", icon: "🪜" }
];

const favoriteExercises = new Set(loadFavoriteExercises());

const loginBox = document.getElementById("loginBox");
const appBox = document.getElementById("appBox");
const adminBox = document.getElementById("adminBox");
const userInfo = document.getElementById("userInfo");
const workoutTicker = document.getElementById("workoutTicker");
const workoutTickerList = document.getElementById("workoutTickerList");
const statusMessage = document.getElementById("statusMessage");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const exerciseInput = document.getElementById("exercise");
const favoriteExerciseBtn = document.getElementById("favoriteExerciseBtn");
const valueInput = document.getElementById("value");
const unitInput = document.getElementById("unit");
const saveWorkoutBtn = document.getElementById("saveWorkoutBtn");
const workoutList = document.getElementById("workoutList");
const stats = document.getElementById("stats");
const statsRange = document.getElementById("statsRange");
const customRange = document.getElementById("customRange");
const statsFrom = document.getElementById("statsFrom");
const statsTo = document.getElementById("statsTo");
const radarChart = document.getElementById("radarChart");
const radarSummary = document.getElementById("radarSummary");
const radarLegend = document.getElementById("radarLegend");
const comparisonRange = document.getElementById("comparisonRange");
const comparisonExercise = document.getElementById("comparisonExercise");
const comparisonSummary = document.getElementById("comparisonSummary");
const comparisonList = document.getElementById("comparisonList");
const enablePushBtn = document.getElementById("enablePushBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const teamNameInput = document.getElementById("teamName");
const createTeamBtn = document.getElementById("createTeamBtn");
const adminUserSelect = document.getElementById("adminUserSelect");
const teamAssignmentList = document.getElementById("teamAssignmentList");
const saveTeamAssignmentsBtn = document.getElementById("saveTeamAssignmentsBtn");
const adminUserList = document.getElementById("adminUserList");

populateExerciseSelects();
syncFavoriteExerciseButton();

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
  const loginIdentifier = emailInput.value;

  if (isAdminUsername(loginIdentifier)) {
    if (!isAdminCredentials(loginIdentifier, passwordInput.value)) {
      setStatus("Admin-Login fehlgeschlagen: Passwort ist falsch.", true);
      return;
    }

    await enterAdminMode();
    return;
  }

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

adminLogoutBtn.addEventListener("click", exitAdminMode);

createTeamBtn.addEventListener("click", async () => {
  const teamName = teamNameInput.value.trim();

  if (!teamName) {
    setStatus("Bitte einen Teamnamen eingeben.", true);
    return;
  }

  await runFirebaseAction("Team erstellen", async () => {
    await addDoc(collection(db, "teams"), {
      name: teamName,
      createdAt: serverTimestamp()
    });
    teamNameInput.value = "";
  });
});

adminUserSelect.addEventListener("change", renderTeamAssignmentList);

saveTeamAssignmentsBtn.addEventListener("click", async () => {
  const userId = adminUserSelect.value;

  if (!userId) {
    setStatus("Bitte zuerst einen User auswählen.", true);
    return;
  }

  const teamIds = Array.from(teamAssignmentList.querySelectorAll("input:checked"))
    .map(input => input.value);

  const selectedUser = adminUsersCache.find(user => user.id === userId);

  await runFirebaseAction("Team-Zuordnung speichern", async () => {
    await setDoc(doc(db, "users", userId), {
      email: selectedUser?.email || "Unbekannter User",
      teamIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
});

onAuthStateChanged(auth, async user => {
  currentUser = user;

  if (unsubscribeWorkouts) {
    unsubscribeWorkouts();
    unsubscribeWorkouts = null;
  }

  if (unsubscribeWorkoutFeed) {
    unsubscribeWorkoutFeed();
    unsubscribeWorkoutFeed = null;
  }

  if (unsubscribeComparisonWorkouts) {
    unsubscribeComparisonWorkouts();
    unsubscribeComparisonWorkouts = null;
  }

  if (unsubscribeCurrentUserProfile) {
    unsubscribeCurrentUserProfile();
    unsubscribeCurrentUserProfile = null;
  }

  if (unsubscribeUsers) {
    unsubscribeUsers();
    unsubscribeUsers = null;
  }

  workoutFeedInitialized = false;
  seenWorkoutFeedIds.clear();
  usersCache = new Map();
  currentUserTeamIds = [];

  if (isAdminMode) {
    return;
  }

  if (user) {
    loginBox.hidden = true;
    appBox.hidden = false;
    adminBox.hidden = true;
    userInfo.textContent = `Eingeloggt als ${user.email}`;
    setStatus("Firebase Auth verbunden. Lade Firestore-Daten ...");
    await ensureUserProfile(user);
    loadUsersForTeamVisibility();
    loadCurrentUserProfile(user.uid);
    loadWorkoutFeed();
    loadWorkouts();
    loadComparisonWorkouts();
  } else {
    loginBox.hidden = false;
    appBox.hidden = true;
    adminBox.hidden = true;
    workoutList.innerHTML = "";
    workoutsCache = [];
    workoutHistoryCache = [];
    comparisonWorkoutsCache = [];
    stats.textContent = "";
    renderWorkoutTicker([]);
    renderStats();
    renderComparison();
    setStatus("Nicht eingeloggt. Firebase ist initialisiert.");
  }
});

statsRange.addEventListener("change", () => {
  customRange.hidden = statsRange.value !== "custom";
  renderStats();
});

statsFrom.addEventListener("change", renderStats);
statsTo.addEventListener("change", renderStats);
comparisonRange.addEventListener("change", renderComparison);
comparisonExercise.addEventListener("change", renderComparison);
exerciseInput.addEventListener("change", () => {
  applyDefaultUnitForExercise();
  syncFavoriteExerciseButton();
});
favoriteExerciseBtn.addEventListener("click", toggleFavoriteExercise);

function isAdminUsername(email) {
  return email.trim().toLowerCase() === ADMIN_USERNAME;
}

function isAdminCredentials(email, password) {
  return isAdminUsername(email) && password === ADMIN_PASSWORD;
}

async function enterAdminMode() {
  isAdminMode = true;
  cleanupRegularSubscriptions();

  if (auth.currentUser) {
    await signOut(auth);
  }

  loginBox.hidden = true;
  appBox.hidden = true;
  adminBox.hidden = false;
  passwordInput.value = "";
  setStatus("Admin-Umgebung geöffnet. Lade User und Teams ...");
  loadAdminData();
}

function exitAdminMode() {
  isAdminMode = false;
  cleanupAdminSubscriptions();
  adminBox.hidden = true;
  loginBox.hidden = false;
  setStatus("Admin-Umgebung geschlossen.");
}

function cleanupRegularSubscriptions() {
  if (unsubscribeWorkouts) {
    unsubscribeWorkouts();
    unsubscribeWorkouts = null;
  }
  if (unsubscribeWorkoutFeed) {
    unsubscribeWorkoutFeed();
    unsubscribeWorkoutFeed = null;
  }
  if (unsubscribeComparisonWorkouts) {
    unsubscribeComparisonWorkouts();
    unsubscribeComparisonWorkouts = null;
  }
  if (unsubscribeCurrentUserProfile) {
    unsubscribeCurrentUserProfile();
    unsubscribeCurrentUserProfile = null;
  }
  if (unsubscribeUsers) {
    unsubscribeUsers();
    unsubscribeUsers = null;
  }
}

function cleanupAdminSubscriptions() {
  if (unsubscribeAdminUsers) {
    unsubscribeAdminUsers();
    unsubscribeAdminUsers = null;
  }

  if (unsubscribeAdminTeams) {
    unsubscribeAdminTeams();
    unsubscribeAdminTeams = null;
  }

  if (unsubscribeAdminWorkouts) {
    unsubscribeAdminWorkouts();
    unsubscribeAdminWorkouts = null;
  }
}

async function ensureUserProfile(user) {
  await setDoc(doc(db, "users", user.uid), {
    email: user.email || "Unbekannter User",
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function loadUsersForTeamVisibility() {
  unsubscribeUsers = onSnapshot(collection(db, "users"), snapshot => {
    usersCache = new Map();

    snapshot.forEach(userDoc => {
      const data = userDoc.data();
      usersCache.set(userDoc.id, {
        id: userDoc.id,
        email: data.email || "Unbekannter User",
        teamIds: Array.isArray(data.teamIds) ? data.teamIds : []
      });
    });

    renderWorkoutTicker(getVisibleTeamWorkouts(comparisonWorkoutsCache).slice(0, TEAM_WORKOUT_FEED_LIMIT));
    renderComparison();
  }, error => {
    showFirebaseError("User-Teamdaten laden", error);
  });
}

function loadCurrentUserProfile(userId) {
  unsubscribeCurrentUserProfile = onSnapshot(doc(db, "users", userId), snapshot => {
    const data = snapshot.exists() ? snapshot.data() : {};
    currentUserTeamIds = Array.isArray(data.teamIds) ? data.teamIds : [];
    userInfo.textContent = `Eingeloggt als ${currentUser.email}${getTeamInfoSuffix(currentUserTeamIds)}`;
    renderWorkoutTicker(getVisibleTeamWorkouts(comparisonWorkoutsCache).slice(0, TEAM_WORKOUT_FEED_LIMIT));
    renderComparison();
  }, error => {
    showFirebaseError("Eigene Teamdaten laden", error);
  });
}

function getTeamInfoSuffix(teamIds) {
  if (teamIds.length === 0) {
    return " · keinem Team zugeordnet";
  }

  return ` · ${teamIds.length} Team${teamIds.length === 1 ? "" : "s"}`;
}

function loadAdminData() {
  cleanupAdminSubscriptions();

  unsubscribeAdminUsers = onSnapshot(collection(db, "users"), snapshot => {
    adminProfileUsersCache = [];

    snapshot.forEach(userDoc => {
      const data = userDoc.data();
      adminProfileUsersCache.push({
        id: userDoc.id,
        email: data.email || "Unbekannter User",
        teamIds: Array.isArray(data.teamIds) ? data.teamIds : []
      });
    });

    syncAdminUsersCache();
    clearStatus();
  }, error => {
    showFirebaseError("Admin-User laden", error);
  });

  unsubscribeAdminWorkouts = onSnapshot(query(
    collection(db, "workouts"),
    orderBy("createdAt", "desc"),
    limit(1000)
  ), snapshot => {
    const workoutUsers = new Map();

    snapshot.forEach(workoutDoc => {
      const workout = createWorkoutFromDoc(workoutDoc.id, getSnapshotData(workoutDoc));

      if (workout.userId && !workoutUsers.has(workout.userId)) {
        workoutUsers.set(workout.userId, {
          id: workout.userId,
          email: workout.userEmail,
          teamIds: []
        });
      }
    });

    adminWorkoutUsersCache = Array.from(workoutUsers.values());
    syncAdminUsersCache();
  }, error => {
    showFirebaseError("Admin-Workout-User laden", error);
  });

  unsubscribeAdminTeams = onSnapshot(collection(db, "teams"), snapshot => {
    adminTeamsCache = [];

    snapshot.forEach(teamDoc => {
      const data = teamDoc.data();
      adminTeamsCache.push({
        id: teamDoc.id,
        name: data.name || "Unbenanntes Team"
      });
    });

    adminTeamsCache.sort((a, b) => a.name.localeCompare(b.name, "de"));
    syncAdminUsersCache();
    clearStatus();
  }, error => {
    showFirebaseError("Admin-Teams laden", error);
  });
}

function syncAdminUsersCache() {
  const usersById = new Map();

  adminWorkoutUsersCache.forEach(user => {
    usersById.set(user.id, user);
  });

  adminProfileUsersCache.forEach(user => {
    usersById.set(user.id, user);
  });

  adminUsersCache = Array.from(usersById.values())
    .sort((a, b) => a.email.localeCompare(b.email, "de"));

  renderAdminUserSelect();
  renderAdminUserList();
}

function renderAdminUserSelect() {
  const selectedUserId = adminUserSelect.value;
  adminUserSelect.replaceChildren();

  if (adminUsersCache.length === 0) {
    adminUserSelect.appendChild(createSelectOption("", "Noch keine User gefunden"));
    renderTeamAssignmentList();
    return;
  }

  adminUsersCache.forEach(user => {
    adminUserSelect.appendChild(createSelectOption(user.id, user.email));
  });

  if (adminUsersCache.some(user => user.id === selectedUserId)) {
    adminUserSelect.value = selectedUserId;
  }

  renderTeamAssignmentList();
}

function renderTeamAssignmentList() {
  teamAssignmentList.innerHTML = "";
  const selectedUser = adminUsersCache.find(user => user.id === adminUserSelect.value);

  if (!selectedUser) {
    teamAssignmentList.innerHTML = `<div class="emptyState">Wähle einen User aus, um Teams zuzuordnen.</div>`;
    return;
  }

  if (adminTeamsCache.length === 0) {
    teamAssignmentList.innerHTML = `<div class="emptyState">Erstelle zuerst ein Team.</div>`;
    return;
  }

  adminTeamsCache.forEach(team => {
    const label = document.createElement("label");
    label.className = "teamCheckbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = team.id;
    checkbox.checked = selectedUser.teamIds.includes(team.id);

    const text = document.createElement("span");
    text.textContent = team.name;

    label.append(checkbox, text);
    teamAssignmentList.appendChild(label);
  });
}

function renderAdminUserList() {
  adminUserList.innerHTML = "";

  if (adminUsersCache.length === 0) {
    adminUserList.innerHTML = `<div class="emptyState">Noch keine registrierten User. Sobald sich User anmelden oder Trainings gespeichert haben, erscheinen sie hier.</div>`;
    return;
  }

  adminUsersCache.forEach(user => {
    const item = document.createElement("article");
    item.className = "adminUserItem";

    const email = document.createElement("strong");
    email.textContent = user.email;

    const teams = document.createElement("p");
    teams.textContent = getTeamNames(user.teamIds);

    item.append(email, teams);
    adminUserList.appendChild(item);
  });
}

function getTeamNames(teamIds) {
  if (!teamIds.length) {
    return "Keinem Team zugeordnet";
  }

  return teamIds
    .map(teamId => adminTeamsCache.find(team => team.id === teamId)?.name || "Unbekanntes Team")
    .join(", ");
}

function populateExerciseSelects() {
  populateExerciseSelect(exerciseInput, { includeAllOption: false });
  populateExerciseSelect(comparisonExercise, { includeAllOption: true });
  applyDefaultUnitForExercise();
}

function populateExerciseSelect(selectElement, { includeAllOption }) {
  const currentValue = selectElement.value;
  const sortedExercises = getSortedExercises();
  const favoriteOptions = sortedExercises.filter(exercise => favoriteExercises.has(exercise.name));
  const regularOptions = sortedExercises.filter(exercise => !favoriteExercises.has(exercise.name));

  selectElement.replaceChildren();

  if (includeAllOption) {
    selectElement.appendChild(createSelectOption("all", "Alle Übungen"));
  }

  if (favoriteOptions.length > 0) {
    appendExerciseOptions(selectElement, favoriteOptions, "★");
  }

  appendExerciseOptions(selectElement, regularOptions);

  const availableValues = Array.from(selectElement.options).map(option => option.value);

  if (currentValue && availableValues.includes(currentValue)) {
    selectElement.value = currentValue;
  } else if (includeAllOption) {
    selectElement.value = "all";
  } else if (availableValues.length > 0) {
    selectElement.value = availableValues[0];
  }
}

function appendExerciseOptions(selectElement, exercises, prefix = "") {
  exercises.forEach(exercise => {
    const iconLabel = prefix ? `${prefix} ${exercise.icon}` : exercise.icon;
    selectElement.appendChild(createSelectOption(exercise.name, `${iconLabel} ${exercise.name}`));
  });
}

function createSelectOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;

  return option;
}

function getSortedExercises() {
  return [...exerciseCatalog].sort((a, b) => a.name.localeCompare(b.name, "de"));
}

function toggleFavoriteExercise() {
  const exercise = exerciseInput.value;

  if (favoriteExercises.has(exercise)) {
    favoriteExercises.delete(exercise);
    setStatus(`${exercise} aus den Favoriten entfernt.`);
  } else {
    favoriteExercises.add(exercise);
    setStatus(`${exercise} als Favorit gespeichert.`);
  }

  saveFavoriteExercises();
  populateExerciseSelects();
  exerciseInput.value = exercise;
  syncFavoriteExerciseButton();
  renderComparison();
}

function syncFavoriteExerciseButton() {
  const exercise = exerciseInput.value;
  const isFavorite = favoriteExercises.has(exercise);
  favoriteExerciseBtn.classList.toggle("isFavorite", isFavorite);
  favoriteExerciseBtn.setAttribute("aria-pressed", String(isFavorite));
  favoriteExerciseBtn.textContent = isFavorite ? "★ Favorit" : "☆ Favorisieren";
}

function applyDefaultUnitForExercise() {
  const exercise = exerciseCatalog.find(item => item.name === exerciseInput.value);

  if (exercise && Array.from(unitInput.options).some(option => option.value === exercise.unit)) {
    unitInput.value = exercise.unit;
  }
}

function loadFavoriteExercises() {
  try {
    const storedFavorites = JSON.parse(localStorage.getItem(FAVORITE_EXERCISES_STORAGE_KEY) || "[]");
    return storedFavorites.filter(exercise => exerciseCatalog.some(item => item.name === exercise));
  } catch (error) {
    console.warn("Favoriten konnten nicht geladen werden:", error);
    return [];
  }
}

function saveFavoriteExercises() {
  localStorage.setItem(FAVORITE_EXERCISES_STORAGE_KEY, JSON.stringify([...favoriteExercises]));
}

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
      userEmail: currentUser.email || "Unbekannter User",
      exercise: exerciseInput.value,
      value: Number(valueInput.value),
      unit: unitInput.value,
      teamIds: currentUserTeamIds,
      createdAt: serverTimestamp()
    });

    valueInput.value = "";
  });
});

function loadWorkoutFeed() {
  const q = query(
    collection(db, "workouts"),
    orderBy("createdAt", "desc"),
    limit(TEAM_WORKOUT_QUERY_LIMIT)
  );

  unsubscribeWorkoutFeed = onSnapshot(q, snapshot => {
    const workouts = [];
    const newWorkoutNotifications = [];

    snapshot.forEach(doc => {
      const data = getSnapshotData(doc);
      workouts.push(createWorkoutFromDoc(doc.id, data));
    });

    snapshot.docChanges().forEach(change => {
      if (change.type !== "added" || seenWorkoutFeedIds.has(change.doc.id)) {
        return;
      }

      seenWorkoutFeedIds.add(change.doc.id);

      if (workoutFeedInitialized) {
        newWorkoutNotifications.push(createWorkoutFromDoc(change.doc.id, getSnapshotData(change.doc)));
      }
    });

    workoutFeedInitialized = true;
    const visibleWorkouts = getVisibleTeamWorkouts(workouts).slice(0, TEAM_WORKOUT_FEED_LIMIT);
    renderWorkoutTicker(visibleWorkouts);
    newWorkoutNotifications
      .filter(workout => canSeeWorkoutInTeams(workout))
      .forEach(showWorkoutPushNotification);
  }, error => {
    showFirebaseError("Info-Balken laden", error);
  });
}

function renderWorkoutTicker(workouts) {
  workoutTicker.hidden = false;
  workoutTickerList.innerHTML = "";

  if (workouts.length === 0) {
    const empty = document.createElement("li");
    empty.className = "tickerEmpty";
    empty.textContent = currentUser
      ? "Noch keine Trainings im Team. Starte die erste Einheit!"
      : "Logge dich ein, um aktuelle Trainingsmeldungen zu sehen.";
    workoutTickerList.appendChild(empty);
    return;
  }

  workouts.slice(0, TEAM_WORKOUT_FEED_LIMIT).forEach(workout => {
    const item = document.createElement("li");
    item.className = "tickerItem";

    const icon = document.createElement("span");
    icon.className = "tickerIcon";
    icon.textContent = getExerciseIcon(workout.exercise);

    const message = document.createElement("span");
    message.textContent = getWorkoutNotificationBody(workout);

    item.append(icon, message);
    workoutTickerList.appendChild(item);
  });
}

function getSnapshotData(doc) {
  return doc.data({ serverTimestamps: "estimate" });
}

function createWorkoutFromDoc(id, data) {
  return {
    id,
    userId: data.userId,
    userEmail: data.userEmail || "Ein User",
    exercise: data.exercise,
    value: Number(data.value) || 0,
    unit: data.unit,
    teamIds: Array.isArray(data.teamIds) ? data.teamIds : [],
    createdAt: getWorkoutDate(data.createdAt)
  };
}

async function showWorkoutPushNotification(workout) {
  if (!canShowWorkoutNotification()) {
    return;
  }

  const title = "Neue Trainingseinheit";
  const body = getWorkoutNotificationBody(workout);
  const options = {
    body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: `workout-${workout.id}`,
    renotify: true
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await getMessagingServiceWorkerRegistration();
      await registration.showNotification(title, options);
      return;
    }

    new Notification(title, options);
  } catch (error) {
    console.warn("Workout-Push konnte nicht angezeigt werden:", error);
  }
}

function canShowWorkoutNotification() {
  return "Notification" in window && Notification.permission === "granted";
}

function getWorkoutNotificationBody(workout) {
  const userName = getDisplayUserName(workout.userEmail);
  return `${userName} hat ${formatNumber(workout.value)} ${workout.unit} ${workout.exercise} gemacht.`;
}

function getDisplayUserName(email) {
  if (!email) {
    return "Ein User";
  }

  return email.includes("@") ? email.split("@")[0] : email;
}

function loadWorkouts() {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );

  unsubscribeWorkouts = onSnapshot(q, snapshot => {
    workoutsCache = [];
    workoutHistoryCache = [];
    workoutList.innerHTML = "";

    snapshot.forEach(doc => {
      const workout = createWorkoutFromDoc(doc.id, getSnapshotData(doc));
      workoutsCache.push(workout);
    });

    workoutHistoryCache = workoutsCache.slice(0, PERSONAL_WORKOUT_HISTORY_LIMIT);
    renderWorkoutList(workoutHistoryCache);
    renderStats();
    clearStatus();
  }, error => {
    showFirebaseError("Firestore laden", error);
  });
}

function loadComparisonWorkouts() {
  const q = query(
    collection(db, "workouts"),
    orderBy("createdAt", "desc"),
    limit(250)
  );

  unsubscribeComparisonWorkouts = onSnapshot(q, snapshot => {
    comparisonWorkoutsCache = [];

    snapshot.forEach(doc => {
      comparisonWorkoutsCache.push(createWorkoutFromDoc(doc.id, getSnapshotData(doc)));
    });

    renderComparison();
  }, error => {
    showFirebaseError("Team-Vergleich laden", error);
  });
}

function getVisibleTeamWorkouts(workouts) {
  return workouts.filter(workout => canSeeWorkoutInTeams(workout));
}

function canSeeWorkoutInTeams(workout) {
  if (!currentUser) {
    return false;
  }

  if (workout.userId === currentUser.uid) {
    return true;
  }

  if (currentUserTeamIds.length === 0) {
    return false;
  }

  const workoutTeamIds = getWorkoutTeamIds(workout);
  return workoutTeamIds.some(teamId => currentUserTeamIds.includes(teamId));
}

function getWorkoutTeamIds(workout) {
  if (workout.teamIds?.length) {
    return workout.teamIds;
  }

  return usersCache.get(workout.userId)?.teamIds || [];
}

function renderComparison() {
  comparisonList.innerHTML = "";

  if (!currentUser) {
    comparisonSummary.textContent = "Logge dich ein, um deinen Fortschritt mit anderen Usern zu vergleichen.";
    comparisonList.innerHTML = `<div class="emptyState">Noch kein Team-Vergleich verfügbar.</div>`;
    return;
  }

  const range = getSelectedComparisonRange();
  const exercise = comparisonExercise.value;
  const filteredWorkouts = comparisonWorkoutsCache.filter(workout => {
    const exerciseMatches = exercise === "all" || workout.exercise === exercise;
    return exerciseMatches && isWorkoutInRange(workout, range) && canSeeWorkoutInTeams(workout);
  });
  const ranking = getUserRanking(filteredWorkouts);
  const currentUserIndex = ranking.findIndex(user => user.userId === currentUser.uid);

  if (ranking.length === 0) {
    comparisonSummary.textContent = `Keine Team-Daten für ${range.label}${getExerciseLabelSuffix(exercise)}.`;
    comparisonList.innerHTML = `<div class="emptyState">Sobald User aus deinen Teams Trainings speichern, erscheint hier die Rangliste.</div>`;
    return;
  }

  const leader = ranking[0];
  const currentUserStats = currentUserIndex >= 0 ? ranking[currentUserIndex] : null;
  comparisonSummary.textContent = currentUserStats
    ? `Du bist auf Platz ${currentUserIndex + 1} von ${ranking.length} für ${range.label}${getExerciseLabelSuffix(exercise)}. Abstand zur Spitze: ${formatNumber(Math.max(leader.total - currentUserStats.total, 0))}.`
    : `Für dich gibt es in ${range.label}${getExerciseLabelSuffix(exercise)} noch keinen Eintrag. ${getDisplayUserName(leader.userEmail)} führt mit ${formatNumber(leader.total)}.`;

  const maxTotal = Math.max(leader.total, 1);
  ranking.forEach((user, index) => {
    comparisonList.appendChild(createComparisonItem(user, index, maxTotal));
  });
}

function getUserRanking(workouts) {
  const users = new Map();

  workouts.forEach(workout => {
    const key = workout.userId || workout.userEmail;

    if (!users.has(key)) {
      users.set(key, {
        userId: workout.userId,
        userEmail: workout.userEmail,
        total: 0,
        entries: 0,
        exerciseTotals: {}
      });
    }

    const user = users.get(key);
    user.total += workout.value;
    user.entries += 1;
    user.exerciseTotals[workout.exercise] = (user.exerciseTotals[workout.exercise] || 0) + workout.value;
  });

  return Array.from(users.values()).sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }

    return b.entries - a.entries;
  });
}

function createComparisonItem(user, index, maxTotal) {
  const item = document.createElement("article");
  item.className = "comparisonItem";
  item.classList.toggle("isCurrentUser", user.userId === currentUser.uid);

  const rank = document.createElement("span");
  rank.className = "comparisonRank";
  rank.textContent = `#${index + 1}`;

  const content = document.createElement("div");
  content.className = "comparisonContent";

  const header = document.createElement("div");
  header.className = "comparisonItemHeader";

  const name = document.createElement("strong");
  name.textContent = user.userId === currentUser.uid
    ? `${getDisplayUserName(user.userEmail)} (du)`
    : getDisplayUserName(user.userEmail);

  const value = document.createElement("span");
  value.textContent = `${formatNumber(user.total)} Punkte`;

  header.append(name, value);

  const progress = document.createElement("div");
  progress.className = "comparisonProgress";
  progress.setAttribute("aria-label", `${formatNumber(user.total)} von ${formatNumber(maxTotal)} Punkten`);

  const bar = document.createElement("span");
  bar.style.width = `${Math.max((user.total / maxTotal) * 100, 4)}%`;
  progress.appendChild(bar);

  const details = document.createElement("p");
  details.className = "comparisonDetails";
  details.textContent = `${user.entries} Einträge · ${getTopExerciseSummary(user.exerciseTotals)}`;

  content.append(header, progress, details);
  item.append(rank, content);
  return item;
}

function getTopExerciseSummary(exerciseTotals) {
  const [exercise, value] = Object.entries(exerciseTotals).sort((a, b) => b[1] - a[1])[0] || [];
  return exercise ? `Top: ${getExerciseIcon(exercise)} ${exercise} (${formatNumber(value)})` : "Noch kein Übungsfokus";
}

function getExerciseLabelSuffix(exercise) {
  return exercise === "all" ? "" : ` · ${exercise}`;
}

function renderWorkoutList(workouts) {
  workoutList.innerHTML = "";

  workouts.forEach(workout => {
    const item = document.createElement("div");
    item.className = "workoutItem";

    const icon = document.createElement("span");
    icon.className = "workoutIcon";
    icon.textContent = getExerciseIcon(workout.exercise);

    const content = document.createElement("span");

    const name = document.createElement("span");
    name.className = "workoutName";
    name.textContent = workout.exercise;

    const meta = document.createElement("span");
    meta.className = "workoutMeta";
    meta.textContent = `${workout.value} ${workout.unit} · ${formatWorkoutDate(workout.createdAt)}`;

    content.append(name, meta);
    item.append(icon, content);
    workoutList.appendChild(item);
  });

  if (workouts.length === 0) {
    workoutList.innerHTML = `<div class="emptyState">Noch keine Trainings gespeichert. Trag dein erstes Workout ein!</div>`;
  }
}

function renderStats() {
  const range = getSelectedStatsRange();
  const filteredWorkouts = workoutsCache.filter(workout => isWorkoutInRange(workout, range));
  const total = filteredWorkouts.reduce((sum, workout) => sum + workout.value, 0);
  const exerciseTotals = getExerciseTotals(filteredWorkouts);

  stats.textContent = `Zeitraum: ${range.label} · Einträge: ${filteredWorkouts.length} · Gesamtwert: ${formatNumber(total)}`;
  renderRadarChart(exerciseTotals, filteredWorkouts.length, range.label);
}

function getSelectedStatsRange() {
  return getStatsRange(statsRange.value, statsFrom.value, statsTo.value);
}

function getSelectedComparisonRange() {
  return getStatsRange(comparisonRange.value);
}

function getStatsRange(value, fromValue = "", toValue = "") {
  const now = new Date();
  const today = startOfDay(now);

  if (value === "week") {
    const start = startOfWeek(today);
    return { label: "Diese Woche", start, end: endOfDay(now) };
  }

  if (value === "last7") {
    return { label: "Letzte 7 Tage", start: addDays(today, -6), end: endOfDay(now) };
  }

  if (value === "month") {
    return { label: "Dieser Monat", start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
  }

  if (value === "last30") {
    return { label: "Letzte 30 Tage", start: addDays(today, -29), end: endOfDay(now) };
  }

  if (value === "custom") {
    const start = fromValue ? startOfDay(new Date(fromValue)) : null;
    const end = toValue ? endOfDay(new Date(toValue)) : null;
    return { label: getCustomRangeLabel(start, end), start, end };
  }

  return { label: "Alles", start: null, end: null };
}

function isWorkoutInRange(workout, range) {
  if (!workout.createdAt) {
    return range.start === null && range.end === null;
  }

  if (range.start && workout.createdAt < range.start) {
    return false;
  }

  if (range.end && workout.createdAt > range.end) {
    return false;
  }

  return true;
}

function renderRadarChart(exerciseTotals, entryCount, rangeLabel) {
  const entries = Object.entries(exerciseTotals).filter(([, value]) => value > 0);
  const maxValue = Math.max(...entries.map(([, value]) => value), 1);
  const center = 120;
  const maxRadius = 78;
  const levels = [0.25, 0.5, 0.75, 1];

  radarChart.replaceChildren();
  radarLegend.replaceChildren();

  if (entries.length === 0) {
    radarSummary.textContent = `Keine Daten für ${rangeLabel}.`;
    return;
  }

  levels.forEach(level => {
    radarChart.appendChild(createSvgElement("polygon", {
      points: getRadarPoints(entries.length, center, maxRadius * level),
      class: "radarGrid"
    }));
  });

  entries.forEach(([exercise], index) => {
    const outerPoint = getRadarPoint(index, entries.length, center, maxRadius);
    const labelPoint = getRadarPoint(index, entries.length, center, maxRadius + 24);

    radarChart.appendChild(createSvgElement("line", {
      x1: center,
      y1: center,
      x2: outerPoint.x,
      y2: outerPoint.y,
      class: "radarAxis"
    }));

    const label = createSvgElement("text", {
      x: labelPoint.x,
      y: labelPoint.y,
      class: "radarLabel",
      "text-anchor": labelPoint.x < center - 8 ? "end" : labelPoint.x > center + 8 ? "start" : "middle"
    });
    label.textContent = exercise;
    radarChart.appendChild(label);
  });

  if (entryCount > 0) {
    const dataPoints = entries.map(([, value], index) => {
      const radius = (value / maxValue) * maxRadius;
      const point = getRadarPoint(index, entries.length, center, radius);
      return `${point.x},${point.y}`;
    }).join(" ");

    radarChart.appendChild(createSvgElement("polygon", {
      points: dataPoints,
      class: "radarArea"
    }));

    entries.forEach(([, value], index) => {
      const radius = (value / maxValue) * maxRadius;
      const point = getRadarPoint(index, entries.length, center, radius);
      radarChart.appendChild(createSvgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: 4,
        class: "radarDot"
      }));
    });
  }

  entries.forEach(([exercise, value]) => {
    const item = document.createElement("span");
    item.textContent = `${getExerciseIcon(exercise)} ${exercise}: ${formatNumber(value)}`;
    radarLegend.appendChild(item);
  });

  radarSummary.textContent = `${entryCount} Einträge im Zeitraum ${rangeLabel}. Höchster Übungswert: ${formatNumber(maxValue)}.`;
}

function getExerciseTotals(workouts) {
  const totals = Object.fromEntries(exerciseCatalog.map(exercise => [exercise.name, 0]));

  workouts.forEach(workout => {
    totals[workout.exercise] = (totals[workout.exercise] || 0) + workout.value;
  });

  return totals;
}

function getRadarPoints(count, center, radius) {
  return Array.from({ length: count }, (_, index) => {
    const point = getRadarPoint(index, count, center, radius);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function getRadarPoint(index, count, center, radius) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return {
    x: Number((center + Math.cos(angle) * radius).toFixed(2)),
    y: Number((center + Math.sin(angle) * radius).toFixed(2))
  };
}

function createSvgElement(name, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function getWorkoutDate(createdAt) {
  if (!createdAt) {
    return null;
  }

  if (typeof createdAt.toDate === "function") {
    return createdAt.toDate();
  }

  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date) {
  const start = startOfDay(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function getCustomRangeLabel(start, end) {
  if (start && end) {
    return `${formatWorkoutDate(start)} bis ${formatWorkoutDate(end)}`;
  }

  if (start) {
    return `Ab ${formatWorkoutDate(start)}`;
  }

  if (end) {
    return `Bis ${formatWorkoutDate(end)}`;
  }

  return "Variabler Zeitraum";
}

function formatWorkoutDate(date) {
  if (!date) {
    return "Datum offen";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 1
  }).format(value);
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

    if (!publicVapidKey || publicVapidKey === "DEIN_PUBLIC_VAPID_KEY") {
      throw new Error("Bitte zuerst den öffentlichen Web-Push-VAPID-Key in app.js eintragen.");
    }

    if (!await isMessagingSupported()) {
      throw new Error("Push wird in diesem Browser nicht unterstützt.");
    }

    const serviceWorkerRegistration = await getMessagingServiceWorkerRegistration();
    const messaging = getMessaging(app);
    listenForForegroundPushMessages(messaging);
    const token = await getToken(messaging, {
      vapidKey: publicVapidKey,
      serviceWorkerRegistration
    });

    if (!token) {
      throw new Error("Firebase konnte keinen Push-Token erzeugen.");
    }

    console.log("Push Token:", token);

    await addDoc(collection(db, "pushTokens"), {
      userId: currentUser.uid,
      token,
      createdAt: serverTimestamp()
    });
  });
});


function listenForForegroundPushMessages(messaging) {
  if (unsubscribeForegroundMessages) {
    return;
  }

  unsubscribeForegroundMessages = onMessage(messaging, payload => {
    const notification = payload.notification || {};
    const title = notification.title || "SportChallenge";
    const body = notification.body || "Neue Trainingseinheit";

    setStatus(`${title}: ${body}`);

    if (canShowWorkoutNotification()) {
      new Notification(title, {
        body,
        icon: "icons/icon-192.png",
        badge: "icons/icon-192.png"
      });
    }
  });
}

async function getMessagingServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker werden in diesem Browser nicht unterstützt.");
  }

  if (messagingServiceWorkerRegistration?.active) {
    return messagingServiceWorkerRegistration;
  }

  const serviceWorkerUrl = new URL("firebase-messaging-sw.js", import.meta.url);
  const serviceWorkerScope = new URL("./", import.meta.url);
  const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
    scope: serviceWorkerScope
  });

  messagingServiceWorkerRegistration = await waitForActiveServiceWorker(registration);
  return messagingServiceWorkerRegistration;
}

async function waitForActiveServiceWorker(registration) {
  if (registration.active) {
    return registration;
  }

  const readyRegistration = await navigator.serviceWorker.ready;

  if (readyRegistration.active) {
    return readyRegistration;
  }

  throw new Error("Der Push-Service-Worker konnte nicht aktiviert werden. Bitte Seite neu laden und erneut versuchen.");
}

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
  return exerciseCatalog.find(item => item.name === exercise)?.icon || "✓";
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
  statusMessage.hidden = false;
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function clearStatus() {
  statusMessage.hidden = true;
  statusMessage.textContent = "";
  statusMessage.classList.remove("error");
}

window.firebaseDebug = {
  app,
  auth,
  db,
  enableFirestoreNetwork: () => enableNetwork(db),
  disableFirestoreNetwork: () => disableNetwork(db)
};
