import {
  IconCalendar,
  IconCap,
  IconClock,
  IconHeart,
  IconInstrument,
  IconKey,
  IconMapPin,
  IconMusic,
  IconTicket,
  IconUsers,
} from "../components/Icons";
import type { IconComponent, IconKey as IconKeyType } from "../data/about.types";

/**
 * Maps the string keys stored in the CMS to their React icon components.
 * Unknown or missing keys fall back to the music note rather than crashing.
 */
const iconMap: Record<IconKeyType, IconComponent> = {
  IconCalendar,
  IconCap,
  IconClock,
  IconHeart,
  IconInstrument,
  IconKey,
  IconMapPin,
  IconMusic,
  IconTicket,
  IconUsers,
};

/** Resolve an icon key from the CMS into its React component. */
export function resolveIcon(key?: string | null): IconComponent {
  return iconMap[key as IconKeyType] ?? IconMusic;
}

export default iconMap;
