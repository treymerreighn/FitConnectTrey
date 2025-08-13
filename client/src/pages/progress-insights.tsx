import { ProgressInsights } from "@/components/progress-insights";

export default function ProgressInsightsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <ProgressInsights />
      </div>
    </div>
  );
}