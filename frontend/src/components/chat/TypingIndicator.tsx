export function TypingIndicator({ users }: { users: string[] }) {
  if (!users || users.length === 0) return null;

  const text = users.length === 1 
    ? `${users[0]} is typing...` 
    : users.length === 2 
      ? `${users[0]} and ${users[1]} are typing...` 
      : 'Several people are typing...';

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400 px-4 py-1">
      <div className="flex gap-1 items-center bg-zinc-800/50 rounded-full px-2 py-1">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{text}</span>
    </div>
  );
}
