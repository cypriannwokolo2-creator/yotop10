import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
            <Link href="/submit" className="hover:text-foreground transition-colors">Submit</Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} YoTop10. Open platform for top 10 lists.
          </p>
        </div>
      </div>
    </footer>
  );
}
