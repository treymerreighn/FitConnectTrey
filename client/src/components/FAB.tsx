import { Plus } from "lucide-react";
import { Link } from "@/components/ui/link";

export default function FAB() {
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Link href="/add-exercise" asChild>
        <button
          className="fab h-14 w-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-95 transform transition hover:from-red-700 hover:to-red-800"
          aria-label="Add exercise"
        >
          <Plus className="h-6 w-6" />
        </button>
      </Link>
    </div>
  );
}
