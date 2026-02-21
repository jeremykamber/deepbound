import Link from 'next/link';

export default function MarketingPage() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-24 md:py-32 lg:py-40 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter max-w-3xl mb-6 text-balance">
          Understand your audience with AI-driven personas.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 text-balance">
          Generate realistic user personas from minimal input and chat with them to test your ideas, pricing, and messaging.
        </p>
        <Link 
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Go to Dashboard
        </Link>
      </section>
    </div>
  );
}
