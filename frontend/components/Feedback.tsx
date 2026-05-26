'use client';

import { useState } from 'react';
import type { FeedbackContext, Suggestion, Step } from '../lib/types';
import { generateFeedback, submitFeedback, buildGoogleReviewUrl } from '../lib/api';
import StepIndicator from './StepIndicator';
import StepRating from './StepRating';
import StepSuggestions from './StepSuggestions';
import StepEdit from './StepEdit';
import StepGoogle from './StepGoogle';

interface Props {
  context: FeedbackContext;
}

export default function FeedbackFlow({ context }: Props) {
  const [step, setStep]               = useState<Step>(1);
  const [rating, setRating]           = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [editedText, setEditedText]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleUrl, setGoogleUrl]     = useState('');
  const [error, setError]             = useState('');

  async function handleGenerateSuggestions() {
    setLoading(true);
    setError('');
    setStep(2);
    try {
      const res = await generateFeedback({ rating, context });
      setSuggestions(res.suggestions);
    } catch {
      setError('Failed to generate suggestions. Please try again.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSuggestion(idx: number) {
    setSelectedIdx(idx);
    setEditedText(suggestions[idx]);
  }

  function handleProceedToEdit() {
    setStep(3);
  }

  async function handleSubmit() {
    setError('');
    try {
      const res = await submitFeedback({
        rating,
        context: {
          placeId: context.placeId,
          bizName: context.bizName,
          category: context.category,
          lang: context.lang,
        },
        text: editedText,
      });
      setGoogleUrl(buildGoogleReviewUrl("ChIJK9ZfSh-6bTkRJUzXVIgzQTc"));
      setStep(4);
    } catch {
      setError('Submission failed. Please try again.');
    }
  }

  function handleReset() {
    setStep(1);
    setRating(0);
    setSuggestions([]);
    setSelectedIdx(-1);
    setEditedText('');
    setGoogleUrl('');
    setError('');
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 font-serif text-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            Feedback Portal
          </div>
          <span className="text-xs font-medium bg-accent-light text-accent border border-accent/20 px-3 py-1 rounded-full">
            {context.bizName}
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-black/10 rounded-2xl shadow-lg overflow-hidden">
          <StepIndicator step={step} />

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="p-8 min-h-[360px]">
            {step === 1 && (
              <StepRating
                rating={rating}
                setRating={setRating}
                onNext={handleGenerateSuggestions}
              />
            )}
            {step === 2 && (
              <StepSuggestions
                rating={rating}
                suggestions={suggestions}
                selectedIdx={selectedIdx}
                loading={loading}
                onSelect={handleSelectSuggestion}
                onBack={() => setStep(1)}
                onNext={handleProceedToEdit}
              />
            )}
            {step === 3 && (
              <StepEdit
                rating={rating}
                editedText={editedText}
                setEditedText={setEditedText}
                onBack={() => setStep(2)}
                onSubmit={handleSubmit}
              />
            )}
            {step === 4 && (
              <StepGoogle
                rating={rating}
                finalText={editedText}
                googleUrl={googleUrl || buildGoogleReviewUrl(context.placeId)}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}