
import { Badge } from '@/components/ui/badge';
import { Info, Database, Globe, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DataSource {
  name: string;
  type: 'real' | 'simulated' | 'calculated';
  description: string;
  lastUpdated?: string;
  source?: string;
}

interface DataSourceIndicatorProps {
  dataSources: DataSource[];
  className?: string;
}

const DataSourceIndicator = ({ dataSources, className }: DataSourceIndicatorProps) => {
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'real':
        return <Database className="h-3 w-3" />;
      case 'simulated':
        return <BarChart3 className="h-3 w-3" />;
      case 'calculated':
        return <Globe className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'real':
        return 'bg-green-500';
      case 'simulated':
        return 'bg-yellow-500';
      case 'calculated':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TooltipProvider>
          {dataSources.map((source, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between p-2 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(source.type)}
                    <span className="text-xs font-medium">{source.name}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-white text-xs ${getSourceColor(source.type)}`}
                  >
                    {source.type}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{source.name}</p>
                  <p className="text-xs text-gray-600">{source.description}</p>
                  {source.source && (
                    <p className="text-xs text-blue-600">Source: {source.source}</p>
                  )}
                  {source.lastUpdated && (
                    <p className="text-xs text-gray-500">Updated: {source.lastUpdated}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        
        <div className="pt-2 mt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Real Data</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Simulated</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Calculated</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceIndicator;
