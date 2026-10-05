import TermsPage from '../components/TermsPage'

const sections = [
  {
    title: 'Introduction & Acceptance of Terms',
    paragraphs: [
      'By downloading the ALEOS Mobile App, completing the registration process, scanning an ALEOS QR code, or utilizing any services on the platform, you agree to be bound by these Terms & Conditions. If you do not agree with these terms, please do not use the ALEOS app or network services.',
    ],
  },
  {
    title: 'Membership Eligibility & Account Setup',
    points: [
      [
        'Free Account Creation',
        'Registration on ALEOS is 100% free with zero joining fees or mandatory subscription costs for shoppers and general members.',
      ],
      [
        'Account Authenticity',
        'You must register using a valid mobile number, full name, and accurate credentials. Each individual is permitted to maintain only one (1) active member account.',
      ],
      [
        'Age Requirement',
        'You must be at least 18 years of age or possess legal parental/guardian consent to use the ALEOS platform and conduct local transactions.',
      ],
    ],
  },
  {
    title: 'Earning Reward Points',
    points: [
      [
        'Transaction Rewards',
        "When you complete an eligible purchase at a participating ALEOS merchant and scan the store QR code, reward points are automatically credited to your ALEOS Member Wallet based on the store's active reward percentage.",
      ],
      [
        'Reward Split Mechanics',
        "For every bill processed through the ALEOS system, the merchant's funded reward pool (the % set by the merchant) is credited as follows:",
      ],
    ],
    list: [
      '80% to Your Wallet: Credited directly as reward points for future savings across the network.',
      '10% to Your Referrer: Credited to the active member who introduced you to the ALEOS network.',
      '10% to ALEOS: Retained as platform maintenance and processing service fees.',
    ],
    after: [
      ['Calculations', 'Points are calculated on the final gross bill amount verified by the merchant at the billing counter.'],
    ],
  },
  {
    title: 'Referral Engine & Referral Earnings',
    points: [
      [
        '10% Referral Cut',
        'As an active member, you receive a unique referral link/QR code. Every time a member registered via your link completes a purchase at any ALEOS partner store, you earn 10% of the active reward pool credited directly to your wallet.',
      ],
      [
        'Non-Transferable Links',
        'Referral links are unique to your account. Creating dummy accounts, self-referring via secondary phone numbers, or manipulating referral trees is considered a breach of policy.',
      ],
    ],
  },
  {
    title: 'Point Redemption & Network Usage',
    points: [
      [
        'Cross-Merchant Redemption',
        'Reward points earned at one shop (e.g., a local cafe) may be redeemed towards purchases at other participating merchants (e.g., a salon, electronics store, or grocery store) within the ALEOS network, subject to merchant acceptance rules.',
      ],
      [
        'Points Nature',
        'ALEOS reward points are digital promotional credits used exclusively within the ALEOS merchant network. Points carry no direct monetary value outside the platform and cannot be sold, bartered, or transferred to unverified third parties.',
      ],
      [
        'Point Expiry',
        'Reward points remain active as long as your account remains in good standing. Inactive accounts (no app activity or transactions for 365 consecutive days) may result in the forfeiture or expiration of accrued points.',
      ],
    ],
  },
  {
    title: 'Local Services, Jobs & Event Listings',
    points: [
      [
        'Directory Platform',
        'ALEOS provides local service listings (e.g., plumbers, electricians, dentists), job openings, and local event promotional listings for informational purposes.',
      ],
      [
        'Independent Vendors',
        'Service providers, employers, and event organizers listed on ALEOS are independent entities. ALEOS does not employ, guarantee, or directly warrant the quality, safety, outcome, or legality of third-party services, job offers, or local events.',
      ],
    ],
  },
  {
    title: 'Acceptable Use & Anti-Fraud Policy',
    paragraphs: ['To protect the integrity of the local merchant network, members agree NOT to:'],
    list: [
      'Generate fake transactions or engage in circular QR scanning with merchants without making a genuine purchase.',
      'Use automated tools, bots, or scripts to manipulate points or referral earnings.',
      'Share or sell access to their account or wallet credentials to third parties.',
      'Engage in fraudulent chargebacks or abusive behavior toward local shop owners or ALEOS support staff.',
    ],
  },
  {
    title: 'Account Suspension & Point Forfeiture',
    points: [
      [
        'Violation Consequences',
        'ALEOS reserves the right to immediately suspend or permanently terminate any member account found engaging in fraud, fake referrals, or terms violations.',
      ],
      [
        'Forfeiture',
        'Upon account termination for fraudulent activity, all accrued reward points and referral earnings shall be immediately forfeited and canceled.',
      ],
    ],
  },
  {
    title: 'Privacy & Data Security',
    paragraphs: [
      'Your privacy is essential to us. ALEOS collects minimal necessary personal data (phone number, name, general transaction location) strictly to operate the rewards program and connect you with nearby merchants.',
      'ALEOS complies with applicable Indian data protection laws and does not sell your personal financial credentials to third-party advertisers.',
    ],
  },
  {
    title: 'Limitation of Liability & Disclaimers',
    paragraphs: [
      'ALEOS acts as a digital technology platform connecting shoppers with independent merchants and service providers.',
      'ALEOS is not liable for merchant product defects, store service disputes, pricing discrepancies directly set by shopkeepers, or personal injury occurring at physical store premises.',
    ],
  },
  {
    title: 'Governing Law & Dispute Resolution',
    paragraphs: [
      'These Terms and Conditions are governed by and construed in accordance with the laws of India. Any legal disputes arising under these terms shall fall under the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.',
    ],
  },
]

export default function TermsMember() {
  return (
    <TermsPage
      title="Member & Shopper Terms & Conditions"
      appliesTo={'Registered Members, Shoppers, Referrers, and App Users ("Member", "Shopper", "User", "You")'}
      sections={sections}
      contactTitle="Contact & Customer Support"
      contactText="For questions, point queries, or account assistance"
    />
  )
}
