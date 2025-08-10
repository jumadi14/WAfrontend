// App.jsx
import React, { useState, useEffect } from 'react';
import DeviceManagement from './components/DeviceManagement.jsx';
import SendMessage from './components/SendMessage.jsx';
import MessageHistory from './components/MessageHistory.jsx';
import Dashboard from './components/Dashboard.jsx';
import Sidebar from './components/Sidebar.jsx';
import TemplateManagement from './components/TemplateManagement.jsx';
import Inbox from './components/Inbox.jsx'; // Tambahkan import Inbox
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchTotalMessages = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL; // Ambil dari .env
      const response = await fetch(`${baseUrl}/whatsapp/messages/total`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTotalMessagesCount(data.total);
    } catch (error) {
      console.error("Error fetching total messages for dashboard:", error);
    }
  };

  useEffect(() => {
    fetchTotalMessages();
    const interval = setInterval(fetchTotalMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`app-container ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
      <Sidebar
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        tabs={['dashboard', 'device', 'send', 'history', 'templates', 'inbox']} // Tab Inbox
      />

      <main className="main-content">
        <header className="app-header">
          <h1>MGM WA Sender APP</h1>
        </header>

        <div className="app-content">
          {activeTab === 'dashboard' && <Dashboard totalMessages={totalMessagesCount} />}
          {activeTab === 'device' && <DeviceManagement />}
          {activeTab === 'send' && <SendMessage onMessageScheduled={fetchTotalMessages} />}
          {activeTab === 'history' && <MessageHistory />}
          {activeTab === 'templates' && <TemplateManagement />}
          {activeTab === 'inbox' && <Inbox />}
        </div>

        {/* Footer */}
        <footer style={{
          backgroundColor: '#ffffff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.1), 0 -2px 4px -1px rgba(0,0,0,0.06)',
          marginTop: '24px',
          textAlign: 'center',
          color: '#4b5563',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: '0' }}>
            Property milik PT. Muria Global Mandiri | Jl. Kertajaya VI No.56, Gubeng, Surabaya
          </p>
          <p style={{ margin: '4px 0 0 0' }}>
            Powered by Jumadi &copy; 2025
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;

