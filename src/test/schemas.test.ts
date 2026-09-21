import { describe, it, expect } from 'vitest';
import { studentSchema, eduFlowBackupSchema } from '@/lib/schemas';

describe('Zod Schemas', () => {
  describe('studentSchema', () => {
    it('should validate a valid student object', () => {
      const validStudent = {
        id: 'stu-1',
        matricule: 'STU-ABC123',
        firstName: 'Moussa',
        lastName: 'Diarra',
        dateOfBirth: '2010-05-14',
        gender: 'M',
        classId: 'class-1',
        status: 'active',
        parentName: 'Ousmane Diarra',
        parentPhone: '+223 70 00 00 00',
        parentEmail: 'parent@example.com',
        enrollmentDate: '2023-10-01',
        createdAt: '2023-10-01T00:00:00.000Z',
        updatedAt: '2023-10-01T00:00:00.000Z',
      };

      const result = studentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid student with missing mandatory fields', () => {
      const invalidStudent = {
        id: 'stu-1',
        firstName: '', // empty name fails min length
      };

      const result = studentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });
  });

  describe('eduFlowBackupSchema', () => {
    it('should validate a complete backup object', () => {
      const backupData = {
        students: [
          {
            id: 'stu-1',
            matricule: 'STU-ABC123',
            firstName: 'Fatoumata',
            lastName: 'Coulibaly',
            dateOfBirth: '2012-08-20',
            gender: 'F',
            classId: 'class-1',
            status: 'active',
            parentName: 'Aminata Coulibaly',
            parentPhone: '+223 66 00 00 00',
            enrollmentDate: '2023-10-01',
            createdAt: '2023-10-01T00:00:00.000Z',
            updatedAt: '2023-10-01T00:00:00.000Z',
          },
        ],
        classes: [],
        teachers: [],
        subjects: [],
        grades: [],
        payments: [],
        expenses: [],
      };

      const result = eduFlowBackupSchema.safeParse(backupData);
      expect(result.success).toBe(true);
    });

    it('should reject corrupt payload with invalid type', () => {
      const corruptData = {
        students: 'not-an-array',
      };

      const result = eduFlowBackupSchema.safeParse(corruptData);
      expect(result.success).toBe(false);
    });
  });
});
