import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { Breadcrumbs } from "@/components/ui";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).nav.contact };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const socials = [
    { label: "TikTok", handle: site.socials.tiktok.handle, url: site.socials.tiktok.url, Icon: TikTokIcon },
    {
      label: "Facebook",
      handle: site.socials.facebook.handle,
      url: site.socials.facebook.url,
      Icon: FacebookIcon,
    },
    {
      label: "Instagram",
      handle: site.socials.instagram.handle,
      url: site.socials.instagram.url,
      Icon: InstagramIcon,
    },
  ];

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[{ label: dict.nav.home, href: href(locale) }, { label: dict.nav.contact }]}
      />

      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
        {dict.nav.contact}
      </h1>
      <p className="mt-2 max-w-xl text-ink-500">{dict.home.storeBody}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-ink-100 bg-white p-7 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink-900">{dict.footer.walkIn}</h2>
          <address className="mt-4 flex gap-3 not-italic">
            <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <span className="text-sm leading-relaxed text-ink-600">
              <strong className="font-bold text-ink-900">{site.address.line1}</strong>
              <br />
              {site.address.line2}
              <br />
              {site.address.city}, {site.address.state}, {site.address.country}
              <br />
              <span className="text-ink-400">{dict.footer.hours}</span>
            </span>
          </address>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(
              `${site.address.line1}, ${site.address.line2}, ${site.address.city}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {dict.home.storeCta}
          </a>
        </section>

        <section className="rounded-card border border-ink-100 bg-white p-7 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink-900">{dict.footer.contactHeading}</h2>
          <ul className="mt-4 space-y-3">
            {site.phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <PhoneIcon className="h-5 w-5 text-brand-600" />
                  {phone}
                </a>
              </li>
            ))}
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <WhatsAppIcon className="h-5 w-5 text-brand-600" />
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <MailIcon className="h-5 w-5 text-brand-600" />
                {site.email}
              </a>
            </li>
          </ul>
        </section>

        <section className="rounded-card border border-ink-100 bg-white p-7 shadow-soft lg:col-span-2">
          <h2 className="text-lg font-extrabold text-ink-900">{dict.footer.followUs}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {socials.map(({ label, handle, url, Icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-4 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <Icon className="h-6 w-6 shrink-0 text-brand-600" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink-900">{label}</span>
                  <span className="block truncate text-xs text-ink-500">{handle}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
