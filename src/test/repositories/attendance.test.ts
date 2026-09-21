import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { EduFlowDexieDB } from '@/repositories/dexie/db';
import { DexieRepositories } from '@/repositories/dexie/DexieRepositories';
import type { Absence } from '@/types';

describe('Absence Repository & Attendance Operations', () => {
  let db: EduFlowDexieDB;
  let repos: DexieRepositories;

  beforeEach(async () => {
    const dbName = `TestAbsenceDB_${Date.now()}_${Math.random()}`;
    db = new EduFlowDexieDB();
    // @ts-expect-error override name for testing
    db._name = dbName;
    await db.open();
    repos = new DexieRepositories(db);
  });

  it('should create and retrieve an absence', async () => {
    const absence: Absence = {
      id: 'abs-1',
      personId: 'stu-1',
      personType: 'student',
      classId: 'cls-1',
      date: '2026-09-15',
      period: 'full_day',
      duration: 1,
      fullDay: true,
      reasonCategory: 'malady',
      reasonDetail: 'Grippe avec certificat',
      justified: true,
      recordedBy: 'Admin',
      createdAt: '2026-09-15T08:00:00.000Z',
      updatedAt: '2026-09-15T08:00:00.000Z',
    };

    await repos.absences.create(absence);
    const fetched = await repos.absences.getById('abs-1');

    expect(fetched).not.toBeNull();
    expect(fetched?.personId).toBe('stu-1');
    expect(fetched?.reasonCategory).toBe('malady');
    expect(fetched?.justified).toBe(true);
  });

  it('should filter absences by person and date range', async () => {
    const abs1: Absence = {
      id: 'abs-10',
      personId: 'stu-10',
      personType: 'student',
      classId: 'cls-1',
      date: '2026-09-01',
      period: 'morning',
      duration: 0.5,
      fullDay: false,
      reasonCategory: 'unjustified',
      justified: false,
      recordedBy: 'Admin',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
    };

    const abs2: Absence = {
      id: 'abs-11',
      personId: 'stu-10',
      personType: 'student',
      classId: 'cls-1',
      date: '2026-09-10',
      period: 'full_day',
      duration: 1,
      fullDay: true,
      reasonCategory: 'family',
      justified: true,
      recordedBy: 'Admin',
      createdAt: '2026-09-10T08:00:00.000Z',
      updatedAt: '2026-09-10T08:00:00.000Z',
    };

    await repos.absences.bulkCreate([abs1, abs2]);

    const allPersonAbsences = await repos.absences.getByPerson('student', 'stu-10');
    expect(allPersonAbsences.length).toBe(2);

    const filteredRange = await repos.absences.getByPerson('student', 'stu-10', '2026-09-05', '2026-09-15');
    expect(filteredRange.length).toBe(1);
    expect(filteredRange[0].id).toBe('abs-11');
  });

  it('should calculate attendance rate correctly', async () => {
    const abs1: Absence = {
      id: 'abs-20',
      personId: 'stu-20',
      personType: 'student',
      classId: 'cls-2',
      date: '2026-09-01',
      period: 'full_day',
      duration: 1,
      fullDay: true,
      reasonCategory: 'unjustified',
      justified: false,
      recordedBy: 'Admin',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
    };

    const abs2: Absence = {
      id: 'abs-21',
      personId: 'stu-20',
      personType: 'student',
      classId: 'cls-2',
      date: '2026-09-02',
      period: 'full_day',
      duration: 1,
      fullDay: true,
      reasonCategory: 'unjustified',
      justified: false,
      recordedBy: 'Admin',
      createdAt: '2026-09-02T08:00:00.000Z',
      updatedAt: '2026-09-02T08:00:00.000Z',
    };

    await repos.absences.bulkCreate([abs1, abs2]);

    // 2 absences out of 10 days = 80% attendance rate
    const rate = await repos.absences.getAttendanceRate('stu-20', 10);
    expect(rate).toBe(80);
  });

  it('should update and delete absence', async () => {
    const abs: Absence = {
      id: 'abs-30',
      personId: 'tea-1',
      personType: 'teacher',
      date: '2026-09-05',
      period: 'full_day',
      duration: 1,
      fullDay: true,
      reasonCategory: 'unjustified',
      justified: false,
      recordedBy: 'Admin',
      createdAt: '2026-09-05T08:00:00.000Z',
      updatedAt: '2026-09-05T08:00:00.000Z',
    };

    await repos.absences.create(abs);

    const updated = await repos.absences.update('abs-30', { justified: true, reasonCategory: 'training' });
    expect(updated?.justified).toBe(true);
    expect(updated?.reasonCategory).toBe('training');

    await repos.absences.delete('abs-30');
    const afterDelete = await repos.absences.getById('abs-30');
    expect(afterDelete).toBeNull();
  });
});
