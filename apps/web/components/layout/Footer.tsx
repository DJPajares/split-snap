import { APP } from '@split-snap/shared/constants';

export function Footer() {
  return (
    <footer className="border-divider border-t py-6">
      <div className="mx-auto px-4 text-center">
        <p className="text-description">
          &copy;{new Date().getFullYear()}{' '}
          {`${APP.NAME}. Split bills, not friendships.`}
        </p>
      </div>
    </footer>
  );
}
