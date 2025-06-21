import { NextRequest, NextResponse } from 'next/server';
import { TemplateManager } from '@/components/ui/card';
import { emailAgent } from '@/components/ui/card';
import { render } from '@/components/ui/card';
import { Html, Body, Container, Text } from '@react-email/components';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'test';
    const templateId = searchParams.get('template') || 'welcome-job-seeker';

    const templateManager = new TemplateManager();

    if (action === 'test') {
      // Test template rendering
      try {
        const preview = await templateManager.previewTemplate(templateId);

        // Check if HTML is properly formatted (React Email uses DOCTYPE + html structure)
        const hasProperHTML = (preview.html.includes('<!DOCTYPE') || preview.html.includes('<html>')) &&
                             preview.html.includes('<body>') &&
                             !preview.html.includes('&lt;html&gt;') &&
                             !preview.html.includes('&lt;body&gt;');

        const hasEscapedHTML = preview.html.includes('&lt;') ||
                              preview.html.includes('&gt;') ||
                              preview.html.includes('&amp;lt;');

        // Test React Email render directly
        const SimpleTestEmail = () => (
          React.createElement(Html, {}, [
            React.createElement(Body, { key: 'body' }, [
              React.createElement(Container, { key: 'container' }, [
                React.createElement(Text, { key: 'text' }, 'Hello from React Email!')
              ])
            ])
          ])
        );

        let reactEmailHtml = '';
        let reactEmailError = '';
        try {
          reactEmailHtml = await render(React.createElement(SimpleTestEmail));
        } catch (error) {
          reactEmailError = error instanceof Error ? error.message : 'Unknown error';
        }

        return NextResponse.json({
          success: true,
          templateId,
          test: {
            htmlLength: preview.html.length,
            textLength: preview.text.length,
            hasProperHTML,
            hasEscapedHTML,
            status: hasProperHTML && !hasEscapedHTML ? 'PASS' : 'FAIL',
          },
          preview: {
            subject: preview.subject,
            htmlPreview: preview.html.substring(0, 500),
            textPreview: preview.text.substring(0, 200) + '...',
          },
          analysis: {
            containsHtmlTag: preview.html.includes('<html>'),
            containsBodyTag: preview.html.includes('<body>'),
            containsEscapedHtml: preview.html.includes('&lt;html&gt;'),
            containsEscapedBody: preview.html.includes('&lt;body&gt;'),
            startsWithHtml: preview.html.trim().startsWith('<'),
            firstChars: preview.html.substring(0, 50),
          },
          reactEmailTest: {
            reactEmailHtml: reactEmailHtml,
            reactEmailError,
            reactEmailLength: reactEmailHtml.length,
            hasHtmlTags: reactEmailHtml.includes('<html>'),
            hasBodyTags: reactEmailHtml.includes('<body>'),
            startsWithDoctype: reactEmailHtml.trim().startsWith('<!DOCTYPE'),
            firstChars: reactEmailHtml.substring(0, 100),
          }
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          templateId,
        });
      }
    } else if (action === 'send') {
      // Test sending email (requires email parameter)
      const email = searchParams.get('email');
      if (!email) {
        return NextResponse.json({
          error: 'Email parameter required for send test',
          usage: '/api/test-email-fix?action=send&email=test@example.com&template=welcome-job-seeker'
        });
      }

      try {
        const rendered = await templateManager.previewTemplate(templateId);
        
        const result = await emailAgent.sendEmail({
          id: `test_fix_${templateId}_${Date.now()}`,
          to: [email],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          template: templateId,
          priority: 'normal',
          tags: [
            { name: 'test', value: 'email-fix' },
            { name: 'template', value: templateId },
          ],
        });

        return NextResponse.json({
          success: result.success,
          templateId,
          email,
          result,
          test: {
            htmlLength: rendered.html.length,
            hasProperHTML: rendered.html.includes('<html>') && !rendered.html.includes('&lt;html&gt;'),
          },
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          templateId,
          email,
        });
      }
    } else {
      return NextResponse.json({
        message: 'Email Template Fix Test Endpoint',
        usage: {
          test: '/api/test-email-fix?action=test&template=welcome-job-seeker',
          send: '/api/test-email-fix?action=send&email=test@example.com&template=welcome-job-seeker',
        },
        availableTemplates: templateManager.getAllTemplatesArray().map(t => t.id),
      });
    }

  } catch (error) {
    console.error('Test email fix error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
