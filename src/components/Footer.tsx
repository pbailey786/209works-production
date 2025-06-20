import { motion } from '@/components/ui/card';
import { Button } from './ui/button';

  MapPin,
  Mail,
  Phone,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Heart,
  ArrowUp,
  Sparkles,
  Briefcase,
  Users,
  Building2,
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'For Job Seekers',
      icon: Users,
      links: [
        { name: 'Find Jobs', href: '/jobs' },
        { name: 'AI Job Search', href: '/jobs?ai=true' },
        { name: 'Resume Builder', href: '/tools/resume-ai' },
        { name: 'Cover Letter AI', href: '/tools/coverletter-ai' },
      ],
    },
    {
      title: 'For Employers',
      icon: Building2,
      links: [
        { name: 'Post a Job', href: '/employers/create-job-post' },
        { name: 'Local Business Signup', href: '/signup/local-business' },
        { name: 'Chamber Partnership', href: '/signup/chamber-partner' },
        { name: 'Employer Dashboard', href: '/employers/dashboard' },
        { name: 'Pricing Plans', href: '/employers/pricing' },
        { name: 'Bulk Upload', href: '/employers/bulk-upload' },
        { name: 'Contact Support', href: '/contact' },
      ],
    },
    {
      title: 'Company',
      icon: Briefcase,
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Testimonials', href: '/testimonials' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/209works', icon: Twitter },
    { name: 'Facebook', href: 'https://facebook.com/209works', icon: Facebook },
    {
      name: 'Instagram',
      href: 'https://instagram.com/209works',
      icon: Instagram,
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/209works',
      icon: Linkedin,
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-[#2d4a3e] text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-[#9fdf9f] via-[#ff6b35] to-[#2d4a3e]"></div>
        <div
          className="absolute left-0 top-0 h-full w-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-[#9fdf9f]/10 blur-xl"></div>
      <div className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-[#ff6b35]/10 blur-xl"></div>

      <div className="relative">
        {/* Main Footer Content */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Link
                  href="/"
                  className="group mb-6 flex items-center space-x-3"
                >
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d3a2e] shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                      <span className="text-base font-bold text-[#9fdf9f]">
                        209
                      </span>
                    </div>
                    <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-[#ff6b35]"></div>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-[#9fdf9f]">
                      209 Works
                    </span>
                    <p className="-mt-1 text-xs text-gray-400">
                      Your Local Job Platform
                    </p>
                  </div>
                </Link>

                <p className="mb-6 leading-relaxed text-gray-300">
                  Connecting Central Valley talent with local opportunities.
                  <strong>100% local focus</strong> - no remote jobs from Utah
                  or San Francisco.
                </p>

                {/* Contact Info */}
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>Central Valley, California</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a
                      href="mailto:hello@209.works"
                      className="transition-colors hover:text-emerald-400"
                    >
                      hello@209.works
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a
                      href="tel:+1-209-555-0123"
                      className="transition-colors hover:text-emerald-400"
                    >
                      (209) 555-0123
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-[#9fdf9f]" />
                    <h3 className="text-lg font-semibold text-white">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {section.links.map(link => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-sm text-gray-300 transition-colors duration-200 hover:text-[#9fdf9f]"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              {/* Copyright */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 text-sm text-gray-400"
              >
                <span>© {currentYear} 209 Works. Made with</span>
                <Heart className="h-4 w-4 fill-current text-[#ff6b35]" />
                <span>in the Central Valley</span>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex items-center gap-4"
              >
                {socialLinks.map(social => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#1d3a2e] p-2 text-gray-400 transition-all duration-200 hover:scale-105 hover:bg-[#0d2a1e] hover:text-[#9fdf9f]"
                      aria-label={`Follow us on ${social.name}`}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </motion.div>

              {/* Back to Top */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scrollToTop}
                  className="border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800 hover:text-white"
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Back to Top
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="border-t border-gray-800 bg-gray-950/50">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#9fdf9f]"></div>
                <span>100% Local Focus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#ff6b35]"></div>
                <span>209 Area Only</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#9fdf9f]"></div>
                <span>AI-Enhanced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#ff6b35]"></div>
                <span>SSL Secured</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
