// src/components/Inbox.jsx
import React, { useState, useEffect } from 'react';
import { FaInbox } from 'react-icons/fa';

function Inbox() {
  const [inboxMessages, setInboxMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // State untuk filter status
  const [filterDevice, setFilterDevice] = useState('all'); // State untuk filter device
  const [availableDevices, setAvailableDevices] = useState([]); // State untuk daftar perangkat

  const API_BASE_URL = 'http://localhost:3000/api';

  // Fetch daftar perangkat yang tersedia
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/whatsapp/devices`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAvailableDevices(data.map(device => device.deviceName));
      } catch (err) {
        console.error('Error fetching devices for Inbox filters:', err);
      }
    };
    fetchDevices();
  }, []);

  const fetchInboxMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = new URL(`${API_BASE_URL}/whatsapp/inbox-messages`);

      // Tambahkan filter status
      if (filterStatus !== 'all') {
        url.searchParams.append('status', filterStatus);
      }
      // Tambahkan filter perangkat
      if (filterDevice !== 'all') {
        url.searchParams.append('deviceName', filterDevice);
      }

      console.log("Fetching inbox messages from:", url.toString());
      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      const data = await response.json();

      // Logika baru untuk memfilter pesan di sisi client-side
      const filteredMessages = data.filter(msg => {
        // Asumsi `fromNumber` atau properti lain di server bisa mengidentifikasi jenis pesan
        const sender = msg.fromNumber || msg.senderName;
        // Hanya tampilkan jika sender TIDAK mengandung @newsletter, @broadcast, atau @channel
        return !sender.includes('@newsletter') && !sender.includes('@broadcast') && !sender.includes('@channel');
      });

      setInboxMessages(filteredMessages);

      // Tandai pesan sebagai dibaca setelah berhasil dimuat (hanya yang 'unread')
      filteredMessages.forEach(async (msg) => {
        if (msg.status === 'unread') {
          try {
            await fetch(`${API_BASE_URL}/whatsapp/inbox-messages/${msg.status}/unread`, {
              method: 'PUT'
            });
            setInboxMessages(prevMessages =>
              prevMessages.map(m => m.id === msg.id ? { ...m, status: 'unread' } : m)
            );
          } catch (readError) {
            console.error(`Gagal menandai pesan ID ${msg.id} sebagai dibaca:`, readError);
          }
        }
      });
    } catch (err) {
      console.error('Error fetching inbox messages:', err);
      setError(`Gagal memuat pesan inbox. Detail: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Panggil fetchInboxMessages setiap kali filter status atau device berubah
  useEffect(() => {
    fetchInboxMessages();
    const intervalId = setInterval(fetchInboxMessages, 10000); // Polling setiap 10 detik
    return () => clearInterval(intervalId);
  }, [filterStatus, filterDevice]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 8px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0
        }}>
          <FaInbox style={{ marginRight: '10px' }} /> Pesan Masuk (Inbox)
        </h2>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 8px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <label style={{ fontWeight: 'bold', color: '#374151' }}>Filter Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#f9fafb',
            fontSize: '0.9rem',
            minWidth: '150px'
          }}
        >
          <option value="all">Semua Status</option>
          <option value="unread">Belum Dibaca</option>
          <option value="read">Dibaca</option>
        </select>

        <label style={{ fontWeight: 'bold', color: '#374151' }}>Filter Perangkat:</label>
        <select
          value={filterDevice}
          onChange={(e) => setFilterDevice(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#f9fafb',
            fontSize: '0.9rem',
            minWidth: '150px'
          }}
        >
          <option value="all">Semua Perangkat</option>
          {availableDevices.map(device => (
            <option key={device} value={device}>{device}</option>
          ))}
        </select>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 6px 10px -2px rgba(0,0,0,0.1), 0 2px 6px -1px rgba(0,0,0,0.06)',
        overflowX: 'auto'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Daftar Pesan Masuk</h3>
        {loading ? (
          <p style={{ fontSize: '1.2rem', fontWeight: 'extrabold', color: '#6b7280', textAlign: 'center' }}>Memuat pesan inbox...</p>
        ) : error ? (
          <p style={{ color: 'red', fontSize: '1rem', textAlign: 'center' }}>Error: {error}</p>
        ) : inboxMessages.length === 0 ? (
          <p style={{ fontSize: '1rem', color: '#6b7280', textAlign: 'center' }}>Belum ada pesan masuk yang ditemukan dengan filter ini.</p>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Device ID</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Dari (Sender)</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Pesan</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568', width: '150px' }}>Waktu</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568', width: '80px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {inboxMessages.map(msg => (
                <tr key={msg.id} style={{ backgroundColor: msg.status === 'unread' ? '#fffbeb' : 'inherit' }}>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#4a5568' }}>
                    {msg.deviceName}
                  </td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', fontWeight: 'bold', color: '#374151' }}>
                    {msg.senderName || msg.fromNumber}
                    {msg.senderName && msg.senderName !== msg.fromNumber && (
                      <div style={{ fontSize: '0.8em', color: '#6b7280' }}>{`(${msg.fromNumber})`}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#4a5568', wordBreak: 'break-word' }}>
                    {msg.body}
                  </td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#6b7280' }}>
                    {formatTimestamp(msg.timestamp)}
                  </td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: msg.status === 'unread' ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                    {msg.status === 'unread' ? 'Belum Dibaca' : 'Dibaca'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Inbox;
