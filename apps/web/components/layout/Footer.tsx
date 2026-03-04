import { APP } from '@split-snap/shared';

export function Footer() {
  return (
    <footer className="border-divider mt-auto border-t py-6">
      <div className="text-default-400 mx-auto max-w-7xl px-4 text-center text-sm">
        <p>
          &copy;{new Date().getFullYear()}{' '}
          {`${APP.NAME}. Split bills, not friendships.`}
        </p>
      </div>
    </footer>
  );
}
