import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Pencil,
  Trash2,
  Printer,
  Download,
  Search,
  Filter,
  FileCheck,
  PieChart as PieChartIcon
} from 'lucide-react';
import type { Payment, Expense } from '@/types';
import { PAYMENT_TYPES, PAYMENT_METHODS, EXPENSE_CATEGORIES } from '@/types';
import { generatePaymentReceiptPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  salary: '#3b82f6',
  utilities: '#f59e0b',
  supplies: '#10b981',
  maintenance: '#ec4899',
  equipment: '#8b5cf6',
  other: '#64748b',
};

export default function Finances() {
  const { 
    students, 
    classes, 
    payments, 
    expenses, 
    settings,
    addPayment, 
    updatePayment, 
    deletePayment,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('payments');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [paymentData, setPaymentData] = useState<Partial<Payment>>({});
  const [expenseData, setExpenseData] = useState<Partial<Expense>>({});
  const [deleteType, setDeleteType] = useState<'payment' | 'expense'>('payment');

  // Search and Filter state
  const [paymentSearch, setPaymentSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF', maximumFractionDigits: 0 }).format(amount);

  const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const balance = totalPayments - totalExpenses;

  // Chart data by month
  const monthlyData = useMemo(() => {
    return [...Array(6)].map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const month = date.toLocaleDateString('fr-FR', { month: 'short' });
      const monthPayments = payments
        .filter((p) => {
          const d = new Date(p.date);
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        })
        .reduce((sum, p) => sum + p.amount, 0);
      const monthExpenses = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);
      return { month, recettes: monthPayments, depenses: monthExpenses };
    });
  }, [payments, expenses]);

  // Expenses category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    return Object.entries(map).map(([cat, amt]) => ({
      name: EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES] || cat,
      categoryKey: cat,
      value: amt,
      percentage: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0,
      color: CATEGORY_COLORS[cat] || '#94a3b8',
    }));
  }, [expenses, totalExpenses]);

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.lastName} ${student.firstName}` : 'Inconnu';
  };

  const getStudentClass = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return undefined;
    return classes.find((c) => c.id === student.classId);
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    const student = students.find((s) => s.id === payment.studentId);
    if (!student) {
      toast.error("Élève non trouvé pour ce paiement");
      return;
    }
    const studentClass = classes.find((c) => c.id === student.classId);
    const saved = await generatePaymentReceiptPDF(payment, student, studentClass, settings, undefined, 'download');
    if (saved) {
      toast.success(`Reçu PDF enregistré pour ${student.lastName}`);
    }
  };

  const handlePrintReceipt = async (payment: Payment) => {
    const student = students.find((s) => s.id === payment.studentId);
    if (!student) {
      toast.error("Élève non trouvé pour ce paiement");
      return;
    }
    const studentClass = classes.find((c) => c.id === student.classId);
    await generatePaymentReceiptPDF(payment, student, studentClass, settings, undefined, 'print');
  };

  const handleOpenPaymentDialog = (payment?: Payment) => {
    if (payment) {
      setSelectedPayment(payment);
      setPaymentData(payment);
    } else {
      setSelectedPayment(null);
      setPaymentData({
        studentId: '',
        amount: 0,
        type: 'tuition',
        method: 'cash',
        date: new Date().toISOString().split('T')[0],
        academicYear: settings.currentAcademicYear || '2025-2026',
        reference: '',
      });
    }
    setIsPaymentDialogOpen(true);
  };

  const handleOpenExpenseDialog = (expense?: Expense) => {
    if (expense) {
      setSelectedExpense(expense);
      setExpenseData(expense);
    } else {
      setSelectedExpense(null);
      setExpenseData({
        amount: 0,
        category: 'supplies',
        description: '',
        date: new Date().toISOString().split('T')[0],
        academicYear: settings.currentAcademicYear || '2025-2026',
        reference: '',
      });
    }
    setIsExpenseDialogOpen(true);
  };

  const handleSavePayment = () => {
    if (!paymentData.studentId || !paymentData.amount) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedPayment) {
      updatePayment(selectedPayment.id, paymentData);
      toast.success('Paiement modifié');
    } else {
      addPayment(paymentData as Omit<Payment, 'id' | 'createdAt'>);
      toast.success('Paiement enregistré');
    }
    setIsPaymentDialogOpen(false);
  };

  const handleSaveExpense = () => {
    if (!expenseData.amount || !expenseData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedExpense) {
      updateExpense(selectedExpense.id, expenseData);
      toast.success('Dépense modifiée');
    } else {
      addExpense(expenseData as Omit<Expense, 'id' | 'createdAt'>);
      toast.success('Dépense enregistrée');
    }
    setIsExpenseDialogOpen(false);
  };

  const confirmDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteType('payment');
    setIsDeleteOpen(true);
  };

  const confirmDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteType('expense');
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (deleteType === 'payment' && selectedPayment) {
      deletePayment(selectedPayment.id);
      toast.success('Paiement supprimé');
    } else if (deleteType === 'expense' && selectedExpense) {
      deleteExpense(selectedExpense.id);
      toast.success('Dépense supprimée');
    }
    setIsDeleteOpen(false);
  };

  // Filtered Lists
  const filteredPayments = useMemo(() => {
    return payments.slice().reverse().filter((p) => {
      const studentName = getStudentName(p.studentId).toLowerCase();
      const ref = (p.reference || '').toLowerCase();
      const q = paymentSearch.toLowerCase();
      return studentName.includes(q) || ref.includes(q);
    });
  }, [payments, paymentSearch, students]);

  const filteredExpenses = useMemo(() => {
    return expenses.slice().reverse().filter((e) => {
      const desc = e.description.toLowerCase();
      const ref = (e.reference || '').toLowerCase();
      const q = expenseSearch.toLowerCase();
      const matchesSearch = desc.includes(q) || ref.includes(q);
      const matchesCategory = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, expenseSearch, expenseCategoryFilter]);

  return (
    <MainLayout>
      <PageHeader title="Finances Pro" description="Gestion intégrée des paiements, factures, dépenses et pièces comptables">
        <div className="flex gap-2">
          <Button onClick={() => handleOpenPaymentDialog()} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Paiement
          </Button>
          <Button onClick={() => handleOpenExpenseDialog()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Dépense
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="card-stats card-stats-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recettes</p>
                <p className="text-2xl font-bold text-success mt-1">
                  {formatCurrency(totalPayments)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{payments.length} encaissements reçus</p>
              </div>
              <div className="p-3 rounded-xl bg-success-light">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-stats card-stats-warning">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dépenses</p>
                <p className="text-2xl font-bold text-warning mt-1">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{expenses.length} pièces de dépenses</p>
              </div>
              <div className="p-3 rounded-xl bg-warning-light">
                <TrendingDown className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`card-stats ${balance >= 0 ? 'card-stats-primary' : 'card-stats-warning'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde Net de Caisse</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance >= 0 ? 'Trésorerie positive' : 'Déficit budgétaire'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary-light">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolution Chart */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Évolution mensuelle Recettes vs Dépenses</CardTitle>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]" /> Recettes
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--destructive))]" /> Dépenses
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [formatCurrency(value)]}
                />
                <Area 
                  type="monotone" 
                  dataKey="recettes" 
                  name="Recettes"
                  stroke="hsl(var(--chart-3))" 
                  fillOpacity={1} 
                  fill="url(#colorRecettes)" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--chart-3))', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="depenses" 
                  name="Dépenses"
                  stroke="hsl(var(--destructive))" 
                  fillOpacity={0} 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="payments" className="gap-2">
            <Receipt className="h-4 w-4" />
            Recettes / Paiements ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Dépenses Pro ({expenses.length})
          </TabsTrigger>
        </TabsList>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="mt-6">
          <Card className="p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher élève, réf..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                Affichage de {filteredPayments.length} paiement(s)
              </span>
            </div>
          </Card>

          <Card className="table-container">
            {filteredPayments.length > 0 ? (
              <Table>
                <TableHeader className="table-header">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions / Imprimer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const studentClass = getStudentClass(payment.studentId);
                    return (
                      <TableRow key={payment.id} className="table-row-hover">
                        <TableCell className="text-xs font-mono">{new Date(payment.date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{studentClass?.name || '-'}</TableCell>
                        <TableCell>
                          <span className="badge-info">{PAYMENT_TYPES[payment.type]}</span>
                        </TableCell>
                        <TableCell className="text-xs">{PAYMENT_METHODS[payment.method]}</TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              title="Télécharger le Reçu Officiel PDF"
                              onClick={() => handleDownloadReceipt(payment)}
                              className="h-8 gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="text-xs hidden sm:inline">Télécharger</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              title="Imprimer le Reçu Officiel PDF"
                              onClick={() => handlePrintReceipt(payment)}
                              className="h-8 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span className="text-xs hidden sm:inline">Imprimer</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenPaymentDialog(payment)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDeletePayment(payment)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<Receipt className="h-12 w-12" />}
                title="Aucun paiement trouvé"
                description="Enregistrez un nouveau règlement d'élève."
                action={
                  <Button onClick={() => handleOpenPaymentDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un paiement
                  </Button>
                }
              />
            )}
          </Card>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="mt-6 space-y-6">
          {/* Expenses Category Breakdown */}
          {expenses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1 p-4 flex flex-col justify-center items-center">
                <CardTitle className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" /> Répartition des Dépenses
                </CardTitle>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => [formatCurrency(val)]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="md:col-span-2 p-4">
                <CardTitle className="text-sm font-semibold mb-3">Ventilation Budgétaire par Poste</CardTitle>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.categoryKey} className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-medium text-muted-foreground truncate">{cat.name}</span>
                      </div>
                      <p className="text-sm font-bold">{formatCurrency(cat.value)}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.percentage}% du total</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Filter Bar */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher libellé, pièce N°..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {Object.entries(EXPENSE_CATEGORIES).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground">
                Affichage de {filteredExpenses.length} dépense(s)
              </span>
            </div>
          </Card>

          <Card className="table-container">
            {filteredExpenses.length > 0 ? (
              <Table>
                <TableHeader className="table-header">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>N° Réf / Pièce</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="table-row-hover">
                      <TableCell className="text-xs font-mono">{new Date(expense.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-xs font-mono font-medium text-slate-500">
                        {expense.reference ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <FileCheck className="h-3 w-3 text-muted-foreground" />
                            {expense.reference}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <span className="badge-warning">{EXPENSE_CATEGORIES[expense.category]}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenExpenseDialog(expense)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => confirmDeleteExpense(expense)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<CreditCard className="h-12 w-12" />}
                title="Aucune dépense trouvée"
                description="Enregistrez vos achats, fournitures ou factures de fonctionnement."
                action={
                  <Button onClick={() => handleOpenExpenseDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une dépense
                  </Button>
                }
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPayment ? 'Modifier le paiement' : 'Nouveau paiement d\'élève'}</DialogTitle>
            <DialogDescription>Enregistrez les versements et générez automatiquement le reçu officiel</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Élève *</Label>
              <Select
                value={paymentData.studentId}
                onValueChange={(value) => setPaymentData({ ...paymentData, studentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un élève" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => {
                    const stClass = classes.find(c => c.id === student.classId);
                    return (
                      <SelectItem key={student.id} value={student.id}>
                        {student.lastName} {student.firstName} ({student.matricule}) - {stClass?.name || 'Sans classe'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant (FCFA) *</Label>
                <Input
                  type="number"
                  step="any"
                  value={paymentData.amount || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  placeholder="0 FCFA"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={paymentData.date || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de Règlement</Label>
                <Select
                  value={paymentData.type}
                  onValueChange={(value) => setPaymentData({ ...paymentData, type: value as Payment['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode de Paiement</Label>
                <Select
                  value={paymentData.method}
                  onValueChange={(value) => setPaymentData({ ...paymentData, method: value as Payment['method'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Référence / N° Chèque ou Mobile Money</Label>
              <Input
                value={paymentData.reference || ''}
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                placeholder="Ex: Orange Money #987234"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSavePayment} className="gradient-primary">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedExpense ? 'Modifier la dépense' : 'Nouvelle dépense d\'établissement'}</DialogTitle>
            <DialogDescription>Enregistrez les sorties de caisse et pièces justificatives</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Description / Motif de la dépense *</Label>
              <Textarea
                value={expenseData.description || ''}
                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                placeholder="Ex: Achat de craies, ramettes de papier et cartouches d'encre"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant (FCFA) *</Label>
                <Input
                  type="number"
                  step="any"
                  value={expenseData.amount || ''}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  placeholder="0 FCFA"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={expenseData.date || ''}
                  onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie Budgétaire</Label>
                <Select
                  value={expenseData.category}
                  onValueChange={(value) => setExpenseData({ ...expenseData, category: value as Expense['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>N° Pièce Justificative / Facture</Label>
                <Input
                  value={expenseData.reference || ''}
                  onChange={(e) => setExpenseData({ ...expenseData, reference: e.target.value })}
                  placeholder="Ex: PJ-2026-084"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveExpense} className="gradient-primary">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={deleteType === 'payment' ? 'Supprimer le paiement' : 'Supprimer la dépense'}
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
