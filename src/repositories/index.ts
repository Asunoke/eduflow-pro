import type { IRepositories } from './types';
import { DexieRepositories } from './dexie/DexieRepositories';

let instancePromise: Promise<IRepositories> | null = null;

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function createRepositories(): Promise<IRepositories> {
  if (isTauriEnvironment()) {
    try {
      const { SqliteRepositories } = await import('./sqlite/SqliteRepositories');
      return await SqliteRepositories.create();
    } catch (err) {
      console.warn('Echec de chargement SQLite, fallback vers Dexie.js:', err);
      return new DexieRepositories();
    }
  } else {
    return new DexieRepositories();
  }
}

export function getRepositories(): Promise<IRepositories> {
  if (!instancePromise) {
    instancePromise = createRepositories();
  }
  return instancePromise;
}

export type { IRepositories };
export * from './types';
