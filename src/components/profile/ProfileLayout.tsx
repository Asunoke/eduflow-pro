import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProfileLayoutProps {
  initials: string;
  name: string;
  photo?: string;
  rating?: number;
  trustScore?: number;
  showRating?: boolean;
  scoreLabel?: string;
  numGrades?: number;
  infoGroups: {
    title: string;
    items: {
      label: string;
      value: React.ReactNode;
      isToggle?: boolean;
    }[];
  }[];
  tabs: {
    value: string;
    label: string;
    content: React.ReactNode;
  }[];
}

export function ProfileLayout({
  initials,
  name,
  photo,
  rating = 0,
  trustScore = 0,
  showRating = true,
  scoreLabel = "Performances",
  numGrades = 0,
  infoGroups,
  tabs
}: ProfileLayoutProps) {
  return (
    <div className="space-y-6">
      <Card className="card-elevated overflow-hidden border-none shadow-premium bg-white dark:bg-slate-900 rounded-3xl">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-muted/50">
            {/* Sidebar section */}
            <div className="w-full md:w-72 p-8 flex flex-col items-center text-center space-y-4 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-800 shadow-xl">
                  <AvatarImage src={photo} alt={name} className="object-cover" />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{name}</h2>
                {showRating && (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`h-4 w-4 ${s <= Math.round(rating) ? 'fill-warning text-warning' : 'text-muted'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 font-medium">{numGrades} évaluations</span>
                  </div>
                )}
              </div>

              {showRating && (
                <div className="w-full space-y-2 pt-2 text-left">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{scoreLabel}</span>
                    <span className="text-primary font-bold">{Math.round(trustScore)}%</span>
                  </div>
                  <Progress value={trustScore} className="h-1.5" />
                </div>
              )}
            </div>


            {/* Content section */}
            <div className="flex-1 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                {infoGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 border-b pb-2">
                      {group.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      {group.items.map((item, iIdx) => (
                        <div key={iIdx} className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{item.label}</p>
                          <div className="text-sm font-semibold flex items-center gap-2">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-premium overflow-hidden border border-muted/20">
        <Tabs defaultValue={tabs[0].value} className="w-full">
          <div className="border-b border-muted/50 px-8 bg-slate-50/30 dark:bg-slate-800/20">
            <TabsList className="h-14 bg-transparent p-0 gap-8">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 font-bold text-muted-foreground data-[state=active]:text-primary transition-all"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="p-8">
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0 focus-visible:outline-none">
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
