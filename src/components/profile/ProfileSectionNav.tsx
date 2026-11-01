import { Link } from "react-router-dom";
import { User, Briefcase, GraduationCap, TrendingUp, FileText, BookOpen, Users, Award, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PROFILE_SECTIONS = [
  { value: "about", label: "About Me", icon: User },
  { value: "work", label: "Work History", icon: Briefcase },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "timeline", label: "Timeline", icon: TrendingUp },
  { value: "cvversions", label: "CV Versions", icon: FileText },
  { value: "courses", label: "Courses", icon: BookOpen },
  { value: "references", label: "References", icon: Users },
  { value: "achievements", label: "Achievements", icon: Award },
  { value: "knowledgebase", label: "Knowledgebase", icon: Database },
];

export default function ProfileSectionNav() {
  return <section className="space-y-4">
    <h1 className="font-heading text-2xl font-bold text-foreground">My Profile</h1>
    <nav aria-label="My Profile sections" className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
      {PROFILE_SECTIONS.map(({ value, label, icon: Icon }) => <Button key={value} asChild variant="ghost" size="sm" className="gap-1.5"><Link to={`/app/profile?tab=${value}`}><Icon className="h-4 w-4" />{label}</Link></Button>)}
    </nav>
  </section>;
}