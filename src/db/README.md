# 🗄️ Architecture de la Base de Données & Repository Pattern - EduFlow Pro

Ce répertoire contient la définition de la base de données et la documentation de la couche de persistance d'**EduFlow Pro**.

---

## 🏛️ Architecture d'Abstration (Repository Pattern)

EduFlow Pro s'exécute sur deux environnements cibles distincts sans modification du code applicatif UI :

1. **Desktop (Tauri 2)** :
   - Moteur de base de données : **SQLite** natif via le plugin `@tauri-apps/plugin-sql`.
   - Mode de journalisation : **WAL (Write-Ahead Logging)** pour des lectures et écritures concourantes ultra-rapides.
   - Intégrité référentielle : `PRAGMA foreign_keys = ON;` activé à l'ouverture des connexions avec suppressions en cascade atomiques (`ON DELETE CASCADE`).

2. **Web Browser** :
   - Moteur de base de données : **IndexedDB** via **Dexie.js**.
   - Cascades applicatives : Implémentées manuellement dans les repositories Dexie sous forme de transactions atomiques (`db.transaction('rw', ...)`).

---

## 📋 Structure des Tables SQL (`schema.sql`)

| Table | Rôle | Clé Étrangère & Cascade |
| :--- | :--- | :--- |
| `cycles` | Cycles scolaires (jardin, primaire, collège, lycée) | - |
| `levels` | Niveaux d'études (DEF, Bac, etc.) | - |
| `classes` | Classes de l'établissement | - |
| `students` | Fiches élèves | `class_id` -> `classes(id)` **ON DELETE SET NULL** |
| `teachers` | Fiches enseignants | - |
| `subjects` | Matières & Coefficients | - |
| `grades` | Notes d'évaluations | `student_id` -> `students(id)` **ON DELETE CASCADE** |
| `periods` | Trimestres / Semestres | - |
| `payments` | Transactions & Cotisations | `student_id` -> `students(id)` **ON DELETE CASCADE** |
| `expenses` | Dépenses opérationnelles | - |
| `tuition_fees` | Grilles de tarifs | - |
| `academic_years` | Années scolaires | - |
| `school_settings` | Réglages généraux & formules de calcul | - |
| `schema_migrations` | Historique des versions de schéma | - |

---

## 🔄 Mode d'Emploi pour Ajouter une Nouvelle Entité

Pour ajouter une nouvelle entité au domaine (ex: `Attendance` / Absences) :

1. **Définir la table dans `src/db/schema.sql`** :
   ```sql
   CREATE TABLE IF NOT EXISTS attendances (
       id TEXT PRIMARY KEY,
       student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
       date TEXT NOT NULL,
       status TEXT NOT NULL
   );
   ```
2. **Ajouter l'interface dans `src/repositories/types.ts`** :
   ```typescript
   export interface IAttendanceRepository {
     getAll(): Promise<Attendance[]>;
     getByStudent(studentId: string): Promise<Attendance[]>;
     create(data: Omit<Attendance, 'id'>): Promise<Attendance>;
     delete(id: string): Promise<void>;
   }
   ```
3. **Implémenter la classe SQLite dans `src/repositories/sqlite/SqliteAttendanceRepository.ts`** et **Dexie dans `src/repositories/dexie/DexieAttendanceRepository.ts`**.
4. **Enregistrer l'entité dans `src/repositories/index.ts`**.
