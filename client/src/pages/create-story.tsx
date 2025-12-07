import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { CURRENT_USER_ID } from '@/lib/constants';
import {
  X,
  Send,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface WorkoutExercise {
  name: string;
  sets: Array<{ reps: number; weight?: number }>;
}

interface WorkoutData {
  workoutType: string;
  duration: number;
  calories: number;
  exercises: WorkoutExercise[];
}

export default function CreateStory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const storyCardRef = useRef<HTMLDivElement>(null);
  
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'dark' | 'fire' | 'minimal'>('dark');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('workoutData');
    
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setWorkoutData(parsed);
        setCaption(`Just crushed ${parsed.workoutType}! 💪🔥`);
      } catch (e) {
        console.error('Failed to parse workout data:', e);
      }
    }
  }, []);

  const createStoryMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      return api.createStory({
        userId: CURRENT_USER_ID,
        image: imageUrl,
        caption: caption,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: '🎉 Story Posted!',
        description: 'Your workout story is now live for 24 hours.',
      });
      // Redirect back to workout summary so user can also post to feed if desired
      if (workoutData) {
        const encoded = encodeURIComponent(JSON.stringify(workoutData));
        setLocation(`/workout-summary?data=${encoded}&storyPosted=true`);
      } else {
        setLocation('/');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to post story',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleGenerateAndPost = async () => {
    if (!storyCardRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Generate image from the story card
      const canvas = await html2canvas(storyCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b: Blob | null) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image blob'));
        }, 'image/png', 0.95);
      });
      
      // Create file for upload
      const file = new File([blob], 'workout-story.png', { type: 'image/png' });
      
      // Upload image
      const uploadResult = await api.uploadImage(file);
      
      // Create story with uploaded image
      createStoryMutation.mutate(uploadResult.url);
    } catch (error: any) {
      console.error('Failed to generate story:', error);
      toast({
        title: 'Failed to generate story',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!workoutData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <h2 className="text-xl font-bold text-white mb-2">No Workout Data</h2>
          <p className="text-zinc-500 mb-4">Complete a workout to share to your story.</p>
          <Button onClick={() => setLocation('/workouts')} className="bg-red-600 hover:bg-red-700">
            Go to Workouts
          </Button>
        </div>
      </div>
    );
  }

  const totalSets = workoutData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = workoutData.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.weight || 0) * set.reps, 0),
    0
  );

  // Template backgrounds
  const templateStyles = {
    dark: {
      background: 'linear-gradient(180deg, #18181b 0%, #000000 100%)',
      accent: '#ef4444',
    },
    fire: {
      background: 'linear-gradient(180deg, #7f1d1d 0%, #000000 100%)',
      accent: '#f97316',
    },
    minimal: {
      background: 'linear-gradient(180deg, #27272a 0%, #09090b 100%)',
      accent: '#a855f7',
    },
  };

  const currentStyle = templateStyles[selectedTemplate];

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-lg border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => setLocation('/')}
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-white">Create Story</h1>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            onClick={handleGenerateAndPost}
            disabled={isGenerating || createStoryMutation.isPending}
          >
            {isGenerating || createStoryMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Story Preview - Using inline styles for html2canvas compatibility */}
        <div className="flex justify-center">
          <div
            ref={storyCardRef}
            style={{
              width: '300px',
              height: '533px', // 9:16 aspect ratio
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              background: currentStyle.background,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Content Container */}
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'flex-start',
              padding: '16px',
              gap: '8px',
            }}>
              {/* Top Section - Trophy & Title */}
              <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: '4px',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                }}>
                  🏆
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: '900', 
                  color: 'white',
                  letterSpacing: '-0.5px',
                  marginBottom: '4px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}>
                  WORKOUT COMPLETE
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: currentStyle.accent,
                }}>
                  {workoutData.workoutType}
                </div>
              </div>

              {/* Stats Grid - Middle Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Stats Row 1 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>⏱️</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                      {workoutData.duration}
                    </div>
                    <div style={{ fontSize: '9px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Minutes
                    </div>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>🔥</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                      {workoutData.calories}
                    </div>
                    <div style={{ fontSize: '9px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Calories
                    </div>
                  </div>
                </div>

                {/* Stats Row 2 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>🎯</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                      {totalSets}
                    </div>
                    <div style={{ fontSize: '9px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Sets
                    </div>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>💪</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                      {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : workoutData.exercises.length}
                    </div>
                    <div style={{ fontSize: '9px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {totalVolume > 0 ? 'Lbs' : 'Exercises'}
                    </div>
                  </div>
                </div>

                {/* Exercises List */}
                <div style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  borderRadius: '10px',
                  padding: '10px',
                }}>
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#71717a', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    marginBottom: '6px',
                  }}>
                    Exercises
                  </div>
                  {workoutData.exercises.slice(0, 4).map((ex, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 0',
                    }}>
                      <span style={{ fontSize: '11px', color: 'white' }}>{ex.name}</span>
                      <span style={{ fontSize: '10px', color: '#71717a' }}>{ex.sets.length} sets</span>
                    </div>
                  ))}
                  {workoutData.exercises.length > 4 && (
                    <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
                      +{workoutData.exercises.length - 4} more exercises
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Branding */}
              <div style={{ textAlign: 'center', paddingBottom: '4px', marginTop: 'auto' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '4px',
                }}>
                  <span style={{ fontSize: '10px' }}>⚔️</span>
                  <span style={{ 
                    fontSize: '9px', 
                    color: '#71717a', 
                    textTransform: 'uppercase', 
                    letterSpacing: '2px',
                  }}>
                    KRATOS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-3 block">
            Choose Template
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedTemplate('dark')}
              className={`flex-1 h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                selectedTemplate === 'dark' 
                  ? 'border-red-500' 
                  : 'border-zinc-800'
              }`}
              style={{ background: templateStyles.dark.background }}
            >
              <span className="text-lg">🌙</span>
              <span className="text-xs text-white mt-1">Dark</span>
            </button>
            <button
              onClick={() => setSelectedTemplate('fire')}
              className={`flex-1 h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                selectedTemplate === 'fire' 
                  ? 'border-red-500' 
                  : 'border-zinc-800'
              }`}
              style={{ background: templateStyles.fire.background }}
            >
              <span className="text-lg">🔥</span>
              <span className="text-xs text-white mt-1">Fire</span>
            </button>
            <button
              onClick={() => setSelectedTemplate('minimal')}
              className={`flex-1 h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                selectedTemplate === 'minimal' 
                  ? 'border-red-500' 
                  : 'border-zinc-800'
              }`}
              style={{ background: templateStyles.minimal.background }}
            >
              <span className="text-lg">✨</span>
              <span className="text-xs text-white mt-1">Minimal</span>
            </button>
          </div>
        </div>

        {/* Caption Input */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
            Caption (optional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption to your story..."
            maxLength={150}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
          <div className="text-right text-xs text-zinc-600 mt-1">
            {caption.length}/150
          </div>
        </div>
      </div>
    </div>
  );
}
