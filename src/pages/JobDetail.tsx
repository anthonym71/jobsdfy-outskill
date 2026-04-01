import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VerdictBadge from "@/components/VerdictBadge";
import StatusPill from "@/components/StatusPill";

const JobDetail = () => {
  const { id } = useParams();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Senior Frontend Engineer</h1>
          <p className="text-sm text-muted-foreground">Acme Corp · Berlin, Germany</p>
        </div>
        <div className="flex items-center gap-2">
          <VerdictBadge verdict="stop" />
          <StatusPill status="new" />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dealbreakers">Dealbreakers</TabsTrigger>
          <TabsTrigger value="fit">Fit</TabsTrigger>
          <TabsTrigger value="pack">Application Pack</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Title:</span> <span className="font-medium text-foreground ml-2">Senior Frontend Engineer</span></div>
              <div><span className="text-muted-foreground">Company:</span> <span className="font-medium text-foreground ml-2">Acme Corp</span></div>
              <div><span className="text-muted-foreground">Location:</span> <span className="font-medium text-foreground ml-2">Berlin, Germany</span></div>
              <div><span className="text-muted-foreground">Salary:</span> <span className="font-medium text-foreground ml-2">€45,000 – €55,000</span></div>
              <div><span className="text-muted-foreground">Work Model:</span> <span className="font-medium text-foreground ml-2">Hybrid</span></div>
              <div><span className="text-muted-foreground">Employment:</span> <span className="font-medium text-foreground ml-2">Full-time</span></div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">We're looking for a Senior Frontend Engineer to lead our design system and help scale our web platform…</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dealbreakers" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Dealbreaker analysis will appear here after running the check.
          </div>
        </TabsContent>

        <TabsContent value="fit" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Fit analysis will appear here after the dealbreaker check.
          </div>
        </TabsContent>

        <TabsContent value="pack" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Application pack will appear here after generating one.
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Activity timeline will appear here as you interact with this job.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobDetail;
