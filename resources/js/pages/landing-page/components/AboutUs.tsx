import React from 'react';
import { Target, Heart, Award, Lightbulb, Star, Shield, Users, Zap } from 'lucide-react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';

interface AboutUsProps {
  brandColor?: string;
  settings: any;
  sectionData: {
    title?: string;
    description?: string;
    story_title?: string;
    story_content?: string;
    layout?: string;
    image_position?: string;
    background_color?: string;
    text_color?: string;
    parallax?: boolean;
    image?: string;
    stats?: Array<{
      value: string;
      label: string;
      color: string;
    }>;
    values?: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    image_title?: string;
    image_subtitle?: string;
    image_icon?: string;
  };
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
  'target': Target,
  'heart': Heart,
  'award': Award,
  'lightbulb': Lightbulb,
  'star': Star,
  'shield': Shield,
  'users': Users,
  'zap': Zap
};

export default function AboutUs({ settings, sectionData, brandColor = '#3b82f6' }: AboutUsProps) {
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
  const textColor = sectionData.text_color || '#1f2937';
  const subtitleColor = sectionData.text_color ? sectionData.text_color + 'cc' : '#4b5563';
  const layout = sectionData.layout || 'image-right';
  const imagePosition = sectionData.image_position || 'right';
  const parallax = sectionData.parallax || false;
  const isImageLeft = layout === 'image-left' || imagePosition === 'left';
  const isCentered = layout === 'centered';
  const isBackground = imagePosition === 'background';

  const statColorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f97316',
    red: '#ef4444',
    yellow: '#eab308'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: isBackground && sectionImage ? undefined : backgroundColor,
    backgroundImage: isBackground && sectionImage ? `url(${sectionImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: parallax ? 'fixed' : undefined,
    position: 'relative',
  };
  // Default data if none provided
  const defaultValues = [
    {
      icon: 'target',
      title: t('Our Mission'),
      description: t('To revolutionize retail operations by making POS systems accessible, efficient, and user-friendly.')
    },
    {
      icon: 'heart',
      title: t('Our Values'),
      description: t('We believe in innovation, reliability, and building solutions that drive retail success.')
    },
    {
      icon: 'award',
      title: t('Our Commitment'),
      description: t('Delivering exceptional user experience with cutting-edge POS technology and unparalleled customer support.')
    },
    {
      icon: 'lightbulb',
      title: t('Our Vision'),
      description: t('A world where every retail transaction is seamless, secure, and leads to business growth.')
    }
  ];

  const defaultStats = [
    { value: t('4+ Years'), label: t('Experience'), color: 'blue' },
    { value: t('10K+'), label: t('Happy Retailers'), color: 'green' },
    { value: t('50+'), label: t('Countries'), color: 'purple' }
  ];

  const values = sectionData.values && sectionData.values.length > 0 
    ? sectionData.values 
    : defaultValues;

  const stats = sectionData.stats && sectionData.stats.length > 0 
    ? sectionData.stats 
    : defaultStats;

  const storyBlock = (
    <div>
      <h3 className="text-2xl font-bold mb-6" style={{ color: textColor }}>
        {sectionData.story_title || t('Empowering Retail Operations Since 2020')}
      </h3>
      <div className="mb-8 leading-relaxed" style={{ color: subtitleColor }} dangerouslySetInnerHTML={{
        __html: (sectionData.story_content || 'Founded by a team of retail enthusiasts and technology experts, our POS system was born from the frustration of outdated cash registers.').replace(/\n/g, '<br/>')
      }} />
      {stats.length > 0 && (
        <div className="flex items-center gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold" style={{ color: statColorMap[stat.color] || textColor }}>{stat.value}</div>
              <div className="text-sm" style={{ color: subtitleColor }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const imageBlock = (
    <div className="bg-white rounded-xl p-8 border border-gray-200 h-96 flex items-center justify-center">
      {sectionImage && !isBackground ? (
        <img src={sectionImage} alt="About Us" className="max-w-full max-h-full object-contain rounded-lg" />
      ) : (
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">{sectionData.image_icon || '🚀'}</span>
          </div>
          <h4 className="text-xl font-semibold mb-2" style={{ color: textColor }}>
            {sectionData.image_title || t('Innovation Driven')}
          </h4>
          <p style={{ color: subtitleColor }}>
            {sectionData.image_subtitle || t('Building the future of retail')}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20" style={sectionStyle} ref={ref}>
      {/* Background overlay when using background image position */}
      {isBackground && sectionImage && (
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }} />
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isBackground ? 'relative' : ''}`}
        style={{ zIndex: isBackground ? 2 : undefined }}>
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: textColor }}>
            {sectionData.title || t('About Our POS System')}
          </h2>
          <p className="text-lg max-w-3xl mx-auto leading-relaxed font-medium" style={{ color: subtitleColor }}>
            {sectionData.description || t('We are passionate about transforming how retailers operate.')}
          </p>
        </div>

        {/* Story + Image block */}
        {isCentered ? (
          <div className={`mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-6" style={{ color: textColor }}>
                {sectionData.story_title || t('Empowering Retail Operations Since 2020')}
              </h3>
              <div className="mb-8 leading-relaxed" style={{ color: subtitleColor }} dangerouslySetInnerHTML={{
                __html: (sectionData.story_content || 'Founded by a team of retail enthusiasts and technology experts, our POS system was born from the frustration of outdated cash registers.').replace(/\n/g, '<br/>')
              }} />
              {stats.length > 0 && (
                <div className="flex items-center justify-center gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold" style={{ color: statColorMap[stat.color] || textColor }}>{stat.value}</div>
                      <div className="text-sm" style={{ color: subtitleColor }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {sectionImage && !isBackground && (
              <div className="mt-8">{imageBlock}</div>
            )}
          </div>
        ) : (
          <div className={`grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isImageLeft ? (
              <>{imageBlock}{storyBlock}</>
            ) : (
              <>{storyBlock}{imageBlock}</>
            )}
          </div>
        )}

        {/* Values Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {values.map((value, index) => {
            const IconComponent = iconMap[value.icon] || Target;
            return (
              <div key={index} className="text-center bg-white p-6 rounded-xl border border-gray-200">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${brandColor}15` }}>
                  <IconComponent className="w-6 h-6" style={{ color: brandColor }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}