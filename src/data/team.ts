import jessPhoto from "../assets/profile.jpg";
import frederickPhoto from "../assets/team/frederick-castro.jpg";
import kiiyoPhoto from "../assets/team/kiiyo-de-leon.jpg";
import michaelaPhoto from "../assets/team/michaela-libut.jpg";
import ricaPhoto from "../assets/team/rica-tuvillara.jpg";

export type TeamMember = {
  id: string;
  name: string;
  /** The member's real position in the band's leadership structure. */
  role: string;
  image?: string;
  imageAlt?: string;
};

/**
 * The public roster is intentionally static for launch. It keeps the team page
 * accurate without adding CMS image-upload and member-management work, and the
 * card component can accept CMS data later without a redesign.
 *
 * Order is meaningful: president first, then the officers, then the section
 * principal. Do not add invented titles here — use the position the member
 * actually holds.
 */
export const teamMembers: TeamMember[] = [
  {
    id: "jess-andrey-sundiang",
    name: "Jess Andrey Sundiang",
    role: "President",
    image: jessPhoto,
    imageAlt: "Portrait of Jess Andrey Sundiang",
  },
  {
    id: "michaela-angela-libut",
    name: "Michaela Angela Libut",
    role: "Secretary",
    image: michaelaPhoto,
    imageAlt: "Portrait of Michaela Angela Libut",
  },
  {
    id: "rica-loraine-tuvillara",
    name: "Rica Loraine Tuvillara",
    role: "Treasurer",
    image: ricaPhoto,
    imageAlt: "Portrait of Rica Loraine Tuvillara",
  },
  {
    id: "frederick-charles-castro",
    name: "Frederick Charles Castro",
    role: "Librarian",
    image: frederickPhoto,
    imageAlt: "Portrait of Frederick Charles Castro",
  },
  {
    id: "kiiyo-de-leon",
    name: "Kiiyo De Leon",
    role: "Section Principal",
    image: kiiyoPhoto,
    imageAlt: "Portrait of Kiiyo De Leon",
  },
];
