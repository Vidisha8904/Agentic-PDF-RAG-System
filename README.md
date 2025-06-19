Document RAG with adaptive chunking
This is a FastAPI-based Retrieval-Augmented Generation (RAG) application designed to process PDF, TXT, DOCX, PPT, and PPTX files, extract their text content, chunk it intelligently, and store it in a ChromaDB vector database for semantic search and question-answering. The application integrates with AWS S3 for file storage, Directus for metadata and conversation history management, and uses AI models (Mistral for OCR, OpenAI for embeddings and classification, and SageMaker for embeddings) to handle document processing and querying.

Features
File Upload and Processing: Upload PDF, TXT, DOCX, PPT, or PPTX files via file upload or URL, with text extraction using Mistral OCR for PDFs and other libraries for non-PDF files.
Intelligent Chunking: Uses a CrewAI agent to classify documents as Q&A, table-heavy, or normal, with specialized chunking logic to preserve context:
Q&A documents are chunked into pairs of question-answer sets.
Table-heavy documents ensure tables remain intact with headers preserved.
Normal documents are split based on headings and semantic boundaries.

Set Up Environment Variables:Create a .env file in the project root with the following variables:
OPENAI_API_KEY=<your-openai-api-key>
MISTRAL_API_KEY=<your-mistral-api-key>
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=<your-aws-region>
S3_BUCKET_NAME=<your-s3-bucket-name>
SAGEMAKER_ENDPOINT_NAME=<your-sagemaker-endpoint-name>
CHROMADB_HOST=<your-chromadb-host>
CHROMADB_PORT=8000
DIRECTUS_URL=<your-directus-url>


Run the Application:
uvicorn main:app --host 0.0.0.0 --port 8001

Dependencies
Key libraries used:

fastapi: For the API framework
chromadb: For vector storage
langchain: For document processing and embeddings
boto3: For AWS S3 and SageMaker integration
mistralai: For PDF OCR
openai: For embeddings and question-answering
crewai: For intelligent document classification
pypdf2, python-docx, python-pptx: For file text extraction
requests: For HTTP requests to Directus
