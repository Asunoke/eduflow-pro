import { useState } from 'react';
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
  Users,
} from 'lucide-react';
import type { Payment, Expense } from '@/types';
import { PAYMENT_TYPES, PAYMENT_METHODS, EXPENSE_CATEGORIES } from '@/types';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function Finances() {
  const { 
    students, 
    classes, 
    levels,
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

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF' }).format(amount);

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalPayments - totalExpenses;

  // Chart data by month
  const monthlyData = [...Array(6)].map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const monthPayments = payments
      .filter((p) => new Date(p.date).getMonth() === date.getMonth())
      .reduce((sum, p) => sum + p.amount, 0);
    const monthExpenses = expenses
      .filter((e) => new Date(e.date).getMonth() === date.getMonth())
      .reduce((sum, e) => sum + e.amount, 0);
    return { month, recettes: monthPayments, depenses: monthExpenses };
  });

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.lastName} ${student.firstName}` : '-';
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
        academicYear: settings.currentAcademicYear,
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
        academicYear: settings.currentAcademicYear,
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

  return (
    <MainLayout>
      <PageHeader title="Finances" description="Gestion des paiements et dépenses">
        <div className="flex gap-2">
          <Button onClick={() => handleOpenPaymentDialog()} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Paiement
          </Button>
          <Button onClick={() => handleOpenExpenseDialog()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Dépense
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
                <p className="text-xs text-muted-foreground mt-1">{payments.length} paiements</p>
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
                <p className="text-xs text-muted-foreground mt-1">{expenses.length} dépenses</p>
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
                <p className="text-sm text-muted-foreground">Solde</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance >= 0 ? 'Positif' : 'Négatif'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary-light">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="card-elevated mb-6">
        <CardHeader>
          <CardTitle className="text-base">Évolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value)]}
                />
                <Legend />
                <Bar dataKey="recettes" name="Recettes" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="payments" className="gap-2">
            <Receipt className="h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Dépenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          <Card className="table-container">
            {payments.length > 0 ? (
              <Table>
                <TableHeader className="table-header">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice().reverse().map((payment) => (
                    <TableRow key={payment.id} className="table-row-hover">
                      <TableCell>{new Date(payment.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                      <TableCell>
                        <span className="badge-info">{PAYMENT_TYPES[payment.type]}</span>
                      </TableCell>
                      <TableCell>{PAYMENT_METHODS[payment.method]}</TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
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
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<Receipt className="h-12 w-12" />}
                title="Aucun paiement"
                description="Enregistrez votre premier paiement."
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

        <TabsContent value="expenses" className="mt-6">
          <Card className="table-container">
            {expenses.length > 0 ? (
              <Table>
                <TableHeader className="table-header">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice().reverse().map((expense) => (
                    <TableRow key={expense.id} className="table-row-hover">
                      <TableCell>{new Date(expense.date).toLocaleDateString('fr-FR')}</TableCell>
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
                title="Aucune dépense"
                description="Enregistrez votre première dépense."
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
            <DialogTitle>{selectedPayment ? 'Modifier le paiement' : 'Nouveau paiement'}</DialogTitle>
            <DialogDescription>Enregistrez un paiement reçu</DialogDescription>
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
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.lastName} {student.firstName} ({student.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant *</Label>
                <Input
                  type="number"
                  value={paymentData.amount || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                  placeholder="0"
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
                <Label>Type</Label>
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
                <Label>Méthode</Label>
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
            <DialogTitle>{selectedExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
            <DialogDescription>Enregistrez une dépense</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={expenseData.description || ''}
                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                placeholder="Description de la dépense"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant *</Label>
                <Input
                  type="number"
                  value={expenseData.amount || ''}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) })}
                  placeholder="0"
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
            <div className="space-y-2">
              <Label>Catégorie</Label>
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
