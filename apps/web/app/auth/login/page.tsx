"use client";

import { useState } from "react";
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
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useApiError } from "@/hooks/useApiError";
import { APP } from "@split-snap/shared";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { handleError } = useApiError();

  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      addToast({ title: "Welcome back!", color: "success" });
      router.push("/dashboard");
    } catch (err) {
      handleError(err, "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) return;
    setLoading(true);
    try {
      await register(email, password, name);
      addToast({ title: "Account created!", color: "success" });
      router.push("/dashboard");
    } catch (err) {
      handleError(err, "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 pt-8">
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-bold">{`Welcome to ${APP.NAME}`}</h1>
          <p className="text-default-500 text-sm text-center">
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
              <div className="flex flex-col gap-4 mt-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onValueChange={setEmail}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onValueChange={setPassword}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
              <div className="flex flex-col gap-4 mt-4">
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
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onValueChange={setPassword}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
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

          <p className="text-xs text-default-400 text-center mt-4">
            You don&apos;t need an account to join sessions.{" "}
            <Link href="/" size="sm">
              Go back
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
