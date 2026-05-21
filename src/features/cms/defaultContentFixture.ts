import type { CmsContent, LandingPage, PageId, PageSection, SeoFields } from './types';

const nowIso = () => new Date().toISOString();

const section = (
  id: string,
  heading: string,
  body: string,
  options?: Partial<PageSection>
): PageSection => ({
  id,
  heading,
  body,
  ctaLabel: options?.ctaLabel ?? 'Learn more',
  ctaHref: options?.ctaHref ?? '#',
  mediaImage: options?.mediaImage ?? 'https://placehold.co/960x640/png',
  mediaAlt: options?.mediaAlt ?? heading,
  layout: options?.layout ?? 'split',
  theme: {
    background: options?.theme?.background ?? '#f9fafb',
    text: options?.theme?.text ?? '#111827',
    accent: options?.theme?.accent ?? '#0f766e'
  }
});

const seo = (slug: string, title: string, description: string, keywords: string[] = []): SeoFields => ({
  metaTitle: title,
  metaDescription: description,
  slug,
  canonical: '',
  socialImage: 'https://placehold.co/1200x630/png',
  noIndex: false,
  keywords
});

const page = (
  id: PageId,
  title: string,
  navLabel: string,
  description: string,
  sections: PageSection[],
  options?: {
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  }
): LandingPage => ({
  id,
  title,
  navLabel,
  published: true,
  seo: seo(
    options?.slug ?? (id === 'home' ? '' : id),
    options?.metaTitle ?? `${title} | Example Studio`,
    options?.metaDescription ?? description,
    options?.keywords ?? []
  ),
  sections,
  updatedAt: nowIso()
});

const category = (name: string, slug: string, description: string) => ({
  id: `category-${slug}`,
  name,
  slug,
  description,
  createdAt: nowIso(),
  updatedAt: nowIso()
});

const mediaAsset = (
  id: string,
  title: string,
  url: string,
  altText: string,
  mimeType = 'image/png'
) => ({
  id,
  title,
  url,
  altText,
  mimeType,
  width: 1200,
  height: 630,
  sizeBytes: null,
  storageProvider: 'external-url',
  storageKey: null,
  createdAt: nowIso(),
  updatedAt: nowIso()
});

