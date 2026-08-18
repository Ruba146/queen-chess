import { useState } from 'react'
import {
  Crown,
  Sparkles,
  Infinity as InfinityIcon,
  Bot,
  LineChart,
  Compass,
  LifeBuoy,
  Check,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Layers,
  Swords,
  ChevronDown,
} from 'lucide-react'
import PageContainer from '../../components/ui/PageContainer'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SectionTitle from '../../components/ui/SectionTitle'

const BENEFITS = [
  { icon: InfinityIcon, title: 'Unlimited AI Analysis', desc: 'Analyze every game with unlimited engine depth.' },
  { icon: Swords, title: 'Unlimited Games', desc: 'Play as many games as you want, anytime.' },
  { icon: Compass, title: 'Opening Explorer', desc: 'Explore the full opening database with lines.' },
  { icon: LineChart, title: 'Advanced Statistics', desc: 'Deep performance insights and trends.' },
  { icon: Bot, title: 'Personal AI Coach', desc: 'A dedicated coach adapted to your play.' },
  { icon: LifeBuoy, title: 'Priority Support', desc: 'Get help faster with priority responses.' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['3 AI analyses / day', 'Basic statistics', 'Standard play', 'Community support'],
    cta: 'Current Plan',
    variant: 'secondary',
    recommended: false,
  },
  {
    name: 'Premium Monthly',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited AI analysis',
      'Unlimited games',
      'Opening Explorer',
      'Advanced statistics',
      'Personal AI Coach',
      'Priority support',
    ],
    cta: 'Upgrade Monthly',
    variant: 'primary',
    recommended: true,
  },
  {
    name: 'Premium Yearly',
    price: '$79.99',
    period: 'per year',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Early access to new features',
      'Exclusive badge',
    ],
    cta: 'Upgrade Yearly',
    variant: 'secondary',
    recommended: false,
  },
]

const COMPARISON = [
  { feature: 'AI Game Analysis', free: '3 / day', premium: 'Unlimited' },
  { feature: 'Games / month', free: '20', premium: 'Unlimited' },
  { feature: 'Opening Explorer', free: 'Limited', premium: 'Full database' },
  { feature: 'Advanced Statistics', free: 'Basic', premium: 'Advanced' },
  { feature: 'Personal AI Coach', free: '—', premium: 'Included' },
  { feature: 'Priority Support', free: '—', premium: 'Included' },
]

const FAQS = [
  {
    icon: CreditCard,
    q: 'How does subscription billing work?',
    a: 'You are billed monthly or yearly depending on your plan. You can upgrade, downgrade, or cancel anytime from your account settings.',
  },
  {
    icon: RefreshCcw,
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancellation is instant and you keep Premium access until the end of your billing period. No hidden fees.',
  },
  {
    icon: ShieldCheck,
    q: 'Is there a free trial?',
    a: 'Yes, every Premium plan includes a 14-day free trial. Cancel anytime before the trial ends and you won\'t be charged.',
  },
  {
    icon: Layers,
    q: 'What features are included in Premium?',
    a: 'Unlimited AI analysis and games, Opening Explorer, advanced statistics, a personal AI coach, and priority support.',
  },
]

function Hero() {
  return (
    <Card padded={false} className="qc-premium-hero text-center">
      <div className="qc-premium-hero-inner">
        <Badge tone="primary" size="sm" icon={Crown}>Queen Chess Premium</Badge>
        <h1 className="qc-premium-hero-title">
          Elevate your chess to the <span className="qc-text-gradient-gold">next level</span>
        </h1>
        <p className="qc-premium-hero-desc">
          Unlock the complete AI training suite. Unlimited analysis, a personal coach, and every tool you need to reach your goals.
        </p>
        <div className="qc-premium-hero-actions">
          <Button size="sm" variant="primary" leftIcon={Crown}>Upgrade to Premium</Button>
          <Button size="sm" variant="secondary" leftIcon={Sparkles}>See Benefits</Button>
        </div>
        <p className="qc-premium-hero-note">14-day free trial · Cancel anytime</p>
      </div>
    </Card>
  )
}

