# Guide d'Intégration Mobile & Audit Technique — OmniDL

Ce document détaille les causes racines des dysfonctionnements rencontrés par l'application mobile et l'interface web, ainsi que les solutions implémentées côté API et côté client.

---

## 1. Audit Technique : Analyse des Écarts de Comportement

### Pourquoi le bot WhatsApp fonctionne parfaitement
Le bot WhatsApp s'exécute côté serveur (Node.js / Python / Baileys).
1. Il effectue un `POST /api/download` pour obtenir le JSON contenant le lien direct `download_url`.
2. Il télécharge le flux binaire en mémoire tampon via `axios({ url, responseType: 'arraybuffer' })` ou stream directement vers l'API WhatsApp avec le type MIME exact (`video/mp4`, `audio/mpeg`).
3. Le serveur du bot ne subit **aucune restriction CORS de navigateur**, ne tente pas de décoder le flux en texte (UTF-8), et transmet des octets bruts purs.

---

### Pourquoi l'application Mobile récupérait un fichier illisible
C'est le symptôme type d'une **corruption de flux binaire** :
1. **Encodage / Décodage textuel par défaut (UTF-8) :**
   - Si la requête HTTP de l'app mobile (via Axios, fetch, ou un client HTTP standard) n'a pas explicitement spécifié `responseType: 'blob'` ou `responseType: 'arraybuffer'`, les bibliothèques interprètent par défaut la réponse comme une chaîne de caractères (`string/text`).
   - La conversion des octets vidéo/audio (h.264/AAC) en chaîne UTF-8 remplace les séquences d'octets invalides par le caractère de remplacement Unicode `\uFFFD` (). Lorsque ces données corrompues sont ensuite sauvegardées dans le stockage local, l'en-tête du conteneur MP4/MP3 (moov atom, ftyp box) est détruit, rendant le fichier totalement illisible par le lecteur du smartphone.
2. **Absence de support HTTP `Range` & Streaming Partiel :**
   - Les lecteurs vidéo mobiles (ExoPlayer sous Android, AVPlayer sous iOS) n'effectuent pas toujours un téléchargement monolithique 200 OK. Ils envoient des requêtes `Range: bytes=0-` pour vérifier le conteneur et inspecter les métadonnées. L'ancien proxy ne transmettait pas le header `Range` à la source et renvoyait un 200 direct au lieu d'un 206 Partial Content.
3. **Absence d'extension et en-tête MIME :**
   - Si le fichier est écrit sans son extension (`.mp4`, `.mp3`) ou avec un nom mal nettoyé, le système d'exploitation mobile ne sait pas quel décodeur associer.

---

### Pourquoi le Site Web n'arrivait pas à déclencher le téléchargement
1. **Blocage de l'attribut `<a download>` Cross-Origin :**
   - Par sécurité, les navigateurs modernes (Chrome, Safari, Firefox) **ignorent l'attribut `download`** sur les balises `<a>` pointant vers un domaine tiers (les CDN TikTok `tikwm.com`, Facebook `fbcdn.net`, YouTube `googlevideo.com`). Le navigateur ouvre alors la vidéo dans un nouvel onglet ou échoue si le CDN bloque le `Referer` direct.
2. **Routage et En-têtes CORS :**
   - Le proxy `/api/proxy` doit impérativement injecter `Content-Disposition: attachment; filename="..."` ET exposer cet en-tête via `Access-Control-Expose-Headers: Content-Disposition, Content-Length, Content-Range, Accept-Ranges, Content-Type`.
   - L'en-tête HTTP `Range` n'était pas autorisé dans `Access-Control-Allow-Headers`.
3. **Gestion d'erreur `fetch` silencieuse :**
   - Si une clé `TENANT_KEYS` était configurée ou qu'une erreur 401/400/500 survenait, le client `fetch` tentait d'appeler `res.json()` sans vérifier `res.ok`, masquant le véritable message d'erreur.

---

## 2. Solutions Côté Client Mobile

### Option A : Téléchargement avec React Native & Expo FileSystem (Recommandé)
```javascript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function downloadMedia(sourceUrl, title, isAudio = false) {
    const ext = isAudio ? '.mp3' : '.mp4';
    const cleanName = title.replace(/[^a-zA-Z0-9_-]/g, '_') + ext;
    const fileUri = `${FileSystem.documentDirectory}${cleanName}`;

    // Téléchargement binaire direct vers le système de fichiers
    const downloadRes = await FileSystem.downloadAsync(sourceUrl, fileUri);

    console.log('Fichier téléchargé :', downloadRes.uri);

    // Partager ou enregistrer dans la galerie
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
    }
}
```

### Option B : Requête Axios dans une App Mobile (React Native / Node)
**Règle d'or : Toujours utiliser `responseType: 'blob'` ou `'arraybuffer'`**
```javascript
import axios from 'axios';
import RNFS from 'react-native-fs'; // Si React Native bare workflow

async function downloadBinaryWithAxios(proxyUrl, filename) {
    const response = await axios.get(proxyUrl, {
        responseType: 'arraybuffer', // Évite impérativement la corruption UTF-8
        headers: {
            'Accept': '*/*'
        }
    });

    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
    const base64Data = Buffer.from(response.data, 'binary').toString('base64');
    await RNFS.writeFile(path, base64Data, 'base64');
}
```

### Option C : En Flutter / Dart
```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

Future<File> downloadFile(String url, String fileName) async {
  final response = await http.get(Uri.parse(url));

  if (response.statusCode == 200 || response.statusCode == 206) {
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/$fileName');

    // Écrire les octets bruts (Uint8List) directement
    await file.writeAsBytes(response.bodyBytes);
    return file;
  } else {
    throw Exception('Échec du téléchargement : ${response.statusCode}');
  }
}
```

---

## 3. Améliorations Apportées à l'API

1. **`api/proxy.js`** :
   - Support complet de l'en-tête `Range` transmis en amont.
   - Gestion des statuts `206 Partial Content` et `200 OK`.
   - Injection des en-têtes `Accept-Ranges: bytes` et `Content-Range`.
   - En-têtes CORS d'exposition (`Access-Control-Expose-Headers: Content-Disposition, Content-Length, Content-Range, Accept-Ranges, Content-Type`).
   - Prise en charge de la méthode `HEAD` pour la pré-détection de taille par les clients mobiles.
2. **`api/download.js`** :
   - CORS complet avec support de `Range` et des headers de sécurité `Authorization`, `X-Requested-With`, `X-Tenant-Key`, `X-API-Key`.
   - Évaluation dynamique de `TENANT_KEYS`.
3. **`public/app.js`** :
   - Vérification systématique de `res.ok` et fallback sur `res.text()` si le serveur renvoie une page d'erreur non-JSON.
   - Feedback interactif lors du déclenchement du téléchargement.
