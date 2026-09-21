import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, StatsCard } from '@/components/shared';
import {
  Users,
  School,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  UserX,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  'hsl(var(--chart-5))',
];

export default function Dashboard() {
  const { getDashboardStats, settings, students, classes, teachers, payments, expenses, grades } = useStore();
  const { absences, loadAbsences } = useAttendanceStore();
  const stats = getDashboardStats();

  useEffect(() => {
    loadAbsences();
  }, [loadAbsences]);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // Month navigation
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));
  const resetToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonthDate(today);
  };

  // Calendar days generation (Monday-start)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  // Daily activity calculations for selected date
  const selectedDayPayments = payments.filter((p) => p.date === selectedDateStr);
  const selectedDayExpenses = expenses.filter((e) => e.date === selectedDateStr);
  const selectedDayAbsences = absences.filter((a) => a.date === selectedDateStr);
  const selectedDayGrades = grades.filter((g) => g.date === selectedDateStr);

  const dayPaymentsTotal = selectedDayPayments.reduce((sum, p) => sum + p.amount, 0);

  // Financial History Chart Data (last 6 months)
  const chartData = Array.from({ length: 6 })
    .map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleDateString('fr-FR', { month: 'short' }),
        revenus: 0,
        depenses: 0,
      };
    })
    .reverse();

  payments.forEach((p) => {
    const monthName = new Date(p.date).toLocaleDateString('fr-FR', { month: 'short' });
    const match = chartData.find((m) => m.month === monthName);
    if (match) match.revenus += p.amount;
  });

  expenses.forEach((e) => {
    const monthName = new Date(e.date).toLocaleDateString('fr-FR', { month: 'short' });
    const match = chartData.find((m) => m.month === monthName);
    if (match) match.depenses += e.amount;
  });

  // Class distribution chart data
  const subjectTaskData = classes.slice(0, 5).map((c, i) => ({
    name: c.name,
    score: students.filter((s) => s.classId === c.id).length * 10,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Student gender distribution
  const maleCount = students.filter((s) => s.gender === 'M').length;
  const femaleCount = students.filter((s) => s.gender === 'F').length;
  const totalStudents = students.length || 1;
  const distributionData = [
    { name: 'Garçons', value: Math.round((maleCount / totalStudents) * 100), color: 'hsl(var(--chart-1))' },
    { name: 'Filles', value: Math.round((femaleCount / totalStudents) * 100), color: 'hsl(var(--chart-2))' },
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: settings.currency || 'XOF',
      maximumFractionDigits: 0,
    }).format(amount);

  const dashboardStats: Array<{
    title: string;
    value: string;
    description: string;
    icon: typeof Users;
    variant: 'orange' | 'blue' | 'purple';
  }> = [
    {
      title: 'Élèves Actifs',
      value: stats.activeStudents.toString(),
      description: 'Inscrits cette année',
      icon: Users,
      variant: 'orange',
    },
    {
      title: 'Revenus (Paiements)',
      value: formatCurrency(stats.totalPayments),
      description: 'Total encaissé',
      icon: TrendingUp,
      variant: 'blue',
    },
    {
      title: 'Enseignants',
      value: teachers.length.toString(),
      description: 'Personnel éducatif',
      icon: School,
      variant: 'purple',
    },
    {
      title: 'Dépenses (Salaires)',
      value: formatCurrency(stats.totalExpenses),
      description: 'Charges et salaires',
      icon: TrendingDown,
      variant: 'orange',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
        <PageHeader
          title="Tableau de bord"
          description={settings.schoolName || 'School Management'}
        />

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, i) => (
            <StatsCard
              key={i}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              variant={stat.variant}
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
                <CardTitle className="text-lg font-bold">Répartition des Effectifs par Classe</CardTitle>
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
                      <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={16}>
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
            {/* Interactive Calendar Widget */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6 overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-base capitalize text-slate-800 dark:text-white">
                    {currentMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevMonth}
                      className="h-8 w-8 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetToToday}
                      className="text-xs px-2 h-7 font-medium text-primary hover:bg-primary/10"
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextMonth}
                      className="h-8 w-8 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-y-2 text-center">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
                    <span key={index} className="text-[10px] font-bold text-slate-400 uppercase">
                      {d}
                    </span>
                  ))}

                  {/* Offset empty slots */}
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`offset-${i}`} className="p-2" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateObj = new Date(year, month, dayNum);
                    const isToday =
                      dayNum === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();
                    const isSelected =
                      dayNum === selectedDate.getDate() &&
                      month === selectedDate.getMonth() &&
                      year === selectedDate.getFullYear();

                    return (
                      <button
                        type="button"
                        key={dayNum}
                        onClick={() => setSelectedDate(dateObj)}
                        className={cn(
                          'p-2 text-xs transition-all rounded-xl relative flex items-center justify-center font-medium focus:outline-none',
                          isSelected
                            ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30'
                            : isToday
                            ? 'border border-primary/40 text-primary font-bold hover:bg-primary/10'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Dynamic Journal Panel for Selected Date */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold">
                      Activités du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedDayPayments.length + selectedDayAbsences.length + selectedDayGrades.length} événement(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Payments */}
                {selectedDayPayments.length > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" /> Encaissés : {selectedDayPayments.length} paiement(s)
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(dayPaymentsTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Absences */}
                {selectedDayAbsences.length > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <UserX className="h-3.5 w-3.5" /> Absences : {selectedDayAbsences.length} personne(s)
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold">
                        {selectedDayAbsences.filter((a) => a.justified).length} justifiée(s)
                      </span>
                    </div>
                  </div>
                )}

                {/* Grades */}
                {selectedDayGrades.length > 0 && (
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Évaluations : {selectedDayGrades.length} note(s) saisie(s)
                      </span>
                    </div>
                  </div>
                )}

                {/* Empty State for Date */}
                {selectedDayPayments.length === 0 &&
                  selectedDayAbsences.length === 0 &&
                  selectedDayGrades.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Aucun événement enregistré à cette date.
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Gender Distribution Donut */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="relative h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        innerRadius={55}
                        outerRadius={75}
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
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Effectif</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {distributionData.map((item) => (
                    <div key={item.name} className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
