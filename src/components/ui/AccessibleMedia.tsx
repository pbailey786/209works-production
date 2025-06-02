import React from 'react';
import { validateMultimediaAccessibility } from '@/utils/accessibility';

interface AccessibleVideoProps {
  src: string;
  poster?: string;
  title: string;
  description?: string;
  captionSrc?: string;
  transcriptSrc?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: number;
  height?: number;
}

interface AccessibleAudioProps {
  src: string;
  title: string;
  description?: string;
  transcriptSrc?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

interface AccessibleIframeProps {
  src: string;
  title: string;
  description?: string;
  width?: number;
  height?: number;
  className?: string;
  allowFullScreen?: boolean;
}

export function AccessibleVideo({
  src,
  poster,
  title,
  description,
  captionSrc,
  transcriptSrc,
  className = '',
  autoPlay = false,
  controls = true,
  width,
  height
}: AccessibleVideoProps) {
  const validation = validateMultimediaAccessibility({
    type: 'video',
    hasCaption: !!captionSrc,
    hasTranscript: !!transcriptSrc,
    title
  });

  return (
    <div className={`accessible-video ${className}`}>
      <video
        src={src}
        poster={poster}
        title={title}
        aria-label={description || title}
        aria-describedby={description ? `${title}-description` : undefined}
        autoPlay={autoPlay}
        controls={controls}
        width={width}
        height={height}
        className="w-full h-auto"
      >
        {captionSrc && (
          <track
            kind="captions"
            src={captionSrc}
            srcLang="en"
            label="English captions"
            default
          />
        )}
        <p>
          Your browser doesn't support HTML video. 
          <a href={src} download>Download the video file</a>.
        </p>
      </video>
      
      {description && (
        <div id={`${title}-description`} className="sr-only">
          {description}
        </div>
      )}
      
      {transcriptSrc && (
        <div className="mt-4">
          <details className="bg-gray-50 p-4 rounded-lg">
            <summary className="font-medium cursor-pointer">
              View Transcript
            </summary>
            <div className="mt-2">
              <iframe
                src={transcriptSrc}
                title={`Transcript for ${title}`}
                className="w-full h-32 border-0"
              />
            </div>
          </details>
        </div>
      )}
      
      {!validation.isValid && process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Accessibility Issues:</strong>
          <ul className="list-disc list-inside mt-1">
            {validation.issues.map((issue, index) => (
              <li key={index} className="text-yellow-800">{issue}</li>
            ))}
          </ul>
          <strong className="block mt-2">Recommendations:</strong>
          <ul className="list-disc list-inside mt-1">
            {validation.recommendations.map((rec, index) => (
              <li key={index} className="text-yellow-800">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AccessibleAudio({
  src,
  title,
  description,
  transcriptSrc,
  className = '',
  autoPlay = false,
  controls = true
}: AccessibleAudioProps) {
  const validation = validateMultimediaAccessibility({
    type: 'audio',
    hasTranscript: !!transcriptSrc,
    title
  });

  return (
    <div className={`accessible-audio ${className}`}>
      <audio
        src={src}
        title={title}
        aria-label={description || title}
        aria-describedby={description ? `${title}-description` : undefined}
        autoPlay={autoPlay}
        controls={controls}
        className="w-full"
      >
        <p>
          Your browser doesn't support HTML audio. 
          <a href={src} download>Download the audio file</a>.
        </p>
      </audio>
      
      {description && (
        <div id={`${title}-description`} className="sr-only">
          {description}
        </div>
      )}
      
      {transcriptSrc && (
        <div className="mt-4">
          <details className="bg-gray-50 p-4 rounded-lg">
            <summary className="font-medium cursor-pointer">
              View Transcript
            </summary>
            <div className="mt-2">
              <iframe
                src={transcriptSrc}
                title={`Transcript for ${title}`}
                className="w-full h-32 border-0"
              />
            </div>
          </details>
        </div>
      )}
      
      {!validation.isValid && process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Accessibility Issues:</strong>
          <ul className="list-disc list-inside mt-1">
            {validation.issues.map((issue, index) => (
              <li key={index} className="text-yellow-800">{issue}</li>
            ))}
          </ul>
          <strong className="block mt-2">Recommendations:</strong>
          <ul className="list-disc list-inside mt-1">
            {validation.recommendations.map((rec, index) => (
              <li key={index} className="text-yellow-800">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AccessibleIframe({
  src,
  title,
  description,
  width,
  height,
  className = '',
  allowFullScreen = false
}: AccessibleIframeProps) {
  const validation = validateMultimediaAccessibility({
    type: 'iframe',
    title
  });

  return (
    <div className={`accessible-iframe ${className}`}>
      <iframe
        src={src}
        title={title}
        aria-label={description || title}
        aria-describedby={description ? `${title}-description` : undefined}
        width={width}
        height={height}
        allowFullScreen={allowFullScreen}
        className="w-full border-0"
      />
      
      {description && (
        <div id={`${title}-description`} className="sr-only">
          {description}
        </div>
      )}
      
      {!validation.isValid && process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Accessibility Issues:</strong>
          <ul className="list-disc list-inside mt-1">
            {validation.issues.map((issue, index) => (
              <li key={index} className="text-yellow-800">{issue}</li>
            ))}
          </ul>
          <strong className="block mt-2">Recommendations:</strong>
          <ul className="list-disc list-inside mt-1">
            {validation.recommendations.map((rec, index) => (
              <li key={index} className="text-yellow-800">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Example usage component for documentation
export function AccessibleMediaExamples() {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Accessible Media Examples</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Video with Captions and Transcript</h3>
        <AccessibleVideo
          src="/videos/job-interview-tips.mp4"
          poster="/images/video-poster.jpg"
          title="Job Interview Tips"
          description="A comprehensive guide to acing your next job interview"
          captionSrc="/captions/job-interview-tips.vtt"
          transcriptSrc="/transcripts/job-interview-tips.html"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Audio with Transcript</h3>
        <AccessibleAudio
          src="/audio/career-advice-podcast.mp3"
          title="Career Advice Podcast Episode 1"
          description="Expert tips for advancing your career in tech"
          transcriptSrc="/transcripts/career-advice-podcast.html"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Embedded Content</h3>
        <AccessibleIframe
          src="https://www.youtube.com/embed/example"
          title="Resume Building Tutorial"
          description="Step-by-step guide to creating an effective resume"
          width={560}
          height={315}
          allowFullScreen
        />
      </div>
    </div>
  );
} 