'use client';

import { Button, Card, CardBody, Link } from '@heroui/react';
import Image from 'next/image';
import { APP } from '@split-snap/shared/constants';

const STEPS = [
  {
    icon: '📸',
    title: 'Scan the Receipt',
    description:
      'Take a photo or upload your receipt. Our AI extracts every item automatically.',
  },
  {
    icon: '🔗',
    title: 'Share the Link',
    description:
      'Get a unique session link or QR code. Send it to everyone at the table.',
  },
  {
    icon: '✅',
    title: 'Claim Your Items',
    description:
      'Each person selects what they ordered. Tax and tip are split proportionally.',
  },
  {
    icon: '💰',
    title: 'See Your Total',
    description:
      'Everyone sees exactly what they owe — fair and transparent, no arguments.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center md:py-32">
        <Image
          src="/logo.png"
          alt={`${APP.NAME} logo`}
          width={96}
          height={96}
          className="mb-6 rounded-2xl"
          priority
        />
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Split bills, <span className="text-primary">not friendships</span>
        </h1>
        <p className="text-default-500 mt-4 max-w-2xl text-lg md:text-xl">
          Scan a receipt, share a link, and let everyone pick their items. Tax
          and tip are automatically distributed. No app download needed.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button
            as={Link}
            href="/scan"
            color="primary"
            size="lg"
            className="px-8 text-base font-semibold"
          >
            Scan a Receipt
          </Button>
          <Button
            as={Link}
            href="/scan?manual=true"
            variant="bordered"
            size="lg"
            className="px-8 text-base font-semibold"
          >
            Enter Manually
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-content1 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Card key={i} className="bg-content2">
                <CardBody className="p-6 text-center">
                  <span className="mb-4 block text-4xl">{step.icon}</span>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-default-500 text-sm">{step.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-3xl font-bold">{`Why ${APP.NAME}?`}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-3 text-3xl">⚡</div>
              <h3 className="mb-1 font-semibold">Real-time</h3>
              <p className="text-default-500 text-sm">
                Everyone sees updates live as items are claimed.
              </p>
            </div>
            <div>
              <div className="mb-3 text-3xl">🧮</div>
              <h3 className="mb-1 font-semibold">Fair Math</h3>
              <p className="text-default-500 text-sm">
                Tax and tip distributed proportionally — down to the penny.
              </p>
            </div>
            <div>
              <div className="mb-3 text-3xl">👤</div>
              <h3 className="mb-1 font-semibold">No Sign-up Needed</h3>
              <p className="text-default-500 text-sm">
                Participants just need a name — no account required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
