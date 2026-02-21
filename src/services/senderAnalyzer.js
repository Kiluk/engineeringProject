/**
 * Analyzes email sender information for suspicious patterns and phishing red flags
 */

// Common legitimate domain patterns (extend as needed)
const TRUSTED_DOMAINS = [
  'google.com',
  'microsoft.com',
  'apple.com',
  'github.com',
  'linkedin.com',
  'facebook.com',
  'twitter.com',
  'amazon.com',
  'gmail.com',
  'outlook.com',
  'yahoo.com',
];

// Known phishing/spoofing patterns
const SUSPICIOUS_PATTERNS = [
  /no-?reply/i,
  /noreply/i,
  /donotreply/i,
  /mailer-?daemon/i,
  /postmaster/i,
  /no-notification/i,
  /alert|confirm|verify|urgent|action required|update|confirm your|click here/i,
];

/**
 * Extract email domain from "Name <email@domain.com>" format
 */
export const extractDomain = (fromString) => {
  try {
    const match = fromString.match(/<([^>]+)>/);
    const email = match ? match[1] : fromString;
    const domain = email.split('@')[1]?.toLowerCase() || '';
    return { email, domain };
  } catch (e) {
    return { email: fromString, domain: '' };
  }
};

/**
 * Check if domain looks like it's impersonating a well-known brand
 */
const checkDomainImpersonation = (domain) => {
  if (!domain) return { isSuspicious: false, reason: null };

  const suspiciousPatterns = [
    { pattern: /g0ogle|g00gle/, brand: 'Google' },
    { pattern: /microso[fv]t|m1crosoft/, brand: 'Microsoft' },
    { pattern: /amaz0n|am4zon/, brand: 'Amazon' },
    { pattern: /appl3|4pple/, brand: 'Apple' },
    { pattern: /.*@.*\d.*/, reason: 'Domain contains suspicious number substitution' },
  ];

  for (const { pattern, brand, reason } of suspiciousPatterns) {
    if (pattern.test(domain)) {
      return {
        isSuspicious: true,
        reason: reason || `Possible impersonation of ${brand}`,
      };
    }
  }

  return { isSuspicious: false, reason: null };
};

/**
 * Check for known typosquatting patterns on popular domains
 */
const checkTyposquatting = (domain) => {
  const commonDomains = [
    { legit: 'google.com', variants: ['goolge.com', 'gogle.com', 'gootle.com'] },
    { legit: 'microsoft.com', variants: ['microsft.com', 'microsfot.com'] },
    { legit: 'amazon.com', variants: ['amazno.com', 'amаzon.com'] },
  ];

  for (const { variants } of commonDomains) {
    if (variants.includes(domain)) {
      return {
        isSuspicious: true,
        reason: `Possible typosquatting (similar to a legitimate domain)`,
      };
    }
  }

  return { isSuspicious: false, reason: null };
};

/**
 * Check sender address for red flag patterns
 */
const checkSenderPatterns = (fromString) => {
  const suspiciousDetails = [];

  // Check for generic/automated sender addresses
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(fromString)) {
      suspiciousDetails.push({
        isSuspicious: true,
        reason: 'Sender uses no-reply or system account pattern',
      });
    }
  }

  // Check if email lacks a display name (sometimes phishing)
  if (!fromString.includes('<') || fromString.trim().startsWith('<')) {
    suspiciousDetails.push({
      isSuspicious: true,
      reason: 'Missing sender display name (raw email only)',
    });
  }

  if (suspiciousDetails.length > 0) {
    return suspiciousDetails[0];
  }

  return { isSuspicious: false, reason: null };
};

/**
 * Check if sender domain is on trusted list
 */
const checkTrustedDomain = (domain) => {
  const isTrusted = TRUSTED_DOMAINS.some(trusted =>
    domain.endsWith(trusted) || domain === trusted
  );

  return {
    isTrusted,
    trustReason: isTrusted ? `${domain} is a known legitimate service` : null,
  };
};

/**
 * Main analysis function: Check sender legitimacy
 * Returns a risk object: { riskLevel: 'low'|'medium'|'high', warnings: [], trustScore: 0-100 }
 */
export const analyzeSender = (fromString) => {
  if (!fromString || fromString === 'Unknown') {
    return {
      riskLevel: 'high',
      warnings: ['Sender information missing or could not be parsed'],
      trustScore: 0,
      senderDetails: { email: 'Unknown', domain: 'Unknown' },
    };
  }

  const { email, domain } = extractDomain(fromString);
  const warnings = [];
  let riskScore = 50; // Start at neutral

  // Check 1: Domain impersonation
  const impersonation = checkDomainImpersonation(domain);
  if (impersonation.isSuspicious) {
    warnings.push(impersonation.reason);
    riskScore += 30;
  }

  // Check 2: Typosquatting
  const typo = checkTyposquatting(domain);
  if (typo.isSuspicious) {
    warnings.push(typo.reason);
    riskScore += 25;
  }

  // Check 3: Sender patterns
  const senderCheck = checkSenderPatterns(fromString);
  if (senderCheck.isSuspicious) {
    warnings.push(senderCheck.reason);
    riskScore += 15;
  }

  // Check 4: Trusted domain
  const trusted = checkTrustedDomain(domain);
  if (trusted.isTrusted) {
    riskScore = Math.max(0, riskScore - 40); // Lower risk for known services
  }

  // Check 5: Domain format validation
  if (!domain || domain.length < 3 || !domain.includes('.')) {
    warnings.push('Invalid domain format');
    riskScore += 20;
  }

  // Clamp score 0-100
  const trustScore = Math.max(0, Math.min(100, 100 - riskScore));

  // Determine risk level
  let riskLevel = 'low';
  if (trustScore < 40) {
    riskLevel = 'high';
  } else if (trustScore < 70) {
    riskLevel = 'medium';
  }

  return {
    riskLevel,
    warnings: warnings.length > 0 ? warnings : ['No red flags detected'],
    trustScore,
    senderDetails: {
      email,
      domain,
      isTrusted: trusted.isTrusted,
    },
  };
};

/**
 * Quick convenience function: just return if suspicious (for real-time alerts)
 */
export const isSenderSuspicious = (fromString) => {
  const analysis = analyzeSender(fromString);
  return analysis.riskLevel === 'high' || analysis.riskLevel === 'medium';
};

export const SenderAnalyzer = {
  analyzeSender,
  isSenderSuspicious,
  extractDomain,
};
