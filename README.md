# sporthub

Eine kleine Firebase-Web-App für Trainings-Tracking mit Firebase Authentication, Cloud Firestore und optionalem Firebase Cloud Messaging.

## Lokal starten

Die App muss über einen Webserver laufen, nicht direkt als `file://`-Datei. Beispiel:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen.

## Firebase prüfen

Wenn in der Firebase Console scheinbar nichts passiert, prüfe diese Punkte:

1. **Authentication aktivieren:** Firebase Console → Authentication → Sign-in method → E-Mail/Passwort aktivieren.
2. **Cloud Firestore aktivieren:** Firebase Console → Firestore Database erstellen. Die App schreibt in die Collection `workouts`.
3. **Firestore statt Realtime Database:** Die App nutzt Cloud Firestore. In der Realtime Database erscheint deshalb kein Trainingseintrag.
4. **Browser-Status ansehen:** Die App zeigt oben eine Statusmeldung und verständliche Firebase-Fehler an.
5. **Browser-Konsole öffnen:** Bei Firestore-Regel- oder Indexproblemen gibt Firebase dort zusätzliche Details aus.

## Push-Benachrichtigungen

Push verwendet den in `app.js` hinterlegten öffentlichen Web-Push-VAPID-Key (`publicVapidKey`). Falls Push nicht funktioniert, prüfe in Firebase Cloud Messaging, ob dieser Schlüssel zum Projekt passt.

## Admin-Umgebung und Teams

Über das dezente Admin-Symbol im Login kann die Admin-Umgebung gezielt geöffnet werden. Dort können Teams erstellt und registrierte Nutzer mehreren Teams zugeordnet werden. Nutzer erscheinen in der Admin-Liste, sobald sie sich mit der App angemeldet oder bereits Trainings gespeichert haben; die App pflegt dafür Firestore-Dokumente in der Collection `users`.

Die Team-Zuordnung wird in `users/{uid}.teamIds` gespeichert. Beim Speichern einer Zuordnung erstellt die Admin-Ansicht zusätzlich die gegenseitigen `teamAccess/{viewerUid}_{targetUid}`-Dokumente für alle User-Paare innerhalb jedes Teams. Neue Trainings speichern zusätzlich die aktuellen `teamIds` des Nutzers. Team-Vergleich und Live-Trainings laden zuerst `teamAccess` mit `viewerId == currentUser.uid`, ergänzen die eigene UID und laden anschließend Workouts für genau diese berechtigten User.

Zusätzlich zur bestehenden Collection `workouts` nutzt die App jetzt:

- `users`: E-Mail-Adresse und Team-Zuordnungen der angemeldeten Nutzer
- `teams`: Teamnamen, die in der Admin-Umgebung verwaltet werden
- `teamAccess`: Gegenseitige Freigaben für Teammitglieder im Format `{viewerId, targetUserId, teamId, createdAt}`

## Firestore-Regeln

Die zur App passende Regeldatei liegt in `firestore.rules` und ist über `firebase.json` für Deployments verdrahtet. Veröffentliche Änderungen mit:

```bash
firebase deploy --only firestore:rules
```

Admin-Rechte werden über einen der folgenden Wege erkannt: ein Firebase-Custom-Claim `admin: true`, ein Dokument `admins/{uid}` in Firestore oder die Bootstrap-E-Mail-Liste in `app.js`/`firestore.rules`. Die Bootstrap-Liste stellt sicher, dass der erste Admin-Zugang nicht ausgesperrt wird; nach dem Anlegen eines Custom-Claims oder Admin-Dokuments kann sie bei Bedarf wieder reduziert werden.

Angemeldete Nutzer dürfen die Profil-/Team-Metadaten aus `users` lesen, damit Team-Zuordnungen und Namen in der App zuverlässig angezeigt werden. Schreiben dürfen normale Nutzer weiterhin nur ihre eigenen Basisdaten; `teamIds` bleiben Admin-Änderungen vorbehalten. Team-Feed und Team-Vergleich lesen fremde Workouts ausschließlich über vorhandene `teamAccess/{currentUid}_{targetUid}`-Dokumente; die Admin-Ansicht darf alle Teams und – mit Admin-Berechtigung per Claim, Admin-Dokument oder Bootstrap-E-Mail – alle Workouts lesen. Wenn die Admin-Seite nur den aktuellen Admin als Fallback zeigt und in der Konsole `Missing or insufficient permissions` erscheint, sind sehr wahrscheinlich die Firestore-Regeln noch nicht veröffentlicht oder das eingeloggte Konto ist serverseitig nicht als Admin berechtigt.
