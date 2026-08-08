'use client';

import { Button } from '@/components/ui/button';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div
      ref={ref}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 px-6 py-12 text-center"
    >
      {/* Hero */}
      <div className="flex flex-col items-center">
        <div className="text-6xl md:text-7xl">🌾</div>

        <h1 className="mt-4 text-5xl font-bold tracking-tight text-green-800 md:text-6xl">
          KrishiMitra
        </h1>

        <p className="mt-4 text-xl font-medium text-green-700 md:text-2xl">
          Your AI Farming Assistant
        </p>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
          Helping Indian farmers with crop guidance, irrigation, fertilizer
          recommendations, pest prevention, and general agricultural support
          through natural voice conversations.
        </p>
      </div>

      {/* Features */}
      <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="text-3xl">🌱</div>
          <p className="mt-2 text-sm font-semibold text-green-900 md:text-base">
            Crop Guidance
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="text-3xl">💧</div>
          <p className="mt-2 text-sm font-semibold text-green-900 md:text-base">
            Irrigation
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="text-3xl">🐛</div>
          <p className="mt-2 text-sm font-semibold text-green-900 md:text-base">
            Pest Control
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="text-3xl">🏛️</div>
          <p className="mt-2 text-sm font-semibold text-green-900 md:text-base">
            Govt. Schemes
          </p>
        </div>
      </div>

      {/* Languages */}
      <p className="mt-8 text-sm text-gray-500">
        🌐 Supports English • हिन्दी • Hinglish
      </p>

      {/* Start Conversation */}
      <Button
        size="lg"
        onClick={onStartCall}
        className="mt-6 w-72 cursor-pointer rounded-full bg-green-700 font-semibold text-white shadow-md transition hover:bg-green-800 hover:shadow-lg"
      >
        🌾 Start Conversation
      </Button>

      {/* Footer */}
      <div className="absolute bottom-5 left-0 w-full px-6 text-center text-xs text-gray-500 md:text-sm">
        Powered by Murf Falcon • LiveKit • Gemini • Deepgram
      </div>
    </div>
  );
};