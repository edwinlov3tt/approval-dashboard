import React, { useEffect, useRef } from 'react';
import { useCreativeStore } from '@/stores/creativeStore';

interface FormWizardProps {
  children: React.ReactNode[];
}

export const FormWizard: React.FC<FormWizardProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get state for determining step unlock status
  const hasAttemptedVerification = useCreativeStore(state =>
    state.facebook.hasAttempted ?? Boolean(state.facebook.pageData)
  );
  const websiteUrl = useCreativeStore(state => state.brief.websiteUrl);
  const companyOverview = useCreativeStore(state => state.brief.companyOverview);
  const campaignObjective = useCreativeStore(state => state.brief.campaignObjective);

  // Step 1 is complete when user has verified Facebook and filled required fields
  const step1Complete = Boolean(hasAttemptedVerification && websiteUrl && companyOverview && campaignObjective);

  // Step 2 is locked until Step 1 is complete
  const step2Locked = !step1Complete;

  // Detect current section based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const sectionHeight = container.clientHeight;
      const newStep = Math.round(scrollPosition / sectionHeight);

      // Prevent scrolling to locked sections
      if (newStep === 1 && step2Locked) {
        container.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        return;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [step2Locked]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scroll-smooth"
        style={{
          scrollSnapType: step2Locked ? 'none' : 'y mandatory',
          scrollSnapStop: 'always',
          scrollBehavior: 'smooth',
          overflowY: step2Locked ? 'hidden' : 'auto'
        }}
      >
        {React.Children.toArray(children).map((child, index) => {
          // Don't render Step 2 until Step 1 is complete
          if (index === 1 && step2Locked) {
            return null;
          }

          return (
            <div
              key={index}
              className="h-screen flex items-start justify-center overflow-hidden"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="w-full max-w-2xl h-full overflow-y-auto px-6 py-6 hide-scrollbar">
                {child}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
