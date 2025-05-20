import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="mb-4">
          At MonsterData, we respect your privacy. This policy explains how we collect, use, and protect your information.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2">Information We Collect</h2>
        <p className="mb-4">
          We do not collect personal information directly. However, third-party services such as Google AdSense may use cookies and similar technologies to display relevant ads.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2">Use of Information</h2>
        <p className="mb-4">
          The information collected is used solely to improve user experience and show relevant advertisements.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2">Cookies</h2>
        <p className="mb-4">
          This site uses third-party cookies, including Google and its partners, to serve ads based on your previous visits to this or other websites.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2">Your Choices</h2>
        <p className="mb-4">
          You can opt out of personalized advertising by visiting <a
            href="https://www.aboutads.info"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >www.aboutads.info</a>.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2">Contact</h2>
        <p className="mb-4">
          If you have any questions about this policy, feel free to contact us at: <a
            href="mailto:andres0613@icloud.com"
            className="text-blue-600 hover:underline"
          >andres0613@icloud.com</a>.
        </p>
      </div>
    </div>
  );
}
