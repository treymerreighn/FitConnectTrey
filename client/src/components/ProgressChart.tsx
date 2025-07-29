import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";

interface WeightDataPoint {
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
}

interface ProgressChartProps {
  data: WeightDataPoint[];
  title?: string;
  showTrend?: boolean;
  aiAnalysis?: {
    trend: "gaining" | "losing" | "maintaining" | "fluctuating";
    analysis: string;
    recommendations: string[];
  };
}

export function ProgressChart({ 
  data, 
  title = "Weight Progress", 
  showTrend = true,
  aiAnalysis 
}: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No weight data available yet. Start tracking to see your progress!
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), 'MMM dd');
  };

  const formatTooltip = (value: any, name: string) => {
    if (name === 'weight') return [`${value} lbs`, 'Weight'];
    if (name === 'bodyFat') return [`${value}%`, 'Body Fat'];
    if (name === 'muscleMass') return [`${value} lbs`, 'Muscle Mass'];
    return [value, name];
  };

  const getTrendIcon = () => {
    if (!aiAnalysis) return null;
    
    switch (aiAnalysis.trend) {
      case "gaining":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "losing":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "maintaining":
        return <Minus className="h-4 w-4 text-blue-500" />;
      case "fluctuating":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!aiAnalysis) return "bg-gray-100";
    
    switch (aiAnalysis.trend) {
      case "gaining":
        return "bg-green-100 text-green-800";
      case "losing":
        return "bg-red-100 text-red-800";
      case "maintaining":
        return "bg-blue-100 text-blue-800";
      case "fluctuating":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showTrend && aiAnalysis && (
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <Badge variant="secondary" className={getTrendColor()}>
                {aiAnalysis.trend.charAt(0).toUpperCase() + aiAnalysis.trend.slice(1)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#weightGradient)"
              />
              {data.some(d => d.bodyFat) && (
                <Area
                  type="monotone"
                  dataKey="bodyFat"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#bodyFatGradient)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {aiAnalysis && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>AI Analysis:</strong> {aiAnalysis.analysis}
              </p>
              {aiAnalysis.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Recommendations:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {aiAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}