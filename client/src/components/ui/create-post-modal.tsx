import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dumbbell, Apple, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [, setLocation] = useLocation();

  const handleClose = () => {
    onClose();
  };

  const handleTypeSelect = (type: "workout" | "nutrition" | "progress") => {
    handleClose();
    if (type === "workout") {
      setLocation("/build-workout");
    } else if (type === "nutrition") {
      setLocation("/meals?create=true");
    } else if (type === "progress") {
      setLocation("/progress?create=true");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-fit-green/10 to-fit-green/5 border-fit-green/30 hover:from-fit-green/20 hover:to-fit-green/10 hover:border-fit-green/40 transition-all duration-200 hover:scale-[1.02] group"
            onClick={() => handleTypeSelect("workout")}
          >
            <Dumbbell className="h-8 w-8 text-fit-green group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg text-fit-green">Workout</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30 hover:from-orange-500/20 hover:to-orange-500/10 hover:border-orange-500/40 transition-all duration-200 hover:scale-[1.02] group"
            onClick={() => handleTypeSelect("nutrition")}
          >
            <Apple className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg text-orange-500">Nutrition</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 hover:from-blue-500/20 hover:to-blue-500/10 hover:border-blue-500/40 transition-all duration-200 hover:scale-[1.02] group"
            onClick={() => handleTypeSelect("progress")}
          >
            <TrendingUp className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg text-blue-500">Progress</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

}
