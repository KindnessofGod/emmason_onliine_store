import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "./icons";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import type { Category } from "@/lib/types";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/site";

export function Footer({
  locale,
  dict,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
}) {
  const company = [
    { label: dict.footer.aboutUs, path: "/about" },
    { label: dict.footer.sellWithUs, path: "/sell" },
    { label: dict.nav.contact, path: "/contact" },
  ];

  const support = [
    { label: dict.footer.deliveryInfo, path: "/delivery" },
    { label: dict.footer.returns, path: "/returns" },
    { label: dict.footer.faq, path: "/faq" },
  ];

  const socials = [
    { label: "TikTok", url: site.socials.tiktok.url, Icon: TikTokIcon },
    { label: "Facebook", url: site.socials.facebook.url, Icon: FacebookIcon },
    { label: "Instagram", url: site.socials.instagram.url, Icon: InstagramIcon },
    { label: "WhatsApp", url: whatsappLink(), Icon: WhatsAppIcon },
  ];

  return (
    <footer className="mt-20 bg-ink-900 text-ink-200">
      <div className="border-b border-white/10">
        <div className="container-page flex flex-col items-start gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <h2 className="text-xl font-bold text-white">{dict.footer.newsletterTitle}</h2>
            <p className="mt-1.5 text-sm text-ink-300">{dict.footer.newsletterBody}</p>
          </div>
          <NewsletterForm
            placeholder={dict.footer.newsletterPlaceholder}
            cta={dict.footer.newsletterCta}
            thanks={dict.footer.newsletterThanks}
            invalid={dict.checkout.invalidEmail}
          />
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-300">
            {dict.footer.tagline} {dict.home.trustGuarantee}.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {socials.map(({ label, url, Icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded-lg bg-white/10 p-2.5 text-white transition hover:bg-brand-500"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        <nav aria-labelledby="footer-shop">
          <h3 id="footer-shop" className="text-sm font-bold text-white">
            {dict.footer.shopHeading}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link
                  href={href(locale, `/category/${category.slug}`)}
                  className="text-ink-300 transition hover:text-brand-300"
                >
                  {category.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h3 id="footer-company" className="text-sm font-bold text-white">
            {dict.footer.companyHeading}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {company.map((link) => (
              <li key={link.path}>
                <Link
                  href={href(locale, link.path)}
                  className="text-ink-300 transition hover:text-brand-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-bold text-white">{dict.footer.supportHeading}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {support.map((link) => (
              <li key={link.path}>
                <Link
                  href={href(locale, link.path)}
                  className="text-ink-300 transition hover:text-brand-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-bold text-white">{dict.footer.contactHeading}</h3>
          <ul className="mt-4 space-y-3.5 text-sm">
            <li className="flex gap-2.5">
              <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span className="text-ink-300">
                {site.address.line1}
                <br />
                {site.address.line2}
                <br />
                {site.address.city}, {site.address.state}
              </span>
            </li>
            {site.phones.map((phone) => (
              <li key={phone} className="flex gap-2.5">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="text-ink-300 transition hover:text-brand-300"
                >
                  {phone}
                </a>
              </li>
            ))}
            <li className="flex gap-2.5">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <a
                href={`mailto:${site.email}`}
                className="text-ink-300 transition hover:text-brand-300"
              >
                {site.email}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs text-ink-400">
            {dict.footer.walkIn} · {dict.footer.hours}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.legalName}. {dict.footer.rights}
          </p>
          <div className="flex gap-5">
            <Link href={href(locale, "/privacy")} className="transition hover:text-brand-300">
              {dict.footer.privacy}
            </Link>
            <Link href={href(locale, "/terms")} className="transition hover:text-brand-300">
              {dict.footer.termsLink}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
