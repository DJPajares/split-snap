'use client';

import { Button, Card, Surface } from '@heroui/react';
import { APP } from '@split-snap/shared/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  return (
    <div className="flex flex-col gap-20 py-6">
      {/* Hero */}
      <section className="mx-auto max-w-5xl p-4 sm:p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Image
            src="/logo.png"
            alt={`${APP.NAME} logo`}
            width={96}
            height={96}
            priority
          />
          <div className="flex flex-col gap-2">
            <h1 className="title-hero">
              Split bills, <span className="text-accent">not friendships</span>
            </h1>
            <p className="text-description-lg">
              Scan a receipt, share a link, and let everyone pick their items.
              Tax and tip are automatically distributed. No app download needed.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              className="px-8 text-base font-semibold"
              onPress={() => router.push('/scan')}
            >
              Scan a Receipt
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="px-8 text-base font-semibold"
              onPress={() => router.push('/scan?manual=true')}
            >
              Enter Manually
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <Surface variant="secondary">
        <section className="mx-auto max-w-5xl p-4 sm:p-8">
          <div className="flex flex-col gap-8 py-4 text-center sm:py-8">
            <h2 className="title-page">How It Works</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <Card key={i}>
                  <Card.Content className="p-6 text-center">
                    <span className="mb-4 block text-4xl">{step.icon}</span>
                    <h4 className="title-card">{step.title}</h4>
                    <p className="text-description">{step.description}</p>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </Surface>

      {/* Features */}
      <section className="mx-auto max-w-5xl p-4 sm:p-8">
        <div className="flex flex-col gap-8 text-center">
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
