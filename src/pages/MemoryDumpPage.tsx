import MemoryDumpTab from "@/components/profile/MemoryDumpTab";

const MemoryDumpPage = () => (
  <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Brain Dump & Context</h1>
      <p className="text-muted-foreground">
        A raw repository of ideas, frameworks, and personal reflections used to provide deep context for AI-driven career matching.
      </p>
    </div>
    
    <div className="bg-card rounded-lg border shadow-sm p-1">
      <MemoryDumpTab />
    </div>
  </div>
);

export default MemoryDumpPage;