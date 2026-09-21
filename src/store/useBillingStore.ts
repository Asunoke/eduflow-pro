import { create } from 'zustand';
import type { Invoice, Receipt, Payment, Student } from '@/types';
import { getRepositories } from '@/repositories';
import { generatePaymentReceiptPDF, generateInvoicePDF } from '@/lib/pdfGenerator';

interface BillingState {
  invoices: Invoice[];
  receipts: Receipt[];
  loading: boolean;
  error: string | null;

  loadBillingData: () => Promise<void>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  generateReceiptForPayment: (
    payment: Payment,
    student: Student,
    studentClass?: any,
    settings?: any,
    mode?: 'download' | 'print'
  ) => Promise<Receipt>;
  printReceipt: (payment: Payment, student: Student, studentClass?: any, settings?: any) => Promise<boolean>;
  downloadReceipt: (payment: Payment, student: Student, studentClass?: any, settings?: any) => Promise<boolean>;
  printInvoice: (invoice: Invoice, student: Student, studentClass?: any, settings?: any) => Promise<boolean>;
  downloadInvoice: (invoice: Invoice, student: Student, studentClass?: any, settings?: any) => Promise<boolean>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  invoices: [],
  receipts: [],
  loading: false,
  error: null,

  loadBillingData: async () => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const invoices = await repos.invoices.getAll();
      const receipts = await repos.receipts.getAll();
      set({ invoices, receipts, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createInvoice: async (invoiceData) => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const existingInvoices = await repos.invoices.getAll();
      const seq = (existingInvoices.length + 1).toString().padStart(4, '0');
      const year = new Date().getFullYear();
      const invoiceNumber = `FAC-${year}-${seq}`;

      const now = new Date().toISOString();
      const newInvoice: Invoice = {
        ...invoiceData,
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        number: invoiceNumber,
        createdAt: now,
        updatedAt: now,
      };

      const created = await repos.invoices.create(newInvoice);
      set((state) => ({ invoices: [created, ...state.invoices], loading: false }));
      return created;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const updated = await repos.invoices.update(id, { status });
      if (updated) {
        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? updated : i)),
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      await repos.invoices.delete(id);
      set((state) => ({
        invoices: state.invoices.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  generateReceiptForPayment: async (payment, student, studentClass, settings, mode = 'download') => {
    const repos = await getRepositories();
    const existing = await repos.receipts.getByPayment(payment.id);
    if (existing) {
      await generatePaymentReceiptPDF(payment, student, studentClass, settings, existing.number, mode);
      return existing;
    }

    const allReceipts = await repos.receipts.getAll();
    const seq = (allReceipts.length + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    const recNumber = `REC-${year}-${seq}`;

    const newReceipt: Receipt = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      number: recNumber,
      paymentId: payment.id,
      studentId: student.id,
      amount: payment.amount,
      date: payment.date,
      academicYear: payment.academicYear,
      createdAt: new Date().toISOString(),
    };

    const created = await repos.receipts.create(newReceipt);
    set((state) => ({ receipts: [created, ...state.receipts] }));

    await generatePaymentReceiptPDF(payment, student, studentClass, settings, created.number, mode);
    return created;
  },

  printReceipt: async (payment, student, studentClass, settings) => {
    return await generatePaymentReceiptPDF(payment, student, studentClass, settings, undefined, 'print');
  },

  downloadReceipt: async (payment, student, studentClass, settings) => {
    return await generatePaymentReceiptPDF(payment, student, studentClass, settings, undefined, 'download');
  },

  printInvoice: async (invoice, student, studentClass, settings) => {
    return await generateInvoicePDF(invoice, student, studentClass, settings, 'print');
  },

  downloadInvoice: async (invoice, student, studentClass, settings) => {
    return await generateInvoicePDF(invoice, student, studentClass, settings, 'download');
  },
}));
