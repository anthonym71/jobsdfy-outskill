import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Handshake } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-8 sm:py-10">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-4">
        {/* Brand & Address */}
        <div className="space-y-3">
          <span className="font-heading text-sm font-bold text-foreground">JobsDFY</span>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              FFLIPI Holding LLC<br />
              12345 Lake City Way NE #2068<br />
              Seattle, WA 98125
            </span>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <span className="text-sm font-semibold text-foreground">Contact</span>
          <div className="space-y-2 text-xs text-muted-foreground">
            <a href="tel:+13857876364" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone className="h-3.5 w-3.5 shrink-0" /> +1 (385) 787-6364
            </a>
            <a href="mailto:support@jobsdfy.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5 shrink-0" /> support@jobsdfy.com
            </a>
            <a href="mailto:info@jobsdfy.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5 shrink-0" /> info@jobsdfy.com
            </a>
          </div>
        </div>

        {/* Legal */}
        <div className="space-y-3">
          <span className="text-sm font-semibold text-foreground">Legal</span>
          <div className="space-y-2 text-xs text-muted-foreground">
            <a href="http://fflipi.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="http://fflipi.com/terms-of-service-fflipi" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>

        {/* Affiliate */}
        <div className="space-y-3">
          <span className="text-sm font-semibold text-foreground">Partner</span>
          <div className="space-y-2 text-xs text-muted-foreground">
            <Link to="/affiliate-terms" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Handshake className="h-3.5 w-3.5 shrink-0" /> Become an Affiliate
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FFLIPI Holding LLC. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
