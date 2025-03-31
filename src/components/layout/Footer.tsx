
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background py-6">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © 2023 SportCritic. All rights reserved.
        </p>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <Link to="/about" className="text-sm text-muted-foreground hover:underline">
            About
          </Link>
          <Link to="/terms" className="text-sm text-muted-foreground hover:underline">
            Terms
          </Link>
          <Link to="/privacy" className="text-sm text-muted-foreground hover:underline">
            Privacy
          </Link>
          <a
            href="https://twitter.com/sportcritic"
            className="text-sm text-muted-foreground hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Twitter
          </a>
          <a
            href="https://instagram.com/sportcritic"
            className="text-sm text-muted-foreground hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
