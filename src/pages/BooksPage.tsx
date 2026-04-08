import BooksTab from "@/components/profile/BooksTab";

const BooksPage = () => (
  <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Intellectual Foundation</h1>
      <p className="text-muted-foreground">
        A curated record of academic literature and business frameworks that define your professional expertise and continuous learning.
      </p>
    </div>
    
    <div className="bg-card rounded-lg border shadow-sm p-1">
      <BooksTab />
    </div>
  </div>
);

export default BooksPage;