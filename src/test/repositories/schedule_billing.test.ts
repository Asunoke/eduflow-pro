import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { EduFlowDexieDB } from '@/repositories/dexie/db';
import { DexieRepositories } from '@/repositories/dexie/DexieRepositories';
import type { TimeSlot, Invoice, Receipt } from '@/types';
import { numberToWordsFR } from '@/lib/pdfGenerator';

describe('Schedule & Billing Repositories & Utilities', () => {
  let db: EduFlowDexieDB;
  let repos: DexieRepositories;

  beforeEach(async () => {
    const dbName = `TestScheduleBillingDB_${Date.now()}_${Math.random()}`;
    db = new EduFlowDexieDB();
    // @ts-expect-error override name for testing
    db._name = dbName;
    await db.open();
    repos = new DexieRepositories(db);
  });

  it('should convert number to West African French words correctly', () => {
    expect(numberToWordsFR(50000)).toBe('CINQUANTE MILLE FRANCS CFA');
    expect(numberToWordsFR(125000)).toBe('CENT VINGT-CINQ MILLE FRANCS CFA');
    expect(numberToWordsFR(1500000)).toBe('UN MILLION CINQ CENTS MILLE FRANCS CFA');
  });

  it('should create and retrieve a TimeSlot for timetable', async () => {
    const slot: TimeSlot = {
      id: 'slot-1',
      classId: 'cls-1',
      subjectId: 'sub-maths',
      teacherId: 'tea-1',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:00',
      room: 'Salle 101',
      academicYear: '2025-2026',
      createdAt: '2026-09-15T08:00:00.000Z',
      updatedAt: '2026-09-15T08:00:00.000Z',
    };

    await repos.timeSlots.create(slot);
    const fetched = await repos.timeSlots.getById('slot-1');
    expect(fetched).not.toBeNull();
    expect(fetched?.subjectId).toBe('sub-maths');
    expect(fetched?.dayOfWeek).toBe(1);

    const classSlots = await repos.timeSlots.getByClass('cls-1');
    expect(classSlots.length).toBe(1);
  });

  it('should create and retrieve an Invoice and Receipt', async () => {
    const invoice: Invoice = {
      id: 'inv-1',
      number: 'FAC-2026-0001',
      studentId: 'stu-1',
      academicYear: '2025-2026',
      issueDate: '2026-09-15',
      dueDate: '2026-09-30',
      status: 'sent',
      items: [{ id: 'i1', description: 'Frais de scolarité T1', amount: 75000 }],
      totalAmount: 75000,
      createdAt: '2026-09-15T08:00:00.000Z',
      updatedAt: '2026-09-15T08:00:00.000Z',
    };

    await repos.invoices.create(invoice);
    const fetchedInvoice = await repos.invoices.getById('inv-1');
    expect(fetchedInvoice?.number).toBe('FAC-2026-0001');

    const receipt: Receipt = {
      id: 'rec-1',
      number: 'REC-2026-0001',
      paymentId: 'pay-1',
      studentId: 'stu-1',
      amount: 75000,
      date: '2026-09-15',
      academicYear: '2025-2026',
      createdAt: '2026-09-15T08:00:00.000Z',
    };

    await repos.receipts.create(receipt);
    const fetchedReceipt = await repos.receipts.getByPayment('pay-1');
    expect(fetchedReceipt?.number).toBe('REC-2026-0001');
    expect(fetchedReceipt?.amount).toBe(75000);
  });
});
