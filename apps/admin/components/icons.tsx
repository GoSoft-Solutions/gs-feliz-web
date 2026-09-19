/**
 * Shared icon set for the admin — zero-dependency inline SVGs (matches the
 * approach already used across the app before this file existed; see e.g.
 * the old per-page EditIcon/TrashIcon duplicates this replaces).
 *
 * All icons share the same visual language: 1.75px stroke, currentColor,
 * rounded caps/joins, 18px default size. Pass `size`/`className` to fit
 * each use (nav item, button, badge...).
 */
import type { SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

function Svg({ size = 18, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// --- Navigation sections ---------------------------------------------------
export const IconDashboard = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Svg>
);
export const IconContacts = (p: IconProps) => (
  <Svg {...p}><path d="M17 21a5 5 0 0 0-10 0" /><circle cx="12" cy="10" r="4" /><path d="M21 21a7 7 0 0 0-3.4-6" /><path d="M3 21a7 7 0 0 1 3.4-6" /></Svg>
);
export const IconCampaigns = (p: IconProps) => (
  <Svg {...p}><path d="M3 11v2a2 2 0 0 0 2 2h1l4 5v-6" /><path d="M6 11h3l7-5v12l-7-5" /><path d="M18 9a3 3 0 0 1 0 6" /></Svg>
);
export const IconNewsletter = (p: IconProps) => (
  <Svg {...p}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="m3 6.5 9 6 9-6" /></Svg>
);
export const IconContent = (p: IconProps) => (
  <Svg {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H14l4 4v13.5a.5.5 0 0 1-.5.5H6.5A2.5 2.5 0 0 1 4 18.5Z" /><path d="M13.5 3v4a1 1 0 0 0 1 1h4" /><path d="M8 13h8M8 17h5" /></Svg>
);
export const IconMemberships = (p: IconProps) => (
  <Svg {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6 15h4" /></Svg>
);
export const IconCourses = (p: IconProps) => (
  <Svg {...p}><path d="M2 8 12 3l10 5-10 5-10-5Z" /><path d="M6 10.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5" /><path d="M22 8v7" /></Svg>
);
export const IconAnalytics = (p: IconProps) => (
  <Svg {...p}><path d="M4 20V10" /><path d="M11 20V4" /><path d="M18 20v-7" /><path d="M2 20h20" /></Svg>
);
export const IconPermissions = (p: IconProps) => (
  <Svg {...p}><path d="M12 3 4.5 6v6c0 4.5 3.2 7.4 7.5 9 4.3-1.6 7.5-4.5 7.5-9V6Z" /><path d="m9.5 12 1.8 1.8L15 10" /></Svg>
);

// --- Actions & chrome --------------------------------------------------------
export const IconLogout = (p: IconProps) => (
  <Svg {...p}><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Svg>
);
export const IconMenu = (p: IconProps) => (
  <Svg {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Svg>
);
export const IconClose = (p: IconProps) => (
  <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>
);
export const IconPlus = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const IconEdit = (p: IconProps) => (
  <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></Svg>
);
export const IconTrash = (p: IconProps) => (
  <Svg {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></Svg>
);
export const IconEye = (p: IconProps) => (
  <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const IconEyeOff = (p: IconProps) => (
  <Svg {...p}><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a17.5 17.5 0 0 1-2.29 3.36M6.6 6.6C3.9 8.36 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.4-1.6" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="M2 2l20 20" /></Svg>
);
export const IconMail = (p: IconProps) => (
  <Svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Svg>
);
export const IconLink = (p: IconProps) => (
  <Svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Svg>
);
export const IconUnlink = (p: IconProps) => (
  <Svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /><path d="M3 3l18 18" /></Svg>
);
export const IconCopy = (p: IconProps) => (
  <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Svg>
);
export const IconCheck = (p: IconProps) => (
  <Svg {...p}><path d="m5 12 4 4L19 6" /></Svg>
);
export const IconHistory = (p: IconProps) => (
  <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></Svg>
);
export const IconChevron = (p: IconProps & { direction?: 'down' | 'up' }) => {
  const { direction = 'down', ...rest } = p;
  return <Svg {...rest}><path d={direction === 'up' ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} /></Svg>;
};
export const IconSave = (p: IconProps) => (
  <Svg {...p}><path d="M5 4h12l2 2v14H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></Svg>
);
export const IconUser = (p: IconProps) => (
  <Svg {...p}><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></Svg>
);
export const IconSearch = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>
);
export const IconTrendingUp = (p: IconProps) => (
  <Svg {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></Svg>
);
export const IconSend = (p: IconProps) => (
  <Svg {...p}><path d="m22 2-11 11" /><path d="M22 2 15 22l-4-9-9-4Z" /></Svg>
);
export const IconPause = (p: IconProps) => (
  <Svg {...p}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></Svg>
);
export const IconPlay = (p: IconProps) => (
  <Svg {...p}><path d="M7 4.5v15l13-7.5Z" strokeLinejoin="round" /></Svg>
);

// --- Rich-text editor toolbar -----------------------------------------------
export const IconUndo = (p: IconProps) => (
  <Svg {...p}><path d="M3 10h10a5 5 0 0 1 0 10H8" /><path d="m7 5-4 5 4 5" /></Svg>
);
export const IconRedo = (p: IconProps) => (
  <Svg {...p}><path d="M21 10H11a5 5 0 0 0 0 10h5" /><path d="m17 5 4 5-4 5" /></Svg>
);
export const IconStrikethrough = (p: IconProps) => (
  <Svg {...p}><path d="M6 12h12" /><path d="M8 6.5C8.5 5 10 4 12 4c2.5 0 4.5 1.3 4.5 3.2 0 1.2-.7 2-1.8 2.6" /><path d="M8.7 15.5c-.3.9-.1 1.8.6 2.6.9 1 2.3 1.4 3.7 1.4 2.2 0 4-1.1 4-2.9 0-.8-.3-1.4-.8-1.9" /></Svg>
);
export const IconListBullets = (p: IconProps) => (
  <Svg {...p}><circle cx="4.5" cy="6" r="1.25" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.25" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.25" fill="currentColor" stroke="none" /><path d="M9 6h11M9 12h11M9 18h11" /></Svg>
);
export const IconListNumbers = (p: IconProps) => (
  <Svg {...p}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 5.5V9M3.5 5.5H4.5M3.5 9.5h1.5" /><path d="M3.5 13.5h1.8c.5 0 .7.6.3.9l-2 1.8h2.3" /></Svg>
);
export const IconAlignLeft = (p: IconProps) => (
  <Svg {...p}><path d="M4 6h16M4 12h10M4 18h13" /></Svg>
);
export const IconAlignCenter = (p: IconProps) => (
  <Svg {...p}><path d="M4 6h16M7 12h10M5.5 18h13" /></Svg>
);
export const IconAlignRight = (p: IconProps) => (
  <Svg {...p}><path d="M4 6h16M10 12h10M7 18h13" /></Svg>
);
export const IconQuote = (p: IconProps) => (
  <Svg {...p}><path d="M7 7.5C5 8.5 4 10 4 12.5V17h4.5v-4.5H6.2C6.3 11 7 9.8 8.5 9Z" /><path d="M16 7.5c-2 1-3 2.5-3 5V17h4.5v-4.5h-2.3c.1-1.5.8-2.7 2.3-3.5Z" /></Svg>
);
export const IconClearFormat = (p: IconProps) => (
  <Svg {...p}><path d="M5 4h9l-4 16" /><path d="M13 4h6" /><path d="m4 20 16-16" /></Svg>
);
export const IconPalette = (p: IconProps) => (
  <Svg {...p}><path d="M12 3a9 8.5 0 1 0 0 17c1.1 0 2-.85 2-1.9 0-.5-.2-.95-.5-1.28-.3-.33-.5-.78-.5-1.27 0-1.05.9-1.9 2-1.9h1.7c1.8 0 3.3-1.4 3.3-3.15C19.5 6 16.1 3 12 3Z" /><circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="11" cy="7" r="1.1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8" r="1.1" fill="currentColor" stroke="none" /></Svg>
);
export const IconChevronSmall = (p: IconProps) => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
);
