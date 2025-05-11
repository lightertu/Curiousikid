'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayback } from '@/app/playback-context';
import { LayoutGrid, Brain, LogIn, User } from 'lucide-react';

export function SideBar() {
  let sidebarRef = useRef<HTMLDivElement>(null);
  let resizeHandleRef = useRef<HTMLDivElement>(null);
  let pathname = usePathname();
  let { setActivePanel } = usePlayback();

  const [width, setWidth] = useState(224);
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);

  // Calculate dynamic sizes for nav items based on sidebar width
  const navItemSizes = useMemo(() => {
    const baseWidth = 224; // Corresponds to initial width
    const scaleFactor = width / baseWidth;

    // Define base sizes
    const baseFontSizeRem = 1.4; // text-sm (14px)
    const baseIconSizePx = 20;    // size-5 (20px)

    // Calculate scaled sizes with min/max limits
    const fontSize = Math.max(0.75, Math.min(1.15, baseFontSizeRem * scaleFactor)); // Min ~12px, Max ~18.4px
    const iconSize = Math.max(16, Math.min(28, baseIconSizePx * scaleFactor));    // Min 16px, Max 28px

    // Calculate padding based on icon size to maintain balance
    const padding = Math.max(8, Math.min(16, 12 * scaleFactor)); // Base p-3 (12px)

    return {
      fontSize: `${fontSize}rem`,
      iconSize: `${iconSize}px`,
      padding: `${padding}px`,
    };
  }, [width]);

  useEffect(() => {
    const MIN_WIDTH = 180;
    const MAX_WIDTH = 400;

    const handleMouseDown = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      setIsResizing(true);
      setInitialMouseX(e.clientX);
      setInitialWidth(sidebarRef.current.offsetWidth);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - initialMouseX;
      const newWidth = initialWidth + deltaX;
      const constrainedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const currentResizeHandle = resizeHandleRef.current;
    if (currentResizeHandle) {
      currentResizeHandle.addEventListener('mousedown', handleMouseDown);
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }

    return () => {
      if (currentResizeHandle) {
        currentResizeHandle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, initialMouseX, initialWidth]);

  const navItems = [
    { href: '/', label: 'All Podcasts', icon: LayoutGrid },
    { href: '/learnings', label: 'My Learnings', icon: Brain },
  ];

  return (
    <div
      ref={sidebarRef}
      className="relative hidden md:block bg-[#181818] h-[100dvh] overflow-y-auto overflow-x-hidden shrink-0"
      style={{ width: `${width}px` }}
      onClick={() => setActivePanel('sidebar')}
    >
      <div
        ref={resizeHandleRef}
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize group z-10"
      >
        <div className="w-[3px] h-10 bg-gray-600 rounded-full absolute top-1/2 -translate-y-1/2 right-[calc(50%-1.5px)] group-hover:bg-blue-400 transition-colors" />
      </div>

      <div className="flex flex-col min-h-full pb-[72px]">
        <nav className="p-4 space-y-2" style={{ paddingTop: navItemSizes.padding, paddingBottom: navItemSizes.padding }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg text-gray-200 hover:bg-[#2A2A2A] transition-colors duration-150 w-full ${isActive ? 'bg-[#3A3A3A] font-semibold' : ''
                  }`}
                style={{
                  fontSize: navItemSizes.fontSize,
                  padding: navItemSizes.padding,
                }}
              >
                <Icon
                  className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`}
                  style={{
                    width: navItemSizes.iconSize,
                    height: navItemSizes.iconSize,
                    marginRight: `calc(${navItemSizes.iconSize} * 0.4)` // Maintain proportional margin
                  }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 pb-4">
          <Link
            href="/login"
            className="flex items-center justify-center w-full bg-[#4169E1] hover:bg-[#365AC7] text-white rounded-full transition-colors duration-200"
            style={{
              fontSize: navItemSizes.fontSize,
              padding: navItemSizes.padding,
            }}
          >
            <User
              className="text-white"
              style={{
                width: navItemSizes.iconSize,
                height: navItemSizes.iconSize,
                marginRight: `calc(${navItemSizes.iconSize} * 0.4)`
              }}
            />
            <span>Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
