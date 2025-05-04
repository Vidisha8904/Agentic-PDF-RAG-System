

import chromadb
import uuid
import logging
import traceback
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings  # OpenAI embeddings
import os
import boto3
import json
from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
SAGEMAKER_ENDPOINT_NAME=os.getenv("SAGEMAKER_ENDPOINT_NAME")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize ChromaDB client
client = chromadb.HttpClient(host="chroma-vidisha-lb-1390783373.ap-southeast-1.elb.amazonaws.com", port=8000)
client_emb = boto3.client('sagemaker-runtime',region_name='ap-southeast-1')

# client = chromadb.HttpClient(host="chroma", port=8000)

# Create or get the collection

# collection = client.get_or_create_collection("deploy3", metadata={"hnsw:space": "cosine", "embedding_dimension": 1536})  # OpenAI embeddings have 1536 dimensions
# collection = client.get_collection(name="test-1")
collection= client.get_collection(name='nomic')

# Load OpenAI embedding model
# embedding_model = OpenAIEmbeddings(
#     model="text-embedding-3-small",  # Change to "text-embedding-ada-002" if needed
#     openai_api_key= OPENAI_API_KEY  # Replace with your actual API key
# # )
# try:
#     embedding_model = HuggingFaceEmbeddings(
#         model_name="/root/.cache/huggingface/models--nomic-ai--nomic-embed-text-v1/snapshots/720244025c1a7e15661a174c63cce63c8218e52b",
#         model_kwargs={'trust_remote_code': True}
#     )
# except Exception as e:
#     logger.error(f"Error loading model {str(e)}\n{traceback.format_exc()}")
#     raise

# def create_embeddings(text_chunks):
    
#     response = client_emb.invoke_endpoint(
#         EndpointName=SAGEMAKER_ENDPOINT_NAME,
#         Body=json.dumps({
#             "inputs": text_chunks,
#         }),
#         ContentType='application/json'
#         )
    
#     return response['Body'].read().decode('utf-8')

def create_embeddings(texts, batch_size=32):
    """
    Get embeddings from SageMaker endpoint for both documents and queries.
    
    Args:
        texts: Either a single string (for a query) or a list of strings (for documents)
        endpoint_name: The name of your SageMaker endpoint
        
    Returns:
        For a single string: A single embedding vector
        For a list of strings: A list of embedding vectors
    """
    # Convert single text to list for consistent processing
    is_single_text = isinstance(texts, str)
    if is_single_text:
        texts = [texts]
    all_embeddings = []
    
    # Process in batches
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        
        # Prepare the input payload
        payload = {"inputs": batch_texts}
        payload_json = json.dumps(payload)
        
        # Call the SageMaker endpoint
        response = client_emb.invoke_endpoint(
            EndpointName=SAGEMAKER_ENDPOINT_NAME,
            ContentType='application/json',
            Body=payload_json
        )
        
        # Parse the response
        response_body = json.loads(response['Body'].read().decode())
        
        # Add batch embeddings to the full list
        # Note: You may need to adjust this based on the actual response format
        batch_embeddings = response_body
        all_embeddings.extend(batch_embeddings)
    
    # Return a single embedding for a query, or the list for documents
    return all_embeddings[0] if is_single_text else all_embeddings


def add_to_collection(text_chunks, filename, user_id):
    """Add text chunks and their embeddings to the ChromaDB collection with user_id."""
    try:
        # Generate embeddings using OpenAI
        embeddings = create_embeddings(text_chunks)

        # Prepare metadata with the filename and user_id
        metadatas = [{"filename": filename, "user_id": user_id} for _ in range(len(text_chunks))]

        # Add data to ChromaDB collection
        collection.add(
            ids=[str(uuid.uuid4()) for _ in range(len(text_chunks))],
            documents=text_chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )

        logger.info(f"Added {len(text_chunks)} chunks from {filename} by user {user_id} to the collection.")
    except Exception as e:
        logger.error(f"Error adding chunks to collection: {str(e)}\n{traceback.format_exc()}")
        raise

