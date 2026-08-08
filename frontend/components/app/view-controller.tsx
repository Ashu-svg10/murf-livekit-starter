'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';

import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';
import { Button } from '@/components/ui/button';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();
  const { resolvedTheme } = useTheme();

  const [isConnecting, setIsConnecting] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  // Keeps track of whether we previously had an active call.
  // This prevents the initial "not connected" state from being
  // incorrectly shown as "Conversation Ended".
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
      setIsConnecting(false);
      setMicDenied(false);
      setHasEnded(false);
      return;
    }

    // Only show "Conversation Ended" if an actual connected
    // conversation existed before.
    if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      setIsConnecting(false);
      setHasEnded(true);
    }
  }, [isConnected]);

  const handleStartCall = async () => {
    setHasEnded(false);
    setMicDenied(false);
    setIsConnecting(true);

    try {
      // Request microphone permission before starting the LiveKit call.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // We only needed the stream to verify permission.
      // LiveKit will create and manage the actual microphone track.
      stream.getTracks().forEach((track) => track.stop());

      await start();
    } catch (error) {
      console.error('Failed to start voice conversation:', error);

      setIsConnecting(false);
      setMicDenied(true);
    }
  };

  const handleTryAgain = () => {
    setMicDenied(false);
    setHasEnded(false);
  };

  return (
    <AnimatePresence mode="wait">
      {/* =========================
          MICROPHONE DENIED
         ========================= */}
      {micDenied && !isConnected && !isConnecting && (
        <motion.div
          key="mic-denied"
          {...VIEW_MOTION_PROPS}
          className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center"
        >
          <div className="text-6xl">🎤</div>

          <h2 className="mt-6 text-3xl font-bold text-red-600">
            Microphone Permission Required
          </h2>

          <p className="mt-4 max-w-md text-muted-foreground">
            KrishiMitra needs access to your microphone to start a voice
            conversation.
          </p>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Please allow microphone access in your browser settings and try
            again.
          </p>

          <Button
            size="lg"
            onClick={handleTryAgain}
            className="mt-8 cursor-pointer rounded-full bg-green-700 px-8 font-semibold text-white hover:bg-green-800"
          >
            Try Again
          </Button>
        </motion.div>
      )}

      {/* =========================
          CALL ENDED
         ========================= */}
      {hasEnded && !isConnected && !isConnecting && !micDenied && (
        <motion.div
          key="call-ended"
          {...VIEW_MOTION_PROPS}
          className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center"
        >
          <div className="text-6xl">🌾</div>

          <h1 className="mt-6 text-4xl font-bold text-green-800 md:text-5xl">
            Conversation Ended
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            Thank you for using KrishiMitra. You can start another farming
            conversation whenever you need help.
          </p>

          <Button
            size="lg"
            onClick={handleStartCall}
            className="mt-8 w-72 cursor-pointer rounded-full bg-green-700 font-semibold text-white shadow-md transition hover:bg-green-800 hover:shadow-lg"
          >
            🌾 Start Again
          </Button>

          <p className="absolute bottom-5 px-6 text-center text-xs text-muted-foreground md:text-sm">
            Powered by Murf Falcon • LiveKit • Gemini • Deepgram
          </p>
        </motion.div>
      )}

      {/* =========================
          READY
         ========================= */}
      {!isConnected && !isConnecting && !micDenied && !hasEnded && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
        />
      )}

      {/* =========================
          CONNECTING
         ========================= */}
      {isConnecting && !isConnected && (
        <motion.div
          key="connecting"
          {...VIEW_MOTION_PROPS}
          className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center"
        >
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />

          <h2 className="mt-6 text-2xl font-bold text-green-700 md:text-3xl">
            Connecting to KrishiMitra...
          </h2>

          <p className="mt-2 max-w-md text-muted-foreground">
            Please wait while your farming assistant is getting ready.
          </p>
        </motion.div>
      )}

      {/* =========================
          ACTIVE CONVERSATION
         ========================= */}
      {isConnected && (
        <MotionSessionView
          key="session"
          {...VIEW_MOTION_PROPS}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
          audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
          audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={
            appConfig.audioVisualizerGridColumnCount
          }
          audioVisualizerRadialBarCount={
            appConfig.audioVisualizerRadialBarCount
          }
          audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={
            appConfig.audioVisualizerWaveLineWidth
          }
          className="fixed inset-0"
        />
      )}
    </AnimatePresence>
  );
}