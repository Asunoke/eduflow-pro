# EduFlow Pro

EduFlow Pro est un Système de Gestion Scolaire (ERP) avancé adapté aux établissements d'enseignement, particulièrement optimisé pour l'environnement académique (Mali/Afrique de l'Ouest). Il combine des technologies Web modernes et une architecture Desktop Windows native performante avec Tauri.

## 🚀 Démarrer l'application (Mode Développement)

Pour modifier le code et lancer l'interface applicative (Tauri + React) en direct :

```bash
# Installer les dépendances du projet (une seule fois)
npm install

# Lancer la fenêtre d'application EduFlow Pro
npm run tauri dev
```

## 📦 Construire la version finale (.exe) pour Partager

Une fois que l'application est prête et que vous souhaitez l'exporter pour l'installer sur un autre ordinateur (ex: Secrétariat, Direction), vous devez générer l'exécutable final :

```bash
# Lancer la compilation de la version finale
npm run tauri build
```

> [!TIP]
> **Où se trouve le fichier final ?**
> Une fois la compilation terminée, rendez-vous dans le dossier :
> `src-tauri/target/release/bundle/msi/`
> 
> Vous y trouverez un fichier d'installation (ex: `eduflow-pro_1.0.0_x64_en-US.msi` ou un fichier `app.exe` selon votre configuration). 
> C'est ce fichier que vous pourrez copier sur une **clé USB** ou envoyer par mail/Transfert pour **partager le logiciel** avec l'école concernée !
