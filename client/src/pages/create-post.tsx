import { useState } from "react";
import { CreatePostModal } from "@/components/ui/create-post-modal";

export default function CreatePost() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // Navigate back to previous page
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CreatePostModal isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}
