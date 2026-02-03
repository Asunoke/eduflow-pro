import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, StatsCard, EmptyState } from '@/components/shared';
import { 
  Users, 
  GraduationCap, 
  School, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
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
  Cell,
} from 'recharts';

const CHART_COLORS = ['hsl(221, 83%, 53%)', 'hsl(173, 80%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)'];

export default function Dashboard() {
  const { getDashboardStats, settings, students, classes, teachers, payments, expenses, periods } = useStore();
  const stats = getDashboardStats();
  const activePeriod = periods.find((p) => p.isActive);

  // Calculate payment chart data
  const paymentsByMonth = payments.reduce((acc, p) => {
    const month = new Date(p.date).toLocaleDateString('fr-FR', { month: 'short' });
    acc[month] = (acc[month] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(paymentsByMonth).map(([month, amount]) => ({
    month,
    amount,
  }));

  // Student status distribution
  const statusData = [
    { name: 'Actifs', value: students.filter((s) => s.status === 'active').length, color: CHART_COLORS[0] },
    { name: 'Inactifs', value: students.filter((s) => s.status === 'inactive').length, color: CHART_COLORS[1] },
    { name: 'Transférés', value: students.filter((s) => s.status === 'transferred').length, color: CHART_COLORS[2] },
    { name: 'Diplômés', value: students.filter((s) => s.status === 'graduated').length, color: CHART_COLORS[3] },
  ].filter((d) => d.value > 0);

  const balance = stats.totalPayments - stats.totalExpenses;
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF' }).format(amount);

  return (
    <MainLayout>
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue sur EduFlow • ${settings.schoolName || 'Mon École'}`}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
          <Calendar className="h-4 w-4" />
          <span>{settings.currentAcademicYear}</span>
          {activePeriod && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>{activePeriod.name}</span>
            </>
          )}
        </div>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Élèves"
          value={stats.totalStudents}
          description={`${stats.activeStudents} actifs`}
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Classes"
          value={stats.totalClasses}
          description={`${classes.length} groupes`}
          icon={GraduationCap}
          variant="accent"
        />
        <StatsCard
          title="Professeurs"
          value={stats.totalTeachers}
          description="Corps enseignant"
          icon={School}
          variant="success"
        />
        <StatsCard
          title="Balance"
          value={formatCurrency(balance)}
          description={balance >= 0 ? 'Solde positif' : 'Solde négatif'}
          icon={Wallet}
          variant={balance >= 0 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Revenus mensuels</CardTitle>
            <Link to="/finances">
              <Button variant="ghost" size="sm" className="text-primary">
                Voir tout <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }}
                      axisLine={{ stroke: 'hsl(220, 13%, 91%)' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }}
                      axisLine={{ stroke: 'hsl(220, 13%, 91%)' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 91%)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Montant']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(221, 83%, 53%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="Aucune donnée"
                description="Les revenus apparaîtront ici une fois les paiements enregistrés."
                icon={<TrendingUp className="h-10 w-10" />}
              />
            )}
          </CardContent>
        </Card>

        {/* Student Distribution */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Répartition des élèves</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 91%)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="Aucun élève"
                description="Ajoutez des élèves pour voir leur répartition."
                icon={<Users className="h-10 w-10" />}
              />
            )}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Résumé financier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success-light">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Recettes</p>
                  <p className="text-xs text-muted-foreground">{payments.length} paiements</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-success">{formatCurrency(stats.totalPayments)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive-light">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">Dépenses</p>
                  <p className="text-xs text-muted-foreground">{expenses.length} dépenses</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-destructive">{formatCurrency(stats.totalExpenses)}</p>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Taux de recouvrement</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/students">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm">Nouvel élève</span>
                </Button>
              </Link>
              <Link to="/finances">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Wallet className="h-5 w-5 text-accent" />
                  <span className="text-sm">Nouveau paiement</span>
                </Button>
              </Link>
              <Link to="/grades">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <GraduationCap className="h-5 w-5 text-success" />
                  <span className="text-sm">Saisir notes</span>
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <CheckCircle2 className="h-5 w-5 text-warning" />
                  <span className="text-sm">Générer rapport</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
