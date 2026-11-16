# Réels « face caméra » IdeaForge

Format : accroche (toi + texte POV) → toi en haut, chrono + étape au milieu, enregistrement d'IdeaForge en bas → fin « Commente « IDÉE » ».
Fabriqué automatiquement (mardi et samedi) par la tâche programmée « Réel face caméra IdeaForge », dans le bac à sable Higgsfield :

```
bash tools/ugc-reel/run.sh <url_face_camera> /idea/<slug> "POV : tu trouves une idée|de business rentable en {s} sec" <debut_s> <seed> [mirror]
```

Les vidéos face caméra disponibles sont rangées dans Supabase (`app_settings`, clé `ugc_facecams`). Le réel terminé est déposé
sur le CDN Higgsfield puis enregistré dans `app_settings` (clé `ig_ugc:<AAAA-MM-JJ>`), et la tâche quotidienne du site le publie sur Instagram.
