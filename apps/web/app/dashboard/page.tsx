'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Spinner, Chip, Button, Link } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useApiError } from '@/hooks/useApiError';
import type { Session } from '@split-snap/shared';
import { api } from '@/lib/api';
import { getCurrencySymbol } from '@split-snap/shared';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const { handleError } = useApiError();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Fetch user's sessions
  useEffect(() => {
    if (user) {
      api.sessions
        .list()
        .then(setSessions)
        .catch((err) => handleError(err, 'Failed to load sessions'))
        .finally(() => setLoadingSessions(false));
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
          <p className="text-default-500">
            Manage your bill-splitting sessions
          </p>
        </div>
        <Button
          as={Link}
          href="/scan"
          color="primary"
          className="font-semibold"
        >
          + New Split
        </Button>
      </div>

      {loadingSessions ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-5xl">📋</span>
            <p className="text-lg font-semibold">No sessions yet</p>
            <p className="text-default-500 text-center max-w-sm">
              Start by scanning a receipt or entering items manually. Your
              sessions will appear here.
            </p>
            <Button as={Link} href="/scan" color="primary" variant="flat">
              Create Your First Split
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card
              key={session.id}
              isPressable
              onPress={() => router.push(`/session/${session.code}`)}
              className="w-full"
            >
              <CardBody className="flex flex-row items-center justify-between gap-4 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{session.code}</span>
                    <Chip
                      size="sm"
                      color={
                        session.status === 'active'
                          ? 'success'
                          : session.status === 'settled'
                            ? 'default'
                            : 'warning'
                      }
                      variant="flat"
                    >
                      {session.status}
                    </Chip>
                  </div>
                  <p className="text-sm text-default-500">
                    {session.items.length} item
                    {session.items.length !== 1 ? 's' : ''} ·{' '}
                    {session.participants.length} participant
                    {session.participants.length !== 1 ? 's' : ''} ·{' '}
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    {getCurrencySymbol(session.currency)}{session.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-default-400">{session.currency}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
