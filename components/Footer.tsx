import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-secondary/50 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-text mb-4 text-sm">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-text-light hover:text-primary text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-text-light hover:text-primary text-sm transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-text-light hover:text-primary text-sm transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4 text-sm">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/advice" className="text-text-light hover:text-primary text-sm transition-colors">
                  Advice
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-text-light hover:text-primary text-sm transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-light hover:text-primary text-sm transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4 text-sm">For Therapists</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/therapists" className="text-text-light hover:text-primary text-sm transition-colors">
                  Join Us
                </Link>
              </li>
              <li>
                <Link href="/therapists/login" className="text-text-light hover:text-primary text-sm transition-colors">
                  Therapist Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4 text-sm">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-text-light hover:text-primary text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-light hover:text-primary text-sm transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-secondary/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-lighter text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} TherapyPlatform. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social media icons would go here */}
            <span className="text-text-lighter text-xs">256-bit SSL SECURE</span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-text-lighter text-xs">
            If you are in a crisis or any other person may be in danger - don&apos;t use this site. 
            <Link href="/crisis-resources" className="text-primary hover:underline ml-1">
              These resources can provide you with immediate help.
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

