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

Die Team-Zuordnung wird in `users/{uid}.teamIds` gespeichert. Neue Trainings speichern zusätzlich die aktuellen `teamIds` des Nutzers. Der Team-Vergleich und die Live-Trainings filtern dadurch auf Personen, die mindestens ein Team mit dem eingeloggten Nutzer teilen.

Zusätzlich zur bestehenden Collection `workouts` nutzt die App jetzt:

- `users`: E-Mail-Adresse und Team-Zuordnungen der angemeldeten Nutzer
- `teams`: Teamnamen, die in der Admin-Umgebung verwaltet werden

## Firestore-Regeln

Die zur App passende Regeldatei liegt in `firestore.rules`. Wichtig: Die App prüft Admin-Rechte nicht mehr über ein fest codiertes Passwort oder eine E-Mail-Adresse, sondern über ein Dokument `admins/{uid}` in Firestore. Lege dieses Admin-Dokument einmalig über die Firebase Console, die Admin SDKs oder ein bereits berechtigtes Admin-Konto an.

Angemeldete Nutzer dürfen die Profil-/Team-Metadaten aus `users` lesen, damit Team-Zuordnungen und Namen in der App zuverlässig angezeigt werden. Schreiben dürfen normale Nutzer weiterhin nur ihre eigenen Basisdaten; `teamIds` bleiben Admin-Änderungen vorbehalten. Team-Feed und Team-Vergleich laden ausschließlich Workouts, deren `teamIds` sich mit den im eigenen `users/{uid}.teamIds` gespeicherten Teams überschneiden; die Admin-Ansicht darf alle Teams und – mit Admin-Dokument – alle Workouts lesen.
