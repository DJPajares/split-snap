export function Footer() {
  return (
    <footer className="border-t border-divider py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-default-400">
        <p>
          &copy; {new Date().getFullYear()} Split Snap. Split bills, not friendships.
        </p>
      </div>
    </footer>
  );
}
