import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ src, alt, name, className, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src} alt={alt || name} />
      <AvatarFallback className="bg-fit-green text-white font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
