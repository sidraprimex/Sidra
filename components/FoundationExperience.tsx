import { foundationContent } from "@/cms/foundationContent";
import { AmbientCanvas } from "@/components/motion/AmbientCanvas";
import { Card } from "@/components/ui/Card";

export function FoundationExperience() {
  const content = foundationContent.foundation;

  return (
    <main id="top">
      <section className="relative flex min-h-screen items-end overflow-hidden bg-black-950 px-4 pb-9 pt-11 text-ivory-100 md:px-6 md:pb-11">
        <AmbientCanvas />
        <div className="relative mx-auto w-full max-w-7xl">
          <p className="text-micro uppercase tracking-[0.22em] text-gold-500">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-hero">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-body-lg text-gray-300">
            {content.body}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[content.signalOne, content.signalTwo, content.signalThree].map(
              (signal) => (
                <Card
                  key={signal}
                  className="border-white/10 bg-white/[0.045] text-ivory-100 backdrop-blur-xl"
                >
                  <p className="font-display text-h3">{signal}</p>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>
      <section id="about" className="bg-ivory-100 px-4 py-11 md:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-micro uppercase tracking-[0.18em] text-gold-600">
            Foundation verified first
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-h1">
            Nothing enters Sidra before its phase is complete.
          </h2>
          <p className="mt-4 max-w-2xl text-body text-gray-700">
            This release intentionally contains no fictional Studios, products or
            marketplace data. Each production system will connect only after its
            own security, data and acceptance checks pass.
          </p>
        </div>
      </section>
    </main>
  );
}
