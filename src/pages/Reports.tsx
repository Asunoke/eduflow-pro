import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download,
  Users,
  GraduationCap,
  Wallet,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Reports() {
  const { students, classes, levels, teachers, payments, expenses, periods, settings } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    periods.find((p) => p.isActive)?.id || ''
  );
  const [selectedClass, setSelectedClass] = useState<string>('');

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF' }).format(amount);

  const reports = [
    {
      id: 'students',
      title: 'Liste des élèves',
      description: 'Liste complète des élèves avec leurs informations',
      icon: Users,
      color: 'primary',
    },
    {
      id: 'classes',
      title: 'Effectifs par classe',
      description: 'Répartition des élèves par classe et niveau',
      icon: GraduationCap,
      color: 'accent',
    },
    {
      id: 'grades',
      title: 'Résultats scolaires',
      description: 'Moyennes et classements par période',
      icon: BarChart3,
      color: 'success',
    },
    {
      id: 'payments',
      title: 'État des paiements',
      description: 'Récapitulatif des paiements et dettes',
      icon: Wallet,
      color: 'warning',
    },
    {
      id: 'finances',
      title: 'Rapport financier',
      description: 'Bilan complet recettes/dépenses',
      icon: FileText,
      color: 'primary',
    },
    {
      id: 'yearly',
      title: 'Bilan annuel',
      description: 'Synthèse complète de l\'année scolaire',
      icon: Calendar,
      color: 'accent',
    },
  ];

  const handleGenerateReport = (reportId: string) => {
    // In a real app, this would generate and download a PDF/Excel file
    toast.success('Génération du rapport en cours...');
    
    // Simulate report generation
    setTimeout(() => {
      toast.success('Rapport généré avec succès !');
    }, 1500);
  };

  const getIconBg = (color: string) => {
    switch (color) {
      case 'primary': return 'bg-primary-light text-primary';
      case 'accent': return 'bg-accent-light text-accent';
      case 'success': return 'bg-success-light text-success';
      case 'warning': return 'bg-warning-light text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Quick stats
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const activeStudents = students.filter((s) => s.status === 'active').length;

  return (
    <MainLayout>
      <PageHeader title="Rapports" description="Génération de rapports et statistiques" />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="card-elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{students.length}</p>
            <p className="text-sm text-muted-foreground">Élèves inscrits</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{classes.length}</p>
            <p className="text-sm text-muted-foreground">Classes</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{formatCurrency(totalPayments)}</p>
            <p className="text-sm text-muted-foreground">Total recettes</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{formatCurrency(totalExpenses)}</p>
            <p className="text-sm text-muted-foreground">Total dépenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-elevated mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Période</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Classe</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map((cls) => {
                    const level = levels.find((l) => l.id === cls.levelId);
                    return (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({level?.name})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="card-elevated hover:shadow-card-hover transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${getIconBg(report.color)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-lg mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleGenerateReport(report.id)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    onClick={() => handleGenerateReport(report.id)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
