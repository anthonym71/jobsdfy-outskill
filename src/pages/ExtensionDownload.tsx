import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Chrome, Globe, Shield, ArrowLeft, Smartphone, Bookmark, Share2, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const browsers = [
  { name: "Google Chrome", icon: Chrome, supported: true },
  { name: "Microsoft Edge", icon: Globe, supported: true },
  { name: "Brave Browser", icon: Shield, supported: true },
  { name: "Arc Browser", icon: Globe, supported: true },
  { name: "Opera", icon: Globe, supported: true },
];

const BOOKMARKLET_CODE = `javascript:void(function(){var t=document.body.innerText.slice(0,15000),u=new URL('https://www.jobsdfy.com/app/new-job');u.searchParams.set('source','bookmarklet');u.searchParams.set('text',t);u.searchParams.set('url',window.location.href);u.searchParams.set('title',document.title);window.open(u.toString(),'_blank')})()`;

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
  const [copied, setCopied] = useState(false);

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/app/settings">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Browser Extension & Mobile</h1>
          <p className="text-sm text-muted-foreground mt-1">Send jobs to JobsDFY with one click from any device.</p>
        </div>
      </div>

      <Tabs defaultValue="desktop">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="desktop" className="gap-1.5"><Chrome className="h-3.5 w-3.5" /> Desktop Extension</TabsTrigger>
          <TabsTrigger value="mobile" className="gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Mobile</TabsTrigger>
        </TabsList>

        {/* Desktop Extension */}
        <TabsContent value="desktop" className="space-y-6 mt-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Download className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground">JobsDFY Browser Extension</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Adds a floating "Send to JobsDFY" button on LinkedIn, Indeed, and any job page.
              One click extracts the job and opens it in your dashboard. <strong className="text-foreground">Pre-configured — no setup needed.</strong>
            </p>
            <Button size="lg" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download Extension (.zip)
            </Button>
          </div>

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

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-heading text-base font-semibold text-foreground">Installation Steps</h3>
            <ol className="space-y-3">
              {[
                "Download and unzip the extension file above.",
                "Open your browser and navigate to the extensions page:\n• Chrome: chrome://extensions\n• Edge: edge://extensions\n• Brave: brave://extensions",
                "Enable \"Developer Mode\" (toggle in the top-right corner).",
                "Click \"Load unpacked\" and select the unzipped folder.",
                "The JobsDFY button will appear on LinkedIn and Indeed job pages. You can also click the extension icon on any page to send it.",
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
        </TabsContent>

        {/* Mobile */}
        <TabsContent value="mobile" className="space-y-6 mt-6">
          {/* Share target (PWA) */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
               <h3 className="font-heading text-base font-semibold text-foreground">Option 1: Install & Share (Recommended)</h3>
                <p className="text-xs text-muted-foreground">Works with LinkedIn, Indeed & any app — iPhone & Android</p>
              </div>
            </div>
            <ol className="space-y-3">
              {[
                "Open www.jobsdfy.com in your mobile browser (Chrome or Safari).",
                "Install the app:\n• iPhone: Tap the Share icon → \"Add to Home Screen\"\n• Android: Tap the browser menu → \"Install app\" or \"Add to Home Screen\"",
                "Open the LinkedIn app (or any job site), find a job you like.",
                "Tap Share → choose \"JobsDFY\" from the share menu.\nThe job is automatically sent and extracted!",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{step}</p>
                </li>
              ))}
            </ol>
            <div className="rounded-lg bg-accent/50 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">💡 Works with LinkedIn App!</span>{" "}
                When you share from the LinkedIn mobile app, it sends the job URL directly to JobsDFY. This also works with Indeed, Glassdoor, and any app with a Share button.
              </p>
            </div>
          </div>

          {/* Bookmarklet */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-foreground">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">Option 2: Bookmarklet (Fallback)</h3>
                <p className="text-xs text-muted-foreground">Works on any mobile browser without installing</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Copy this code and save it as a bookmark:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-foreground bg-background rounded px-2 py-1.5 overflow-x-auto whitespace-nowrap border border-border">
                  {BOOKMARKLET_CODE}
                </code>
                <Button variant="outline" size="sm" onClick={copyBookmarklet} className="shrink-0 gap-1">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <ol className="space-y-3">
              {[
                "Copy the code above.",
                "Create a new bookmark in your browser (bookmark any page first).",
                "Edit the bookmark — replace the URL with the copied code. Name it \"Send to JobsDFY\".",
                "Navigate to a job posting, then tap the bookmark. It will extract the page and open JobsDFY.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExtensionDownload;
