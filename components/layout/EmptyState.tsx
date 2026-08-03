export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-bg-card p-6 text-center text-sm text-text-secondary">
      {message}
    </div>
  );
}
