import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, GraduationCap, Award, MessageSquare, Users, FileText } from "lucide-react";
import AboutMeTab from "@/components/profile/AboutMeTab";
import WorkHistoryTab from "@/components/profile/WorkHistoryTab";
import EducationTab from "@/components/profile/EducationTab";
import ReferencesTab from "@/components/profile/ReferencesTab";
import AchievementsTab from "@/components/profile/AchievementsTab";
import InterviewPracticeTab from "@/components/profile/InterviewPracticeTab";
import CVVersionsTab from "@/components/profile/CVVersionsTab";

const Profile = () => {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Build your professional profile, manage your CV, and practice for interviews.</p>
      </div>

      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="about" className="gap-1.5"><User className="h-4 w-4" />About Me</TabsTrigger>
          <TabsTrigger value="work" className="gap-1.5"><Briefcase className="h-4 w-4" />Work History</TabsTrigger>
          <TabsTrigger value="education" className="gap-1.5"><GraduationCap className="h-4 w-4" />Education</TabsTrigger>
          <TabsTrigger value="cvversions" className="gap-1.5"><FileText className="h-4 w-4" />CV Versions</TabsTrigger>
          <TabsTrigger value="references" className="gap-1.5"><Users className="h-4 w-4" />References</TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5"><Award className="h-4 w-4" />Achievements</TabsTrigger>
          <TabsTrigger value="interview" className="gap-1.5"><MessageSquare className="h-4 w-4" />Interview Practice</TabsTrigger>
        </TabsList>

        <TabsContent value="about"><AboutMeTab /></TabsContent>
        <TabsContent value="work"><WorkHistoryTab /></TabsContent>
        <TabsContent value="education"><EducationTab /></TabsContent>
        <TabsContent value="cvversions"><CVVersionsTab /></TabsContent>
        <TabsContent value="references"><ReferencesTab /></TabsContent>
        <TabsContent value="achievements"><AchievementsTab /></TabsContent>
        <TabsContent value="interview"><InterviewPracticeTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
