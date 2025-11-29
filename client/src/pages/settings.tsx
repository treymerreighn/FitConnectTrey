import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePreferences } from '@/contexts/preferences-context';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Weight, ArrowLeft } from 'lucide-react';

export default function Settings() {
  const { weightUnit, setWeightUnit } = usePreferences();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <header className="fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-center px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/profile')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-white">Settings</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>
      
      <div className="max-w-2xl mx-auto p-4 pt-20 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-primary" />
              <CardTitle>Weight Unit</CardTitle>
            </div>
            <CardDescription>
              Choose your preferred unit for displaying and entering weights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={weightUnit} onValueChange={(value) => setWeightUnit(value as 'lbs' | 'kg')}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <RadioGroupItem value="lbs" id="lbs" />
                <Label htmlFor="lbs" className="flex-1 cursor-pointer">
                  <div className="font-medium">Pounds (lbs)</div>
                  <div className="text-sm text-muted-foreground">Imperial system</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors mt-2">
                <RadioGroupItem value="kg" id="kg" />
                <Label htmlFor="kg" className="flex-1 cursor-pointer">
                  <div className="font-medium">Kilograms (kg)</div>
                  <div className="text-sm text-muted-foreground">Metric system</div>
                </Label>
              </div>
            </RadioGroup>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> Changing this setting will display all weights in {weightUnit === 'lbs' ? 'pounds' : 'kilograms'}. 
                Existing workout data will be converted automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
