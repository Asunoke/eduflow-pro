import { describe, it, expect } from 'vitest';
import { gradingService } from '@/lib/gradingService';
import type { Grade, GradingConfig, CalculationConfig } from '@/types';

describe('gradingService', () => {
  describe('round', () => {
    it('should round numbers to specified decimal places', () => {
      expect(gradingService.round(14.567, 2)).toBe(14.57);
      expect(gradingService.round(14.564, 2)).toBe(14.56);
      expect(gradingService.round(10, 2)).toBe(10);
      expect(gradingService.round(15.7777, 1)).toBe(15.8);
    });
  });

  describe('calculateSubjectAverage', () => {
    const sampleGrades: Grade[] = [
      {
        id: 'g1',
        studentId: 's1',
        subjectId: 'sub1',
        periodId: 'p1',
        value: 14,
        maxValue: 20,
        type: 'homework',
        date: '2024-01-10',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-10',
      },
      {
        id: 'g2',
        studentId: 's1',
        subjectId: 'sub1',
        periodId: 'p1',
        value: 16,
        maxValue: 20,
        type: 'test',
        date: '2024-01-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      },
      {
        id: 'g3',
        studentId: 's1',
        subjectId: 'sub1',
        periodId: 'p1',
        value: 12,
        maxValue: 20,
        type: 'exam',
        date: '2024-01-20',
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20',
      },
    ];

    it('should return 0 averages for empty grade list', () => {
      const res = gradingService.calculateSubjectAverage([]);
      expect(res).toEqual({ homeworkAvg: 0, examAvg: 0, totalAvg: 0 });
    });

    it('should calculate subject average in normalized mode correctly', () => {
      const config: GradingConfig = {
        weights: { homework: 1, test: 1, exam: 2, oral: 1, project: 1 },
        calculationMethod: 'weighted',
        annualMethod: 'average',
        roundDecimals: 2,
        includeAbsenceAsZero: true,
      };

      const calcConfig: CalculationConfig = {
        mode: 'normalized',
        weights: { devoir: 1, composition: 2 },
        normalizeBase: { devoir: 20, composition: 20 },
      };

      const result = gradingService.calculateSubjectAverage(sampleGrades, config, calcConfig);

      // homeworkAvg = (14 + 16) / 2 = 15
      // examAvg = 12
      // totalAvg = (15 * 1 + 12 * 2) / 3 = (15 + 24) / 3 = 13
      expect(result.homeworkAvg).toBe(15);
      expect(result.examAvg).toBe(12);
      expect(result.totalAvg).toBe(13);
    });

    it('should calculate subject average in direct mode correctly', () => {
      const calcConfig: CalculationConfig = {
        mode: 'direct',
        weights: { devoir: 1, composition: 2 },
      };

      const result = gradingService.calculateSubjectAverage(sampleGrades, undefined, calcConfig);

      // homeworkAvg = (14 + 16) / 2 = 15
      // examAvg = 12
      // totalAvg = (15 + 12) / 3 = 9
      expect(result.homeworkAvg).toBe(15);
      expect(result.examAvg).toBe(12);
      expect(result.totalAvg).toBe(9);
    });
  });

  describe('calculatePeriodAverage', () => {
    it('should calculate weighted average across subjects', () => {
      const subjects = [
        { average: 14, coefficient: 2 }, // 28
        { average: 16, coefficient: 3 }, // 48
        { average: 10, coefficient: 1 }, // 10
      ];
      // Total points: 86 / 6 = 14.333... -> 14.33
      const avg = gradingService.calculatePeriodAverage(subjects);
      expect(avg).toBe(14.33);
    });

    it('should return 0 when total coefficients sum to 0', () => {
      expect(gradingService.calculatePeriodAverage([])).toBe(0);
    });
  });

  describe('getAppreciation and getMention', () => {
    it('should return appropriate appreciation based on average', () => {
      expect(gradingService.getAppreciation(17)).toBe('Excellent');
      expect(gradingService.getAppreciation(15)).toBe('Très Bien');
      expect(gradingService.getAppreciation(13)).toBe('Bien');
      expect(gradingService.getAppreciation(11)).toBe('Passable');
      expect(gradingService.getAppreciation(8)).toBe('Insuffisant');
    });

    it('should return appropriate mention based on average', () => {
      expect(gradingService.getMention(17)).toBe('Très Bien');
      expect(gradingService.getMention(14.5)).toBe('Bien');
      expect(gradingService.getMention(12.5)).toBe('Assez Bien');
      expect(gradingService.getMention(10.5)).toBe('Passable');
      expect(gradingService.getMention(7)).toBe('Médiocre');
    });
  });

  describe('rankStudents', () => {
    it('should rank students by overallAverage descending', () => {
      const input = [
        { id: 's1', overallAverage: 12 },
        { id: 's2', overallAverage: 16 },
        { id: 's3', overallAverage: 14 },
      ];

      const ranked = gradingService.rankStudents(input);
      expect(ranked[0].id).toBe('s2');
      expect(ranked[0].classRank).toBe(1);
      expect(ranked[1].id).toBe('s3');
      expect(ranked[1].classRank).toBe(2);
      expect(ranked[2].id).toBe('s1');
      expect(ranked[2].classRank).toBe(3);
    });
  });
});
