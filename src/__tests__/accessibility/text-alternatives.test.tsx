import { render, screen } from '@testing-library/react';
import {
  generateAltText,
  createDecorativeIconProps,
  createInformativeIconProps,
  createInteractiveIconProps,
  ACCESSIBLE_ICONS,
  validateMultimediaAccessibility,
} from '@/utils/accessibility';
import { Avatar } from '@/components/Avatar';
import {
  AccessibleVideo,
  AccessibleAudio,
  AccessibleIframe,
} from '@/components/ui/AccessibleMedia';
import JobCard from '@/components/JobCard';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('Text Alternatives for Non-text Content', () => {
  describe('Alt Text Generation', () => {
    it('generates appropriate alt text for logos', () => {
      expect(generateAltText('logo', { companyName: 'Acme Corp' })).toBe(
        'Acme Corp logo'
      );
      expect(generateAltText('logo')).toBe('Company logo');
    });

    it('generates appropriate alt text for avatars', () => {
      expect(generateAltText('avatar', { userName: 'John Doe' })).toBe(
        "John Doe's profile picture"
      );
      expect(generateAltText('avatar')).toBe('User profile picture');
    });

    it('generates empty alt text for decorative images', () => {
      expect(generateAltText('decorative')).toBe('');
    });

    it('generates descriptive alt text for informative images', () => {
      expect(
        generateAltText('informative', {
          description: 'Chart showing sales data',
        })
      ).toBe('Chart showing sales data');
      expect(generateAltText('informative')).toBe('Informative image');
    });
  });

  describe('Icon Accessibility Props', () => {
    it('creates proper props for decorative icons', () => {
      const props = createDecorativeIconProps();
      expect(props).toEqual({
        'aria-hidden': true,
        role: 'presentation',
      });
    });

    it('creates proper props for informative icons', () => {
      const props = createInformativeIconProps('Save document');
      expect(props).toEqual({
        'aria-label': 'Save document',
        role: 'img',
      });
    });

    it('creates proper props for interactive icons', () => {
      const props = createInteractiveIconProps('Close dialog');
      expect(props).toEqual({
        'aria-label': 'Close dialog',
      });
    });

    it('provides predefined accessible icon configurations', () => {
      expect(ACCESSIBLE_ICONS.save).toEqual({
        'aria-label': 'Save',
        role: 'img',
      });
      expect(ACCESSIBLE_ICONS.decorative).toEqual({
        'aria-hidden': true,
        role: 'presentation',
      });
    });
  });

  describe('Avatar Component', () => {
    it('renders with proper alt text when userName is provided', () => {
      render(<Avatar src="/test-avatar.jpg" userName="Jane Smith" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', "Jane Smith's profile picture");
    });

    it('renders with custom alt text when provided', () => {
      render(<Avatar src="/test-avatar.jpg" alt="Custom alt text" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Custom alt text');
    });

    it('renders fallback with proper aria-label when no image', () => {
      render(<Avatar userName="John Doe" fallback="JD" />);

      const fallback = screen.getByLabelText("John Doe's profile picture");
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent('JD');
    });
  });

  describe('JobCard Component', () => {
    const mockJob = {
      title: 'Software Engineer',
      company: 'Tech Corp',
      type: 'Full-time',
      postedAt: '2024-01-01',
      description: 'Great opportunity for a software engineer',
      applyUrl: 'https://example.com/apply',
    };

    it('renders icons with proper accessibility attributes', () => {
      render(
        <JobCard
          {...mockJob}
          isFeatured={true}
          onSave={jest.fn()}
          onViewDetails={jest.fn()}
        />
      );

      // Featured star icon should be decorative
      const starIcon = screen
        .getByRole('article')
        .querySelector('svg[aria-hidden="true"]');
      expect(starIcon).toBeInTheDocument();

      // Button icons should be hidden since buttons have text labels
      const eyeIcon = screen
        .getByRole('button', { name: /view details/i })
        .querySelector('svg[aria-hidden="true"]');
      expect(eyeIcon).toBeInTheDocument();
    });
  });

  describe('Multimedia Accessibility', () => {
    describe('AccessibleVideo', () => {
      it('renders video with proper accessibility attributes', () => {
        render(
          <AccessibleVideo
            src="/test-video.mp4"
            title="Test Video"
            description="A test video for accessibility"
            captionSrc="/test-captions.vtt"
          />
        );

        const video = screen.getByTitle('Test Video');
        expect(video).toHaveAttribute(
          'aria-label',
          'A test video for accessibility'
        );

        const track = video.querySelector('track[kind="captions"]');
        expect(track).toBeInTheDocument();
        expect(track).toHaveAttribute('src', '/test-captions.vtt');
      });

      it('shows transcript when provided', () => {
        render(
          <AccessibleVideo
            src="/test-video.mp4"
            title="Test Video"
            transcriptSrc="/test-transcript.html"
          />
        );

        expect(screen.getByText('View Transcript')).toBeInTheDocument();
      });
    });

    describe('AccessibleAudio', () => {
      it('renders audio with proper accessibility attributes', () => {
        render(
          <AccessibleAudio
            src="/test-audio.mp3"
            title="Test Audio"
            description="A test audio file"
            transcriptSrc="/test-transcript.html"
          />
        );

        const audio = screen.getByTitle('Test Audio');
        expect(audio).toHaveAttribute('aria-label', 'A test audio file');
        expect(screen.getByText('View Transcript')).toBeInTheDocument();
      });
    });

    describe('AccessibleIframe', () => {
      it('renders iframe with proper title attribute', () => {
        render(
          <AccessibleIframe
            src="https://example.com/embed"
            title="Embedded Content"
            description="An embedded video tutorial"
          />
        );

        const iframe = screen.getByTitle('Embedded Content');
        expect(iframe).toHaveAttribute(
          'aria-label',
          'An embedded video tutorial'
        );
      });
    });
  });

  describe('Multimedia Validation', () => {
    it('validates video accessibility correctly', () => {
      const validVideo = validateMultimediaAccessibility({
        type: 'video',
        hasCaption: true,
        hasTranscript: true,
        title: 'Test Video',
      });

      expect(validVideo.isValid).toBe(true);
      expect(validVideo.issues).toHaveLength(0);

      const invalidVideo = validateMultimediaAccessibility({
        type: 'video',
        hasCaption: false,
        hasTranscript: false,
        title: 'Test Video',
      });

      expect(invalidVideo.isValid).toBe(false);
      expect(invalidVideo.issues).toContain('Video missing captions');
    });

    it('validates audio accessibility correctly', () => {
      const validAudio = validateMultimediaAccessibility({
        type: 'audio',
        hasTranscript: true,
        title: 'Test Audio',
      });

      expect(validAudio.isValid).toBe(true);

      const invalidAudio = validateMultimediaAccessibility({
        type: 'audio',
        hasTranscript: false,
        title: 'Test Audio',
      });

      expect(invalidAudio.isValid).toBe(false);
      expect(invalidAudio.issues).toContain('Audio missing transcript');
    });

    it('validates iframe accessibility correctly', () => {
      const validIframe = validateMultimediaAccessibility({
        type: 'iframe',
        title: 'Embedded Content',
      });

      expect(validIframe.isValid).toBe(true);

      const invalidIframe = validateMultimediaAccessibility({
        type: 'iframe',
      });

      expect(invalidIframe.isValid).toBe(false);
      expect(invalidIframe.issues).toContain('iframe missing title attribute');
    });
  });

  describe('SVG and Icon Accessibility', () => {
    it('ensures decorative SVGs are hidden from screen readers', () => {
      const { container } = render(
        <div>
          <svg aria-hidden="true" role="presentation">
            <path d="M10 10" />
          </svg>
        </div>
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('role', 'presentation');
    });

    it('ensures informative SVGs have proper accessibility attributes', () => {
      const { container } = render(
        <div>
          <svg aria-label="Success" role="img">
            <title>Success</title>
            <path d="M10 10" />
          </svg>
        </div>
      );

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute('aria-label', 'Success');
      expect(svg).toHaveAttribute('role', 'img');
      const titleElement = svg?.querySelector('title');
      expect(titleElement).not.toBeNull();
      expect(titleElement).toHaveTextContent('Success');
    });
  });

  describe('Emoji Accessibility', () => {
    it('ensures emoji icons have proper role and aria-label', () => {
      const { container } = render(
        <span role="img" aria-label="Target icon">
          🎯
        </span>
      );

      const emoji = container.querySelector('span');
      expect(emoji).toHaveAttribute('role', 'img');
      expect(emoji).toHaveAttribute('aria-label', 'Target icon');
    });
  });
});
