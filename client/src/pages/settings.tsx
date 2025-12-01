import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { usePreferences } from '@/contexts/preferences-context';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Weight, ArrowLeft, Crown, Zap } from 'lucide-react';

export default function Settings() {
  const { weightUnit, setWeightUnit } = usePreferences();
  const [, setLocation] = useLocation();
  
  // Mock premium toggle for testing
  const [mockPremium, setMockPremium] = React.useState(() => {
    return localStorage.getItem('fitconnect-mock-premium') === 'true';
  });

  const handlePremiumToggle = (checked: boolean) => {
    setMockPremium(checked);
    localStorage.setItem('fitconnect-mock-premium', checked.toString());
    // Reload to update premium status throughout app
    window.location.reload();
  };

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
        {/* Mock Premium Toggle - For Testing Only */}
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-amber-900 dark:text-amber-100">Mock Premium Mode</CardTitle>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <CardDescription className="text-amber-800 dark:text-amber-300">
              Testing mode - enables premium features without subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-gray-900/40">
              <div>
                <div className="font-medium text-amber-900 dark:text-amber-100">Enable Premium Features</div>
                <div className="text-sm text-amber-700 dark:text-amber-400">Exercise stats, 1RM calculations, auto-load weights</div>
              </div>
              <Switch
                checked={mockPremium}
                onCheckedChange={handlePremiumToggle}
              />
            </div>
            <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                <strong>⚠️ Development Only:</strong> This toggle simulates premium subscription. 
                Page will reload when toggled to update all components.
              </p>
            </div>
          </CardContent>
        </Card>

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
