"use client";

import { useState, use } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  addToast,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);

  // Check if already joined
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`participant_${code}`);
    if (stored) {
      router.push(`/session/${code}`);
      return null;
    }
  }

  const handleJoin = async () => {
    if (!name.trim()) return;
    setJoining(true);

    try {
      const result = await api.sessions.join(code, {
        displayName: name.trim(),
      });

      // Store participant ID
      localStorage.setItem(`participant_${code}`, result.participantId);

      addToast({ title: `Welcome, ${name.trim()}!`, color: "success" });
      router.push(`/session/${code}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to join session";
      addToast({ title: "Error", description: message, color: "danger" });
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 pt-8">
          <span className="text-5xl">👋</span>
          <h1 className="text-2xl font-bold">Join Session</h1>
          <p className="text-default-500 text-center">
            Enter your name to start claiming your items
          </p>
          <div className="font-mono text-lg tracking-widest font-bold text-primary">
            {code.toUpperCase()}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 pb-8 px-6">
          <Input
            label="Your Name"
            placeholder="e.g. Alex"
            value={name}
            onValueChange={setName}
            size="lg"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <Button
            color="primary"
            size="lg"
            className="font-semibold"
            onPress={handleJoin}
            isLoading={joining}
            isDisabled={!name.trim()}
          >
            Join & Start Picking
          </Button>
          <p className="text-xs text-default-400 text-center">
            No account needed — just pick a name.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
