import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CVUploadParser from "@/components/profile/CVUploadParser";
export default function OnboardingCVUpload({ onParsed }: { onParsed: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="outline" onClick={() => setOpen(true)}><Upload className="h-4 w-4 mr-1" />Upload CV / details</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>Upload your CV</DialogTitle></DialogHeader>
      <CVUploadParser onImportComplete={() => {}} onReviewComplete={data => { onParsed(data); setOpen(false); }} />
    </DialogContent></Dialog>
  </>;
}