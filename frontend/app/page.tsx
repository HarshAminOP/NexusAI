// This is a React Functional Component for our Home Page
export default function Home() {
  return (
    // 'main' is the primary container. 
    // 'flex', 'min-h-screen', etc., are Tailwind classes for styling.
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          NexusAI
        </h1>
        <p className="text-slate-600">
          Foundation established. Ready for Agent integration.
        </p>
      </div>
    </main>
  );
}