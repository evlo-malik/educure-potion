import React from 'react';

export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
      
      <div className="prose prose-indigo max-w-none">
        <p className="text-lg text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit our website. They help us make your experience better while you use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Authentication and security</li>
            <li>Preferences and settings</li>
            <li>Analytics and performance</li>
            <li>Personalization</li>
            <li>Feature functionality</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Essential Cookies:</strong> Required for basic functionality
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your settings and preferences
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how you use our service
            </li>
            <li>
              <strong>Marketing Cookies:</strong> Used to deliver relevant content
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact the functionality of our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
          <p>
            We may use third-party services that use cookies. These third-party cookies are governed by their respective privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p>
            If you have questions about our Cookie Policy, please contact us at:
          </p>
          <p className="mt-4">
            <strong>Email:</strong> privacy@educure.ai<br />
            <strong>Address:</strong> 123 Innovation Drive, Tech Valley, CA 94043
          </p>
        </section>
      </div>
    </div>
  );
}