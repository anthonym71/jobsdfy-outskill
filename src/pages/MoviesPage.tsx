import MoviesTab from "@/components/profile/MoviesTab";

const MoviesPage = () => (
  <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Character & Media Insights</h1>
      <p className="text-muted-foreground">
        Analysis of media consumption to map professional temperament, soft skills, and cultural alignment.
      </p>
    </div>
    
    <div className="bg-card rounded-lg border shadow-sm p-1">
      <MoviesTab />
    </div>
  </div>
);

export default MoviesPage;