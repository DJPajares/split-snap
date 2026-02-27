"use client";

import { Button, Card, CardBody, Link } from "@heroui/react";

const STEPS = [
  {
    icon: "📸",
    title: "Scan the Receipt",
    description:
      "Take a photo or upload your receipt. Our AI extracts every item automatically.",
  },
  {
    icon: "🔗",
    title: "Share the Link",
    description:
      "Get a unique session link or QR code. Send it to everyone at the table.",
  },
  {
    icon: "✅",
    title: "Claim Your Items",
    description:
      "Each person selects what they ordered. Tax and tip are split proportionally.",
  },
  {
    icon: "💰",
    title: "See Your Total",
    description:
      "Everyone sees exactly what they owe — fair and transparent, no arguments.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-20 md:py-32 px-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
          Split bills,{" "}
          <span className="text-primary">not friendships.</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-default-500 max-w-2xl">
          Scan a receipt, share a link, and let everyone pick their items.
          Tax and tip are automatically distributed. No app download needed.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            as={Link}
            href="/scan"
            color="primary"
            size="lg"
            className="font-semibold text-base px-8"
          >
            Scan a Receipt
          </Button>
          <Button
            as={Link}
            href="/scan?manual=true"
            variant="bordered"
            size="lg"
            className="font-semibold text-base px-8"
          >
            Enter Manually
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-content1">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <Card key={i} className="bg-content2">
                <CardBody className="text-center p-6">
                  <span className="text-4xl mb-4 block">{step.icon}</span>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-default-500">
                    {step.description}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Why Split Snap?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold mb-1">Real-time</h3>
              <p className="text-sm text-default-500">
                Everyone sees updates live as items are claimed.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🧮</div>
              <h3 className="font-semibold mb-1">Fair Math</h3>
              <p className="text-sm text-default-500">
                Tax and tip distributed proportionally — down to the penny.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">👤</div>
              <h3 className="font-semibold mb-1">No Sign-up Needed</h3>
              <p className="text-sm text-default-500">
                Participants just need a name — no account required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
