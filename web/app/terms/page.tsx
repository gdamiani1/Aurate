import type { Metadata } from 'next';
import HazardStripe from '@/components/HazardStripe';
import GrainOverlay from '@/components/GrainOverlay';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules for using Mogster. Acceptable use, liability, governing law.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main className="relative min-h-screen bg-hazard-yellow">
      <GrainOverlay />

      <HazardStripe height="sm" label="⚠ TERMS OF SERVICE ⚠" />

      <div className="relative z-10">
        <div className="px-6 pt-6">
          <a
            href="/"
            className="font-display uppercase tracking-tight text-ink text-2xl hover:underline"
          >
            ← MOGSTER
          </a>
        </div>

        <article className="relative z-10 max-w-2xl mx-auto my-12 p-8 bg-cream text-ink border-2 border-ink font-body leading-relaxed">
          <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-none">
            TERMS OF SERVICE
          </h1>
          <p className="mt-2 font-mono text-sm">Effective 2026-04-18</p>

          <h2 className="font-display text-2xl mt-8 mb-2">Acceptance</h2>
          <p>
            Using Mogster means you agree to these terms. If you don&apos;t,
            don&apos;t use it.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">What Mogster is</h2>
          <p>
            Mogster is an AI-powered &quot;aura rating&quot; app. Upload a
            selfie, get a score, get a roast. It&apos;s for entertainment — not
            a serious psychological assessment.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">Your account</h2>
          <p>
            You&apos;re responsible for keeping your account secure. One account
            per person.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">
            Acceptable use — what NOT to do
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              No nudity, sexually explicit content, or material depicting minors
              in any context.
            </li>
            <li>
              No hate speech, slurs, or harassment directed at anyone.
            </li>
            <li>No illegal content of any kind.</li>
            <li>
              No uploading other people&apos;s images without their consent.
            </li>
            <li>
              No automated scraping, reverse engineering, or attempts to break
              the service.
            </li>
            <li>
              No pretending to be someone you&apos;re not — especially with
              intent to defraud or harass.
            </li>
          </ul>
          <p className="mt-4">
            Violations mean account termination without warning.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">
            Content you upload
          </h2>
          <p>
            You own your uploads. You grant Mogster a worldwide, royalty-free
            license to use them solely to provide the service — store them, show
            them back to you, run them through the AI rater. We never claim
            ownership of your photos and we don&apos;t use them for anything
            else.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">
            Content Mogster generates
          </h2>
          <p>
            Aura ratings, roasts, and fight narratives are AI-generated.
            They&apos;re for fun. They don&apos;t reflect the views of Grgur
            Damiani or Mogster, and they aren&apos;t a real assessment of
            anyone&apos;s character.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">
            Service availability
          </h2>
          <p>
            We try to keep Mogster up, but we don&apos;t guarantee uninterrupted
            service. Outages happen.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">Termination</h2>
          <p>
            You can delete your account anytime. If you can&apos;t delete from
            the app, email{' '}
            <a
              href="mailto:support@mogster.app"
              className="underline"
            >
              support@mogster.app
            </a>{' '}
            and we&apos;ll take care of it. We can terminate accounts that
            violate these terms.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">Disclaimer</h2>
          <p>
            Mogster is provided &quot;as is.&quot; To the maximum extent allowed
            by law, we disclaim all warranties, express or implied.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">
            Limitation of liability
          </h2>
          <p>
            To the maximum extent allowed by law, Grgur Damiani and Mogster
            aren&apos;t liable for indirect, incidental, or consequential
            damages arising from your use of the service.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">Governing law</h2>
          <p>
            These terms are governed by the laws of Croatia, without regard to
            conflict of laws principles.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">Changes</h2>
          <p>
            We&apos;ll update this page and bump the effective date when things
            change. Material changes will be notified by email.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-2">Contact</h2>
          <p>
            <a
              href="mailto:support@mogster.app"
              className="underline"
            >
              support@mogster.app
            </a>
            .
          </p>
        </article>
      </div>
    </main>
  );
}
