'use client';

import { Link } from '@heroui/react';
import { IconMenu2 } from '@tabler/icons-react';
import { ReactNode, useEffect, useState } from 'react';

import { cn } from '@/lib/utils'; // or your cn utility

import Sidebar from './Sidebar';

export type MenuItemsProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
};

export type BrandProps = {
  name: string;
  logo?: React.ReactNode;
  href?: string;
};

type NavbarProps = {
  brand: BrandProps;
  items: MenuItemsProps[];
  rightContent?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'static' | 'sticky' | 'fixed' | 'hide-on-scroll';
};

const maxWidthClasses = {
  sm: 'max-w-[640px]',
  md: 'max-w-[768px]',
  lg: 'max-w-[1024px]',
  xl: 'max-w-[1280px]',
  '2xl': 'max-w-[1536px]',
  full: 'max-w-full',
};

function useScrollDirection() {
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHidden(currentScrollY > lastScrollY && currentScrollY > 64);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  return isHidden;
}

export function Navbar({
  brand,
  items,
  rightContent,
  className,
  maxWidth = 'lg',
  position = 'hide-on-scroll',
}: NavbarProps) {
  const isHidden = useScrollDirection();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          'bg-background/70 z-40 w-full backdrop-blur-lg transition-transform duration-300',
          position === 'sticky' && 'sticky top-0',
          position === 'fixed' && 'fixed top-0',
          position === 'hide-on-scroll' &&
            isHidden &&
            'sticky top-0 -translate-y-full',
          className,
        )}
      >
        <header
          className={cn(
            'flex h-16 items-center justify-between px-6',
            maxWidth !== 'full' && maxWidthClasses[maxWidth],
            'mx-auto',
          )}
        >
          {/* Left side (brand and menu button) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
              aria-expanded={isSidebarOpen}
              className="cursor-pointer"
            >
              <span className="sr-only">Menu</span>
              <IconMenu2 size={24} />
            </button>

            <div className="sm:hidden">
              <Link
                href={brand.href || '/'}
                className="flex items-center gap-2 no-underline"
              >
                {brand.logo && <>{brand.logo}</>}
                <p className="font-bold">{brand.name}</p>
              </Link>
            </div>
          </div>

          {/* Header title */}
          <div className="hidden sm:flex">{brand.name}</div>

          {/* Right side (user avatar, etc.) */}
          {rightContent && (
            <div className="flex items-center gap-4">{rightContent}</div>
          )}
        </header>
      </nav>

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        menuItems={items}
      />
    </>
  );
}
