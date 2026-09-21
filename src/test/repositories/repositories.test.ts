import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { EduFlowDexieDB } from '@/repositories/dexie/db';
import { DexieRepositories } from '@/repositories/dexie/DexieRepositories';
import type { Student, Class, Grade, Payment } from '@/types';

describe('Dexie Repositories Integration & Cascades', () => {
  let db: EduFlowDexieDB;
  let repos: DexieRepositories;

  beforeEach(async () => {
    // Unique database name per test to ensure clean state
    const dbName = `TestDB_${Date.now()}_${Math.random()}`;
    db = new EduFlowDexieDB();
    // @ts-expect-error override name for testing
    db._name = dbName;
    await db.open();
    repos = new DexieRepositories(db);
  });

  it('should create and retrieve a student correctly', async () => {
    const student: Student = {
      id: 'stu-101',
      matricule: 'STU-TEST101',
      firstName: 'Aissata',
      lastName: 'Traore',
      dateOfBirth: '2012-04-10',
      gender: 'F',
      classId: 'cls-1',
      status: 'active',
      parentName: 'Bakary Traore',
      parentPhone: '+223 76 00 00 00',
      enrollmentDate: '2023-10-01',
      createdAt: '2023-10-01T00:00:00.000Z',
      updatedAt: '2023-10-01T00:00:00.000Z',
    };

    await repos.students.create(student);
    const fetched = await repos.students.getById('stu-101');

    expect(fetched).not.toBeNull();
    expect(fetched?.firstName).toBe('Aissata');
    expect(fetched?.matricule).toBe('STU-TEST101');
  });

  it('should perform cascade deletion when a student is deleted', async () => {
    const student: Student = {
      id: 'stu-202',
      matricule: 'STU-TEST202',
      firstName: 'Modibo',
      lastName: 'Keita',
      dateOfBirth: '2011-01-15',
      gender: 'M',
      classId: 'cls-1',
      status: 'active',
      parentName: 'Samba Keita',
      parentPhone: '+223 65 00 00 00',
      enrollmentDate: '2023-10-01',
      createdAt: '2023-10-01T00:00:00.000Z',
      updatedAt: '2023-10-01T00:00:00.000Z',
    };

    const grade: Grade = {
      id: 'g-202',
      studentId: 'stu-202',
      subjectId: 'sub-1',
      periodId: 'p-1',
      value: 15,
      maxValue: 20,
      type: 'homework',
      date: '2023-11-01',
      createdAt: '2023-11-01T00:00:00.000Z',
      updatedAt: '2023-11-01T00:00:00.000Z',
    };

    const payment: Payment = {
      id: 'pay-202',
      studentId: 'stu-202',
      amount: 25000,
      type: 'tuition',
      method: 'cash',
      date: '2023-10-05',
      academicYear: '2023-2024',
      createdAt: '2023-10-05T00:00:00.000Z',
    };

    await repos.students.create(student);
    await repos.grades.create(grade);
    await repos.payments.create(payment);

    // Verify initial creation
    const gradesBefore = await repos.grades.getByStudent('stu-202');
    const paymentsBefore = await repos.payments.getByStudent('stu-202');
    expect(gradesBefore.length).toBe(1);
    expect(paymentsBefore.length).toBe(1);

    // Delete student and check cascade
    await repos.students.delete('stu-202');

    const studentAfter = await repos.students.getById('stu-202');
    const gradesAfter = await repos.grades.getByStudent('stu-202');
    const paymentsAfter = await repos.payments.getByStudent('stu-202');

    expect(studentAfter).toBeNull();
    expect(gradesAfter.length).toBe(0);
    expect(paymentsAfter.length).toBe(0);
  });

  it('should set student classId to null/empty when a class is deleted', async () => {
    const cls: Class = {
      id: 'cls-55',
      name: '9ème Année A',
      levelId: 'lvl-9',
      capacity: 35,
      academicYear: '2023-2024',
      createdAt: '2023-10-01T00:00:00.000Z',
      updatedAt: '2023-10-01T00:00:00.000Z',
    };

    const student: Student = {
      id: 'stu-303',
      matricule: 'STU-TEST303',
      firstName: 'Fatou',
      lastName: 'Sissoko',
      dateOfBirth: '2010-09-09',
      gender: 'F',
      classId: 'cls-55',
      status: 'active',
      parentName: 'Boubacar Sissoko',
      parentPhone: '+223 78 00 00 00',
      enrollmentDate: '2023-10-01',
      createdAt: '2023-10-01T00:00:00.000Z',
      updatedAt: '2023-10-01T00:00:00.000Z',
    };

    await repos.classes.create(cls);
    await repos.students.create(student);

    await repos.classes.delete('cls-55');

    const updatedStudent = await repos.students.getById('stu-303');
    expect(updatedStudent?.classId).toBe('');
  });
});
