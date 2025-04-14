import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// デバッグ用のログ出力
console.log('Environment Variables:', {
  region: process.env.REACT_APP_REGION,
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  apiEndpoint: process.env.REACT_APP_API_ENDPOINT
});

// Amplifyの設定
const amplifyConfig = {
  Auth: {
    region: process.env.REACT_APP_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  },
  API: {
    endpoints: [
      {
        name: 'ragApi',
        endpoint: process.env.REACT_APP_API_ENDPOINT,
      },
    ],
  },
};

Amplify.configure(amplifyConfig);

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getAuthHeaders = async () => {
    try {
      const { signInUserSession } = await getCurrentUser();
      return {
        'Authorization': `Bearer ${signInUserSession.idToken.jwtToken}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      throw new Error('認証エラー');
    }
  };

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
        const headers = await getAuthHeaders();
        
        const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/document`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error('APIエラー');
        }

        setUploadStatus('ドキュメントが正常にアップロードされました');
      } catch (error) {
        console.error('Error:', error);
        setUploadStatus(
          error.message === '認証エラー' 
            ? 'ログインが必要です'
            : 'アップロード中にエラーが発生しました'
        );
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
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('APIエラー');
      }

      const data = await response.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      setResponse(
        error.message === '認証エラー'
          ? 'ログインが必要です'
          : 'エラーが発生しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="App">
          <header className="App-header">
            <div className="auth-controls">
              <div className="user-info">
                <span>ようこそ, {user.username}</span>
                <button onClick={signOut}>ログアウト</button>
              </div>
            </div>
            <h1>RAG アプリケーション</h1>
            
            <section className="upload-section">
              <h2>ドキュメントのアップロード</h2>
              <form onSubmit={handleFileUpload}>
                <input
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  aria-label="ドキュメントを選択"
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  アップロード
                </button>
              </form>
              {uploadStatus && (
                <p className="status-message" role="status">
                  {uploadStatus}
                </p>
              )}
            </section>

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
                    aria-label="質問入力"
                  />
                </div>
                <div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? '処理中...' : '送信'}
                  </button>
                </div>
              </form>
            </section>

            {response && (
              <section className="response-section">
                <h2>回答:</h2>
                <div 
                  className="response-content"
                  role="region"
                  aria-live="polite"
                >
                  {response}
                </div>
              </section>
            )}
          </header>
        </div>
      )}
    </Authenticator>
  );
}

export default App;