function Benefits() {
  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="Premium Benefits"
        title="Everything you unlock"
        description="A complete toolkit for serious players."
        className="qc-section-head mb-3"
      />
      <div className="qc-benefits-grid">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon
          return (
            <Card key={benefit.title} hover padded={false} className="qc-benefit-card">
              <div className="qc-benefit-icon">
                <Icon className="h-4 w-4 qc-text-gold" aria-hidden="true" />
              </div>
              <h3 className="qc-benefit-title">{benefit.title}</h3>
              <p className="qc-benefit-desc">{benefit.desc}</p>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="Pricing"
        title="Simple, transparent plans"
        description="Start free. Upgrade when you're ready."
        className="qc-section-head mb-3"
      />
      <div className="qc-pricing-grid">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            hover
            padded={false}
            className={`qc-pricing-card ${plan.recommended ? 'qc-pricing-recommended' : ''}`}
          >
            {plan.recommended && (
              <Badge
                tone="warning"
                size="sm"
                icon={Crown}
                className="qc-pricing-badge"
              >
                Recommended
              </Badge>
            )}
            <div className="qc-pricing-header">
              <h3 className="qc-pricing-name">{plan.name}</h3>
              <div className="qc-pricing-price-row">
                <span className="qc-pricing-price">{plan.price}</span>
                <span className="qc-pricing-period">{plan.period}</span>
              </div>
            </div>
            <ul className="qc-pricing-features">
              {plan.features.map((feature) => (
                <li key={feature} className="qc-pricing-feature">
                  <Check className="h-3.5 w-3.5 shrink-0 qc-text-success" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={plan.variant}
              fullWidth
              disabled={plan.name === 'Free'}
              className="qc-pricing-cta"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Comparison() {
  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="Comparison"
        title="Free vs Premium"
        className="qc-section-head mb-3"
      />
      <Card padded={false} className="qc-comparison-card">
        <div className="qc-comparison-scroll">
          <table className="qc-comparison-table">
            <thead>
              <tr className="qc-comparison-head">
                <th className="qc-comparison-th">Feature</th>
                <th className="qc-comparison-th">Free</th>
                <th className="qc-comparison-th qc-comparison-th-premium">
                  <span className="qc-comparison-premium-label">
                    <Crown className="h-3.5 w-3.5" aria-hidden="true" /> Premium
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="qc-comparison-row">
                  <td className="qc-comparison-td">{row.feature}</td>
                  <td className="qc-comparison-td qc-text-muted">{row.free}</td>
                  <td className="qc-comparison-td qc-comparison-td-premium font-medium qc-text-primary">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="FAQ"
        title="Frequently asked questions"
        className="qc-section-head mb-3"
      />
      <div className="qc-faq-list">
        {FAQS.map((faq, idx) => {
          const Icon = faq.icon
          const isOpen = openIndex === idx
          return (
            <div
              key={faq.q}
              className={`qc-faq-item ${isOpen ? 'qc-faq-open' : ''}`}
            >
              <button
                className="qc-faq-trigger"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <div className="qc-faq-icon">
                  <Icon className="h-3.5 w-3.5 qc-text-gold" aria-hidden="true" />
                </div>
                <span className="qc-faq-question">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 qc-text-muted qc-faq-chevron ${isOpen ? 'qc-faq-chevron-open' : ''}`} />
              </button>
              {isOpen && (
                <div className="qc-faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="qc-section">
      <Card padded={false} className="qc-final-cta text-center">
        <div className="qc-final-cta-inner">
          <div className="qc-final-cta-icon">
            <Crown className="h-6 w-6 qc-text-primary" aria-hidden="true" />
          </div>
          <h2 className="qc-final-cta-title">Ready to become a stronger player?</h2>
          <p className="qc-final-cta-desc">
            Join Premium today and unlock the full power of your AI training suite. Start your 14-day free trial now.
          </p>
          <div className="qc-final-cta-actions">
            <Button size="sm" variant="primary" leftIcon={Crown}>Upgrade to Premium</Button>
            <Button size="sm" variant="secondary">View Plans</Button>
          </div>
          <p className="qc-final-cta-note">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Secure checkout · No payment required to start
          </p>
        </div>
      </Card>
    </section>
  )
}

function Premium() {
  return (
    <PageContainer maxWidth="max-w-7xl">
      <div className="qc-page-premium">
        <Hero />
        <Benefits />
        <Pricing />
        <Comparison />
        <FAQ />
        <FinalCta />
      </div>
    </PageContainer>
  )
}

export default Premium
