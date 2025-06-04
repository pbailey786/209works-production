interface WebhookConfig {
  discordWebhookUrl?: string;
  emailWebhookUrl?: string;
  slackWebhookUrl?: string;
}

interface AlertNotification {
  type: 'job_spam' | 'resume_flood' | 'unusual_activity' | 'system_error' | 'security_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: any;
  timestamp: string;
}

class WebhookService {
  private config: WebhookConfig;

  constructor() {
    this.config = {
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
      emailWebhookUrl: process.env.EMAIL_WEBHOOK_URL,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    };
  }

  async sendAlert(alert: AlertNotification): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to Discord if configured
    if (this.config.discordWebhookUrl) {
      promises.push(this.sendDiscordAlert(alert));
    }

    // Send to email webhook if configured
    if (this.config.emailWebhookUrl) {
      promises.push(this.sendEmailAlert(alert));
    }

    // Send to Slack if configured
    if (this.config.slackWebhookUrl) {
      promises.push(this.sendSlackAlert(alert));
    }

    // Execute all webhook calls
    await Promise.allSettled(promises);
  }

  private async sendDiscordAlert(alert: AlertNotification): Promise<void> {
    if (!this.config.discordWebhookUrl) return;

    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);

    const embed = {
      title: `${emoji} ${alert.title}`,
      description: alert.description,
      color: color,
      fields: [
        {
          name: 'Severity',
          value: alert.severity.toUpperCase(),
          inline: true,
        },
        {
          name: 'Type',
          value: alert.type.replace('_', ' ').toUpperCase(),
          inline: true,
        },
        {
          name: 'Timestamp',
          value: new Date(alert.timestamp).toLocaleString(),
          inline: true,
        },
      ],
      footer: {
        text: '209 Works Admin Alert System',
      },
      timestamp: alert.timestamp,
    };

    // Add additional fields based on alert type
    if (alert.data) {
      if (alert.data.userId) {
        embed.fields.push({
          name: 'User ID',
          value: alert.data.userId,
          inline: true,
        });
      }
      if (alert.data.email) {
        embed.fields.push({
          name: 'Email',
          value: alert.data.email,
          inline: true,
        });
      }
      if (alert.data.count || alert.data.jobCount || alert.data.queryCount) {
        const count = alert.data.count || alert.data.jobCount || alert.data.queryCount;
        embed.fields.push({
          name: 'Count',
          value: count.toString(),
          inline: true,
        });
      }
    }

    const payload = {
      username: '209 Works Alert Bot',
      avatar_url: 'https://209.works/favicon.ico',
      embeds: [embed],
    };

    try {
      const response = await fetch(this.config.discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to send Discord webhook:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending Discord webhook:', error);
    }
  }

  private async sendEmailAlert(alert: AlertNotification): Promise<void> {
    if (!this.config.emailWebhookUrl) return;

    const payload = {
      to: process.env.ADMIN_EMAIL || 'admin@209.works',
      subject: `[209 Works Alert] ${alert.severity.toUpperCase()}: ${alert.title}`,
      html: this.generateEmailHTML(alert),
      text: this.generateEmailText(alert),
    };

    try {
      const response = await fetch(this.config.emailWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to send email webhook:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending email webhook:', error);
    }
  }

  private async sendSlackAlert(alert: AlertNotification): Promise<void> {
    if (!this.config.slackWebhookUrl) return;

    const color = this.getSeveritySlackColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);

    const payload = {
      username: '209 Works Alert Bot',
      icon_emoji: ':warning:',
      attachments: [
        {
          color: color,
          title: `${emoji} ${alert.title}`,
          text: alert.description,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Type',
              value: alert.type.replace('_', ' ').toUpperCase(),
              short: true,
            },
            {
              title: 'Timestamp',
              value: new Date(alert.timestamp).toLocaleString(),
              short: false,
            },
          ],
          footer: '209 Works Admin Alert System',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to send Slack webhook:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending Slack webhook:', error);
    }
  }

  private getSeverityColor(severity: string): number {
    switch (severity) {
      case 'critical': return 0xff0000; // Red
      case 'high': return 0xff8c00; // Dark Orange
      case 'medium': return 0xffd700; // Gold
      case 'low': return 0x32cd32; // Lime Green
      default: return 0x808080; // Gray
    }
  }

  private getSeveritySlackColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ffd700';
      case 'low': return 'good';
      default: return '#808080';
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  }

  private generateEmailHTML(alert: AlertNotification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #2d4a3e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-box { 
            border-left: 4px solid ${this.getSeverityHexColor(alert.severity)}; 
            background-color: #f9f9f9; 
            padding: 15px; 
            margin: 20px 0; 
          }
          .severity { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 4px; 
            color: white; 
            background-color: ${this.getSeverityHexColor(alert.severity)}; 
            font-weight: bold; 
          }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .data-table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>209 Works System Alert</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2>${alert.title}</h2>
            <p><span class="severity">${alert.severity.toUpperCase()}</span></p>
            <p>${alert.description}</p>
            <p><strong>Type:</strong> ${alert.type.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            
            ${alert.data && Object.keys(alert.data).length > 0 ? `
              <h3>Additional Details:</h3>
              <table class="data-table">
                ${Object.entries(alert.data).map(([key, value]) => `
                  <tr>
                    <th>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>
                    <td>${value}</td>
                  </tr>
                `).join('')}
              </table>
            ` : ''}
          </div>
          
          <p>Please log into the admin dashboard to investigate and resolve this alert.</p>
          <p><a href="https://209.works/admin" style="background-color: #2d4a3e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Go to Admin Dashboard</a></p>
        </div>
      </body>
      </html>
    `;
  }

  private generateEmailText(alert: AlertNotification): string {
    let text = `209 Works System Alert\n\n`;
    text += `Title: ${alert.title}\n`;
    text += `Severity: ${alert.severity.toUpperCase()}\n`;
    text += `Type: ${alert.type.replace('_', ' ').toUpperCase()}\n`;
    text += `Description: ${alert.description}\n`;
    text += `Timestamp: ${new Date(alert.timestamp).toLocaleString()}\n\n`;

    if (alert.data && Object.keys(alert.data).length > 0) {
      text += `Additional Details:\n`;
      Object.entries(alert.data).forEach(([key, value]) => {
        text += `- ${key}: ${value}\n`;
      });
      text += '\n';
    }

    text += `Please log into the admin dashboard to investigate and resolve this alert.\n`;
    text += `Admin Dashboard: https://209.works/admin`;

    return text;
  }

  private getSeverityHexColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8c00';
      case 'medium': return '#ffd700';
      case 'low': return '#32cd32';
      default: return '#808080';
    }
  }
}

export const webhookService = new WebhookService();
