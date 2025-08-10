import React, { useState, useEffect } from 'react';
import { FaHistory } from 'react-icons/fa';
import io from 'socket.io-client';

function MessageHistory() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDevice, setFilterDevice] = useState('all');
    const [availableDevices, setAvailableDevices] = useState([]);
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
                // Gunakan deviceName dari backend baru
                setAvailableDevices(data.map(device => device.deviceName));
            } catch (err) {
                console.error('Error fetching devices:', err);
            }
        };
        fetchDevices();
    }, []);

    // Setup Socket.IO untuk real-time updates
    useEffect(() => {
        const socket = io('http://localhost:3000');
        
        // Listen untuk update status pesan
        socket.on('outgoing_message_status_update', (data) => {
            console.log('Message status update:', data);
            // Update pesan yang bersangkutan di state
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === data.messageId 
                        ? { ...msg, status: data.status } 
                        : msg
                )
            );
            
            // Tampilkan notifikasi jika status berubah menjadi read
            if (data.status === 'read') {
                const message = messages.find(msg => msg.id === data.messageId);
                if (message && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('Pesan Dibaca', {
                        body: `Pesan ke ${message.toNumber} telah dibaca`,
                        icon: '/favicon.ico'
                    });
                }
            }
        });

        // Request permission untuk notifikasi
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => socket.disconnect();
    }, [messages]); // Tambahkan `messages` ke dependency array agar `find` berfungsi dengan data terbaru.

    const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = new URL(`${API_BASE_URL}/whatsapp/messages`);

            // Handle filter status
            if (filterStatus !== 'all') {
                if (filterStatus === 'sent_delivered_played') {
                    url.searchParams.append('status', 'sent');
                    url.searchParams.append('status', 'delivered');
                    url.searchParams.append('status', 'played');
                } else if (filterStatus === 'failed_or_revoked') {
                    url.searchParams.append('status', 'failed');
                    url.searchParams.append('status', 'revoked');
                } else {
                    url.searchParams.append('status', filterStatus);
                }
            }

            // Handle filter device
            if (filterDevice !== 'all') {
                url.searchParams.append('deviceName', filterDevice);
            }

            console.log("Fetching messages from:", url.toString());
            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            setMessages(data);
        } catch (err) {
            console.error('Error fetching message history:', err);
            setError(`Gagal memuat riwayat pesan. Detail: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    // Auto-refresh setiap 10 detik dan saat filter berubah
    useEffect(() => {
        fetchMessages();
        const intervalId = setInterval(fetchMessages, 10000);
        return () => clearInterval(intervalId);
    }, [filterStatus, filterDevice]);

    /**
     * @param {string|number} timestamp - Waktu dalam format string atau angka.
     * @returns {string} - Waktu yang diformat sesuai zona waktu Jakarta.
     */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };



    const displayStatus = (status) => {
        switch (status) {
            case 'pending':
                return 'Menunggu';
            case 'sent':
                return 'Terkirim ✅';
            case 'delivered':
                return 'Diterima 📱';
            case 'played':
                return 'Dimainkan ▶️';
            case 'read':
                return 'Dibaca 👁️';
            case 'failed':
                return 'Gagal ❌';
            case 'revoked':
                return 'Ditarik ↩️';
            default:
                return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b'; // amber
            case 'sent': return '#10b981'; // green
            case 'delivered': return '#8b5cf6'; // purple
            case 'played': return '#06b6d4'; // cyan
            case 'read': return '#3b82f6'; // blue
            case 'failed': return '#ef4444'; // red
            case 'revoked': return '#6b7280'; // gray
            default: return '#6b7280';
        }
    };

    // Truncate pesan jika terlalu panjang
    const truncateMessage = (message, maxLength = 100) => {
        if (!message) return '-';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 4px 8px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                marginBottom: '2rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <FaHistory style={{ marginRight: '10px', fontSize: '1.2rem', color: '#1f2937' }} />
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                }}>
                    Riwayat Pesan Terkirim
                </h2>
            </div>
            
            {/* Filter Section */}
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
                    <option value="pending">Menunggu</option>
                    <option value="sent_delivered_played">Terkirim/Diterima</option>
                    <option value="read">Dibaca</option>
                    <option value="failed_or_revoked">Gagal/Ditarik</option>
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
                
                <button
                    onClick={fetchMessages}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        marginLeft: 'auto'
                    }}
                >
                    Refresh Data
                </button>
            </div>
            
            {/* Messages Table */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 6px 10px -2px rgba(0,0,0,0.1), 0 2px 6px -1px rgba(0,0,0,0.06)',
                overflowX: 'auto'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{
                            display: 'inline-block',
                            width: '40px',
                            height: '40px',
                            border: '4px solid #f3f4f6',
                            borderTop: '4px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6b7280', marginTop: '16px' }}>
                            Memuat riwayat pesan...
                        </p>
                    </div>
                ) : error ? (
                    <div style={{ 
                        backgroundColor: '#fee2e2', 
                        border: '1px solid #fecaca', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        textAlign: 'center',
                        color: '#991b1b'
                    }}>
                        <p style={{ margin: 0 }}>Error: {error}</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ 
                        backgroundColor: '#f0f9ff', 
                        border: '1px solid #bae6fd', 
                        borderRadius: '8px', 
                        padding: '40px 16px', 
                        textAlign: 'center',
                        color: '#0369a1'
                    }}>
                        <p style={{ margin: 0, fontSize: '1.1rem' }}>
                            Tidak ada riwayat pesan yang ditemukan dengan filter ini.
                        </p>
                    </div>
                ) : (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.9rem',
                        textAlign: 'left'
                    }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>ID</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Perangkat</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Nomor Tujuan</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Pesan</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Waktu</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Status</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8f8f8', fontWeight: 'bold', color: '#4a5568' }}>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map(msg => (
                                <tr key={msg.id}>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#4a5568' }}>
                                        <code style={{ fontSize: '0.8rem', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                                            {msg.id.substring(0, 8)}...
                                        </code>
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#4a5568' }}>
                                        <span style={{ 
                                            backgroundColor: '#e0e7ff', 
                                            color: '#3730a3', 
                                            padding: '2px 8px', 
                                            borderRadius: '12px', 
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {msg.deviceName}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#4a5568' }}>
                                        <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                                            {msg.toNumber}
                                        </code>
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#4a5568', maxWidth: '300px', wordBreak: 'break-word' }}>
                                        {truncateMessage(msg.message)}
                                        {msg.mediaPath && (
                                            <span style={{ 
                                                display: 'inline-block', 
                                                marginLeft: '8px', 
                                                backgroundColor: '#dbeafe', 
                                                color: '#1d4ed8', 
                                                padding: '2px 6px', 
                                                borderRadius: '4px', 
                                                fontSize: '0.75rem'
                                            }}>
                                                📎 Media
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#4a5568' }}>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            {formatTimestamp(msg.sentAt || msg.timestamp)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7' }}>
                                        <span style={{
                                            backgroundColor: getStatusColor(msg.status),
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            display: 'inline-block'
                                        }}>
                                            {displayStatus(msg.status)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #edf2f7', color: '#dc2626', maxWidth: '200px', wordBreak: 'break-word' }}>
                                        {msg.error || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* CSS Animation for spinner */}
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default MessageHistory;

