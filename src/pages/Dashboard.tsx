import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, StatsCard } from '@/components/shared';
import {
  Users,
  GraduationCap,
  School,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  BookOpen,
  ArrowRight,
  MoreVertical,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export default function Dashboard() {
  const { getDashboardStats, settings, students, classes, teachers, payments, expenses } = useStore();
  const stats = getDashboardStats();

  // Management Value Chart Data - Real financial history (last 6 months)
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      revenus: 0,
      depenses: 0
    };
  }).reverse();

  payments.forEach((p) => {
    const month = new Date(p.date).toLocaleDateString('fr-FR', { month: 'short' });
    const match = chartData.find((m) => m.month === month);
    if (match) match.revenus += p.amount;
  });

  expenses.forEach((e) => {
    const month = new Date(e.date).toLocaleDateString('fr-FR', { month: 'short' });
    const match = chartData.find((m) => m.month === month);
    if (match) match.depenses += e.amount;
  });

  // Subject Task Data - Real subjects (enrollment or coefficient)
  const subjectTaskData = classes.slice(0, 5).map((c, i) => ({
    name: c.name,
    score: students.filter(s => s.classId === c.id).length * 10, // Mocking a score for visualization
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  // Distribution Data - Real student gender distribution
  const maleCount = students.filter(s => s.gender === 'M').length;
  const femaleCount = students.filter(s => s.gender === 'F').length;
  const totalStudents = students.length || 1;
  const distributionData = [
    { name: 'Garçons', value: Math.round((maleCount / totalStudents) * 100), color: 'hsl(var(--chart-1))' },
    { name: 'Filles', value: Math.round((femaleCount / totalStudents) * 100), color: 'hsl(var(--chart-2))' },
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings.currency || 'XOF', maximumFractionDigits: 0 }).format(amount);

  const dashboardStats = [
    {
      title: "Élèves Actifs",
      value: stats.activeStudents.toString(),
      description: "Inscrits cette année",
      icon: Users,
      variant: "orange",
    },
    {
      title: "Revenus (Paiements)",
      value: formatCurrency(stats.totalPayments),
      description: "Total encaissé",
      icon: TrendingUp,
      variant: "blue",
    },
    {
      title: "Enseignants",
      value: teachers.length.toString(),
      description: "Personnel éducatif",
      icon: School,
      variant: "purple"
    },
    {
      title: "Dépenses (Salaires)",
      value: formatCurrency(stats.totalExpenses),
      description: "Charges et salaires",
      icon: TrendingDown,
      variant: "orange",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
        <PageHeader
          title="Tableau de bord"
          description={settings.schoolName || "School Management"}
        />

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, i) => (
            <StatsCard
              key={i}
              title={stat.title}
              value={stat.value}
              icon={stat.icon as any}
              variant={stat.variant as any}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column - 8/12 */}
          <div className="lg:col-span-8 space-y-6">

            {/* Management Value Chart */}
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Bilan Financier</CardTitle>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]" /> Revenus
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--destructive))]" /> Dépenses
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenus"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={1}
                        fill="url(#colorRev)"
                        strokeWidth={4}
                        dot={{ r: 4, fill: 'hsl(var(--chart-1))', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="depenses"
                        stroke="hsl(var(--destructive))"
                        fillOpacity={0}
                        strokeWidth={4}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subject Task Bar Chart */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Répartition par Classe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={subjectTaskData} margin={{ left: 40 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                        width={100}
                      />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar
                        dataKey="score"
                        radius={[0, 10, 10, 0]}
                        barSize={16}
                      >
                        {subjectTaskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 4/12 */}
          <div className="lg:col-span-4 space-y-6">

            {/* Distribution Donut */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="relative h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold">{maleCount + femaleCount > 0 ? '100%' : '0%'}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {distributionData.map((item) => (
                    <div key={item.name} className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Widget */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6 overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-lg text-slate-800 dark:text-white">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowRight className="rotate-180 h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowRight className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-y-4 text-center">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                    <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>
                  ))}
                  {Array.from({ length: 31 }).map((_, i) => {
                    const isToday = i + 1 === new Date().getDate();
                    return (
                      <div key={i} className={cn(
                        "p-2 text-xs transition-all cursor-default relative group",
                        isToday ? "text-primary-foreground font-bold" : "text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                      )}>
                        {isToday && <div className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/30 -z-10 animate-pulse" />}
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* List Widget */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold">Derniers Élèves</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {students.slice(0, 3).map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center text-white text-xs font-bold">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{student.firstName} {student.lastName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{student.matricule}</p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
