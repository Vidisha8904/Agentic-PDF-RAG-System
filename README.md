<div align="center">

# 🧠 Agentic Document Intelligence System

### Adaptive Retrieval-Augmented Generation (RAG) using AI-driven Document Classification, OCR and Dynamic Chunking

Transform enterprise documents into an intelligent, searchable knowledge base using Large Language Models, Agentic AI and Semantic Retrieval.

<p>

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![OpenAI](https://img.shields.io/badge/GPT--4o-LLM-black)
![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorDB-orange)
![Docker](https://img.shields.io/badge/Docker-Container-blue)
![AWS](https://img.shields.io/badge/AWS-S3-yellow)
![CrewAI](https://img.shields.io/badge/CrewAI-Agentic-purple)

</p>

---

*A production-oriented AI system that combines Natural Language Processing, Information Retrieval, OCR, Agentic AI and Large Language Models to intelligently understand and retrieve knowledge from complex documents.*

</div>

---

# 📖 Overview

Modern organizations store valuable information across thousands of PDFs, reports, manuals, presentations and technical documents. Although Retrieval-Augmented Generation (RAG) has become a popular solution for document question answering, most implementations still rely on fixed-size chunking strategies that ignore document structure.

This project presents an **Agentic Document Intelligence System** that improves document retrieval by combining:

- AI-driven document classification
- Adaptive chunking strategies
- OCR for scanned documents
- Semantic retrieval
- Large Language Models
- Cloud-native architecture

Rather than treating every document identically, the system first analyses the document structure before selecting an appropriate chunking strategy. This preserves semantic relationships between content, improves retrieval quality and generates more reliable answers.

The platform supports multiple document formats, semantic search, conversation history, user authentication and cloud deployment, making it significantly closer to a production AI application than a demonstration chatbot.

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/6cc6f0a0-60c8-4061-9678-bfb8f317aa9a" />


# ✨ Key Features

## 🤖 Agentic Document Classification

Uses CrewAI to analyse document structure before any preprocessing begins.

Instead of immediately chunking every document, an AI agent first determines whether it is:

- Narrative
- Question–Answer
- Table-heavy

The document is then routed to the most appropriate chunking strategy.

---

## 🧩 Adaptive Chunking

Unlike traditional RAG systems that split every document into equally sized chunks, this system dynamically changes its chunking strategy based on document type.

This preserves:

- semantic boundaries
- table relationships
- question-answer pairs

before embeddings are generated.

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/792d93ea-bc25-4e33-910a-e550d1c81aa5" />


## 🔍 Semantic Retrieval

Instead of keyword search, document chunks are converted into vector embeddings using **OpenAI text-embedding-3-small** and stored inside **ChromaDB**.

User queries are embedded into the same vector space, allowing semantically similar content to be retrieved even when different wording is used.

---

## 📄 Multi-format Document Support

Supported document formats include

- PDF
- DOCX
- TXT
- PPT
- PPTX

Documents can be uploaded directly or processed from supported URLs.

---

## 📑 OCR Support

Scanned documents are processed using **Mistral OCR**, allowing image-based PDFs to become searchable.

---

## 💬 Conversational Question Answering

Retrieved document chunks are provided as context to **GPT-4o**, enabling grounded responses rather than relying solely on the model's internal knowledge.

Each response also references the document sources used to generate the answer.

---

## 🔒 User Authentication

The platform integrates **Directus** to manage:

- authentication
- document metadata
- conversation history

---

## ☁ Cloud Deployment

The backend is containerized using Docker and integrates with AWS S3 for scalable document storage.

---

# 🚨 Why Traditional RAG Falls Short

A typical Retrieval-Augmented Generation pipeline looks like this:

```
Document

↓

Fixed Chunking

↓

Embeddings

↓

Vector Database

↓

LLM

↓

Answer
```

Although simple, this pipeline introduces several problems.

### Broken Document Structure

Tables often become fragmented.

Headers become separated from their corresponding values.

---

### Question–Answer Separation

FAQ documents frequently split questions from answers, reducing retrieval quality.

---

### Arbitrary Chunk Boundaries

Important concepts may be divided simply because they exceed a predefined character limit.

---

### Increased Token Cost

Poor retrieval results in more context being sent to the language model.

---

### Reduced Answer Quality

Since the retrieved context is incomplete, generated answers become less reliable.

---

# 💡 Proposed Solution

Instead of assuming every document should be processed identically, this project introduces a document analysis stage before chunking.

```
User Upload

↓

Text Extraction

↓

Mistral OCR

↓

CrewAI Document Analysis

↓

Document Classification

↓

Adaptive Chunking

↓

Embedding Generation

↓

ChromaDB

↓

Semantic Retrieval

↓

Context Engineering

↓

GPT-4o

↓

Grounded Response
```

This simple architectural change significantly improves context preservation before the retrieval stage even begins.

---

# 🏗 System Architecture

The platform consists of several independent services.

| Layer | Technology |
|---------|------------|
| Frontend | React |
| Backend | FastAPI |
| Authentication | Directus |
| Cloud Storage | AWS S3 |
| OCR | Mistral OCR |
| Agentic AI | CrewAI |
| Embeddings | OpenAI text-embedding-3-small |
| Vector Database | ChromaDB |
| LLM | GPT-4o |
| Deployment | Docker |

---

# ⚙ Complete Workflow

1. User uploads a document.
2. Document is stored securely.
3. Text is extracted.
4. Mistral OCR processes scanned PDFs.
5. CrewAI analyses document structure.
6. Appropriate chunking strategy is selected.
7. Chunks are embedded using OpenAI embeddings.
8. Vectors are stored inside ChromaDB.
9. User submits a question.
10. Relevant chunks are retrieved.
11. GPT-4o generates a grounded response.
12. Sources are returned alongside the answer.
13. Conversation history is stored.

---

# 🧠 Adaptive Chunking

The central contribution of this project is its adaptive chunking pipeline.

## Narrative Documents

Split according to semantic sections and logical document structure.

---

## Question–Answer Documents

Questions remain paired with their corresponding answers.

---

## Table-heavy Documents

Tables preserve relationships between headers, rows and values.

---

Rather than forcing one solution onto every document, the pipeline adapts itself based on document structure.

---

# 🛠 Technology Stack

## Artificial Intelligence

- Large Language Models
- Retrieval-Augmented Generation
- Semantic Search
- Prompt Engineering
- Context Engineering

## Natural Language Processing

- Embeddings
- Information Retrieval
- Semantic Similarity
- Text Processing

## Agentic AI

- CrewAI

## OCR

- Mistral OCR

## Backend

- FastAPI

## Database

- ChromaDB

## Cloud

- AWS S3

## Deployment

- Docker

---

# 💭 Engineering Decisions

### Why Adaptive Chunking?

Because different document structures require different retrieval strategies.

---

### Why CrewAI?

To separate document understanding from retrieval.

---

### Why ChromaDB?

Lightweight semantic retrieval with metadata support.

---

### Why GPT-4o?

High-quality grounded response generation.

---

### Why Mistral OCR?

Reliable extraction from scanned documents.

---

### Why FastAPI?

High-performance asynchronous backend suitable for AI services.

---

# ⚠ Challenges

Some of the key engineering challenges encountered during development included:

- preserving table structures
- selecting appropriate chunk sizes
- maintaining semantic relationships
- OCR quality
- reducing token consumption
- handling heterogeneous document formats

These challenges directly influenced the final architecture of the system.

---

# 🚀 Future Improvements

- Hybrid Search (BM25 + Vector Search)
- Reranking Models
- GraphRAG
- Streaming Responses
- Source Citation
- Evaluation Framework
- LangGraph Integration
- Observability
- Multi-tenant Architecture

---

# 📖 Engineering Case Study

A detailed case study explaining the motivation, implementation and design decisions behind this project is available on Medium.

**🔗 Case Study: Real-Time PDF Q&A Chatbot Using RAG and Chunking Techniques**

https://medium.com/@vidisha8904/case-study-real-time-pdf-q-a-chatbot-using-rag-and-chunking-techniques-d046b6344ce8

---

# 👩‍💻 About the Author

**Vidisha Solanki**

AI Engineer | Machine Learning Engineer | Applied AI Research

I build intelligent AI systems spanning Machine Learning, Deep Learning, Computer Vision, Natural Language Processing and Generative AI. My work focuses on transforming research ideas into scalable, production-ready AI solutions through thoughtful system design, experimentation and continuous learning.

If you found this project interesting, feel free to connect or explore my other repositories.

⭐ If you like this project, consider giving it a star!
