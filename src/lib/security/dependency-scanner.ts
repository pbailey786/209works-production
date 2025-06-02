import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// Types for vulnerability data
export interface VulnerabilityInfo {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  package: string;
  version: string;
  vulnerableVersions: string;
  patchedVersions?: string;
  recommendation: string;
  overview: string;
  references?: string[];
  cwe?: string[];
  cvss?: {
    score: number;
    vectorString: string;
  };
}

export interface ScanResult {
  timestamp: string;
  totalVulnerabilities: number;
  vulnerabilities: VulnerabilityInfo[];
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
  };
  recommendations: string[];
}

// Security configuration
const SECURITY_CONFIG = {
  // Severity levels that should fail CI/CD
  failOnSeverity: ['critical', 'high'],
  
  // Maximum age for vulnerability database (in days)
  maxDatabaseAge: 7,
  
  // Packages to ignore (with justification)
  ignoredVulnerabilities: [
    // Example: 'GHSA-xxxx-xxxx-xxxx' // Reason: False positive for our use case
  ],
  
  // Output formats
  outputFormats: ['json', 'text', 'sarif'] as const,
};

export class DependencyScanner {
  private projectRoot: string;
  
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }
  
  // Scan using npm audit
  async scanWithNpmAudit(): Promise<ScanResult> {
    try {
      console.log('🔍 Running npm audit scan...');
      
      const auditOutput = execSync('npm audit --json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      
      const auditData = JSON.parse(auditOutput);
      return this.parseNpmAuditResults(auditData);
    } catch (error: any) {
      // npm audit exits with non-zero code when vulnerabilities are found
      if (error.stdout) {
        const auditData = JSON.parse(error.stdout);
        return this.parseNpmAuditResults(auditData);
      }
      throw new Error(`Failed to run npm audit: ${error.message}`);
    }
  }
  
  // Scan using Snyk (if available)
  async scanWithSnyk(): Promise<ScanResult> {
    try {
      console.log('🔍 Running Snyk scan...');
      
      const snykOutput = execSync('snyk test --json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      
      const snykData = JSON.parse(snykOutput);
      return this.parseSnykResults(snykData);
    } catch (error: any) {
      if (error.stdout) {
        const snykData = JSON.parse(error.stdout);
        return this.parseSnykResults(snykData);
      }
      
      // If Snyk is not installed, fall back to npm audit
      console.warn('Snyk not available, falling back to npm audit');
      return this.scanWithNpmAudit();
    }
  }
  
  // Parse npm audit results
  private parseNpmAuditResults(auditData: any): ScanResult {
    const vulnerabilities: VulnerabilityInfo[] = [];
    const summary = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
    
    if (auditData.vulnerabilities) {
      for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities as any)) {
        const vuln = vulnData as any;
        
        const vulnerability: VulnerabilityInfo = {
          id: vuln.source || `npm-${packageName}`,
          title: vuln.title || `Vulnerability in ${packageName}`,
          severity: this.normalizeSeverity(vuln.severity),
          package: packageName,
          version: vuln.range || 'unknown',
          vulnerableVersions: vuln.range || 'unknown',
          recommendation: this.generateRecommendation(vuln),
          overview: vuln.overview || 'No description available',
          references: vuln.references ? [vuln.url] : undefined,
        };
        
        vulnerabilities.push(vulnerability);
        summary[vulnerability.severity as keyof typeof summary]++;
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      summary,
      recommendations: this.generateRecommendations(vulnerabilities),
    };
  }
  
  // Parse Snyk results
  private parseSnykResults(snykData: any): ScanResult {
    const vulnerabilities: VulnerabilityInfo[] = [];
    const summary = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
    
    if (snykData.vulnerabilities) {
      for (const vuln of snykData.vulnerabilities) {
        const vulnerability: VulnerabilityInfo = {
          id: vuln.id,
          title: vuln.title,
          severity: this.normalizeSeverity(vuln.severity),
          package: vuln.packageName,
          version: vuln.version,
          vulnerableVersions: vuln.semver?.vulnerable?.[0] || 'unknown',
          patchedVersions: vuln.semver?.unaffected?.[0],
          recommendation: vuln.fixedIn ? `Update to version ${vuln.fixedIn}` : 'No fix available',
          overview: vuln.description,
          references: vuln.references,
          cwe: vuln.identifiers?.CWE,
          cvss: vuln.cvssScore ? {
            score: vuln.cvssScore,
            vectorString: vuln.CVSSv3,
          } : undefined,
        };
        
        vulnerabilities.push(vulnerability);
        summary[vulnerability.severity as keyof typeof summary]++;
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      summary,
      recommendations: this.generateRecommendations(vulnerabilities),
    };
  }
  
  // Normalize severity levels
  private normalizeSeverity(severity: string): VulnerabilityInfo['severity'] {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'moderate':
      case 'medium':
        return 'moderate';
      case 'low':
        return 'low';
      default:
        return 'info';
    }
  }
  
  // Generate recommendation for vulnerability
  private generateRecommendation(vuln: any): string {
    if (vuln.fixAvailable) {
      return `Run 'npm audit fix' to automatically fix this vulnerability`;
    }
    
    if (vuln.url) {
      return `Review vulnerability details at ${vuln.url} and update manually`;
    }
    
    return 'Review and update the package to a secure version';
  }
  
  // Generate overall recommendations
  private generateRecommendations(vulnerabilities: VulnerabilityInfo[]): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalCount > 0) {
      recommendations.push(`🚨 ${criticalCount} critical vulnerabilities found - immediate action required`);
    }
    
    if (highCount > 0) {
      recommendations.push(`⚠️ ${highCount} high severity vulnerabilities found - update soon`);
    }
    
    recommendations.push('Run "npm audit fix" to automatically fix known vulnerabilities');
    recommendations.push('Review all vulnerabilities and update dependencies regularly');
    recommendations.push('Consider using automated dependency update tools like Dependabot');
    
    return recommendations;
  }
  
  // Check if scan should fail CI/CD
  shouldFailBuild(scanResult: ScanResult): boolean {
    return SECURITY_CONFIG.failOnSeverity.some(severity => 
      scanResult.summary[severity as keyof typeof scanResult.summary] > 0
    );
  }
  
  // Save scan results to file
  async saveScanResults(scanResult: ScanResult, format: 'json' | 'text' | 'sarif' = 'json'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `security-scan-${timestamp}.${format}`;
    const filePath = path.join(this.projectRoot, 'security-reports', fileName);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    let content: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(scanResult, null, 2);
        break;
      case 'text':
        content = this.formatTextReport(scanResult);
        break;
      case 'sarif':
        content = JSON.stringify(this.convertToSarif(scanResult), null, 2);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`📄 Scan results saved to: ${filePath}`);
    
    return filePath;
  }
  
  // Format text report
  private formatTextReport(scanResult: ScanResult): string {
    let report = `Security Scan Report\n`;
    report += `Generated: ${scanResult.timestamp}\n`;
    report += `Total Vulnerabilities: ${scanResult.totalVulnerabilities}\n\n`;
    
    report += `Summary:\n`;
    report += `- Critical: ${scanResult.summary.critical}\n`;
    report += `- High: ${scanResult.summary.high}\n`;
    report += `- Moderate: ${scanResult.summary.moderate}\n`;
    report += `- Low: ${scanResult.summary.low}\n`;
    report += `- Info: ${scanResult.summary.info}\n\n`;
    
    if (scanResult.vulnerabilities.length > 0) {
      report += `Vulnerabilities:\n`;
      report += `================\n\n`;
      
      for (const vuln of scanResult.vulnerabilities) {
        report += `${vuln.severity.toUpperCase()}: ${vuln.title}\n`;
        report += `Package: ${vuln.package} (${vuln.version})\n`;
        report += `Recommendation: ${vuln.recommendation}\n`;
        report += `Overview: ${vuln.overview}\n`;
        if (vuln.references) {
          report += `References: ${vuln.references.join(', ')}\n`;
        }
        report += `\n`;
      }
    }
    
    report += `Recommendations:\n`;
    report += `===============\n`;
    for (const rec of scanResult.recommendations) {
      report += `- ${rec}\n`;
    }
    
    return report;
  }
  
  // Convert to SARIF format (for GitHub Code Scanning)
  private convertToSarif(scanResult: ScanResult): any {
    return {
      version: '2.1.0',
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [{
        tool: {
          driver: {
            name: '209Jobs Security Scanner',
            version: '1.0.0',
            informationUri: 'https://209.works/security',
          },
        },
        results: scanResult.vulnerabilities.map(vuln => ({
          ruleId: vuln.id,
          message: {
            text: vuln.title,
          },
          level: this.severityToSarifLevel(vuln.severity),
          locations: [{
            physicalLocation: {
              artifactLocation: {
                uri: 'package.json',
              },
              region: {
                startLine: 1,
                startColumn: 1,
              },
            },
          }],
          properties: {
            package: vuln.package,
            version: vuln.version,
            recommendation: vuln.recommendation,
          },
        })),
      }],
    };
  }
  
  // Convert severity to SARIF level
  private severityToSarifLevel(severity: VulnerabilityInfo['severity']): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'moderate':
        return 'warning';
      case 'low':
      case 'info':
        return 'note';
      default:
        return 'note';
    }
  }
}

