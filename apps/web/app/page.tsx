'use client';

import { Button, Card, CardBody, Link } from '@heroui/react';
import { APP } from '@split-snap/shared/constants';
import Image from 'next/image';

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

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-time Updates',
    description: 'Everyone sees changes live as items are claimed.',
  },
  {
    icon: '🧮',
    title: 'Fair Math',
    description: 'Tax and tip distributed proportionally — down to the penny.',
  },
  {
    icon: '👤',
    title: 'No Sign-up Needed',
    description: 'Participants just need a name — no account required.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 py-6 sm:gap-40">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center">
        <Image
          src="/logo.png"
          alt={`${APP.NAME} logo`}
          width={96}
          height={96}
          className="mb-6 rounded-2xl"
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="title-hero">
            Split bills, <span className="text-primary">not friendships</span>
          </h1>
          <p className="text-description-lg">
            Scan a receipt, share a link, and let everyone pick their items. Tax
            and tip are automatically distributed. No app download needed.
          </p>
        </div>
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
      <section className="bg-accent -mx-4 px-4 py-12 sm:-mx-8 sm:px-8">
        <div className="mx-auto flex flex-col gap-8 text-center">
          <h2 className="title-page">How It Works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Card key={i}>
                <CardBody className="p-6 text-center">
                  <span className="mb-4 block text-4xl">{step.icon}</span>
                  <h4 className="title-card">{step.title}</h4>
                  <p className="text-description">{step.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mx-auto flex flex-col gap-8 text-center">
          <h2 className="title-page">{`Why ${APP.NAME}?`}</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <div key={i}>
                <span className="mb-4 block text-4xl">{feature.icon}</span>
                <h4 className="title-card">{feature.title}</h4>
                <p className="text-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
