import { UserAvatar } from "@/components/ui/user-avatar";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { User, Post } from "@shared/schema";

interface StoriesProps {
  users: User[];
  posts: Post[];
}

export function Stories({ users, posts }: StoriesProps) {
  const getActiveUsers = () => {
    // Show users who have posted recently (for stories)
    const recentPosters = posts.slice(0, 4).map(post => 
      users.find(user => user.id === post.userId)
    ).filter(Boolean) as User[];
    
    // Add current user at the beginning
    const currentUser = users.find(user => user.id === CURRENT_USER_ID);
    if (currentUser) {
      return [currentUser, ...recentPosters.filter(user => user.id !== currentUser.id)];
    }
    return recentPosters;
  };

  const activeUsers = getActiveUsers();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-6">
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stories</h2>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {activeUsers.map((user, index) => (
            <div key={user.id} className="flex-shrink-0 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fit-green to-fit-blue p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    className="w-full h-full border-0"
                    size="lg"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 max-w-[64px] truncate">
                {index === 0 ? "Your Story" : user.name.split(" ")[0]}
              </p>
            </div>
          ))}
          
          {/* Empty state when no users */}
          {activeUsers.length === 0 && (
            <div className="flex-1 text-center py-4">
              <p className="text-gray-500 dark:text-gray-300 text-sm">
                Follow users to see their stories here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
