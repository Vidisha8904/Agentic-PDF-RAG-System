Documnet RAG 
This is a FastAPI-based Retrieval-Augmented Generation (RAG) application designed to process PDF, TXT, DOCX, PPT, and PPTX files, extract their text content, chunk it intelligently, and store it in a ChromaDB vector database for semantic search and question-answering. The application integrates with AWS S3 for file storage, Directus for metadata and conversation history management, and uses AI models (Mistral for OCR, OpenAI for embeddings and classification, and SageMaker for embeddings) to handle document processing and querying.

Features

File Upload and Processing: Upload PDF, TXT, DOCX, PPT, or PPTX files via file upload or URL, with text extraction using Mistral OCR for PDFs and other libraries for non-PDF files.
Intelligent Chunking: Uses a CrewAI agent to classify documents as Q&A, table-heavy, or normal, with specialized chunking logic to preserve context:
Q&A documents are chunked into pairs of question-answer sets.
Table-heavy documents ensure tables remain intact with headers preserved.
Normal documents are split based on headings and semantic boundaries.


Vector Storage: Stores chunked text and embeddings in ChromaDB, using SageMaker-hosted embeddings for efficient retrieval.
Semantic Search and Querying: Answers user questions based on stored documents using OpenAI's GPT-4o model, with conversation history stored in Directus.
Authentication: Integrates with Directus for OAuth2-based user authentication.
AWS S3 Integration: Stores uploaded files in S3 with metadata saved in Directus.
CORS Support: Configured for cross-origin requests to work with frontend applications (e.g., React).
Table Handling: Converts markdown tables to JSON format for better retrieval and processing.

Prerequisites

Python 3.9+
Docker (optional, for containerized deployment)
AWS account with S3 bucket and SageMaker endpoint configured
Directus instance configured via the .env file
ChromaDB instance configured via the .env file
Environment variables configured in a .env file (see below)

Installation

Clone the Repository:
git clone <repository-url>
cd document-rag


Install Dependencies:
pip install -r requirements.txt


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



Project Structure
document-rag-backend/
├── main.py           # Core FastAPI application with endpoints and logic
├── db.py            # ChromaDB interactions for vector storage and retrieval
├── requirements.txt  # Python dependencies
├── .env             # Environment variables (not committed)
├── app.log          # Log file for application logs
└── README.md        # This file

Endpoints

GET /health: Check if the server is running.

Response: {"status": "healthy"}


POST /upload-file: Upload files (PDF, TXT, DOCX, PPT, PPTX) for processing and storage.

Request: Multipart form-data with files
Response: {"message": "Processed X files successfully and uploaded to S3."}


POST /process-url: Process files from provided URLs.

Request: JSON body with urls: List[str]
Response: {"message": "Processed X files from URLs successfully and uploaded to S3."}


POST /query: Query the system with a question based on stored documents.

Request: JSON body with question: str
Response: {"response": "<answer based on documents>"}


GET /conversation-history: Retrieve the last 50 conversation entries for the authenticated user.

Query Params: limit (default: 50), offset (default: 0)
Response: {"history": [<conversation_entries>]}


DELETE /delete-pdf: Delete a specific PDF from S3 and ChromaDB.

Request: JSON body with s3_key: str, filename: str
Response: {"message": "PDF deleted successfully from S3 and ChromaDB."}



Usage

Upload a File:Use a tool like Postman or a frontend application to send a POST request to /upload-file with one or more files. The files are stored in S3, processed, chunked, and their embeddings are saved in ChromaDB.

Query the System:Send a POST request to /query with a JSON body containing a question. The system retrieves relevant chunks from ChromaDB and generates an answer using GPT-4o, including source filenames.

View Conversation History:Send a GET request to /conversation-history to retrieve the user’s recent queries and responses.

Delete a PDF:Send a DELETE request to /delete-pdf with the s3_key and filename to remove a PDF from S3 and ChromaDB.


Notes

Table Retrieval: The application has known issues with table retrieval accuracy, which are being refined. Tables are converted to JSON format to improve retrieval.
Chunking: Q&A and normal chunking are optimized, but table text chunking may need further tuning for edge cases.
Authentication: Ensure Directus is properly configured for OAuth2 token validation.
Logging: Logs are written to app.log for debugging and monitoring.

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

See requirements.txt for the full list.
Troubleshooting

ChromaDB Connection Issues: Ensure the ChromaDB instance is running and accessible at the specified host and port.
AWS Errors: Verify AWS credentials and S3 bucket configuration in the .env file.
Directus Errors: Check that the Directus instance is running and the DIRECTUS_URL is correct.
Missing Embeddings: Confirm that the SageMaker endpoint is properly deployed and the SAGEMAKER_ENDPOINT_NAME is set.

Contributing
Contributions are welcome! Please submit a pull request or open an issue for bugs, feature requests, or improvements.
