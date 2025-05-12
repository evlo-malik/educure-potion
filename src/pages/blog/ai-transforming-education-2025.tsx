import { FC } from 'react';
import SEO from '../../components/SEO';

const BlogPost: FC = () => {
  const publishDate = '2025-01-15';
  const author = 'Dr. Sarah Johnson';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'How AI is Transforming Education in 2025',
    description: 'Discover how artificial intelligence is revolutionizing the way students learn and teachers teach in 2025.',
    image: 'https://educure.io/blog/ai-education-2025.jpg',
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'EduCare AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://educure.io/logo.png'
      }
    },
    datePublished: publishDate,
    dateModified: publishDate,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        title="How AI is Transforming Education in 2025 | EduCare AI Blog"
        description="Discover how artificial intelligence is revolutionizing education in 2025. Learn about personalized learning, AI tutors, and the future of education technology."
        keywords="AI in education, future of education, education technology, personalized learning, AI tutors"
        structuredData={structuredData}
      />
      
      <article className="prose lg:prose-xl">
        <h1 className="text-4xl font-bold mb-4">How AI is Transforming Education in 2025</h1>
        
        <div className="text-gray-600 mb-8">
          <time dateTime={publishDate}>
            {new Date(publishDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
          <span className="mx-2">•</span>
          <span>By {author}</span>
        </div>

        <img
          src="/blog/ai-education-2025.jpg"
          alt="AI-powered classroom showing students interacting with personalized learning interfaces"
          className="w-full rounded-lg mb-8"
        />

        <h2 className="text-2xl font-semibold mb-4">The Rise of Personalized Learning</h2>
        <p>
          Artificial Intelligence has revolutionized how students learn by providing truly personalized
          educational experiences. Unlike traditional one-size-fits-all approaches, AI-powered platforms
          like EduCare AI adapt to each student's unique learning style, pace, and preferences.
        </p>

        <h2 className="text-2xl font-semibold my-4">AI Tutors: Available 24/7</h2>
        <p>
          One of the most significant advancements in education technology is the emergence of
          sophisticated AI tutors. These virtual assistants can provide instant feedback, answer
          questions, and guide students through complex topics at any time of day.
        </p>

        <h2 className="text-2xl font-semibold my-4">Real-Time Progress Tracking</h2>
        <p>
          AI systems now offer unprecedented insights into student progress. Teachers and parents can
          access detailed analytics about learning patterns, areas of difficulty, and suggested
          interventions, all powered by advanced machine learning algorithms.
        </p>

        <div className="bg-blue-50 p-6 rounded-lg my-8">
          <h3 className="text-xl font-semibold mb-4">Key Takeaways</h3>
          <ul className="list-disc pl-6">
            <li>Personalized learning paths adapted to individual students</li>
            <li>24/7 availability of AI tutors for immediate assistance</li>
            <li>Advanced analytics for tracking student progress</li>
            <li>Improved engagement through interactive learning experiences</li>
          </ul>
        </div>
      </article>
    </div>
  );
};

export default BlogPost; 