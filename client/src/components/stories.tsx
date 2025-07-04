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
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
      <div className="px-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today's Workouts</h2>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {activeUsers.map((user, index) => (
            <div key={user.id} className="flex-shrink-0 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fit-green to-fit-blue p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    className="w-full h-full border-0"
                    size="lg"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {index === 0 ? "Your Story" : user.name.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
