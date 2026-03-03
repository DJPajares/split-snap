import { APP } from '@split-snap/shared';

export function Footer() {
  return (
    <footer className="border-t border-divider py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-default-400">
        <p>
          &copy;{new Date().getFullYear()} {`${APP.NAME}. Split bills, not friendships.`}
        </p>
      </div>
    </footer>
  );
}
