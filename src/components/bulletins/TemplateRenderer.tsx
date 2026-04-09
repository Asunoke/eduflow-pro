import React from 'react';
import { BulletinTemplate, TemplateBlock, BulletinData, SchoolSettings } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TemplateRendererProps {
  template: BulletinTemplate;
  data: BulletinData;
  settings: SchoolSettings;
  isPreview?: boolean;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ 
  template, 
  data, 
  settings,
  isPreview = false 
}) => {

  const resolveValue = (path: string): string => {
    const rawPath = path.replace(/{{|}}/g, '').trim();
    
    // Exception logic for specific formats
    if (rawPath === 'student.gender') {
      return data.student.gender === 'M' ? 'Masculin' : 'Féminin';
    }
    if (rawPath === 'bulletin.totalCoefficients') {
      const totalCoefficients = data.grades.reduce((sum, g) => sum + (g.subject.coefficient || 0), 0);
      return totalCoefficients.toString();
    }
    if (rawPath === 'bulletin.totalWeightedPoints') {
      const totalWeightedPoints = data.grades.reduce((sum, g) => sum + (g.average * (g.subject.coefficient || 0)), 0);
      return totalWeightedPoints.toFixed(settings.gradingConfig.roundDecimals);
    }
    
    const keys = rawPath.split('.');
    let current: any = {
      student: data.student,
      bulletin: data,
      school: settings,
      settings: settings,
      class: data.class,
      period: data.period
    };

    for (const key of keys) {
      if (current === undefined || current === null) return '';
      current = current[key];
    }

    return current?.toString() || '';
  };

  const renderContent = (content?: string) => {
    if (!content) return null;
    return content.replace(/{{[^{}]+}}/g, (match) => resolveValue(match));
  };

  const renderBlock = (block: TemplateBlock): React.ReactNode => {
    const baseStyle: React.CSSProperties = {
      fontSize: block.style?.fontSize,
      fontWeight: block.style?.fontWeight as any,
      color: block.style?.color,
      backgroundColor: block.style?.backgroundColor,
      textAlign: block.style?.textAlign,
      textDecoration: block.style?.textDecoration,
      padding: block.style?.padding ? `${block.style.padding}px` : undefined,
      margin: block.style?.margin ? (typeof block.style.margin === 'number' ? `${block.style.margin}px` : block.style.margin) : undefined,
      borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
      border: block.style?.border,
      borderTop: (block.style as any)?.borderTop,
      width: block.style?.width,
      height: block.style?.height,
      flex: block.style?.flex,
      textTransform: (block.style as any)?.textTransform,
    };

    switch (block.type) {
      case 'container':
        return (
          <div key={block.id} style={baseStyle} className="flex flex-col gap-2">
            {block.children?.map(renderBlock)}
          </div>
        );

      case 'grid':
        return (
          <div 
            key={block.id} 
            className="grid gap-4"
            style={{ 
              ...baseStyle,
              gridTemplateColumns: `repeat(${block.columns || 2}, minmax(0, 1fr))` 
            }}
          >
            {block.children?.map(renderBlock)}
          </div>
        );

      case 'text':
        return (
          <div key={block.id} style={baseStyle}>
            {renderContent(block.content)}
          </div>
        );

      case 'divider':
        return <Separator key={block.id} style={baseStyle} className="my-4" />;

      case 'badge':
        return (
          <div key={block.id} style={{ textAlign: block.style?.textAlign }}>
            <Badge style={baseStyle} variant="secondary">
              {renderContent(block.content)}
            </Badge>
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="flex justify-center" style={baseStyle}>
            {settings.logo ? (
              <img src={settings.logo} alt="School Logo" style={{ maxWidth: '100%', height: 'auto' }} />
            ) : (
              <div className="w-20 h-20 bg-muted flex items-center justify-center rounded-lg border-2 border-dashed">
                LOGO
              </div>
            )}
          </div>
        );

      case 'signature':
        return (
          <div key={block.id} style={baseStyle} className="space-y-16 py-8 border-t border-transparent">
            <div className="font-bold border-b-2 border-dotted border-gray-300 pb-2">
              {renderContent(block.content)}
            </div>
            <div className="italic text-xs text-slate-600">(Signature et Cachet)</div>
          </div>
        );

      case 'table':
        if (block.source === 'grades') {
          // Fallback to all columns if config is missing
          const colsC = block.config?.columns || ['subject', 'coefficient', 'homework', 'exam', 'average', 'rank', 'appreciation'];
          const headerBg = block.style?.backgroundColor || '#f1f5f9';
          const headerColor = block.style?.color || 'inherit';
          const decimals = settings.gradingConfig.roundDecimals;

          const labelMap: Record<string, string> = {
            subject: 'Matières',
            coefficient: 'Coef',
            homework: 'Note Classe',
            exam: 'Comp x2',
            average: 'Moy/Gle',
            weighted: 'Moy/Coeff',
            classAverage: 'Moy. Classe',
            rank: 'Rang',
            appreciation: 'Appréciation',
            teacher: 'Prof',
          };

          const renderCell = (grade: BulletinData['grades'][number], col: string): React.ReactNode => {
            switch (col) {
              case 'subject':
                return <TableCell className="font-medium border-r last:border-r-0">{grade.subject.name}</TableCell>;
              case 'coefficient':
                return <TableCell className="text-center border-r last:border-r-0 text-slate-700">{grade.subject.coefficient}</TableCell>;
              case 'homework':
                return <TableCell className="text-center border-r last:border-r-0 text-slate-700">{grade.homeworkAverage.toFixed(decimals)}</TableCell>;
              case 'exam':
                return <TableCell className="text-center border-r last:border-r-0 text-slate-700">{(grade.examAverage * 2).toFixed(decimals)}</TableCell>;
              case 'average':
                return <TableCell className="text-center font-bold border-r last:border-r-0">{grade.average.toFixed(decimals)}</TableCell>;
              case 'weighted':
                return <TableCell className="text-center border-r last:border-r-0 text-slate-700">{(grade.average * grade.subject.coefficient).toFixed(decimals)}</TableCell>;
              case 'classAverage':
                return <TableCell className="text-center border-r last:border-r-0 text-slate-700">{(grade.classAverage ?? 0).toFixed(decimals)}</TableCell>;
              case 'rank':
                return <TableCell className="text-center border-r last:border-r-0">{grade.rank || '-'}</TableCell>;
              case 'teacher':
                return <TableCell className="text-center border-r last:border-r-0 text-slate-700">{grade.teacherName || '-'}</TableCell>;
              case 'appreciation':
                return <TableCell className="text-sm italic border-r last:border-r-0 text-slate-700 pt-3">{grade.grades[0]?.comment || (grade.average >= 16 ? 'Très Bien' : grade.average >= 14 ? 'Bien' : grade.average >= 12 ? 'Assez Bien' : grade.average >= 10 ? 'Passable' : 'Insuffisant')}</TableCell>;
              default:
                return null;
            }
          };

          return (
            <div key={block.id} className="overflow-hidden border rounded-lg" style={{ ...baseStyle, backgroundColor: 'transparent', color: 'inherit' }}>
              <Table>
                <TableHeader style={{ backgroundColor: headerBg }}>
                  <TableRow className="hover:bg-transparent border-b-0">
                    {colsC.map((col: string) => (
                      <TableHead key={col} className="text-center font-bold border-r last:border-r-0" style={{ color: headerColor }}>
                        {labelMap[col] || col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.grades.map((grade, idx) => (
                    <TableRow key={idx} className="hover:bg-transparent">
                      {colsC.map((col: string) => (
                        <React.Fragment key={`${col}-${idx}`}>
                          {renderCell(grade, col)}
                        </React.Fragment>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "bulletin-paper bg-white text-slate-900 shadow-2xl mx-auto overflow-hidden",
      isPreview ? "scale-[0.8] origin-top" : ""
    )}
    style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      boxSizing: 'border-box'
    }}>
      <div className="flex flex-col gap-4 h-full">
        {template.layout.map(renderBlock)}
      </div>
    </div>
  );
};
