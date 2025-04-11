import React, { useState } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadStatus('ファイルを選択してください');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const response = await fetch('http://localhost:3001/document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });
        const data = await response.json();
        setUploadStatus('ドキュメントが正常にアップロードされました');
      } catch (error) {
        console.error('Error:', error);
        setUploadStatus('アップロード中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      setResponse('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>RAG アプリケーション</h1>
        
        {/* ドキュメントアップロードセクション */}
        <section className="upload-section">
          <h2>ドキュメントのアップロード</h2>
          <form onSubmit={handleFileUpload}>
            <input
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button type="submit" disabled={isLoading}>
              アップロード
            </button>
          </form>
          {uploadStatus && <p className="status-message">{uploadStatus}</p>}
        </section>

        {/* 質問セクション */}
        <section className="query-section">
          <h2>質問</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="質問を入力してください"
                rows="4"
                cols="50"
                disabled={isLoading}
              />
            </div>
            <div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? '処理中...' : '送信'}
              </button>
            </div>
          </form>
        </section>

        {/* 回答セクション */}
        {response && (
          <section className="response-section">
            <h2>回答:</h2>
            <div className="response-content">
              {response}
            </div>
          </section>
        )}
      </header>
    </div>
  );
}

export default App;
