import { APP } from '@split-snap/shared/constants';

import { TypographyMuted } from '../shared/Typography';

export function Footer() {
  return (
    <footer className="border-divider border-t py-6">
      <div className="mx-auto px-4 text-center">
        <TypographyMuted>
          &copy;{new Date().getFullYear()}{' '}
          {`${APP.NAME}. Split bills, not friendships.`}
        </TypographyMuted>
      </div>
    </footer>
  );
}
