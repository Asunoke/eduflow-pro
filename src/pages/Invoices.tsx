import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useBillingStore } from '@/store/useBillingStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, SearchInput, EmptyState, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { DatePicker } from '@/components/ui/date-picker';
import { parseISO, formatISO } from 'date-fns';
import {
  FileText,
  Receipt as ReceiptIcon,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Download,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, InvoiceItem, Receipt } from '@/types';
import { generateInvoicePDF } from '@/lib/pdfGenerator';

export default function Invoices() {
  const { students, classes, payments, settings } = useStore();
  const {
    invoices,
    receipts,
    loadBillingData,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    generateReceiptForPayment,
    printReceipt,
    printInvoice,
  } = useBillingStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form for New Invoice
  const [invoiceStudentId, setInvoiceStudentId] = useState<string>('');
  const [invoiceDueDate, setInvoiceDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Frais de Scolarité Tranche 1', amount: 50000 },
  ]);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const student = students.find((s) => s.id === inv.studentId);
      const studentName = student ? `${student.lastName} ${student.firstName}` : '';
      const matchSearch =
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        studentName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [invoices, students, search, filterStatus]);

  // KPIs
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaidInvoices = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0);
    const pendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').length;

    return {
      totalInvoiced,
      totalPaidInvoices,
      pendingInvoices,
      receiptsCount: receipts.length,
    };
  }, [invoices, receipts]);

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { id: Date.now().toString(), description: '', amount: 10000 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id));
  };

  const handleCreateInvoice = async () => {
    if (!invoiceStudentId) {
      toast.error('Veuillez sélectionner un élève.');
      return;
    }
    const validItems = invoiceItems.filter((item) => item.description.trim() && item.amount > 0);
    if (validItems.length === 0) {
      toast.error('Veuillez ajouter au moins un article valide.');
      return;
    }

    const totalAmount = validItems.reduce((sum, item) => sum + item.amount, 0);

    try {
      await createInvoice({
        studentId: invoiceStudentId,
        academicYear: settings.currentAcademicYear || '2025-2026',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: invoiceDueDate,
        status: 'sent',
        items: validItems,
        totalAmount,
        notes: invoiceNotes,
      });
      toast.success('Facture créée avec succès.');
      setIsInvoiceDialogOpen(false);
      setInvoiceStudentId('');
      setInvoiceItems([{ id: '1', description: 'Frais de Scolarité Tranche 1', amount: 50000 }]);
    } catch (err) {
      toast.error("Erreur lors de la création de la facture.");
    }
  };

  const handleDeleteInvoice = async () => {
    if (selectedInvoice) {
      try {
        await deleteInvoice(selectedInvoice.id);
        toast.success('Facture supprimée.');
      } catch (err) {
        toast.error('Erreur lors de la suppression.');
      }
    }
    setIsDeleteOpen(false);
    setSelectedInvoice(null);
  };

  const handleDownloadReceiptForPayment = async (payment: any) => {
    const student = students.find((s) => s.id === payment.studentId);
    if (!student) {
      toast.error('Élève introuvable pour ce paiement.');
      return;
    }
    const studentClass = classes.find((c) => c.id === student.classId);
    await generateReceiptForPayment(payment, student, studentClass, settings, 'download');
  };

  const handlePrintReceiptForPayment = async (payment: any) => {
    const student = students.find((s) => s.id === payment.studentId);
    if (!student) {
      toast.error('Élève introuvable pour ce paiement.');
      return;
    }
    const studentClass = classes.find((c) => c.id === student.classId);
    await generateReceiptForPayment(payment, student, studentClass, settings, 'print');
  };

  return (
    <MainLayout>
      <PageHeader
        title="Facturation & Reçus de Paiement"
        description="Génération des reçus officiels de scolarité et édition des factures d'établissement"
      >
        <Button onClick={() => setIsInvoiceDialogOpen(true)} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Facture
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Facturé</p>
              <h3 className="text-xl font-bold">{stats.totalInvoiced.toLocaleString('fr-FR')} FCFA</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Factures Réglées</p>
              <h3 className="text-xl font-bold">{stats.totalPaidInvoices.toLocaleString('fr-FR')} FCFA</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Factures en Attente</p>
              <h3 className="text-xl font-bold">{stats.pendingInvoices}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600">
              <ReceiptIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reçus Délivrés</p>
              <h3 className="text-xl font-bold">{payments.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="receipts" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="receipts" className="gap-2">
            <ReceiptIcon className="h-4 w-4" />
            Reçus de Paiement ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Factures ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Receipts */}
        <TabsContent value="receipts" className="space-y-4">
          <Card className="table-container">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Reçus de Versement de Scolarité</CardTitle>
              <CardDescription>
                Imprimez ou téléchargez les reçus officiels avec le tampon de l'établissement pour tout paiement effectué.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <Table>
                  <TableHeader className="table-header">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Télécharger / Imprimer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => {
                      const student = students.find((s) => s.id === p.studentId);
                      const studentName = student ? `${student.lastName} ${student.firstName}` : 'Inconnu';

                      return (
                        <TableRow key={p.id} className="table-row-hover">
                          <TableCell className="font-medium whitespace-nowrap">{p.date}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{studentName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{student?.matricule}</div>
                          </TableCell>
                          <TableCell>{p.description || 'Frais de Scolarité'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {p.method.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-600">
                            {p.amount.toLocaleString('fr-FR')} FCFA
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReceiptForPayment(p)}
                                className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Télécharger</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintReceiptForPayment(p)}
                                className="gap-1"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Imprimer</span>
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
                  icon={<ReceiptIcon className="h-10 w-10 text-muted-foreground" />}
                  title="Aucun reçu disponible"
                  description="Les reçus seront générés automatiquement lors de l'enregistrement des paiements."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="card-elevated">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher par N° facture ou nom d'élève..."
                className="flex-1"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="sent">Envoyée / En attente</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="table-container">
            {filteredInvoices.length > 0 ? (
              <Table>
                <TableHeader className="table-header">
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Date Échéance</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const student = students.find((s) => s.id === inv.studentId);
                    const studentClass = student ? classes.find((c) => c.id === student.classId) : undefined;
                    const studentName = student ? `${student.lastName} ${student.firstName}` : 'Inconnu';

                    return (
                      <TableRow key={inv.id} className="table-row-hover">
                        <TableCell className="font-mono font-bold text-primary">{inv.number}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{studentName}</div>
                          <div className="text-xs text-muted-foreground">{studentClass?.name || ''}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{inv.dueDate}</TableCell>
                        <TableCell className="font-mono font-bold">
                          {inv.totalAmount.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={inv.status === 'paid' ? 'default' : 'secondary'}
                            className={inv.status === 'paid' ? 'bg-emerald-600' : ''}
                          >
                            {inv.status === 'paid' ? 'Payée' : inv.status === 'overdue' ? 'En retard' : 'Envoyée'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateInvoiceStatus(inv.id, 'paid')}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Payée
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (student) {
                                  const saved = await generateInvoicePDF(inv, student, studentClass, settings, 'download');
                                  if (saved) toast.success(`Facture enregistrée en PDF pour ${student.lastName}`);
                                } else {
                                  toast.error("Élève non trouvé pour cette facture");
                                }
                              }}
                              className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Download className="h-3.5 w-3.5" /> Télécharger
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (student) {
                                  await generateInvoicePDF(inv, student, studentClass, settings, 'print');
                                } else {
                                  toast.error("Élève non trouvé pour cette facture");
                                }
                              }}
                              className="gap-1"
                            >
                              <Printer className="h-3.5 w-3.5" /> Imprimer
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsDeleteOpen(true);
                              }}
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
                icon={<FileText className="h-10 w-10 text-muted-foreground" />}
                title="Aucune facture disponible"
                description="Créer une nouvelle facture pour délivrer des appels de fonds."
                action={
                  <Button onClick={() => setIsInvoiceDialogOpen(true)} className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" /> Nouvelle Facture
                  </Button>
                }
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une Facture d'Établissement</DialogTitle>
            <DialogDescription>
              Émettez un appel de frais pour un élève (frais de scolarité, cantine, uniforme, etc.).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Sélectionner l'Élève *</Label>
              <Select value={invoiceStudentId} onValueChange={setInvoiceStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un élève" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.lastName} {s.firstName} ({s.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Date d'échéance</Label>
              <DatePicker
                date={invoiceDueDate ? parseISO(invoiceDueDate) : undefined}
                onChange={(d) =>
                  setInvoiceDueDate(d ? formatISO(d, { representation: 'date' }) : '')
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Lignes de la Facture *</Label>
                <Button size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="h-3 w-3 mr-1" /> Ajouter une ligne
                </Button>
              </div>

              {invoiceItems.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-center">
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[idx].description = e.target.value;
                      setInvoiceItems(newItems);
                    }}
                    placeholder="Description du frais"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[idx].amount = Number(e.target.value);
                      setInvoiceItems(newItems);
                    }}
                    placeholder="Montant"
                    className="w-32"
                  />
                  {invoiceItems.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Notes / Instructions de paiement</Label>
              <Input
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Ex: Règlement par Orange Money, SAMA Money ou Espèces à la caisse"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateInvoice} className="gradient-primary">
              Générer la Facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer la facture"
        description="Êtes-vous sûr de vouloir supprimer cette facture ?"
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDeleteInvoice}
      />
    </MainLayout>
  );
}
