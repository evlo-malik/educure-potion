import { FC } from 'react';
import SEO from '../../components/SEO';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  slug: string;
  date: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How AI is Transforming Education in 2025',
    description: 'Discover how artificial intelligence is revolutionizing the way students learn and teachers teach in 2025.',
    slug: 'ai-transforming-education-2025',
    date: '2025-01-15',
  },
  {
    id: '2',
    title: '5 Game-Changing Study Hacks with EduCare AI',
    description: 'Learn how to maximize your study efficiency using EduCare AI\'s advanced features and tools.',
    slug: 'study-hacks-educare-ai',
    date: '2025-01-10',
  },
  {
    id: '3',
    title: 'Top AI Tools for Exam Preparation in 2025',
    description: 'Explore the most effective AI-powered tools that are helping students ace their exams in 2025.',
    slug: 'top-ai-tools-exam-preparation',
    date: '2025-01-05',
  },
];

const BlogIndex: FC = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'EduCare AI Blog',
    description: 'Latest insights on AI in education, study tips, and learning technologies',
    publisher: {
      '@type': 'Organization',
      name: 'EduCare AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://educure.io/logo.png'
      }
    },
    blogPost: blogPosts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      url: `https://educure.io/blog/${post.slug}`
    }))
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        title="EduCare AI Blog - Latest Education & AI Learning Insights"
        description="Discover the latest trends in AI education, study techniques, and learning technology. Expert advice to help you excel in your studies."
        keywords="AI education blog, study tips, learning technology, education AI, student success"
        structuredData={structuredData}
      />
      
      <h1 className="text-4xl font-bold mb-8">EduCare AI Blog</h1>
      
      <div className="grid gap-8">
        {blogPosts.map(post => (
          <article key={post.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">
              <a href={`/blog/${post.slug}`} className="hover:text-blue-600">
                {post.title}
              </a>
            </h2>
            <p className="text-gray-600 mb-4">{post.description}</p>
            <div className="flex justify-between items-center">
              <time dateTime={post.date} className="text-sm text-gray-500">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <a
                href={`/blog/${post.slug}`}
                className="text-blue-600 hover:text-blue-800"
              >
                Read more →
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BlogIndex; 
