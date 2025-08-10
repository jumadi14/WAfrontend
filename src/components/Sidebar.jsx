// src/components/Sidebar.jsx
import React from 'react';
// Pastikan semua ikon yang dibutuhkan sudah di-import di sini
import { FaBars, FaTachometerAlt, FaWhatsapp, FaPaperPlane, FaHistory, FaFileAlt, FaInbox } from 'react-icons/fa'; 
import './Sidebar.css'; // Tetap gunakan file CSS terpisah untuk Sidebar

function Sidebar({ setActiveTab, activeTab, toggleSidebar, isSidebarOpen }) {
  return (
    <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <FaBars />
        </button>
        {isSidebarOpen && <h2>Menu</h2>}
      </div>
      <nav className="sidebar-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaTachometerAlt className="icon" /> {isSidebarOpen && 'Dashboard'}
        </button>
        <button
          className={activeTab === 'device' ? 'active' : ''}
          onClick={() => setActiveTab('device')}
        >
          <FaWhatsapp className="icon" /> {isSidebarOpen && 'Manajemen Perangkat'}
        </button>
        <button
          className={activeTab === 'send' ? 'active' : ''}
          onClick={() => setActiveTab('send')}
        >
          <FaPaperPlane className="icon" /> {isSidebarOpen && 'Kirim Pesan'}
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory className="icon" /> {isSidebarOpen && 'Riwayat Pesan'}
        </button>
        <button
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          <FaFileAlt className="icon" /> {isSidebarOpen && 'Manajemen Template'}
        </button>
        {/* <<< START: Tambahkan menu Inbox dengan struktur button >>> */}
        <button
          className={activeTab === 'inbox' ? 'active' : ''}
          onClick={() => setActiveTab('inbox')}
        >
          <FaInbox className="icon" /> {isSidebarOpen && 'Inbox Pesan'}
        </button>
        {/* <<< END: Tambahkan menu Inbox dengan struktur button >>> */}
      </nav>
    </aside>
  );
}

export default Sidebar;