def retrieve_from_collection(query, user_id, top_k=8):
    """Retrieve the most relevant text chunks from ChromaDB based on the query, filtered by user_id."""
    logger.info(f"Querying ChromaDB with query: {query}, user_id: {user_id}, top_k: {top_k}")
    try:
        filename_filter = None
        logger.info(f"Querying ChromaDB with query: {query}, user_id: {user_id}, top_k: {top_k}")

        if "from " in query.lower() and ".pdf" in query.lower():
            query_parts = query.split(".pdf")
            from_parts = query_parts[0].split("from ")
            if len(from_parts) > 1:
                filename_filter = from_parts[-1].strip() + ".pdf"
                query = query_parts[1].strip().lstrip(',').strip()
                logger.info(f"Extracted filename filter: {filename_filter}")

        # Generate embedding for the query
        query_embedding = create_embeddings(query)

        where_filter = {"user_id": user_id}
        logger.info(f"Using filter: {where_filter}")

        if filename_filter:
            where_filter["filename"] = filename_filter

        # Query ChromaDB
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=['documents', 'metadatas', 'distances'],
            where=where_filter
        )

        logger.info(f"Query results: {results}")

        if results['documents'] and results['metadatas']:
            return [
                {'document': doc, 'metadata': meta}
                for doc, meta in zip(results['documents'][0], results['metadatas'][0])
            ]

        logger.info("No documents found.")
        return []
    except Exception as e:
        logger.error(f"Error retrieving from collection: {str(e)}\n{traceback.format_exc()}")
        raise

def overwriting_chromadb(user_id: str, filename: str):
    """for overwriting"""
    """Delete all chunks associated with a specific filename and user_id from ChromaDB."""
    try:
        # Query to find all chunks with matching user_id and filename
        where_filter = {
            "$and": [
                {"user_id": user_id},
                {"filename": filename}
            ]
        }
        results = collection.get(
            where=where_filter,
            include=["metadatas"]  # We only need metadata to get the IDs
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])
            logger.info(f"Deleted {len(results['ids'])} existing chunks for {filename} for user {user_id}")
        else:
            logger.info(f"No existing chunks found for {filename} for user {user_id}")
    except Exception as e:
        logger.error(f"Error deleting chunks for {filename}: {str(e)}\n{traceback.format_exc()}")
        raise

def delete_pdf_from_collection(user_id: str, filename: str):
    """Delete all chunks, embeddings, and metadata for a specific PDF from ChromaDB."""
    try:
        where_filter = {
            "$and": [
                {"user_id": user_id},
                {"filename": filename}
            ]
        }
        results = collection.get(
            where=where_filter,
            include=["metadatas"]
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])
            logger.info(f"Deleted {len(results['ids'])} chunks for {filename} for user {user_id} from ChromaDB")
        else:
            logger.info(f"No chunks found to delete for {filename} for user {user_id}")
    except Exception as e:
        logger.error(f"Error deleting PDF {filename} from ChromaDB: {str(e)}\n{traceback.format_exc()}")
        raise









# import chromadb
# import uuid
# import logging
# import traceback
# from langchain_huggingface import HuggingFaceEmbeddings
# import os
# from dotenv import load_dotenv
# import numpy as np  # Added for MMR similarity calculations

# # Load environment variables
# load_dotenv()
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Initialize ChromaDB client
# client = chromadb.HttpClient(host="chroma-vidisha-lb-1390783373.ap-southeast-1.elb.amazonaws.com", port=8000)
# collection = client.get_collection(name='nomic')

# # Initialize embedding model
# try:
#     embedding_model = HuggingFaceEmbeddings(
#         model_name="/root/.cache/huggingface/models--nomic-ai--nomic-embed-text-v1/snapshots/720244025c1a7e15661a174c63cce63c8218e52b",
#         model_kwargs={'trust_remote_code': True}
#     )
# except Exception as e:
#     logger.error(f"Error loading model {str(e)}\n{traceback.format_exc()}")
#     raise

