interface Props {
  label?: string;
}

export default function Loading({ label = 'Loading…' }: Props) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-grape/30 border-t-magenta" />
      <p className="font-display text-lg text-grape/80">{label}</p>
    </main>
  );
}
