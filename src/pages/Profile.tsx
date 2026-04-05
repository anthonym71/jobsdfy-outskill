import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, GraduationCap, Award, MessageSquare, Users, FileText, Database, TrendingUp, BookOpen, Brain, Crown, Bookmark, Lightbulb, Share2 } from "lucide-react";
import AboutMeTab from "@/components/profile/AboutMeTab";
import WorkHistoryTab from "@/components/profile/WorkHistoryTab";
import EducationTab from "@/components/profile/EducationTab";
import ReferencesTab from "@/components/profile/ReferencesTab";
import AchievementsTab from "@/components/profile/AchievementsTab";
import InterviewPracticeTab from "@/components/profile/InterviewPracticeTab";
import CVVersionsTab from "@/components/profile/CVVersionsTab";
import KnowledgebaseTab from "@/components/profile/KnowledgebaseTab";
import TimelineTab from "@/components/profile/TimelineTab";
import CoursesTab from "@/components/profile/CoursesTab";
import AssessmentsTab from "@/components/profile/AssessmentsTab";
import AutobiographyTab from "@/components/profile/AutobiographyTab";
import BooksTab from "@/components/profile/BooksTab";
import MemoryDumpTab from "@/components/profile/MemoryDumpTab";
import SocialPostsTab from "@/components/profile/SocialPostsTab";

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
          <TabsTrigger value="timeline" className="gap-1.5"><TrendingUp className="h-4 w-4" />Timeline</TabsTrigger>
          <TabsTrigger value="cvversions" className="gap-1.5"><FileText className="h-4 w-4" />CV Versions</TabsTrigger>
          <TabsTrigger value="courses" className="gap-1.5"><BookOpen className="h-4 w-4" />Courses</TabsTrigger>
          <TabsTrigger value="assessments" className="gap-1.5"><Brain className="h-4 w-4" />Assessments</TabsTrigger>
          <TabsTrigger value="references" className="gap-1.5"><Users className="h-4 w-4" />References</TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5"><Award className="h-4 w-4" />Achievements</TabsTrigger>
          <TabsTrigger value="knowledgebase" className="gap-1.5"><Database className="h-4 w-4" />Knowledgebase</TabsTrigger>
          <TabsTrigger value="autobiography" className="gap-1.5"><Crown className="h-4 w-4" />Autobiography</TabsTrigger>
          <TabsTrigger value="books" className="gap-1.5"><Bookmark className="h-4 w-4" />Books</TabsTrigger>
          <TabsTrigger value="memorydump" className="gap-1.5"><Lightbulb className="h-4 w-4" />Memory Dump</TabsTrigger>
          <TabsTrigger value="socialposts" className="gap-1.5"><Share2 className="h-4 w-4" />Social Media</TabsTrigger>
          <TabsTrigger value="interview" className="gap-1.5"><MessageSquare className="h-4 w-4" />Interview Practice</TabsTrigger>
        </TabsList>

        <TabsContent value="about"><AboutMeTab /></TabsContent>
        <TabsContent value="work"><WorkHistoryTab /></TabsContent>
        <TabsContent value="education"><EducationTab /></TabsContent>
        <TabsContent value="timeline"><TimelineTab /></TabsContent>
        <TabsContent value="cvversions"><CVVersionsTab /></TabsContent>
        <TabsContent value="courses"><CoursesTab /></TabsContent>
        <TabsContent value="assessments"><AssessmentsTab /></TabsContent>
        <TabsContent value="references"><ReferencesTab /></TabsContent>
        <TabsContent value="achievements"><AchievementsTab /></TabsContent>
        <TabsContent value="knowledgebase"><KnowledgebaseTab /></TabsContent>
        <TabsContent value="autobiography"><AutobiographyTab /></TabsContent>
        <TabsContent value="books"><BooksTab /></TabsContent>
        <TabsContent value="memorydump"><MemoryDumpTab /></TabsContent>
        <TabsContent value="socialposts"><SocialPostsTab /></TabsContent>
        <TabsContent value="interview"><InterviewPracticeTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