# def cosine_similarity(a, b):
#     """Compute cosine similarity between two vectors."""
#     a = np.array(a)
#     b = np.array(b)
#     dot_product = np.dot(a, b)
#     norm_a = np.linalg.norm(a)
#     norm_b = np.linalg.norm(b)
#     return dot_product / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0

# def apply_mmr(query_embedding, candidate_docs, candidate_embeddings, top_k, lambda_param=0.7):
#     """
#     Apply Maximum Marginal Relevance (MMR) to select diverse and relevant documents.
    
#     Args:
#         query_embedding: Embedding of the query (list or numpy array).
#         candidate_docs: List of dictionaries [{'document': text, 'metadata': {...}}, ...].
#         candidate_embeddings: List of embeddings corresponding to candidate_docs.
#         top_k: Number of final documents to return.
#         lambda_param: Balances relevance (lambda) and diversity (1-lambda), range [0, 1].
    
#     Returns:
#         List of selected documents [{'document': text, 'metadata': {...}}, ...].
#     """
#     if not candidate_docs or len(candidate_docs) < top_k:
#         return candidate_docs  # Return all if fewer candidates than top_k

#     # Initialize result set
#     selected_indices = []
#     remaining_indices = list(range(len(candidate_docs)))

#     # Compute relevance scores (cosine similarity = 1 - distance, as ChromaDB returns distances)
#     distances = [candidate_docs[i]['distance'] for i in remaining_indices]
#     relevance_scores = [1.0 - dist for dist in distances]  # Convert distance to similarity

#     # Select first document (most relevant)
#     first_idx = np.argmax(relevance_scores)
#     selected_indices.append(remaining_indices.pop(first_idx))

#     # Iteratively select remaining documents
#     while len(selected_indices) < top_k and remaining_indices:
#         mmr_scores = []
#         for i in remaining_indices:
#             # Relevance score
#             relevance = relevance_scores[i]
#             # Diversity: max similarity to already selected documents
#             max_sim_to_selected = 0.0
#             for j in selected_indices:
#                 sim = cosine_similarity(candidate_embeddings[i], candidate_embeddings[j])
#                 max_sim_to_selected = max(max_sim_to_selected, sim)
#             # MMR score
#             mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim_to_selected
#             mmr_scores.append(mmr_score)

#         # Select document with highest MMR score
#         best_idx = np.argmax(mmr_scores)
#         selected_indices.append(remaining_indices.pop(best_idx))

#     # Return selected documents
#     return [candidate_docs[i] for i in selected_indices]

# def add_to_collection(text_chunks, filename, user_id):
#     """Add text chunks and their embeddings to the ChromaDB collection with user_id."""
#     try:
#         # Generate embeddings using the embedding model
#         embeddings = embedding_model.embed_documents(text_chunks)

#         # Prepare metadata with the filename and user_id
#         metadatas = [{"filename": filename, "user_id": user_id} for _ in range(len(text_chunks))]

#         # Add data to ChromaDB collection
#         collection.add(
#             ids=[str(uuid.uuid4()) for _ in range(len(text_chunks))],
#             documents=text_chunks,
#             embeddings=embeddings,
#             metadatas=metadatas
#         )

#         logger.info(f"Added {len(text_chunks)} chunks from {filename} by user {user_id} to the collection.")
#     except Exception as e:
#         logger.error(f"Error adding chunks to collection: {str(e)}\n{traceback.format_exc()}")
#         raise

# def retrieve_from_collection(query, user_id, top_k=8, top_k_initial=20, lambda_param=0.7):
#     """
#     Retrieve the most relevant and diverse text chunks from ChromaDB using MMR.
    
#     Args:
#         query: The user query string.
#         user_id: The ID of the user to filter documents.
#         top_k: Number of final documents to return (default: 8).
#         top_k_initial: Number of initial candidate documents to fetch (default: 20).
#         lambda_param: MMR parameter balancing relevance and diversity (default: 0.7).
    
