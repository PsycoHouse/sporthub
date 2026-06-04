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

Push funktioniert erst, wenn in `app.js` der Platzhalter `DEIN_PUBLIC_VAPID_KEY` durch den öffentlichen Web-Push-Zertifikatsschlüssel aus Firebase Cloud Messaging ersetzt wurde.
