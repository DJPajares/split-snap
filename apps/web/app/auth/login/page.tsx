'use client';

import {
  addToast,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Link,
  Tab,
  Tabs,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { APP } from '@split-snap/shared/constants';
import {
  type LoginFormData,
  loginSchema,
  type RegisterFormData,
  registerSchema,
} from '@split-snap/shared/schemas';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useApiError } from '@/hooks/useApiError';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { handleError } = useApiError();

  const [tab, setTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

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

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      addToast({ title: 'Welcome back!', color: 'success' });
      router.push(getPostAuthRedirect());
    } catch (err) {
      handleError(err, 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await register(data.email, data.password, data.name);
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
        <CardHeader className="flex flex-col items-center gap-2 pt-8 text-center">
          <Image
            src="/logo.png"
            alt={`${APP.NAME} logo`}
            width={36}
            height={36}
            className="rounded-md"
            priority
          />
          <h2 className="title-section">{`Welcome to ${APP.NAME}`}</h2>
          <p className="text-description">
            Sign in to save your sessions and access them later
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
              <form
                className="mt-4 flex flex-col gap-4"
                onSubmit={loginForm.handleSubmit(handleLogin)}
              >
                <Controller
                  name="email"
                  control={loginForm.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(fieldState.error)}
                      errorMessage={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={loginForm.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(fieldState.error)}
                      errorMessage={fieldState.error?.message}
                      endContent={
                        <button
                          aria-label="toggle password visibility"
                          className="outline-transparent focus:outline-solid"
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                      }
                    />
                  )}
                />
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="font-semibold"
                  isLoading={loading}
                  isDisabled={!loginForm.formState.isValid}
                >
                  Log In
                </Button>
              </form>
            </Tab>
            <Tab key="register" title="Sign Up">
              <form
                className="mt-4 flex flex-col gap-4"
                onSubmit={registerForm.handleSubmit(handleRegister)}
              >
                <Controller
                  name="name"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Name"
                      placeholder="Your name"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(fieldState.error)}
                      errorMessage={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(fieldState.error)}
                      errorMessage={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(fieldState.error)}
                      errorMessage={fieldState.error?.message}
                      endContent={
                        <button
                          aria-label="toggle password visibility"
                          className="outline-transparent focus:outline-solid"
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                      }
                    />
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(fieldState.error)}
                      errorMessage={fieldState.error?.message}
                      endContent={
                        <button
                          aria-label="toggle password visibility"
                          className="outline-transparent focus:outline-solid"
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                        >
                          {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                      }
                    />
                  )}
                />
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="font-semibold"
                  isLoading={loading}
                  isDisabled={!registerForm.formState.isValid}
                >
                  Create Account
                </Button>
              </form>
            </Tab>
          </Tabs>

          <p className="text-description text-center">
            You don&apos;t need an account to join sessions.{' '}
            <Link href="/" size="sm" className="font-semibold">
              Go back
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
