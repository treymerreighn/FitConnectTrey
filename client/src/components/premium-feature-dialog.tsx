import { Crown, Check, Zap, Star, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PremiumFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export function PremiumFeatureDialog({ 
  open, 
  onOpenChange,
  featureName = "AI Insights"
}: PremiumFeatureDialogProps) {
  const premiumFeatures = [
    "AI-powered progress photo analysis",
    "Personalized workout recommendations",
    "Advanced nutrition insights",
    "Progress trend predictions",
    "Compare progress over time",
    "Unlimited AI insights generation",
    "Priority support",
    "Ad-free experience"
  ];

  const handleUpgrade = () => {
    // TODO: Implement actual payment flow (Stripe, etc.)
    console.log("Redirect to premium purchase");
    // For now, just close the dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-center">
            <strong className="text-lg text-gray-900 dark:text-white">{featureName}</strong> is a premium-only feature
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Premium Benefits */}
          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Premium Membership</h3>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Best Value
                </Badge>
              </div>
              
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  $9.99
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Cancel anytime
                </p>
              </div>

              <ul className="space-y-2">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold"
              size="lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          {/* Money-back guarantee */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
