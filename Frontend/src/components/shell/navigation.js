/**
 * Single source of truth for where things live in the app.
 * The sidebar, the "Find a section" search, page breadcrumbs and the Home page all read this.
 * `hint` is plain language for staff who don't know the programme names yet.
 */
import {
  Home, ClipboardCheck, AlertTriangle, FileBarChart, Users, GraduationCap, HeartPulse, Scale,
  Building2, User, BookOpen, Award, UserMinus, School, Trophy, Book, Stethoscope, Users2, Baby,
  Accessibility, Smile, Activity, Shield, Hand, Pill, Thermometer, Network, Contact2, Gavel, Megaphone,
} from "lucide-react";

export const GENERAL_NAV = [
  { name: "Home", path: "/dashboard", icon: Home, hint: "Today's overview and shortcuts" },
  { name: "Follow-ups", path: "/tracking", icon: ClipboardCheck, hint: "Monthly visits that are due or overdue" },
  { name: "Urgent cases", path: "/tracking/urgent-cases", icon: AlertTriangle, hint: "People who need help first" },
  { name: "Reports", path: "/module-reports", icon: FileBarChart, hint: "Download programme reports" },
];

export const ADMIN_NAV = [{ name: "Users & access", path: "/users", icon: Users, hint: "Add staff and choose what they can do", adminOnly: true }];

export const DOMAINS = [
  {
    key: "education",
    permission: "education",
    name: "Education",
    icon: GraduationCap,
    tone: "education",
    blurb: "Study centres, students, schools and exam support",
    modules: [
      { name: "Study centres", path: "/education/study-centers", icon: Building2, hint: "Centres, their teachers and group leaders" },
      { name: "SC students", path: "/education/sc-students", icon: User, hint: "Children enrolled at study centres" },
      { name: "Teachers", path: "/education/teachers", icon: BookOpen, hint: "Teachers at each centre" },
      { name: "Group leaders", path: "/education/group-leaders", icon: Award, hint: "Community group leaders" },
      { name: "Dropouts", path: "/education/dropouts", icon: UserMinus, hint: "Children who left school" },
      { name: "Schools", path: "/education/schools", icon: School, hint: "Partner and local schools" },
      { name: "Competitive exams", path: "/education/competitive-exams", icon: Trophy, hint: "Students preparing for entrance exams" },
      { name: "Board preparation", path: "/education/board-preparation", icon: Book, hint: "Class 10 and 12 board exam support" },
    ],
  },
  {
    key: "health",
    permission: "health",
    name: "Health",
    icon: HeartPulse,
    tone: "health",
    blurb: "Camps, care for the elderly, mothers, and long-term illness",
    modules: [
      { name: "Health camps", path: "/health/health-camps", icon: Stethoscope, hint: "Camps held and people seen" },
      { name: "Elderly", path: "/health/elderly", icon: Users2, hint: "Older people receiving care" },
      { name: "Mother & child", path: "/health/mother-child", icon: Baby, hint: "Pregnancy and child health" },
      { name: "Persons with disability", path: "/health/pwd", icon: Accessibility, hint: "Disability support and certificates" },
      { name: "Adolescents", path: "/health/adolescents", icon: Smile, hint: "Young people's health and awareness" },
      { name: "Tuberculosis", path: "/health/tuberculosis", icon: Activity, hint: "TB patients and treatment" },
      { name: "HIV", path: "/health/hiv", icon: Shield, hint: "HIV patients and treatment" },
      { name: "Leprosy", path: "/health/leprosy", icon: Hand, hint: "Leprosy patients and care" },
      { name: "Addiction", path: "/health/addiction", icon: Pill, hint: "Substance use and rehabilitation" },
      { name: "Other diseases", path: "/health/other-diseases", icon: Thermometer, hint: "Any other illness being followed" },
    ],
  },
  {
    key: "socialJustice",
    permission: "socialJustice",
    name: "Social justice",
    icon: Scale,
    tone: "social",
    blurb: "Community groups, government schemes and legal help",
    modules: [
      { name: "CBU / CBO groups", path: "/social-justice/cbucbo-details", icon: Network, hint: "Community-based groups and members" },
      { name: "Entitlements", path: "/social-justice/entitlements", icon: Contact2, hint: "ID cards, pensions and schemes" },
      { name: "Legal aid", path: "/social-justice/legal-aid", icon: Gavel, hint: "Legal cases and advice given" },
      { name: "Workshops & awareness", path: "/social-justice/workshops", icon: Megaphone, hint: "Sessions held in the community" },
    ],
  },
];

export const DOMAIN_TONE = {
  education: { text: "text-domain-education", bg: "bg-domain-education", soft: "bg-domain-education/10" },
  health: { text: "text-domain-health", bg: "bg-domain-health", soft: "bg-domain-health/10" },
  social: { text: "text-domain-social", bg: "bg-domain-social", soft: "bg-domain-social/10" },
};

export const canSeeDomain = (user, domain) =>
  !!user && (user.role === "admin" || (user.permissions || []).some((p) => p.startsWith(`${domain.permission}:`)));

/** Everything the user may open, flattened, with its section — for search and breadcrumbs. */
export const flatNav = (user) => [
  ...GENERAL_NAV.map((item) => ({ ...item, section: null })),
  ...DOMAINS.filter((d) => canSeeDomain(user, d)).flatMap((d) => d.modules.map((m) => ({ ...m, section: d }))),
  ...ADMIN_NAV.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => ({ ...item, section: null })),
];

/** Where am I? → { domain, item } for the current path. */
export const locate = (pathname) => {
  for (const d of DOMAINS) {
    const item = d.modules.find((m) => pathname.startsWith(m.path));
    if (item) return { domain: d, item };
  }
  const item = [...GENERAL_NAV, ...ADMIN_NAV].find((m) => pathname === m.path);
  return { domain: null, item: item || null };
};
