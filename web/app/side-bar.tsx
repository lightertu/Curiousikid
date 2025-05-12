'use client';

import { useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayback } from '@/app/playback-context';
import { LayoutGrid, Brain, User, PanelLeftClose, PanelRight, LibraryIcon } from 'lucide-react';
import { useSidebar } from './sidebar-context';

export function SideBar() {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { setActivePanel } = usePlayback();

  const {
    sidebarWidth,
    isCollapsed,
    toggleCollapse,
  } = useSidebar();

  const iconSize = "30px";
  const navItemStyling = useMemo(() => {
    if (isCollapsed) {
      return {
        fontSize: '0rem',
        iconSize: iconSize,
        padding: '12px',
        showLabel: false,
        iconMarginRight: '0px',
        navContainerPaddingX: 'px-3',
        navContainerPaddingY: 'py-2',
        navItemsSpaceY: 'space-y-2',
      };
    } else {
      return {
        fontSize: '1.05rem',
        iconSize: iconSize,
        padding: '12px',
        showLabel: true,
        iconMarginRight: '8px',
        navContainerPaddingX: 'px-4',
        navContainerPaddingY: 'py-4',
        navItemsSpaceY: 'space-y-2',
      };
    }
  }, [isCollapsed]);

  const navItems = [
    { href: '/', label: 'All Podcasts', icon: LayoutGrid },
    { href: '/learnings', label: 'My Learnings', icon: Brain },
  ];

  return (
    <div
      ref={sidebarRef}
      className="fixed top-0 left-0 md:block bg-[#181818] h-[100dvh] overflow-y-auto overflow-x-hidden shrink-0"
      style={{ width: `${sidebarWidth}px` }}
      onClick={() => setActivePanel('sidebar')}
    >
      <div className={`flex flex-col min-h-full ${isCollapsed ? 'items-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between'} p-4 h-[60px]`}>
          {!isCollapsed && <span className="font-semibold text-lg flex items-center"><LibraryIcon className="mr-2 h-6 w-6" />Library</span>}
          <button
            onClick={toggleCollapse}
            className={`p-1.5 hover:bg-[#2A2A2A] rounded-md text-gray-300 hover:text-white ${isCollapsed ? 'm-auto' : ''}`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelRight size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <nav className={`${navItemStyling.navContainerPaddingX} ${navItemStyling.navContainerPaddingY} ${navItemStyling.navItemsSpaceY} flex-grow`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-lg text-gray-200 hover:bg-[#2A2A2A] transition-colors duration-150 w-full ${isActive ? 'bg-[#3A3A3A] font-semibold' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                style={{
                  fontSize: navItemStyling.fontSize,
                  padding: navItemStyling.padding,
                }}
              >
                <Icon
                  className={`${isActive && !isCollapsed ? 'text-white' : 'text-gray-400'} ${isActive && isCollapsed ? 'text-white' : ''}`}
                  style={{
                    width: navItemStyling.iconSize,
                    height: navItemStyling.iconSize,
                    marginRight: navItemStyling.showLabel ? navItemStyling.iconMarginRight : '0px',
                  }}
                />
                {navItemStyling.showLabel && item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
