import { FC } from 'react';
import SEO from '../components/SEO';

const Home: FC = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EduCare AI',
    description: 'AI-powered learning assistant for students and educators',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free trial available'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'AI-powered document analysis',
      'Personalized study plans',
      'Intelligent flashcard generation',
      'Real-time tutoring assistance'
    ]
  };

  return (
    <div>
      <SEO
        title="EduCare AI - Your Intelligent Study Assistant | AI-Powered Learning Tools"
        description="Transform your learning experience with EduCare AI. Our intelligent study assistant uses advanced AI to help you understand documents, create study materials, and learn more effectively."
        keywords="AI study assistant, document analysis, flashcard generator, personalized learning, AI tutor, education technology"
        structuredData={structuredData}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-12 md:py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-6">
            Transform Your Learning with AI
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-12">
            EduCare AI is your intelligent study companion that helps you understand complex documents,
            generate study materials, and learn more effectively using advanced artificial intelligence.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Document Analysis</h2>
              <p>Upload any document and get instant insights, summaries, and key points.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Smart Flashcards</h2>
              <p>Automatically generate effective study materials from your documents.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">AI Tutoring</h2>
              <p>Get personalized help and explanations whenever you need them.</p>
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose EduCare AI?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-2">Save Time</h3>
              <p>Automate the creation of study materials and get instant document analysis.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Learn Better</h3>
              <p>Get personalized learning experiences adapted to your unique style.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p>Access AI tutoring assistance whenever you need it.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p>Monitor your learning journey with detailed analytics and insights.</p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-8">Ready to Transform Your Learning?</h2>
          <div className="text-center">
            <a
              href="/signup"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
            >
              Start Free Trial
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home; 