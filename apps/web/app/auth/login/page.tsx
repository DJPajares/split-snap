'use client';

import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Input,
  Button,
  Divider,
  Link,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useApiError } from '@/hooks/useApiError';
import { APP } from '@split-snap/shared/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { handleError } = useApiError();

  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const getPostAuthRedirect = (): string => {
    const pendingCode = localStorage.getItem('pending_session_code');
    if (pendingCode) {
      // Restore guest participantId if it was preserved before login redirect
      const pendingParticipantId = localStorage.getItem(
        'pending_participant_id',
      );
      if (pendingParticipantId) {
        // Save the guest participantId separately so it can be restored on logout
        localStorage.setItem(
          `guest_participant_${pendingCode}`,
          pendingParticipantId,
        );
        localStorage.removeItem('pending_participant_id');
      }
      // Clear logged-in participant so join page doesn't short-circuit to session
      localStorage.removeItem(`participant_${pendingCode}`);
      // Note: Don't remove pending_session_code here — it's consumed by the join page
      // to auto-join after redirect
      return `/join/${pendingCode}`;
    }
    return '/dashboard';
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      addToast({ title: 'Welcome back!', color: 'success' });
      router.push(getPostAuthRedirect());
    } catch (err) {
      handleError(err, 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) return;
    setLoading(true);
    try {
      await register(email, password, name);
      addToast({ title: 'Account created!', color: 'success' });
      router.push(getPostAuthRedirect());
    } catch (err) {
      handleError(err, 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 pt-8">
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-bold">{`Welcome to ${APP.NAME}`}</h1>
          <p className="text-default-500 text-center text-sm">
            Sign in to save your sessions and access them later.
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="px-6 pb-8">
          <Tabs
            selectedKey={tab}
            onSelectionChange={(key) => setTab(key as string)}
            fullWidth
            className="mb-4"
          >
            <Tab key="login" title="Log In">
              <div className="mt-4 flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onValueChange={setEmail}
                />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onValueChange={setPassword}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  endContent={
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  }
                />
                <Button
                  color="primary"
                  size="lg"
                  className="font-semibold"
                  onPress={handleLogin}
                  isLoading={loading}
                  isDisabled={!email || !password}
                >
                  Log In
                </Button>
              </div>
            </Tab>
            <Tab key="register" title="Sign Up">
              <div className="mt-4 flex flex-col gap-4">
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={name}
                  onValueChange={setName}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onValueChange={setEmail}
                />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onValueChange={setPassword}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  endContent={
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  }
                />
                <Button
                  color="primary"
                  size="lg"
                  className="font-semibold"
                  onPress={handleRegister}
                  isLoading={loading}
                  isDisabled={!email || !password || !name}
                >
                  Create Account
                </Button>
              </div>
            </Tab>
          </Tabs>

          <p className="text-default-400 mt-4 text-center text-xs">
            You don&apos;t need an account to join sessions.{' '}
            <Link href="/" size="sm">
              Go back
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
