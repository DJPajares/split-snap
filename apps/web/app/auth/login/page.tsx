'use client';

import {
  Button,
  Card,
  CardHeader,
  Description,
  FieldError,
  Fieldset,
  Form,
  Input,
  InputGroup,
  Label,
  Link,
  Separator,
  Tabs,
  TextField,
  toast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { APP, STORAGE_KEYS } from '@split-snap/shared/constants';
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
    const pendingCode = localStorage.getItem(
      STORAGE_KEYS.KEY_PENDING_SESSION_CODE,
    );
    if (pendingCode) {
      // Restore guest participantId if it was preserved before login redirect
      const pendingParticipantId = localStorage.getItem(
        STORAGE_KEYS.KEY_PENDING_PARTICIPANT_ID,
      );
      if (pendingParticipantId) {
        // Save the guest participantId separately so it can be restored on logout
        localStorage.setItem(
          `${STORAGE_KEYS.KEY_GUEST_PARTICIPANT_PREFIX}${pendingCode}`,
          pendingParticipantId,
        );
        localStorage.removeItem(STORAGE_KEYS.KEY_PENDING_PARTICIPANT_ID);
      }
      // Clear logged-in participant so join page doesn't short-circuit to session
      localStorage.removeItem(
        `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${pendingCode}`,
      );
      // Note: Don't remove STORAGE_KEYS.KEY_PENDING_SESSION_CODE here — it's consumed by the join page
      // to auto-join after redirect
      return `/join/${pendingCode}`;
    }
    return '/dashboard';
  };

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
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
      toast.success('Account created!');
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
        <CardHeader className="items-center gap-2 text-center">
          <Image
            src="/logo.png"
            alt={`${APP.NAME} logo`}
            width={36}
            height={36}
            priority
          />
          <h3 className="title-section">{`Welcome to ${APP.NAME}`}</h3>
          <Card.Description>
            Sign in to save your sessions and access them later
          </Card.Description>
        </CardHeader>

        <Separator />

        <Card.Content>
          <Tabs
            className="w-full"
            selectedKey={tab}
            onSelectionChange={(key) => setTab(key as string)}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="authentication">
                <Tabs.Tab id="login">
                  Log In
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="register">
                  Sign Up
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="login">
              <Form onSubmit={loginForm.handleSubmit(handleLogin)}>
                <Fieldset>
                  <Fieldset.Group>
                    <Controller
                      name="email"
                      control={loginForm.control}
                      render={({ field }) => (
                        <TextField type="email">
                          <Label>Email</Label>
                          <Input
                            variant="secondary"
                            placeholder="you@example.com"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                          <FieldError />
                        </TextField>
                      )}
                    />
                    <Controller
                      name="password"
                      control={loginForm.control}
                      render={({ field }) => (
                        <TextField
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                        >
                          <Label>Password</Label>
                          <InputGroup variant="secondary">
                            <InputGroup.Input
                              placeholder="Enter your password"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                            <InputGroup.Suffix>
                              <button
                                aria-label="toggle password visibility"
                                className="outline-transparent focus:outline-solid"
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                              >
                                {showPassword ? <IconEyeOff /> : <IconEye />}
                              </button>
                            </InputGroup.Suffix>
                          </InputGroup>
                          <FieldError />
                        </TextField>
                      )}
                    />
                  </Fieldset.Group>
                  <Fieldset.Actions>
                    <Button
                      type="submit"
                      size="lg"
                      className="font-semibold"
                      isPending={loading}
                      isDisabled={!loginForm.formState.isValid}
                      fullWidth
                    >
                      Log In
                    </Button>
                  </Fieldset.Actions>
                </Fieldset>
              </Form>
            </Tabs.Panel>
            <Tabs.Panel id="register">
              <Form onSubmit={registerForm.handleSubmit(handleRegister)}>
                <Fieldset>
                  <Fieldset.Group>
                    <Controller
                      name="name"
                      control={registerForm.control}
                      render={({ field }) => (
                        <TextField type="text">
                          <Label>Name</Label>
                          <Input
                            variant="secondary"
                            placeholder="Your name"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                          <FieldError />
                        </TextField>
                      )}
                    />
                    <Controller
                      name="email"
                      control={registerForm.control}
                      render={({ field }) => (
                        <TextField type="email">
                          <Label>Email</Label>
                          <Input
                            variant="secondary"
                            placeholder="you@example.com"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                          <FieldError />
                        </TextField>
                      )}
                    />
                    <Controller
                      name="password"
                      control={registerForm.control}
                      render={({ field }) => (
                        <TextField type={showPassword ? 'text' : 'password'}>
                          <Label>Password</Label>
                          <InputGroup variant="secondary">
                            <InputGroup.Input
                              placeholder="Enter your password"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                            <InputGroup.Suffix>
                              <button
                                aria-label="toggle password visibility"
                                className="outline-transparent focus:outline-solid"
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                              >
                                {showPassword ? <IconEyeOff /> : <IconEye />}
                              </button>
                            </InputGroup.Suffix>
                          </InputGroup>
                          <FieldError />
                        </TextField>
                      )}
                    />
                    <Controller
                      name="confirmPassword"
                      control={registerForm.control}
                      render={({ field }) => (
                        <TextField
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                        >
                          <Label>Confirm Password</Label>
                          <InputGroup variant="secondary">
                            <InputGroup.Input
                              placeholder="Enter your password"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                            <InputGroup.Suffix>
                              <button
                                aria-label="toggle password visibility"
                                className="outline-transparent focus:outline-solid"
                                type="button"
                                onClick={() =>
                                  setShowConfirmPassword((prev) => !prev)
                                }
                              >
                                {showConfirmPassword ? (
                                  <IconEyeOff />
                                ) : (
                                  <IconEye />
                                )}
                              </button>
                            </InputGroup.Suffix>
                          </InputGroup>
                          <FieldError />
                        </TextField>
                      )}
                    />
                  </Fieldset.Group>
                  <Fieldset.Actions>
                    <Button
                      type="submit"
                      size="lg"
                      className="font-semibold"
                      isPending={loading}
                      isDisabled={!registerForm.formState.isValid}
                      fullWidth
                    >
                      Create Account
                    </Button>
                  </Fieldset.Actions>
                </Fieldset>
              </Form>
            </Tabs.Panel>
          </Tabs>

          <Description className="text-center">
            {`You don't need an account to join sessions. `}
            <Link href="/" className="text-xs font-semibold">
              Go back
            </Link>
          </Description>
        </Card.Content>
      </Card>
    </div>
  );
}
