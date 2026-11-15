export type InstrumentFamilyId = "woodwinds" | "brass" | "strings" | "percussion";

export type Instrument = {
  id: string;
  name: string;
  family: InstrumentFamilyId;
  /** A CSS background that matches the photograph, so cut-outs look seamless. */
  mat: string;
  image: string;
  alt: string;
  description: string;
  level: string;
};

export const instrumentFamilies: {
  id: InstrumentFamilyId;
  name: string;
  blurb: string;
}[] = [
  {
    id: "woodwinds",
    name: "Woodwinds",
    blurb: "Breath, reed, and silver keys — the singing heart of the band.",
  },
  {
    id: "brass",
    name: "Brass",
    blurb: "Golden bells and brave fanfares that carry across the plaza.",
  },
  {
    id: "strings",
    name: "Strings",
    blurb: "Bowed, plucked, and resonant colours that soften and lift the sound.",
  },
  {
    id: "percussion",
    name: "Percussion",
    blurb: "The pulse, the sparkle, and the thunder at the back of the band.",
  },
];

export const instruments: Instrument[] = [
  {
    id: "flute",
    name: "Flute",
    family: "woodwinds",
    mat: "#070706",
    image: "flute.webp",
    alt: "A silver flute photographed against a dark background",
    description: "Bright, agile, and often the first melody you hear in a concert.",
    level: "Beginner-friendly",
  },
  {
    id: "piccolo",
    name: "Piccolo",
    family: "woodwinds",
    mat: "#ffffff",
    image: "piccolo.webp",
    alt: "A silver piccolo on a white background",
    description:
      "The flute's brilliant high cousin, with a sound that can carry over the whole band.",
    level: "Intermediate",
  },
  {
    id: "clarinet",
    name: "Clarinet",
    family: "woodwinds",
    mat: "linear-gradient(135deg, #ccb08e 0%, #c1c1b1 100%)",
    image: "clarinet.webp",
    alt: "A wooden clarinet with silver keys on a warm grey background",
    description: "Warm and woody, at home in classical, folk, and marching music.",
    level: "Beginner-friendly",
  },
  {
    id: "oboe",
    name: "Oboe",
    family: "woodwinds",
    mat: "#ffffff",
    image: "oboe.webp",
    alt: "An oboe with its double reed on a white background",
    description: "A plaintive, singing tone with a double reed that rewards patient practice.",
    level: "Intermediate",
  },
  {
    id: "saxophone",
    name: "Saxophone",
    family: "woodwinds",
    mat: "linear-gradient(135deg, #131217 0%, #1a1e2a 55%, #212b3e 100%)",
    image: "saxophone.webp",
    alt: "A gold saxophone glowing against a deep blue background",
    description: "A smooth, expressive voice that moves easily between concert band and jazz.",
    level: "Beginner-friendly",
  },
  {
    id: "trumpet",
    name: "Trumpet",
    family: "brass",
    mat: "linear-gradient(135deg, #b5b2ac 0%, #a89b89 100%)",
    image: "trumpet.webp",
    alt: "A brass trumpet and cornet on a soft grey background",
    description: "Golden and bold — the instrument that announces the start of the show.",
    level: "Beginner-friendly",
  },
  {
    id: "horn",
    name: "Horn",
    family: "brass",
    mat: "#ffffff",
    image: "horn.webp",
    alt: "A French horn with coiled brass tubing on a white background",
    description: "A mellow, noble sound that connects the brass and woodwind sections.",
    level: "Intermediate",
  },
  {
    id: "trombone",
    name: "Trombone",
    family: "brass",
    mat: "linear-gradient(145deg, #efe4d2 0%, #d8c3a4 100%)",
    image: "trombone.webp",
    alt: "A brass trombone with its slide extended",
    description: "Rich, theatrical, and unmistakable, with a slide that can glide or punctuate.",
    level: "Beginner-friendly",
  },
  {
    id: "violin",
    name: "Violin",
    family: "strings",
    mat: "#070707",
    image: "violin.webp",
    alt: "A varnished violin against a black background",
    description: "A versatile, singing string voice that can lead a melody or add a shimmer.",
    level: "Beginner-friendly",
  },
  {
    id: "cello",
    name: "Cello",
    family: "strings",
    mat: "#040404",
    image: "cello.webp",
    alt: "A cello standing against a black background",
    description: "Deep, warm, and expressive — the cello gives the band its low string anchor.",
    level: "Beginner-friendly",
  },
  {
    id: "harp",
    name: "Harp",
    family: "strings",
    mat: "linear-gradient(160deg, #d9a76f 0%, #9d7854 55%, #6e5c4d 100%)",
    image: "harp.webp",
    alt: "A concert harp and stool in warm golden light",
    description:
      "A rare, sparkling colour that turns an ordinary concert into something memorable.",
    level: "Intermediate",
  },
  {
    id: "drum-set",
    name: "Drum Set",
    family: "percussion",
    mat: "#ffffff",
    image: "drum-set.webp",
    alt: "A full drum set with cymbals on a white background",
    description: "The pulse of the band, driving rhythm and energy from the back of the stage.",
    level: "Beginner-friendly",
  },
  {
    id: "timpani",
    name: "Timpani",
    family: "percussion",
    mat: "#ffffff",
    image: "timpani.webp",
    alt: "A copper timpani drum with wooden mallets",
    description: "Deep, thunderous drums that add drama and power to the biggest moments.",
    level: "Intermediate",
  },
  {
    id: "glockenspiel",
    name: "Glockenspiel",
    family: "percussion",
    mat: "#ffffff",
    image: "glockenspiel.webp",
    alt: "A glockenspiel with metal bars and mallets",
    description: "Bright, bell-like notes that sparkle above the rest of the band.",
    level: "Beginner-friendly",
  },
  {
    id: "chimes",
    name: "Chimes",
    family: "percussion",
    mat: "#ffffff",
    image: "chimes.webp",
    alt: "A set of tubular chimes on a wooden stand",
    description: "A resonant, ceremonial sound that rings out and lingers in the hall.",
    level: "Beginner-friendly",
  },
  {
    id: "cymbals",
    name: "Cymbals",
    family: "percussion",
    mat: "#232323",
    image: "cymbals.webp",
    alt: "A pair of bronze cymbals against a dark background",
    description: "A brilliant crash or a soft shimmer — cymbals add colour and climax.",
    level: "Beginner-friendly",
  },
  {
    id: "triangle",
    name: "Triangle",
    family: "percussion",
    mat: "#ffffff",
    image: "triangle.webp",
    alt: "A metal triangle with its striker on a white background",
    description: "Small but precise, with a clear, pure ring that cuts through the hall.",
    level: "Beginner-friendly",
  },
];

const imageModules = import.meta.glob("../assets/instruments/*.{webp,png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Resolve a filename from the data above to Vite's hashed asset URL. */
export function instrumentImage(filename: string): string {
  return imageModules[`../assets/instruments/${filename}`] ?? "";
}

export function instrumentsForFamily(family: InstrumentFamilyId): Instrument[] {
  return instruments.filter((instrument) => instrument.family === family);
}
