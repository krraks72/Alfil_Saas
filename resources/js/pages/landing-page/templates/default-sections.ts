export const defaultLandingPageSections = {
  sections: [
    {
      key: 'header',
      transparent: false,
      background_color: '#ffffff',
      text_color: '#1f2937',
      button_style: 'gradient'
    },
    {
      key: 'hero',
      title: 'POS Purchase and Sales Management Tool',
      subtitle: 'Transform your retail operations with our comprehensive point-of-sale system.',
      announcement_text: '🚀 New: Advanced Analytics Dashboard',
      primary_button_text: 'Start Free Trial',
      secondary_button_text: 'Login',
      image: '',
      background_color: '#f8fafc',
      text_color: '#1f2937',
      layout: 'image-right',
      height: 600,
      stats: [
        { value: '10K+', label: 'Active Users' },
        { value: '50+', label: 'Countries' },
        { value: '99%', label: 'Satisfaction' }
      ],
      card: {
        name: 'John Doe',
        title: 'Senior Developer',
        company: 'Tech Solutions Inc.',
        initials: 'JD'
      }
    },
    {
      key: 'features',
      title: 'Powerful Features for Modern Retail',
      description: 'Everything you need to manage sales, inventory, and customer relationships.',
      background_color: '#ffffff',
      layout: 'grid',
      columns: 3,
      image: '',
      show_icons: true,
      features_list: [
        {
          title: 'Inventory Management',
          description: 'Track stock levels, manage products, and automate reordering.',
          icon: 'package'
        },
        {
          title: 'Sales Processing',
          description: 'Fast and secure payment processing with multiple payment methods.',
          icon: 'credit-card'
        },
        {
          title: 'Analytics & Reports',
          description: 'Track sales, revenue, and business performance metrics.',
          icon: 'bar-chart'
        }
      ]
    },
    {
      key: 'screenshots',
      title: 'See POS System in Action',
      subtitle: 'Explore our intuitive interface and powerful features designed to streamline your retail operations.',
      screenshots_list: [
        {
          src: '/images/screenshots/hero.png',
          alt: 'POS Dashboard Overview',
          title: 'Dashboard Overview',
          description: 'Comprehensive dashboard with sales analytics and inventory management'
        },
        {
         src: '/images/screenshots/pos-interface.png',
         alt: 'POS Sales Interface',
         title: 'Sales Interface',
         description: 'Intuitive point-of-sale interface for fast and efficient transactions'
        },
        {
          src: '/images/screenshots/purchase.png',
          alt: 'Purchase',
          title: 'Purchase Management',
          description: 'Streamlined purchase orders and supplier management with cost tracking'
        },
        {
          src: '/images/screenshots/customer-management.png',
          alt: 'Customer Management',
          title: 'Customer Database',
          description: 'Comprehensive customer profiles with purchase history and loyalty programs'
        },
        {
          src: '/images/screenshots/inventory-report.png',
          alt: 'Inventory Report',
          title: 'Inventory Reports',
          description: 'Comprehensive inventory analytics with stock levels and movement tracking'
        },
        {
          src: '/images/screenshots/pos.png',
          alt: 'POS',
          title: 'POS',
          description: 'Complete point-of-sale with barcode scanning and receipt printing'
        }
      ]
    },
    {
      key: 'why_choose_us',
      title: 'Why Choose Our POS System?',
      subtitle: 'We\'re not just another point-of-sale platform.',
      reasons: [
        { title: 'Quick Setup', description: 'Get your POS system running in under 5 minutes.', icon: 'clock' },
        { title: 'Retail Network', description: 'Join thousands of retailers using our platform.', icon: 'users' }
      ],
      stats: [
        { value: '10K+', label: 'Active Users', color: 'blue' },
        { value: '99%', label: 'Satisfaction', color: 'green' }
      ]
    },
    // {
    //   key: 'templates',
    //   title: 'Explore Our Templates',
    //   subtitle: 'Choose from our professionally designed templates to create your perfect digital business card.',
    //   background_color: '#f8fafc',
    //   layout: 'grid',
    //   columns: 3,
    //   templates_list: [
    //     { name: 'freelancer', category: 'professional' },
    //     { name: 'doctor', category: 'medical' },
    //     { name: 'restaurant', category: 'food' },
    //     { name: 'realestate', category: 'business' },
    //     { name: 'fitness', category: 'health' },
    //     { name: 'photography', category: 'creative' },
    //     { name: 'lawfirm', category: 'professional' },
    //     { name: 'cafe', category: 'food' },
    //     { name: 'salon', category: 'beauty' },
    //     { name: 'construction', category: 'business' },
    //     { name: 'eventplanner', category: 'services' },
    //     { name: 'tech-startup', category: 'technology' }
    //   ],
    //   cta_text: 'View All Templates',
    //   cta_link: '#'
    // },
    {
      key: 'about',
      title: 'About Our POS System',
      description: 'We are passionate about transforming how retailers operate.',
      story_title: 'Empowering Retail Operations Since 2020',
      story_content: 'Founded by a team of retail enthusiasts and technology experts, our POS system was born from the frustration of outdated cash registers.',
      image: '',
      background_color: '#f9fafb',
      layout: 'image-right',
      stats: [
        { value: '4+ Years', label: 'Experience', color: 'blue' },
        { value: '10K+', label: 'Happy Users', color: 'green' },
        { value: '50+', label: 'Countries', color: 'purple' }
      ]
    },
    {
      key: 'team',
      title: 'Meet Our Team',
      subtitle: 'We\'re a diverse team of innovators and problem-solvers.',
      cta_title: 'Want to Join Our Team?',
      cta_description: 'We\'re always looking for talented individuals.',
      cta_button_text: 'View Open Positions',
      members: [
        { name: 'Sarah Johnson', role: 'CEO & Founder', bio: 'Former tech executive with 15+ years experience in retail technology and business development.', image: '', linkedin: '#', email: 'sarah@pos.com' },
        { name: 'Michael Chen', role: 'CTO & Co-Founder', bio: 'Software architect specializing in scalable POS systems and payment processing solutions.', image: '', linkedin: '#', email: 'michael@pos.com' },
        { name: 'Emily Rodriguez', role: 'Head of Product', bio: 'Product strategist with deep expertise in retail operations and user experience design.', image: '', linkedin: '#', email: 'emily@pos.com' },
        { name: 'David Kim', role: 'Lead Developer', bio: 'Full-stack developer passionate about creating intuitive and powerful retail management tools.', image: '', linkedin: '#', email: 'david@pos.com' }
      ]
    },
    {
      key: 'testimonials',
      title: 'What Our Clients Say',
      subtitle: 'Don\'t just take our word for it.',
      trust_title: 'Trusted by Professionals Worldwide',
      trust_stats: [
        { value: '4.9/5', label: 'Average Rating', color: 'blue' },
        { value: '10K+', label: 'Happy Users', color: 'green' }
      ],
      testimonials: [
        { name: 'Alex Thompson', role: 'Store Manager', company: 'RetailCorp Inc.', content: 'This POS system has revolutionized how we manage sales, inventory, and customer relationships. The reporting features are incredible!', rating: 5 },
        { name: 'Maria Garcia', role: 'Business Owner', company: 'Fashion Boutique', content: 'Easy to use, reliable, and the customer support is outstanding. Our sales have increased by 30% since switching to this POS.', rating: 5 },
        { name: 'John Davis', role: 'Operations Manager', company: 'Coffee Chain', content: 'The multi-branch management feature is exactly what we needed. We can monitor all our locations from one dashboard.', rating: 5 }
      ]
    },
    {
      key: 'plans',
      title: 'Choose Your Plan',
      subtitle: 'Start with our free plan and upgrade as you grow.',
      faq_text: 'Have questions about our plans? Contact our sales team'
    },
    {
      key: 'faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Got questions? We\'ve got answers.',
      cta_text: 'Still have questions?',
      button_text: 'Contact Support',
      faqs: [
        { question: 'How does the POS system work?', answer: 'Our POS system allows you to process sales, manage inventory, track customer data, and generate detailed reports. Simply set up your products, configure payment methods, and start processing transactions with our intuitive interface.' },
        { question: 'Can I manage multiple store locations?', answer: 'Yes! Our POS system supports multi-branch management. You can set up multiple locations, assign managers, track inventory across branches, and monitor performance from a centralized dashboard.' },
        { question: 'What payment methods are supported?', answer: 'We support all major payment methods including cash, credit/debit cards, mobile payments, digital wallets, and contactless payments. Integration with popular payment gateways is included.' },
        { question: 'Is my business data secure?', answer: 'Absolutely. We use enterprise-grade security measures including data encryption, secure servers, regular backups, and compliance with industry standards to protect your business information.' },
        { question: 'Can I track inventory and stock levels?', answer: 'Yes, our comprehensive inventory management system tracks stock levels in real-time, sends low stock alerts, manages product categories and variants, and provides detailed inventory reports.' },
        { question: 'Do you provide customer support?', answer: 'We offer 24/7 customer support through email, live chat, and phone. Our support team includes POS specialists who can help with setup, training, and troubleshooting.' },
        { question: 'Can I generate sales reports?', answer: 'Our reporting system provides detailed analytics including daily/monthly sales reports, profit margins, top-selling products, customer insights, and branch performance comparisons.' },
        { question: 'Is there a mobile app available?', answer: 'Yes, we offer mobile apps for both iOS and Android that allow you to manage your business on-the-go, process sales, check inventory, and view reports from anywhere.' }
      ]
    },
    {
      key: 'newsletter',
      title: 'Stay Updated with POS System',
      subtitle: 'Get the latest updates and retail management tips.',
      privacy_text: 'No spam, unsubscribe at any time.',
      benefits: [
        { icon: '📧', title: 'Weekly Updates', description: 'Latest features and improvements' }
      ]
    },
    {
      key: 'contact',
      title: 'Get in Touch',
      subtitle: 'Have questions about POS? We\'d love to hear from you.',
      form_title: 'Send us a Message',
      info_title: 'Contact Information',
      info_description: 'We\'re here to help and answer any question you might have.',
      layout: 'split',
      background_color: '#f9fafb'
    },
    {
      key: 'footer',
      description: 'Transforming retail operations with innovative point-of-sale solutions.',
      newsletter_title: 'Stay Updated',
      newsletter_subtitle: 'Join our newsletter for updates',
      links: {
        product: [{ name: 'Features', href: '#features' }, { name: 'Pricing', href: '#pricing' }],
        company: [{ name: 'About Us', href: '#about' }, { name: 'Contact', href: '#contact' }]
      },
      social_links: [
        { name: 'Facebook', icon: 'Facebook', href: '#' },
        { name: 'Twitter', icon: 'Twitter', href: '#' }
      ],
      section_titles: {
        product: 'Product',
        company: 'Company'
      }
    }
  ],
  theme: {
    primary_color: '#10b77f',
    secondary_color: '#ffffff',
    accent_color: '#f7f7f7',
    logo_light: '',
    logo_dark: '',
    favicon: ''
  },
  seo: {
    meta_title: 'POS System - Point of Sale Solutions',
    meta_description: 'Streamline your retail operations with our comprehensive POS system.',
    meta_keywords: 'pos system, point of sale, retail management, inventory, sales'
  },
  custom_css: '',
  custom_js: '',
  section_order: ['header', 'hero', 'features', 'screenshots', 'why_choose_us', 'about', 'team', 'testimonials', 'plans', 'faq', 'newsletter', 'contact', 'footer'],
  section_visibility: {
    header: true,
    hero: true,
    features: true,
    screenshots: true,
    why_choose_us: true,
    // templates: true,
    about: true,
    team: true,
    testimonials: true,
    plans: true,
    faq: true,
    newsletter: true,
    contact: true,
    footer: true
  }
};