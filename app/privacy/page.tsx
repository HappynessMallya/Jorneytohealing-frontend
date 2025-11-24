"use client";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary to-accent py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <h1 className="text-4xl font-bold text-text mb-8">Privacy Notice</h1>
          
          <div className="prose prose-lg max-w-none text-text/80 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-text mb-4">Introduction</h2>
              <p>
                We are committed to protecting your privacy and ensuring the security of your
                personal information. This privacy notice explains how we collect, use, and
                protect your data when you use our therapy platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text mb-4">Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal information (name, email, age range, gender identity)</li>
                <li>Questionnaire responses related to your therapy goals</li>
                <li>Booking and payment information</li>
                <li>Chat messages and session notes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text mb-4">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide therapy services and support</li>
                <li>Schedule and manage appointments</li>
                <li>Process payments securely</li>
                <li>Communicate with you about your sessions</li>
                <li>Improve our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text mb-4">Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal
                information. All data is encrypted and stored securely. Access to your information
                is restricted to authorized personnel only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text mb-4">Your Rights</h2>
              <p>Under GDPR and other privacy laws, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text mb-4">Contact Us</h2>
              <p>
                If you have questions about this privacy notice or wish to exercise your rights,
                please contact us at privacy@journeytohealing.com
              </p>
            </section>

            <section>
              <p className="text-sm text-text/60 mt-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

