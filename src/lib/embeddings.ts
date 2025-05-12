import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import OpenAI from 'openai';
import { z } from 'zod';

// Browser polyfill for Pinecone
if (typeof global === 'undefined') {
  (window as any).global = window;
}

const PINECONE_API_KEY = import.meta.env.VITE_PINECONE_API_KEY;
const PINECONE_INDEX_NAME = import.meta.env.VITE_PINECONE_INDEX_NAME;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY
});

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Initialize LangChain embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  modelName: 'text-embedding-3-small'
});

// Schema for vector metadata
const metadataSchema = z.object({
  documentId: z.string(),
  chunk: z.string(),
  index: z.number(),
  type: z.enum(['pdf', 'youtube', 'lecture']),
});

type Metadata = z.infer<typeof metadataSchema>;

// Split text into overlapping chunks
function splitIntoChunks(text: string): string[] {
  if (!text || typeof text !== 'string') {
    console.error('Invalid text provided to splitIntoChunks:', text);
    return [];
  }

  console.log('Splitting text into chunks...');
  console.log('Text length:', text.length);
  
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const chunk = text.slice(
      currentIndex,
      Math.min(currentIndex + CHUNK_SIZE, text.length)
    );

    if (chunk.trim()) {
      chunks.push(chunk);
    }
    currentIndex += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  console.log('Created chunks:', chunks.length);
  if (chunks.length > 0) {
    console.log('Sample chunk:', chunks[0].substring(0, 100));
  }
  
  return chunks;
}

// Create embeddings for text chunks
async function createEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!chunks.length) {
    console.error('No chunks provided for embedding');
    return [];
  }

  console.log('Creating embeddings for chunks:', chunks.length);
  
  try {
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks,
    });

    console.log('Successfully created embeddings:', embeddings.data.length);
    return embeddings.data.map(embedding => embedding.embedding);
  } catch (error) {
    console.error('Error creating embeddings:', error);
    throw error;
  }
}

// Store vectors in Pinecone
export async function storeDocumentVectors(
  documentId: string,
  content: string,
  type: Metadata['type']
): Promise<boolean> {
  if (!documentId || !content) {
    console.error('Missing required parameters:', { documentId, contentLength: content?.length });
    return false;
  }

  console.log('Storing vectors for document:', documentId);
  console.log('Content length:', content.length);
  console.log('Document type:', type);

  try {
    const index = pinecone.index(PINECONE_INDEX_NAME);
    const chunks = splitIntoChunks(content);

    if (!chunks.length) {
      console.error('No valid chunks generated from content');
      return false;
    }

    const embeddings = await createEmbeddings(chunks);

    if (!embeddings.length) {
      console.error('No embeddings generated');
      return false;
    }

    console.log('Created embeddings:', embeddings.length);

    const vectors = chunks.map((chunk, i) => ({
      id: `${documentId}_${i}`,
      values: embeddings[i],
      metadata: {
        documentId,
        chunk,
        index: i,
        type,
      },
    }));

    console.log('Prepared vectors:', vectors.length);

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      console.log(`Upserting batch ${i / batchSize + 1}/${Math.ceil(vectors.length / batchSize)}`);
      await index.upsert(batch);
    }

    console.log('Successfully stored all vectors');
    return true;
  } catch (error) {
    console.error('Error storing document vectors:', error);
    return false;
  }
}

// Query similar vectors using LangChain
export async function querySimilarChunks(
  query: string,
  documentId: string,
  limit: number = 5
): Promise<string[]> {
  if (!query || !documentId) {
    console.error('Invalid parameters for similarity search:', { query, documentId });
    return [];
  }

  console.log('Starting similarity search...');
  console.log('Query:', query);
  console.log('Document ID:', documentId);
  console.log('Limit:', limit);

  const startTime = performance.now();

  try {
    const index = pinecone.index(PINECONE_INDEX_NAME);
    console.log('Initialized Pinecone index');

    // Create embedding for the query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    // Query Pinecone directly first
    const queryResponse = await index.query({
      vector: queryEmbedding.data[0].embedding,
      filter: { documentId },
      topK: limit,
      includeMetadata: true
    });

    console.log('Direct Pinecone query results:', queryResponse.matches.length);

    if (queryResponse.matches.length === 0) {
      console.log('No matches found in Pinecone with filter:', { documentId });
      const stats = await index.describeIndexStats();
      console.log('Index stats:', stats);
      return [];
    }

    // Extract chunks directly from Pinecone results
    const chunks = queryResponse.matches
      .filter(match => match.metadata && typeof match.metadata.chunk === 'string')
      .map(match => match.metadata ? (match.metadata.chunk as string) : '');

    console.log('Retrieved chunks:', chunks.length);
    chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1} preview:`, chunk.substring(0, 100));
    });

    const totalTime = performance.now() - startTime;
    console.log(`Search completed in ${totalTime.toFixed(2)}ms`);

    return chunks;
  } catch (error) {
    console.error('Error in similarity search:', error);
    return [];
  }
}

// Delete document vectors from Pinecone
export async function deleteDocumentVectors(documentId: string): Promise<boolean> {
  if (!documentId) {
    console.error('No document ID provided for deletion');
    return false;
  }

  console.log('Deleting vectors for document:', documentId);
  
  try {
    const index = pinecone.index(PINECONE_INDEX_NAME);
    
    // First, query to get all vector IDs for this document
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0), // Dummy vector for metadata-only query
      filter: { documentId },
      topK: 10000,
      includeMetadata: false
    });

    const vectorIds = queryResponse.matches.map(match => match.id);
    console.log(`Found ${vectorIds.length} vectors to delete`);

    if (vectorIds.length > 0) {
      // Delete vectors by their IDs
      await index.deleteMany(vectorIds);
      console.log('Successfully deleted all vectors');
    } else {
      console.log('No vectors found to delete');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting document vectors:', error);
    return false;
  }
}