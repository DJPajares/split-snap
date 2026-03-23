'use client';

import {
  Button,
  ButtonGroup,
  Card,
  Chip,
  IconPlus,
  Spinner,
} from '@heroui/react';
import { formatCurrency } from '@split-snap/shared/currency';
import type { Session } from '@split-snap/shared/types';
import { IconClipboardText } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useApiError } from '@/hooks/useApiError';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

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
  }, [user, handleError]);

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
    <div className="mx-auto flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="title-section">Welcome, {user.name}</h3>
          <p className="text-description-lg">
            Manage your bill-splitting sessions
          </p>
        </div>
        <Button className="font-semibold" onPress={() => router.push('/scan')}>
          <IconPlus />
          New Split
        </Button>
      </div>

      {/* Filter chips */}
      <div>
        <ButtonGroup variant="tertiary" size="sm">
          <Button
            variant={roleFilter === 'all' ? 'primary' : 'secondary'}
            onPress={() => setRoleFilter('all')}
          >
            All ({sessions.length})
          </Button>
          <Button
            variant={roleFilter === 'host' ? 'primary' : 'secondary'}
            onPress={() => setRoleFilter('host')}
          >
            Hosted ({sessions.filter((s) => s.role === 'host').length})
          </Button>
          <Button
            variant={roleFilter === 'participant' ? 'primary' : 'secondary'}
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
          <Card.Content className="flex flex-col items-center justify-center gap-4 py-16">
            <IconClipboardText size={48} className="text-default" />
            <h5 className="title-subsection">
              {roleFilter === 'all'
                ? 'No sessions yet'
                : roleFilter === 'host'
                  ? 'No hosted sessions'
                  : 'No joined sessions'}
            </h5>
            <p className="text-description text-center">
              {roleFilter === 'all'
                ? 'Start by scanning a receipt or entering items manually. Your sessions will appear here.'
                : roleFilter === 'host'
                  ? 'Sessions you create will appear here.'
                  : 'Sessions you join will appear here.'}
            </p>
            {(roleFilter === 'all' || roleFilter === 'host') && (
              <Button variant="tertiary" onPress={() => router.push('/scan')}>
                Create Your First Split
              </Button>
            )}
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="w-full">
              <button
                type="button"
                className="cursor-pointer"
                onClick={() => router.push(`/session/${session.code}`)}
              >
                <Card.Content className="flex flex-row items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h5 className="title-subsection">{session.code}</h5>
                      <Chip
                        size="sm"
                        color={session.role === 'host' ? 'warning' : 'default'}
                        variant="tertiary"
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
                        variant="tertiary"
                      >
                        {session.status}
                      </Chip>
                    </div>
                    <p className="text-description">
                      {session.items.length} item
                      {session.items.length !== 1 ? 's' : ''} ·{' '}
                      {session.participants.length} participant
                      {session.participants.length !== 1 ? 's' : ''} ·{' '}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <h5 className="title-subsection">
                      {formatCurrency({
                        value: session.total,
                        currency: session.currency,
                        decimal: 2,
                      })}
                    </h5>
                    <p className="text-description">{session.currency}</p>
                  </div>
                </Card.Content>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
