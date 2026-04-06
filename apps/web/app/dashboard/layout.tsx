export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="mx-auto max-w-5xl p-4 sm:p-8">{children}</section>;
}
