import React from 'react';

interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
  expiresIn: string;
}

export function EmailVerificationTemplate({
  userName,
  verificationUrl,
  expiresIn,
}: EmailVerificationProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2d4a3e 0%, #1d3a2e 100%)', 
        padding: '40px 20px', 
        textAlign: 'center' 
      }}>
        <h1 style={{ color: 'white', margin: '0', fontSize: '28px' }}>
          Welcome to 209 Works!
        </h1>
        <p style={{ color: '#9fdf9f', margin: '10px 0 0 0', fontSize: '16px' }}>
          Please verify your email address
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 20px', background: 'white' }}>
        <p style={{ color: '#333', fontSize: '16px', lineHeight: '1.6' }}>
          Hi {userName},
        </p>
        
        <p style={{ color: '#333', fontSize: '16px', lineHeight: '1.6' }}>
          Thank you for joining 209 Works, the Central Valley's premier job platform! 
          To complete your registration and start exploring local job opportunities, 
          please verify your email address by clicking the button below.
        </p>

        {/* Verification Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a 
            href={verificationUrl}
            style={{
              background: '#2d4a3e',
              color: 'white',
              padding: '16px 32px',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'inline-block',
              boxShadow: '0 4px 12px rgba(45, 74, 62, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            Verify Email Address
          </a>
        </div>

        {/* Alternative Link */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          margin: '30px 0',
          border: '1px solid #e9ecef'
        }}>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style={{ 
            color: '#2d4a3e', 
            fontSize: '14px', 
            wordBreak: 'break-all',
            margin: '0',
            fontFamily: 'monospace',
            background: 'white',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            {verificationUrl}
          </p>
        </div>

        {/* Security Notice */}
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          margin: '30px 0'
        }}>
          <h3 style={{ color: '#856404', margin: '0 0 10px 0', fontSize: '16px' }}>
            🔒 Security Notice
          </h3>
          <p style={{ color: '#856404', fontSize: '14px', margin: '0', lineHeight: '1.5' }}>
            This verification link will expire in <strong>{expiresIn}</strong>. 
            If you didn't create an account with 209 Works, please ignore this email.
          </p>
        </div>

        {/* What's Next */}
        <div style={{ margin: '30px 0' }}>
          <h3 style={{ color: '#2d4a3e', margin: '0 0 15px 0', fontSize: '18px' }}>
            What's Next?
          </h3>
          <ul style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Complete your profile to stand out to employers</li>
            <li style={{ marginBottom: '8px' }}>Upload your resume for quick applications</li>
            <li style={{ marginBottom: '8px' }}>Set up job alerts for your dream positions</li>
            <li style={{ marginBottom: '8px' }}>Explore local opportunities in the Central Valley</li>
          </ul>
        </div>

        {/* CTA Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #9fdf9f 0%, #8fd48f 100%)',
          padding: '25px',
          borderRadius: '8px',
          textAlign: 'center',
          margin: '30px 0'
        }}>
          <h3 style={{ color: '#2d4a3e', margin: '0 0 10px 0', fontSize: '18px' }}>
            Built for the 209. Made for the people who work here.
          </h3>
          <p style={{ color: '#2d4a3e', margin: '0', fontSize: '14px' }}>
            Join thousands of Central Valley professionals finding their next opportunity
          </p>
        </div>

        {/* Support */}
        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', textAlign: 'center' }}>
          Need help? Contact us at{' '}
          <a href="mailto:admin@209.works" style={{ color: '#2d4a3e' }}>
            admin@209.works
          </a>
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        textAlign: 'center',
        borderTop: '1px solid #e9ecef'
      }}>
        <p style={{ color: '#666', fontSize: '12px', margin: '0' }}>
          © 2024 209 Works. All rights reserved.<br />
          Your Local Job Platform for the Central Valley
        </p>
      </div>
    </div>
  );
}
