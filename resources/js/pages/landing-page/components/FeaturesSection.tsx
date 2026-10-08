import React from 'react';
import { QrCode, Smartphone, Share2, BarChart3, Globe, Shield, Star, Zap, Users, Lock, Wifi, Heart, Package, CreditCard, Clock } from 'lucide-react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesSectionProps {
  brandColor?: string;
  settings: any;
  sectionData: {
    title?: string;
    description?: string;
    layout?: string;
    columns?: number;
    show_icons?: boolean;
    background_color?: string;
    image?: string;
    features_list?: Feature[];
  };
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
  'qr-code': QrCode,
  'smartphone': Smartphone,
  'share': Share2,
  'bar-chart': BarChart3,
  'globe': Globe,
  'shield': Shield,
  'star': Star,
  'zap': Zap,
  'users': Users,
  'lock': Lock,
  'wifi': Wifi,
  'heart': Heart,
  'package': Package,
  'credit-card': CreditCard,
  'clock': Clock
};

export default function FeaturesSection({ settings, sectionData, brandColor = '#3b82f6' }: FeaturesSectionProps) {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useTranslation();
  
  // Helper to get full URL for images
  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${window.appSettings.imageUrl}${path}`;
  };
  
  const sectionImage = getImageUrl(sectionData.image);
  const backgroundColor = sectionData.background_color || '#f9fafb';
  const columns = sectionData.columns || 3;
  const layout = sectionData.layout || 'grid';
  const showIcons = sectionData.show_icons !== false;
  // Default features if none provided
  const defaultFeatures = [
    {
      icon: 'package',
      title: t('Inventory Management'),
      description: t('Track stock levels, manage products, and automate reordering.')
    },
    {
      icon: 'credit-card',
      title: t('Sales Processing'),
      description: t('Fast and secure payment processing with multiple payment methods.')
    },
    {
      icon: 'bar-chart',
      title: t('Analytics & Reports'),
      description: t('Track sales, revenue, and business performance metrics.')
    }
  ];

  const features = sectionData.features_list && sectionData.features_list.length > 0 
    ? sectionData.features_list 
    : defaultFeatures;

  // Grid column classes
  const gridColClass = [
    'grid-cols-1',
    columns >= 2 ? 'sm:grid-cols-2' : '',
    columns >= 3 ? 'lg:grid-cols-3' : '',
    columns >= 4 ? 'xl:grid-cols-4' : ''
  ].filter(Boolean).join(' ');

  const renderFeatureCard = (feature: Feature, index: number) => {
    const IconComponent = iconMap[feature.icon] || QrCode;
    return (
      <div
        key={index}
        className="bg-white p-8 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
        role="article"
        aria-labelledby={`feature-${index}-title`}
      >
        {showIcons && (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ backgroundColor: `${brandColor}15` }} role="img" aria-label={`${t(feature.title)} ${t('icon')}`}>
            <IconComponent className="w-6 h-6" style={{ color: brandColor }} aria-hidden="true" />
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-900 mb-4" id={`feature-${index}-title`}>
          {t(feature.title)}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {t(feature.description)}
        </p>
      </div>
    );
  };

  const renderFeatureList = (feature: Feature, index: number) => {
    const IconComponent = iconMap[feature.icon] || QrCode;
    return (
      <div
        key={index}
        className="flex gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
        role="article"
        aria-labelledby={`feature-${index}-title`}
      >
        {showIcons && (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${brandColor}15` }}>
            <IconComponent className="w-6 h-6" style={{ color: brandColor }} aria-hidden="true" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2" id={`feature-${index}-title`}>
            {t(feature.title)}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {t(feature.description)}
          </p>
        </div>
      </div>
    );
  };

  const renderFeatureAlternating = (feature: Feature, index: number) => {
    const IconComponent = iconMap[feature.icon] || QrCode;
    const isEven = index % 2 === 0;
    return (
      <div
        key={index}
        className={`flex flex-col md:flex-row gap-6 items-center p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 ${!isEven ? 'md:flex-row-reverse' : ''}`}
        role="article"
        aria-labelledby={`feature-${index}-title`}
      >
        {showIcons && (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${brandColor}15` }}>
            <IconComponent className="w-8 h-8" style={{ color: brandColor }} aria-hidden="true" />
          </div>
        )}
        <div className={!isEven ? 'md:text-right' : ''}>
          <h3 className="text-xl font-bold text-gray-900 mb-2" id={`feature-${index}-title`}>
            {t(feature.title)}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {t(feature.description)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor }} ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {sectionData.title ? t(sectionData.title) : t('Powerful Features for Modern Retail')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            {sectionData.description ? t(sectionData.description) : t('Everything you need to manage sales, inventory, and customer relationships.')}
          </p>
        </div>

        {sectionImage && (
          <div className="mb-8 sm:mb-12 text-center">
            <img src={sectionImage} alt={t('Features')} className="max-w-full h-auto rounded-xl shadow-lg mx-auto" />
          </div>
        )}
        
        <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {(layout === 'list') && (
            <div className="space-y-4">
              {features.map((feature, index) => renderFeatureList(feature, index))}
            </div>
          )}
          {(layout === 'alternating') && (
            <div className="space-y-4">
              {features.map((feature, index) => renderFeatureAlternating(feature, index))}
            </div>
          )}
          {(layout === 'grid' || layout === 'cards' || !layout) && (
            <div className={`grid ${gridColClass} gap-6 sm:gap-8`}>
              {features.map((feature, index) => renderFeatureCard(feature, index))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}