// CLI interface for the scanner
export async function runSecurityScan(options: {
  projectRoot?: string;
  tool?: 'npm' | 'snyk' | 'auto';
  format?: 'json' | 'text' | 'sarif';
  failOnVulnerabilities?: boolean;
} = {}): Promise<ScanResult> {
  const {
    projectRoot = process.cwd(),
    tool = 'auto',
    format = 'json',
    failOnVulnerabilities = true,
  } = options;
  
  const scanner = new DependencyScanner(projectRoot);
  
  let scanResult: ScanResult;
  
  try {
    switch (tool) {
      case 'npm':
        scanResult = await scanner.scanWithNpmAudit();
        break;
      case 'snyk':
        scanResult = await scanner.scanWithSnyk();
        break;
      case 'auto':
      default:
        // Try Snyk first, fall back to npm audit
        try {
          scanResult = await scanner.scanWithSnyk();
        } catch {
          scanResult = await scanner.scanWithNpmAudit();
        }
        break;
    }
    
    // Save results
    await scanner.saveScanResults(scanResult, format);
    
    // Print summary
    console.log('\n📊 Security Scan Summary:');
    console.log(`Total vulnerabilities: ${scanResult.totalVulnerabilities}`);
    console.log(`Critical: ${scanResult.summary.critical}`);
    console.log(`High: ${scanResult.summary.high}`);
    console.log(`Moderate: ${scanResult.summary.moderate}`);
    console.log(`Low: ${scanResult.summary.low}`);
    
    // Check if should fail build
    if (failOnVulnerabilities && scanner.shouldFailBuild(scanResult)) {
      console.error('\n❌ Build should fail due to critical/high severity vulnerabilities');
      process.exit(1);
    }
    
    if (scanResult.totalVulnerabilities === 0) {
      console.log('\n✅ No vulnerabilities found!');
    } else {
      console.log('\n⚠️ Vulnerabilities found - please review and update dependencies');
    }
    
    return scanResult;
  } catch (error) {
    console.error('Error running security scan:', error);
    throw error;
  }
}
