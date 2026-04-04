import { Button } from "@/components/ui/button";
import { Download, Chrome, Globe, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const browsers = [
  { name: "Google Chrome", icon: Chrome, supported: true },
  { name: "Microsoft Edge", icon: Globe, supported: true },
  { name: "Brave Browser", icon: Shield, supported: true },
  { name: "Arc Browser", icon: Globe, supported: true },
  { name: "Opera", icon: Globe, supported: true },
];

const handleDownload = () => {
  fetch("/jobsdfy-extension.zip")
    .then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "jobsdfy-extension.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
};

const ExtensionDownload = () => {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/app/settings">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Browser Extension</h1>
          <p className="text-sm text-muted-foreground mt-1">Send jobs to JobsDFY with one click from any job board.</p>
        </div>
      </div>

      {/* Download Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Download className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-xl font-semibold text-foreground">JobsDFY Browser Extension</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Adds a floating "Send to JobsDFY" button on LinkedIn, Indeed, and any job page.
          One click extracts the job and opens it in your dashboard.
        </p>
        <Button size="lg" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download Extension (.zip)
        </Button>
      </div>

      {/* Supported Browsers */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-heading text-base font-semibold text-foreground">Supported Browsers</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {browsers.map((b) => (
            <div key={b.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <b.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{b.name}</span>
              <span className="ml-auto text-[10px] bg-verdict-go/10 text-verdict-go rounded-full px-2 py-0.5">Supported</span>
            </div>
          ))}
        </div>
      </div>

      {/* Installation Steps */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-heading text-base font-semibold text-foreground">Installation Steps</h3>
        <ol className="space-y-3">
          {[
            "Download and unzip the extension file above.",
            "Open your browser and navigate to the extensions page:\n• Chrome: chrome://extensions\n• Edge: edge://extensions\n• Brave: brave://extensions",
            "Enable \"Developer Mode\" (toggle in the top-right corner).",
            "Click \"Load unpacked\" and select the unzipped folder.",
            "The JobsDFY button will appear on LinkedIn and Indeed job pages.",
            "Click the extension popup icon to set your app URL (this preview URL or your custom domain).",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default ExtensionDownload;
