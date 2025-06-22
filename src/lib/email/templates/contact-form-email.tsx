import React from 'react';

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  submittedAt: string;
}

export function ContactFormEmail({
  name,
  email,
  subject,
  category,
  message,
  submittedAt,
}: ContactFormEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2d4a3e 0%, #1d3a2e 100%)', 
        padding: '40px 20px', 
        textAlign: 'center' 
      }}>
        <h1 style={{ color: 'white', margin: '0', fontSize: '28px' }}>
          New Contact Form Submission
        </h1>
        <p style={{ color: '#9fdf9f', margin: '10px 0 0 0', fontSize: '16px' }}>
          209 Works Contact Form
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 20px', background: 'white' }}>
        {/* Contact Info */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ color: '#2d4a3e', margin: '0 0 15px 0', fontSize: '20px' }}>
            Contact Information
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <strong style={{ color: '#495057' }}>Name:</strong>
              <span style={{ color: '#6c757d', marginLeft: '8px' }}>{name}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Email:</strong>
              <span style={{ color: '#6c757d', marginLeft: '8px' }}>{email}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Category:</strong>
              <span style={{ 
                color: '#2d4a3e', 
                marginLeft: '8px',
                background: '#9fdf9f20',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {category}
              </span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Subject:</strong>
              <span style={{ color: '#6c757d', marginLeft: '8px' }}>{subject}</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2d4a3e', margin: '0 0 15px 0', fontSize: '18px' }}>
            Message:
          </h3>
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            lineHeight: '1.6',
            color: '#495057'
          }}>
            {message.split('\n').map((line, index) => (
              <p key={index} style={{ margin: index === 0 ? '0 0 10px 0' : '10px 0' }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div style={{ 
          borderTop: '1px solid #e9ecef', 
          paddingTop: '20px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <p style={{ margin: '0' }}>
            <strong>Submitted:</strong> {submittedAt}
          </p>
          <p style={{ margin: '5px 0 0 0' }}>
            <strong>Reply to:</strong> 
            <a href={`mailto:${email}`} style={{ color: '#2d4a3e', marginLeft: '8px' }}>
              {email}
            </a>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <a 
            href={`mailto:${email}?subject=Re: ${subject}`}
            style={{
              background: '#2d4a3e',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              marginRight: '10px',
              display: 'inline-block'
            }}
          >
            Reply to {name}
          </a>
          <a 
            href="https://209.works/admin"
            style={{
              background: '#9fdf9f',
              color: '#2d4a3e',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            View Admin Dashboard
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        textAlign: 'center',
        borderTop: '1px solid #e9ecef'
      }}>
        <p style={{ color: '#6c757d', fontSize: '12px', margin: '0' }}>
          This email was sent from the 209 Works contact form.<br />
          Built for the 209. Made for the people who work here.
        </p>
      </div>
    </div>
  );
}
