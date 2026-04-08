import SocialPostsTab from "@/components/profile/SocialPostsTab";

const SocialMediaPage = () => (
  <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Thought Leadership</h1>
      <p className="text-muted-foreground">
        Track your industry contributions, content strategy, and social engagement to showcase your professional influence.
      </p>
    </div>
    
    <div className="bg-card rounded-lg border shadow-sm p-1">
      <SocialPostsTab />
    </div>
  </div>
);

export default SocialMediaPage;