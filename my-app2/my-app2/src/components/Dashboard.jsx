import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [pdfList, setPdfList] = useState([]);
  const [pdfListLoading, setPdfListLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Fetch conversation history
  useEffect(() => {
    console.log('Fetching conversation history, page:', page);
    const fetchConversationHistory = async () => {
      if (!hasMore) return;
  
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          setError('No token found. Please log in again.');
          navigate('/login');
          return;
        }
  
        const res = await axios.get('http://localhost:8001/conversation-history', {
          params: { limit: 50, offset: page * 50 },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Response:', res.data);
        const newHistory = res.data.history || [];
        if (newHistory.length < 50) setHasMore(false);
        setConversationHistory((prev) => [...prev, ...newHistory]);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.message, err.response?.data);
        setError(`Error: Could not fetch conversation history. ${err.message}`);
        setLoading(false);
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      }
    };
    fetchConversationHistory();
  }, [page, navigate, hasMore]);

  // Fetch files
  // const fetchFiles = async () => {
  //   setPdfListLoading(true);
  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       setError('No token found. Please log in again.');
  //       navigate('/login');
  //       return;
  //     }

  //     // const res = await axios.get('http://localhost:8001/list-pdfs', {
  //     //   headers: { Authorization: `Bearer ${token}` },
  //     // });

  //     // setPdfList(res.data.pdfs || []);
  //   } catch (err) {
  //     setError(`Error fetching file list: ${err.message}`);
  //     if (err.response?.status === 401) {
  //       setError('Session expired. Please log in again.');
  //       navigate('/login');
  //     }
  //   }
  //   setPdfListLoading(false);
  // };

  // useEffect(() => {
  //   fetchFiles();
  // }, [navigate]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in again.');
        navigate('/login');
        return;
      }

      const res = await axios.post(
        'http://localhost:8001/query',
        { question: query },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Preprocess response to enforce structure
      let newResponse = res.data.response || 'No response content';
      newResponse = newResponse
        .replace(/###\s*(.+)/g, '**$1**') // Convert ### headers to **
        .replace(/\n\n+/g, '\n') // Normalize excessive line breaks
        .trim();

      const newEntry = {
        query: query,
        response: newResponse,
        date_created: new Date().toISOString(),
      };

      setConversationHistory((prev) => [...prev, newEntry]);
      setQuery('');
    } catch (err) {
      const errorEntry = {
        query: query,
        response: 'Error: Could not process query.',
        date_created: new Date().toISOString(),
      };

      setConversationHistory((prev) => [...prev, errorEntry]);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setUploadStatus('Please select at least one file to upload.');
      return;
    }

    const validFiles = files.every(file =>
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.ppt') ||
      file.name.toLowerCase().endsWith('.pptx')
    );
    if (!validFiles) {
      setUploadStatus('Only PDF, TXT, DOCX, and PPT/PPTX files are supported.');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      setUploadStatus('Uploading files...');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in again.');
        navigate('/login');
        return;
      }

      const res = await axios.post('http://localhost:8001/upload-file', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus(res.data.message || 'Files uploaded successfully!');
      setFiles([]);
      fetchFiles();
    } catch (err) {
      setUploadStatus(`Error uploading files: ${err.message}`);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      }
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      setUploadStatus('Please enter a valid URL.');
      return;
    }

    try {
      setUploadStatus('Processing file...');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in again.');
        navigate('/login');
        return;
      }

      const res = await axios.post(
        'http://localhost:8001/process-url',
        { urls: [url] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setUploadStatus(res.data.message || 'File processed successfully!');
      setUrl('');
      fetchFiles();
    } catch (err) {
      setUploadStatus(`Error processing URL: ${err.message}`);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      }
    }
  };

  const handleDeleteFile = async (s3Key, filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      setUploadStatus('Deleting file...');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in again.');
        navigate('/login');
        return;
      }

      const res = await axios.delete('http://localhost:8001/delete-file', {
        headers: { Authorization: `Bearer ${token}` },
        params: { s3_key: s3Key, filename },
      });

      setUploadStatus(res.data.message || 'File deleted successfully!');
      fetchFiles();
    } catch (err) {
      setUploadStatus(`Error deleting file: ${err.message}`);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      }
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Function to parse and format response for display
  const formatResponse = (response) => {
    return response
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('**')) {
          return <strong key={index}>{line.replace(/\*\*/g, '')}</strong>;
        } else if (line.startsWith('- ')) {
          return <li key={index} style={styles.bulletItem}>{line.replace('- ', '')}</li>;
        } else if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index}>{line}</p>;
      });
  };

  return (
    <div className="dashboard" style={styles.container}>
      {/* Left Sidebar for Uploads */}
      <div style={styles.sidebar}>
        <div style={styles.uploadContainer}>
          <div style={styles.uploadSection}>
            <h3 style={styles.uploadTitle}>Upload Files</h3>
            <form onSubmit={handleFileUpload} style={styles.uploadForm}>
              <input
                type="file"
                accept=".pdf,.txt,.docx,.ppt,.pptx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                multiple
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              <button type="submit" style={styles.uploadButton}>
                Upload Files
              </button>
            </form>
          </div>

          <div style={styles.uploadSection}>
            <h3 style={styles.uploadTitle}>Process File from URL</h3>
            <form onSubmit={handleUrlSubmit} style={styles.uploadForm}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter PDF, TXT, DOCX, or PPT/PPTX URL"
                style={styles.urlInput}
              />
              <button type="submit" style={styles.uploadButton}>
                Process URL
              </button>
            </form>
          </div>

          {uploadStatus && (
            <p style={uploadStatus.includes('Error') ? styles.errorText : styles.successText}>
              {uploadStatus}
            </p>
          )}  

          {/* Uploaded Files Section */}
          <div style={styles.uploadSection}>
            <h3 style={styles.uploadTitle}>Uploaded Files</h3>
            {pdfListLoading ? (
              <p style={styles.loadingText}>Loading...</p>
            ) : pdfList.length === 0 ? (
              <p style={styles.placeholderText}>No files uploaded yet.</p>
            ) : (
              <ul style={styles.pdfList}>
                {pdfList.map((file, index) => (
                  <li key={index} style={styles.pdfItem}>
                    <a
                      href={file.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.pdfLink}
                    >
                      {file.original_filename}
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.s3_key, file.original_filename)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Chat with Files</h2>
        </div>

        <div style={styles.chatContainer} ref={chatContainerRef}>
          {loading && conversationHistory.length === 0 && (
            <div style={styles.loadingContainer}>
              <div style={styles.loader}></div>
              <p style={styles.loadingText}>Loading conversation history...</p>
            </div>
          )}

          {error && <p style={styles.errorText}>{error}</p>}

          {!loading && !error && conversationHistory.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>💬</div>
              <p style={styles.placeholderText}>No conversation history yet. Ask a question to get started!</p>
            </div>
          )}

          {!loading && conversationHistory.length > 0 && (
            <>
              {conversationHistory.map((entry, index) => (
                <div key={index} style={styles.chatEntry}>
                  <div style={styles.userMessage}>
                    <div style={styles.messageBubbleRight}>
                      <p style={styles.messageText}>{entry.query}</p>
                      <span style={styles.messageTime}>{formatTimestamp(entry.date_created)}</span>
                    </div>
                  </div>

                  <div style={styles.assistantMessage}>
                    <div style={styles.assistantAvatar}>AI</div>
                    <div style={styles.messageBubbleLeft}>
                      <div style={styles.responseContainer}>
                        {formatResponse(entry.response)}
                      </div>
                      <span style={styles.messageTime}>{formatTimestamp(entry.date_created)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  style={styles.loadMoreButton}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </div>

        <div style={styles.queryContainer}>
          <form onSubmit={handleQuerySubmit} style={styles.form}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              required
              style={styles.input}
            />
            <button type="submit" style={styles.submitButton}>
              <span style={styles.sendIcon}>➤</span>
            </button>
          </form>

          <div style={styles.userInfoBar}>
            <p style={styles.userEmail}>{localStorage.getItem('userEmail') || 'User'}</p>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated styles with structured response support
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#4a2d5f',
    fontFamily: "'Poppins', 'Segoe UI', 'Roboto', sans-serif", // Corrected string
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#f9f6ff',
    borderRight: '1px solid #e4dff0',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  uploadContainer: {
    padding: '20px',
    flex: 1,
  },
  uploadSection: {
    marginBottom: '20px',
  },
  uploadTitle: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    fontWeight: '500',
    color: '#4a2d5f',
  },
  uploadForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  fileInput: {
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #d8c8eb',
    backgroundColor: 'white',
    color: '#4a2d5f',
    fontSize: '14px',
  },
  urlInput: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d8c8eb',
    backgroundColor: 'white',
    color: '#4a2d5f',
    fontSize: '14px',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
  },
  uploadButton: {
    backgroundColor: '#6a3093',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 4px rgba(106, 48, 147, 0.3)',
    transition: 'background-color 0.2s',
  },
  successText: {
    color: '#2f855a',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'rgba(47, 133, 90, 0.1)',
    borderRadius: '8px',
    margin: '10px 0',
  },
  errorText: {
    color: '#f56565',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    borderRadius: '8px',
    margin: '10px 0',
  },
  pdfList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  pdfItem: {
    padding: '8px 0',
    borderBottom: '1px solid #e4dff0',
    fontSize: '14px',
    color: '#4a2d5f',
    wordBreak: 'break-word',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e4dff0',
    backgroundColor: '#6a3093',
  },
  headerTitle: {
    margin: 0,
    fontWeight: '600',
    fontSize: '22px',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  chatContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#fbfaff',
    display: 'flex',
    flexDirection: 'column',
  },
  chatEntry: {
    marginBottom: '20px',
  },
  userMessage: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '15px',
  },
  assistantMessage: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  assistantAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#6a3093',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    marginRight: '10px',
    boxShadow: '0 2px 4px rgba(106, 48, 147, 0.2)',
  },
  messageBubbleRight: {
    backgroundColor: '#6a3093',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '18px 18px 0 18px',
    maxWidth: '70%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  messageBubbleLeft: {
    backgroundColor: '#f0ebf8',
    color: '#4a2d5f',
    padding: '10px 15px',
    borderRadius: '0 18px 18px 18px',
    maxWidth: '70%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    position: 'relative',
    border: '1px solid #e4dff0',
  },
  responseContainer: {
    whiteSpace: 'pre-wrap', // Preserve line breaks and spacing
    marginBottom: '5px',
  },
  bulletItem: {
    marginLeft: '20px', // Indent bullets
    listStyleType: 'disc', // Use disc bullets for readability
    marginBottom: '5px',
  },
  messageText: {
    margin: '0',
    wordBreak: 'break-word',
    lineHeight: '1.4',
  },
  messageTime: {
    fontSize: '12px',
    opacity: '0.7',
    display: 'block',
    textAlign: 'right',
  },
  loadMoreButton: {
    alignSelf: 'center',
    backgroundColor: 'white',
    color: '#6a3093',
    border: '1px solid #6a3093',
    borderRadius: '20px',
    padding: '8px 16px',
    margin: '10px 0',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  queryContainer: {
    padding: '15px 20px',
    backgroundColor: 'white',
    borderTop: '1px solid #e4dff0',
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '24px',
    border: '1px solid #d8c8eb',
    backgroundColor: 'white',
    color: '#4a2d5f',
    fontSize: '16px',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
    transition: 'border-color 0.2s',
  },
  submitButton: {
    width: '40px',
    height: '40px',
    marginLeft: '10px',
    backgroundColor: '#6a3093',
    color: 'white',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(106, 48, 147, 0.3)',
  },
  sendIcon: {
    fontSize: '16px',
    transform: 'rotate(90deg)',
  },
  userInfoBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e4dff0',
    paddingTop: '10px',
  },
  userEmail: {
    margin: 0,
    fontSize: '14px',
    color: '#4a2d5f',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: '#6a3093',
    border: '1px solid #6a3093',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loader: {
    border: '4px solid #e4dff0',
    borderRadius: '50%',
    borderTop: '4px solid #6a3093',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#6a3093',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    height: '100%',
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '20px',
    opacity: '0.7',
  },
  placeholderText: {
    color: '#6a3093',
    textAlign: 'center',
    maxWidth: '400px',
    opacity: '0.7',
    width: '100%',
  },
  pdfLink: {
    color: '#4a2d5f',
    textDecoration: 'none',
    marginRight: '10px',
  },
  deleteButton: {
    backgroundColor: '#f56565',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.2s',
  },
  '@media (hover: hover)': {
    deleteButton: {
      '&:hover': {
        backgroundColor: '#e53e3e',
      },
    },
  },
};

export default Dashboard;