"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Button,
  Link,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface SessionSummary {
  id: string;
  code: string;
  status: string;
  total: number;
  itemCount: number;
  participantCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

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

      {/* Placeholder for sessions — would come from an API endpoint */}
      <Card>
        <CardBody className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-5xl">📋</span>
          <p className="text-lg font-semibold">No sessions yet</p>
          <p className="text-default-500 text-center max-w-sm">
            Start by scanning a receipt or entering items manually. Your
            sessions will appear here.
          </p>
          <Button
            as={Link}
            href="/scan"
            color="primary"
            variant="flat"
          >
            Create Your First Split
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
