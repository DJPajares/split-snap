'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Button,
  Link,
  ButtonGroup,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useApiError } from '@/hooks/useApiError';
import type { Session } from '@split-snap/shared';
import { api } from '@/lib/api';
import { getCurrencySymbol } from '@split-snap/shared';

type RoleFilter = 'all' | 'host' | 'participant';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const { handleError } = useApiError();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Fetch user's sessions (all roles)
  useEffect(() => {
    if (user) {
      api.sessions
        .list()
        .then(setSessions)
        .catch((err) => handleError(err, 'Failed to load sessions'))
        .finally(() => setLoadingSessions(false));
    }
  }, [user]);

  const filteredSessions = useMemo(() => {
    if (roleFilter === 'all') return sessions;
    return sessions.filter((s) => s.role === roleFilter);
  }, [sessions, roleFilter]);

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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

      {/* Filter chips */}
      <div className="mb-6">
        <ButtonGroup variant="flat" size="sm">
          <Button
            color={roleFilter === 'all' ? 'primary' : 'default'}
            onPress={() => setRoleFilter('all')}
          >
            All ({sessions.length})
          </Button>
          <Button
            color={roleFilter === 'host' ? 'primary' : 'default'}
            onPress={() => setRoleFilter('host')}
          >
            Hosted ({sessions.filter((s) => s.role === 'host').length})
          </Button>
          <Button
            color={roleFilter === 'participant' ? 'primary' : 'default'}
            onPress={() => setRoleFilter('participant')}
          >
            Joined ({sessions.filter((s) => s.role === 'participant').length})
          </Button>
        </ButtonGroup>
      </div>

      {loadingSessions ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center gap-4 py-16">
            <span className="text-5xl">📋</span>
            <p className="text-lg font-semibold">
              {roleFilter === 'all'
                ? 'No sessions yet'
                : roleFilter === 'host'
                  ? 'No hosted sessions'
                  : 'No joined sessions'}
            </p>
            <p className="text-default-500 max-w-sm text-center">
              {roleFilter === 'all'
                ? 'Start by scanning a receipt or entering items manually. Your sessions will appear here.'
                : roleFilter === 'host'
                  ? 'Sessions you create will appear here.'
                  : 'Sessions you join will appear here.'}
            </p>
            {roleFilter === 'all' && (
              <Button as={Link} href="/scan" color="primary" variant="flat">
                Create Your First Split
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              isPressable
              onPress={() => router.push(`/session/${session.code}`)}
              className="w-full"
            >
              <CardBody className="flex flex-row items-center justify-between gap-4 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{session.code}</span>
                    <Chip
                      size="sm"
                      color={session.role === 'host' ? 'warning' : 'primary'}
                      variant="flat"
                    >
                      {session.role === 'host' ? 'Host' : 'Participant'}
                    </Chip>
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
                  <p className="text-default-500 text-sm">
                    {session.items.length} item
                    {session.items.length !== 1 ? 's' : ''} ·{' '}
                    {session.participants.length} participant
                    {session.participants.length !== 1 ? 's' : ''} ·{' '}
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    {getCurrencySymbol(session.currency)}
                    {session.total.toFixed(2)}
                  </p>
                  <p className="text-default-400 text-xs">{session.currency}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