export function buildDefaultContent(): CmsContent {
  const home = page(
    'home',
    'Faster Tech. Smarter Work. Scaled Results.',
    'Home',
    'Premium engineering-focused digital agency for high-performance infrastructure.',
    [],
    {
      metaTitle: 'Example Studio | Web Development, Custom Software, and Business Automation',
      metaDescription:
        'Example Studio helps businesses scale with high-performance websites, custom software, ecommerce systems, and mobile apps.',
      keywords: [
        'web development agency',
        'custom software development',
        'business automation',
        'mobile app development',
        'ecommerce development',
        'digital agency indonesia'
      ]
    }
  );
  home.homeBlocks = [
    {
      id: 'home-hero',
      type: 'hero',
      enabled: true,
      theme: 'light',
      badge: 'Premium Digital Consultancy',
      titlePrimary: 'Faster Tech. Smarter Work.',
      titleAccent: 'Scaled Results.',
      description:
        'Example Studio builds the high-performance digital tools your business deserves. We specialize in lightning-fast websites and custom software that automates your unique workflows, giving you the elite-level tech you need at SME-friendly rates.',
      primaryCtaLabel: 'Get a free strategy call',
      primaryCtaHref: '/contact',
      primaryCtaStyle: 'primary',
      secondaryCtaLabel: 'Explore our shop',
      secondaryCtaHref: '/shop',
      secondaryCtaStyle: 'secondary'
    },
    {
      id: 'home-values',
      type: 'value_triplet',
      enabled: true,
      theme: 'light',
      items: [
        {
          id: 'value-speed',
          icon: 'bolt',
          title: 'Speed',
          text: 'Lightning-fast performance that keeps your customers engaged and improves your search rankings.'
        },
        {
          id: 'value-simplicity',
          icon: 'check_circle',
          title: 'Simplicity',
          text: 'Complex technical problems solved with elegant, easy-to-use interfaces that your team will love.'
        },
        {
          id: 'value-value',
          icon: 'savings',
          title: 'Value',
          text: 'Professional-grade solutions optimized for smart investment, without enterprise pricing.'
        }
      ]
    },
    {
      id: 'home-solutions',
      type: 'solutions_grid',
      enabled: true,
      theme: 'mist',
      heading: 'Our Solutions',
      subheading:
        'Engineered solutions for modern business infrastructure. We build for performance, scale, and uncompromising quality.',
      items: [
        {
          id: 'solution-01',
          number: '01',
          title: 'Professional Business Website',
          text: 'Clean, fast-loading digital authority. We architect modern websites built to convert and scale.',
          ctaLabel: 'Brand authority',
          ctaHref: '/website-development'
        },
        {
          id: 'solution-02',
          number: '02',
          title: 'Custom Business Tools',
          text: 'Bespoke automation systems engineered to streamline internal workflows and reduce operational friction.',
          ctaLabel: 'Automation',
          ctaHref: '/custom-business-tools'
        },
        {
          id: 'solution-03',
          number: '03',
          title: 'Secure Online Shops',
          text: 'Robust commerce systems built for secure payments and performance-driven growth.',
          ctaLabel: 'Revenue growth',
          ctaHref: '/secure-online-shops'
        },
        {
          id: 'solution-04',
          number: '04',
          title: 'Mobile Business App',
          text: 'Professional iOS and Android experiences with responsive architecture and native-feel interaction.',
          ctaLabel: 'Custom access',
          ctaHref: '/mobile-business-app'
        },
        {
          id: 'solution-05',
          number: '05',
          title: 'Official Business Email',
          text: 'Complete domain and email setup engineered for deliverability and professional trust.',
          ctaLabel: 'Professionalization',
          ctaHref: '/official-business-email'
        }
      ]
    },
    {
      id: 'home-why',
      type: 'why_split',
      enabled: true,
      theme: 'blue-soft',
      heading: 'Why Example Studio?',
      description: "We don't just build software; we build the engine for your future growth. Here's what sets our consultancy apart.",
      bullets: [
        {
          id: 'why-1',
          title: 'Innovation Focused on ROI',
          text: 'We prioritize features that drive revenue and efficiency, ensuring your investment pays for itself.'
        },
        {
          id: 'why-2',
          title: '8 Years of Hands-On Expertise',
          text: 'Benefit from years of refined processes and technical mastery in digital delivery.'
        },
        {
          id: 'why-3',
          title: 'Your External Technical Partner',
          text: 'We act as your dedicated CTO extension, so you can focus on running your business.'
        },
        {
          id: 'why-4',
          title: 'Bespoke Strategy for Every Project',
          text: 'No cookie-cutter templates. We design every strategy specifically for your unique goals.'
        },
        {
          id: 'why-5',
          title: 'Premium Quality, Best-Price Guarantee',
          text: 'Top-tier coding standards and design at a price point that makes sense for growing businesses.'
        }
      ],
      mediaImage: '',
      mediaAlt: 'Vanaila digital engineering visual'
    },
    {
      id: 'home-logos',
      type: 'logo_cloud',
      enabled: true,
      theme: 'light',
      heading: 'Trusted by Innovators',
      logos: [
        { id: 'logo-1', name: 'TechWave' },
        { id: 'logo-2', name: 'GlobalCom' },
        { id: 'logo-3', name: 'ApexRetail' },
        { id: 'logo-4', name: 'InnovaHealth' },
        { id: 'logo-5', name: 'Quantum' }
      ],
      primaryCtaLabel: 'View our portfolio',
      primaryCtaHref: '/blog',
      secondaryCtaLabel: "Let's talk growth",
      secondaryCtaHref: '/contact'
    },
    {
      id: 'home-cta',
      type: 'primary_cta',
      enabled: true,
      theme: 'blue-soft',
      heading: 'Ready to Grow?',
      accentText: 'Join the organizations that trust Example Studio.',
      description: "Let's build something that works as hard as you do.",
      ctaLabel: 'Claim free consultation call',
      ctaHref: '/contact',
      ctaStyle: 'primary'
    }
  ];

  return {
    settings: {
      general: {
        siteName: 'Example Studio.',
        siteTagline: 'Engineering-focused digital agency for ambitious brands.',
        baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
        adminEmail: process.env.CMS_ADMIN_EMAIL ?? 'hello@example.com',
        timezone: process.env.CMS_TIMEZONE ?? 'Asia/Jakarta',
        language: 'en-US',
        dateFormat: 'MMMM d, yyyy',
        timeFormat: 'HH:mm',
        weekStartsOn: 1
      },
      navigation: {
        headerLinks: [
          { id: 'nav-home', label: 'Home', href: '/', enabled: true },
          { id: 'nav-about', label: 'About', href: '/about', enabled: true },
          { id: 'nav-categories', label: 'Categories', href: '/categories', enabled: true },
          { id: 'nav-shop', label: 'Shop', href: '/shop', enabled: true },
          { id: 'nav-insights', label: 'Insights', href: '/blog', enabled: true }
        ],
        headerCtaLabel: 'Contact Us',
        headerCtaHref: '/contact',
        footerNavigatorLinks: [
          { id: 'footer-nav-home', label: 'Home', href: '/', enabled: true },
          { id: 'footer-nav-about', label: 'About Us', href: '/about', enabled: true },
          { id: 'footer-nav-categories', label: 'Categories', href: '/categories', enabled: true },
          { id: 'footer-nav-shop', label: 'Shop', href: '/shop', enabled: true },
          { id: 'footer-nav-insights', label: 'Insights', href: '/blog', enabled: true },
          { id: 'footer-nav-contact', label: 'Contact', href: '/contact', enabled: true }
        ],
        footerServiceLinks: []
      },
      contact: {
        companyName: 'Example Studio LLC',
        addressLine1: '123 Example Avenue',
        addressLine2: 'Remote-first team, Global delivery',
        globalReachLabel: 'Global Reach',
        globalReachText: 'Supporting partners across SEA, Europe, and North America.',
        emailLabel: 'Email Us',
        emailValue: 'hello@example.com',
        emailHref: 'mailto:hello@example.com',
        whatsappLabel: 'WhatsApp Business',
        whatsappValue: '+62 800 0000 0000',
        whatsappHref: 'https://wa.me/620000000000',
        instagramLabel: 'Instagram',
        instagramValue: '@example.studio',
        instagramHref: 'https://instagram.com/example.studio'
      },
      social: {
        chatHref: '/contact',
        instagramHref: 'https://instagram.com/example.studio',
        websiteHref: 'https://example.com',
        emailHref: 'mailto:hello@example.com'
      },
      branding: {
        headerLogo: '',
        footerLogo: '',
        siteIcon: '',
        footerTagline: 'Engineering-focused digital agency delivering high-performance infrastructure.',
        footerBadgePrimary: 'Glassmorphism Edition',
        footerBadgeSecondary: 'Premium Engineering',
        copyrightText: '© 2026 Example Studio.'
      },
      writing: {
        defaultPostCategory: 'general',
        defaultPostFormat: 'standard',
        defaultPostStatus: 'draft',
        defaultPostAuthor: 'Admin',
        convertEmoticons: true,
        requireReviewBeforePublish: false,
        pingServices: ['https://rpc.pingomatic.com/']
      },
      reading: {
        homepageDisplay: 'static_page',
        homepagePageId: 'home',
        postsPageId: '',
        postsPerPage: 10,
        feedItems: 10,
        feedSummary: 'excerpt',
        discourageSearchEngines: false
      },
      discussion: {
        commentsEnabled: false,
        commentRegistrationRequired: false,
        closeCommentsAfterDays: 30,
        threadedCommentsEnabled: true,
        threadDepth: 3,
        requireCommentApproval: true,
        notifyOnComment: true
      },
      media: {
        uploadOrganizeByMonth: true,
        thumbnailWidth: 300,
        thumbnailHeight: 300,
        mediumMaxWidth: 768,
        mediumMaxHeight: 768,
        largeMaxWidth: 1600,
        largeMaxHeight: 1600
      },
      permalinks: {
        postPermalinkStructure: '/blog/%postname%',
        categoryBase: 'category',
        tagBase: 'tag'
      },
      seo: {
        titleTemplate: '%page_title% | %site_name%',
        defaultMetaDescription: 'Engineering-led digital systems for growth-focused businesses.',
        defaultOgImage: 'https://placehold.co/1200x630/png',
        defaultNoIndex: false
      },
      sitemap: {
        enabled: true,
        includePages: true,
        includePosts: true,
        includeLastModified: true
      },
      store: {
        storeName: process.env.CMS_ORG_NAME ?? 'Example Store',
        currency: 'IDR',
        currencySymbol: 'Rp',
        storePhone: '',
        storeAddress: '',
        storeCity: '',
        storeProvince: '',
        storePostalCode: '',
        minOrderAmount: 0,
        freeShippingThreshold: 0
      },
      payments: {
        midtransEnabled: true,
        manualTransferEnabled: true,
        bankName: '',
        bankAccountNumber: '',
        bankAccountHolder: '',
        paymentInstructions: 'Please transfer the total amount to the bank account above. Include your order number in the transfer description. Send proof of payment via WhatsApp to confirm your order.'
      },
      appearance: {
        templateId: 'vanaila'
      },
      siteName: 'Example Studio.',
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
      organizationName: process.env.CMS_ORG_NAME ?? 'Example Studio',
      organizationLogo: process.env.CMS_ORG_LOGO ?? '',
      defaultOgImage: 'https://placehold.co/1200x630/png'
    },
    pages: {
      home,
      about: page(
        'about',
        'About Our Team',
        'About',
        'Meet the team behind your website growth system.',
        [
          section(
            'about-story',
            'A practical team focused on execution',
            'We combine content, engineering, and SEO to deliver compounding results for service businesses.',
            {
              ctaLabel: 'Read our blog',
              ctaHref: '/blog'
            }
          )
        ],
        {
          metaTitle: 'About Example Studio | Engineering-First Digital Partner',
          metaDescription:
            'Learn about Example Studio, an engineering-first team building scalable websites, software products, and growth systems.',
          keywords: ['about vanaila digital', 'digital engineering team', 'website development partner', 'custom software team']
        }
      ),
      contact: page(
        'contact',
        'Contact',
        'Contact',
        'Get in touch to discuss your next campaign or website project.',
        [
          section(
            'contact-form',
            'Let us know your goals',
            'Share your current website, timeline, and business target. We will respond with a practical plan.',
            {
              ctaLabel: 'Send inquiry',
              ctaHref: 'mailto:hello@example.com'
            }
          )
        ],
        {
          metaTitle: 'Contact Example Studio | Book a Strategy Call',
          metaDescription:
            'Contact Example Studio to discuss your website, software, or automation goals and get a practical implementation plan.',
          keywords: ['contact vanaila digital', 'book strategy call', 'web development consultation', 'software consultation']
        }
      )
    },
    blogPosts: [
      {
        id: 'post-1',
        title: 'How to Structure a High-Converting Service Landing Page',
        excerpt:
          'A practical structure for hero sections, proof blocks, and conversion paths that increase lead quality.',
        content: `# Why structure matters

High-converting pages are clear, specific, and fast.

## Recommended flow

1. Hero with clear value proposition
2. Social proof
3. Service detail with outcomes
4. CTA with low friction

Keep sections simple and measurable.`,
        author: 'Editorial Team',
        categoryId: 'category-engineering',
        tags: ['engineering', 'performance', 'seo'],
        coverImage: 'https://placehold.co/1200x630/png',
        status: 'published',
        publishedAt: nowIso(),
        updatedAt: nowIso(),
        seo: {
          metaTitle: 'How to Structure a High-Converting Service Landing Page',
          metaDescription:
            'Use this framework to build service pages that improve conversion and organic visibility.',
          slug: 'high-converting-service-landing-page',
          canonical: '',
          socialImage: 'https://placehold.co/1200x630/png',
          noIndex: false,
          keywords: ['service landing page', 'conversion optimization', 'technical seo']
        }
      },
      {
        id: 'post-2',
        title: 'Editorial Workflow Checklist for Marketing Teams',
        excerpt:
          'Set up a draft-to-publish workflow in your CMS so non-technical teams can ship content confidently.',
        content: `# Editorial workflow

Use statuses, approvals, and clear owners.

Draft quickly, review carefully, then publish with SEO checks.`,
        author: 'Editorial Team',
        categoryId: 'category-workflow',
        tags: ['workflow', 'cms'],
        coverImage: 'https://placehold.co/1200x630/png',
        status: 'draft',
        publishedAt: null,
        updatedAt: nowIso(),
        seo: {
          metaTitle: 'Editorial Workflow Checklist for Marketing Teams',
          metaDescription: 'A clear CMS workflow that supports consistent publishing quality.',
          slug: 'editorial-workflow-checklist',
          canonical: '',
          socialImage: 'https://placehold.co/1200x630/png',
          noIndex: false,
          keywords: ['editorial workflow', 'cms publishing', 'content operations']
        }
      }
    ],
    portfolioProjects: [],
    categories: [
      category('General', 'general', 'Default publishing category for uncategorized content.'),
      category('Engineering', 'engineering', 'Technical engineering insights and implementation notes.'),
      category('Performance', 'performance', 'Web performance, speed, and optimization topics.'),
      category('SEO', 'seo', 'Technical SEO and discoverability guidance.'),
      category('Workflow', 'workflow', 'Operational workflows, editorial process, and CMS governance.'),
      category('CMS', 'cms', 'Content management implementation and admin UX topics.')
    ],
    mediaAssets: [
      mediaAsset(
        'media-default-og',
        'Default Open Graph',
        'https://placehold.co/1200x630/png',
        'Default social sharing image'
      ),
      mediaAsset(
        'media-brand-mark',
        'Vanaila Brand Mark',
        'https://placehold.co/240x80/png',
        'Example Studio brand mark'
      ),
      mediaAsset(
        'media-blog-cover',
        'Blog Cover Placeholder',
        'https://placehold.co/1200x630/png',
        'Generic blog cover placeholder'
      )
    ]
  };
}