#     Returns:
#         List of dictionaries [{'document': text, 'metadata': {...}}, ...].
#     """
#     logger.info(f"Querying ChromaDB with query: {query}, user_id: {user_id}, top_k: {top_k}, top_k_initial: {top_k_initial}")
#     try:
#         filename_filter = None
#         if "from " in query.lower() and ".pdf" in query.lower():
#             query_parts = query.split(".pdf")
#             from_parts = query_parts[0].split("from ")
#             if len(from_parts) > 1:
#                 filename_filter = from_parts[-1].strip() + ".pdf"
#                 query = query_parts[1].strip().lstrip(',').strip()
#                 logger.info(f"Extracted filename filter: {filename_filter}")

#         # Generate embedding for the query
#         query_embedding = embedding_model.embed_query(query)

#         # Set up filter
#         where_filter = {"user_id": user_id}
#         if filename_filter:
#             where_filter["filename"] = filename_filter
#         logger.info(f"Using filter: {where_filter}")

#         # Query ChromaDB for initial candidate set
#         results = collection.query(
#             query_embeddings=[query_embedding],
#             n_results=top_k_initial,  # Fetch more candidates for MMR
#             include=['documents', 'metadatas', 'distances', 'embeddings'],  # Include embeddings for MMR
#             where=where_filter
#         )

#         # logger.info(f"Initial query results: {results}")

#         if not results['documents'] or not results['documents'][0]:
#             logger.info("No documents found.")
#             return []

#         # Prepare candidate documents
#         candidate_docs = [
#             {
#                 'document': doc,
#                 'metadata': meta,
#                 'distance': dist  # Store distance for relevance scoring
#             }
#             for doc, meta, dist in zip(
#                 results['documents'][0],
#                 results['metadatas'][0],
#                 results['distances'][0]
#             )
#         ]
#         candidate_embeddings = results['embeddings'][0]

#         # Apply MMR to select top_k documents
#         selected_docs = apply_mmr(query_embedding, candidate_docs, candidate_embeddings, top_k, lambda_param)

#         logger.info(f"Selected {len(selected_docs)} documents after MMR.")
#         print("mmr-------------------", selected_docs)
#         return selected_docs

#     except Exception as e:
#         logger.error(f"Error retrieving from collection: {str(e)}\n{traceback.format_exc()}")
#         raise

# def overwriting_chromadb(user_id: str, filename: str):
#     """Delete all chunks associated with a specific filename and user_id from ChromaDB."""
#     try:
#         where_filter = {
#             "$and": [
#                 {"user_id": user_id},
#                 {"filename": filename}
#             ]
#         }
#         results = collection.get(
#             where=where_filter,
#             include=["metadatas"]
#         )
#         if results["ids"]:
#             collection.delete(ids=results["ids"])
#             logger.info(f"Deleted {len(results['ids'])} existing chunks for {filename} for user {user_id}")
#         else:
#             logger.info(f"No existing chunks found for {filename} for user {user_id}")
#     except Exception as e:
#         logger.error(f"Error deleting chunks for {filename}: {str(e)}\n{traceback.format_exc()}")
#         raise

# def delete_pdf_from_collection(user_id: str, filename: str):
#     """Delete all chunks, embeddings, and metadata for a specific PDF from ChromaDB."""
#     try:
#         where_filter = {
#             "$and": [
#                 {"user_id": user_id},
#                 {"filename": filename}
#             ]
#         }
#         results = collection.get(
#             where=where_filter,
#             include=["metadatas"]
#         )
#         if results["ids"]:
#             collection.delete(ids=results["ids"])
#             logger.info(f"Deleted {len(results['ids'])} chunks for {filename} for user {user_id} from ChromaDB")
#         else:
#             logger.info(f"No chunks found to delete for {filename} for user {user_id}")
#     except Exception as e:
#         logger.error(f"Error deleting PDF {filename} from ChromaDB: {str(e)}\n{traceback.format_exc()}")
#         raise