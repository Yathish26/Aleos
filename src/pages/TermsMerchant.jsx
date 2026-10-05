import TermsPage from '../components/TermsPage'

const sections = [
  {
    title: 'Introduction & Acceptance of Terms',
    paragraphs: [
      'By completing the registration process or displaying the ALEOS QR code at your store/establishment, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you should not register or utilize the ALEOS platform.',
    ],
  },
  {
    title: 'Onboarding & Account Registration',
    points: [
      [
        '100% Free Retail Onboarding',
        'Registration and onboarding for offline retail shop merchants (e.g., Cafes, Salons, Mobile Stores, Grocery, Apparel) are completely free with ₹0 joining fee, ₹0 setup cost, and ₹0 monthly rental.',
      ],
      [
        'Self-Onboarding',
        'Merchants may complete the registration and counter setup on their own mobile device in approximately two (2) minutes.',
      ],
      [
        'Accuracy of Information',
        'You agree to provide accurate business details, store name, category, address, contact numbers, and payment verification credentials during registration.',
      ],
    ],
  },
  {
    title: 'Custom Offer Percentage & Margin Control',
    points: [
      [
        'Merchant Autonomy',
        "You have full control over setting your store's custom reward percentage (ranging typically from 2% to 20% or higher) based on your business margins.",
      ],
      [
        'Binding Rates',
        "The active percentage set in your ALEOS Seller App at the time of a transaction will be the rate applied to the customer's gross bill amount.",
      ],
      [
        'Updates to Offers',
        'You may update or modify your offer percentage at any time through the ALEOS Seller App. Changes take effect immediately for subsequent transactions.',
      ],
    ],
  },
  {
    title: 'Advance Merchant Fund, Wallet Float & Interest Terms',
    points: [
      [
        'Advance Reserve Pool Requirement',
        'To ensure instant payout of customer reward points and referral incentives, merchants agree to maintain an advance floating balance ("Merchant Reward Fund") in their ALEOS Seller Wallet. Reward points and referral cuts are disbursed from this pre-funded balance upon transaction completion.',
      ],
      [
        'Float Funds & Interest Allocation',
        'All unredeemed balances, advance deposits, and float funds maintained in ALEOS banking or escrow accounts are held in pooled accounts. Merchant acknowledges and agrees that any interest, treasury yield, or floating revenue accrued on these bank deposits shall belong exclusively to ALEOS and will be utilized to cover platform security, infrastructure maintenance, and payment processing fees.',
      ],
    ],
  },
  {
    title: 'Reward Issuance, Commission Split & Daily Withdrawal Limits',
    points: [
      [
        'Pay-Only-On-Sale',
        'ALEOS charges no baseline maintenance or transaction fees unless an actual customer completes a scan and transaction at your counter.',
      ],
      [
        'Reward Point Pool Distribution',
        'When a customer transacts and earns points based on your active reward percentage, the total allocated reward pool is distributed as follows:',
      ],
    ],
    list: [
      '80% to Customer Wallet: Issued directly to the purchasing member as reward points for repeat redemptions across the ALEOS network.',
      '10% to Referrer Pool: Distributed to the active member who referred the buyer to the network.',
      '10% ALEOS Platform Fee: Deducted automatically as the platform service fee upon point issuance.',
    ],
    after: [
      [
        'Daily Withdrawal Limit',
        'To ensure network stability, risk management, and operational security, merchant balance payouts and wallet withdrawals are capped at a maximum of ₹5,000 per day per registered business account.',
      ],
      [
        'Transparency',
        'All point distributions, wallet balances, and platform deductions are reflected transparently in real time on your ALEOS Seller Dashboard.',
      ],
    ],
  },
  {
    title: 'Non-Retail Tiered Subscriptions & B2B Listing Fees',
    paragraphs: [
      'While retail merchant onboarding is 100% free, specialized service providers, B2B players, and promoters agree to the following fixed pricing models (exclusive of applicable taxes/GST):',
    ],
    table: {
      head: ['Category / Service Type', 'Target Entities', 'Fee / Billing Model'],
      rows: [
        [
          'Local Service Professionals',
          'Plumbers, Electricians, Dentists, Salons-on-call',
          '₹199 + tax / month (fixed subscription)',
        ],
        ['Events & Expos', 'Event Organizers, Local Promoters', '₹1,999 + tax / event listing fee'],
        ['Job Postings', 'Local Stores & Businesses hiring staff', '₹49 + tax / job post micro-fee'],
        ['Manufacturers', 'B2B Product Suppliers & Producers', '₹1,999 + tax / month subscription'],
        ['Distributors', 'Regional Wholesale Distributors', '₹1,499 + tax / month subscription'],
        ['Dealers', 'Authorized Brand Dealers', '₹999 + tax / month subscription'],
      ],
    },
    note: 'Subscription payments are non-refundable once the listing or service period goes live.',
  },
  {
    title: 'Merchant Obligations & In-Store Guidelines',
    points: [
      [
        'Display of QR Standee',
        'Merchant agrees to display the official ALEOS QR standee or counter code visibly at the primary billing counter.',
      ],
      [
        'Honor Rewards',
        'Merchant must honor the reward point calculations processed via the app and must not charge additional hidden surcharges to customers using the ALEOS app.',
      ],
      [
        'Quality of Goods & Services',
        'Merchant remains solely responsible for the quality, safety, legality, and delivery of products or services sold at their physical store.',
      ],
    ],
  },
  {
    title: 'Fraud Prevention & Account Misuse',
    points: [
      [
        'Strict Zero-Tolerance for Fraud',
        'Fake transactions, self-referral loops, artificial bill inflations, or fraudulent point generation schemes are strictly prohibited.',
      ],
      [
        'Audit & Suspension',
        'ALEOS reserves the right to audit transaction logs and immediately suspend or terminate any merchant account suspected of fraudulent activities or policy abuse, forfeiting any pending platform payouts or balances.',
      ],
    ],
  },
  {
    title: 'Cancellation & Termination',
    points: [
      [
        'No Lock-In Contract',
        'Retail merchants may suspend or cease participation on the ALEOS platform at any time without penalty or exit fees, subject to settlement of outstanding customer reward commitments.',
      ],
      [
        'Termination by ALEOS',
        'ALEOS reserves the right to deactivate a merchant account for violation of these terms, non-compliance with local laws, or extended inactivity.',
      ],
    ],
  },
  {
    title: 'Limitation of Liability',
    paragraphs: [
      'ALEOS acts solely as a technological enabler and customer discovery platform. ALEOS is not liable for store-level product disputes, customer payment defaults on merchant UPI, or indirect business loss.',
    ],
  },
  {
    title: 'Governing Law & Dispute Resolution',
    paragraphs: [
      'These Terms and Conditions are governed by the laws of India. Any legal disputes arising out of or in connection with the platform shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.',
    ],
  },
]

export default function TermsMerchant() {
  return (
    <TermsPage
      title="Merchant Terms & Conditions"
      appliesTo={
        'Registered Merchants, Retail Store Owners, Service Professionals, B2B Entities, and Event Organizers ("Merchant", "Seller", "You")'
      }
      sections={sections}
      contactTitle="Contact & Merchant Support"
      contactText="For onboarding support, terms clarification, or technical assistance"
    />
  )
}
