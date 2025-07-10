'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MediaSelector, 
  ContentEditor, 
  EntryDetails, 
  ProgressBar,
  type Media,
  type JournalContent,
  type EntryDetailsType
} from '@/components/journal';

type CreationStep = 'media' | 'content' | 'details';

// Main Journal Creator Component
export default function JournalCreator() {
  const [currentStep, setCurrentStep] = useState<CreationStep>('media');
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const [content, setContent] = useState<JournalContent>({
    text: '',
    textOverlays: [],
    stickers: []
  });

  const steps = ['Media', 'Story', 'Details'];

  const handlePublish = (details: EntryDetailsType) => {
    console.log('Publishing journal entry:', {
      media: selectedMedia,
      content,
      details
    });
    
    // TODO: Implement actual publishing logic
    // This could involve:
    // 1. Uploading media files to cloud storage
    // 2. Saving journal entry to database
    // 3. Sending notifications to friends (if applicable)
    // 4. Updating user's journal feed
    
    alert('Journal entry published successfully! 🎉');
    
    // Reset form after publishing
    setCurrentStep('media');
    setSelectedMedia([]);
    setContent({
      text: '',
      textOverlays: [],
      stickers: []
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black bg-opacity-90 backdrop-blur-sm">
        <ProgressBar steps={steps} current={currentStep} />
      </div>

      {/* Main Content */}
      <div className="pt-20 h-screen">
        <AnimatePresence mode="wait">
          {currentStep === 'media' && (
            <MediaSelector 
              onNext={(media) => {
                setSelectedMedia(media);
                setCurrentStep('content');
              }}
              maxSelection={10}
            />
          )}
          
          {currentStep === 'content' && (
            <ContentEditor
              media={selectedMedia}
              onNext={(content) => {
                setContent(content);
                setCurrentStep('details');
              }}
              onBack={() => setCurrentStep('media')}
            />
          )}
          
          {currentStep === 'details' && (
            <EntryDetails
              onPublish={handlePublish}
              onBack={() => setCurrentStep('content')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}