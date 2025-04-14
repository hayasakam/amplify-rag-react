import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// Amplifyの設定
const amplifyConfig = {
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_REGION,
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
    }
  },
  API: {
    endpoints: [
      {
        name: 'ragApi',
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_REGION,
        custom_header: async () => {
          try {
            const session = await fetchAuthSession();
            return {
              Authorization: `Bearer ${session.tokens.idToken.toString()}`
            };
          } catch (error) {
            return {};
          }
        }
      },
    ],
  },
};

// デバッグ用のログ出力
console.log('Amplify Config:', {
  region: process.env.REACT_APP_REGION,
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  apiEndpoint: process.env.REACT_APP_API_ENDPOINT
});

Amplify.configure(amplifyConfig);

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getAuthHeaders = async () => {
    try {
      const session = await fetchAuthSession();
      
      // デバッグログ
      console.log('Session obtained:', {
        hasTokens: !!session.tokens,
        hasIdToken: !!session.tokens?.idToken,
      });

      if (!session.tokens?.idToken) {
        throw new Error('認証トークンが見つかりません');
      }

      const jwtToken = session.tokens.idToken.toString();

      return {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Auth error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
        
        console.log('Sending file upload request'); // デバッグログ

        const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/document`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ text }),
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('Upload Response status:', response.status);
          const errorText = await response.text();
          console.error('Upload Error details:', errorText);
          throw new Error('APIエラー');
        }

        setUploadStatus('ドキュメントが正常にアップロードされました');
      } catch (error) {
        console.error('Upload error details:', error);
        setUploadStatus(
          error.message === '認証エラー' 
            ? 'ログインセッションが無効です。再度ログインしてください。'
            : `アップロード中にエラーが発生しました: ${error.message}`
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
      
      // リクエストの詳細をログ出力
      console.log('Making API request to:', process.env.REACT_APP_API_ENDPOINT);
      console.log('Request headers:', {
        ...headers,
        Authorization: 'Bearer [REDACTED]'
      });

      const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`APIエラー: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);  // デバッグログ
      setResponse(data.response);
    } catch (error) {
      console.error('Query error:', error);
      setResponse(
        error.message.includes('認証')
          ? 'ログインセッションが無効です。再度ログインしてください。'
          : `エラーが発生しました: ${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => {
        console.log('Authenticated user:', user); // デバッグログ
        return (
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
        );
      }}
    </Authenticator>
  );
}

export default App;