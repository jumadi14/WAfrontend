// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';

// Fungsi untuk Icon (menggunakan SVG inline untuk kemudahan)
const Icon = ({ children, color, size = '24px', backgroundColor, className = '' }) => (
    <div style={{
        backgroundColor: backgroundColor,
        color: color,
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    }} className={className}>
        {children}
    </div>
);

// Fungsi helper untuk memformat timestamp menjadi waktu yang mudah dibaca
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
    });
};

// Fungsi helper untuk memotong teks pesan agar tidak terlalu panjang
const truncateMessage = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
};

function Dashboard() {
    // States untuk Pesan
    const [sentMessages, setSentMessages] = useState(0);
    const [failedMessages, setFailedMessages] = useState(0);
    const [readMessages, setReadMessages] = useState(0);
    const [totalOverallMessages, setTotalOverallMessages] = useState(0);
    const [pendingMessages, setPendingMessages] = useState(0);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [errorMessages, setErrorMessages] = useState(null);

    // States untuk Perangkat
    const [totalDevices, setTotalDevices] = useState(0);
    const [onlineDevices, setOnlineDevices] = useState(0);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [errorDevices, setErrorDevices] = useState(null);

    // States untuk Aktivitas Terakhir
    const [lastActivities, setLastActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(true);
    const [errorActivities, setErrorActivities] = useState(null);
    

    const API_URL = 'https://wablastmgm.onrender.com/api/whatsapp';

    const fetchMessageSummary = async () => {
        try {
            const response = await fetch(`${API_URL}/messages/total`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            
            const total = data.total || 0;
            const sent = data.sent || 0;
            const failed = data.failed || 0;
            const read = data.read || 0;
            const pending = data.pending || 0; // Menggunakan properti pending dari backend jika ada

            setTotalOverallMessages(total);
            setSentMessages(sent);
            setFailedMessages(failed);
            setReadMessages(read);
            setPendingMessages(pending);

        } catch (err) {
            console.error('Error fetching message summary:', err);
            setErrorMessages(`Gagal mengambil ringkasan pesan. Detail: ${err.message}`);
        } finally {
            setLoadingMessages(false);
        }
    };
    
    const fetchDeviceSummary = async () => {
        try {
            const response = await fetch(`${API_URL}/devices`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            
            const total = data.length;
            const online = data.filter(device =>
                ['authenticated', 'ready', 'connected'].includes(device.status)
            ).length;

            setTotalDevices(total);
            setOnlineDevices(online);
        } catch (err) {
            console.error('Error fetching device summary:', err);
            setErrorDevices(`Gagal mengambil ringkasan perangkat. Detail: ${err.message}`);
        } finally {
            setLoadingDevices(false);
        }
    };

    // --- FUNGSI UNTUK MENGAMBIL AKTIVITAS TERAKHIR (SUDAH DIPERBAIKI) ---
    const fetchLastActivities = async () => {
        setLoadingActivities(true);
        setErrorActivities(null);
        try {
            const response = await fetch(`${API_URL}/messages/recent`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setLastActivities(data);
        } catch (err) {
            console.error('Error fetching recent activities:', err);
            setErrorActivities(`Gagal memuat aktivitas terakhir. Detail: ${err.message}`);
        } finally {
            setLoadingActivities(false);
        }
    };

    useEffect(() => {
        fetchMessageSummary();
        fetchDeviceSummary();
        fetchLastActivities();

        const messagesIntervalId = setInterval(fetchMessageSummary, 15000);
        const devicesIntervalId = setInterval(fetchDeviceSummary, 10000);
        const activitiesIntervalId = setInterval(fetchLastActivities, 15000);

        return () => {
            clearInterval(messagesIntervalId);
            clearInterval(devicesIntervalId);
            clearInterval(activitiesIntervalId);
        };
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
            case 'delivered':
            case 'played':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                );
            case 'pending':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                );
            case 'failed':
            case 'revoked':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>
                );
        }
    };
    
    // KOMPONEN KARTU KECIL UNTUK MENGULANG TAMPILAN
    const StatisticCard = ({ title, value, icon, iconColor, iconBgColor }) => (
        <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 8px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
                <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>{title}</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '8px 0 0' }}>{value}</h3>
            </div>
            <Icon color={iconColor} backgroundColor={iconBgColor} size="48px">
                {icon}
            </Icon>
        </div>
    );
    
    return (
        <div style={{ padding: '24px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    
                </div>
            </div>

            {/* --- KARTU-KARTU ATAS --- */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {loadingMessages ? (
                    <p>Memuat data pesan...</p>
                ) : errorMessages ? (
                    <p style={{ color: 'red' }}>Error: {errorMessages}</p>
                ) : (
                    <>
                        <StatisticCard 
                            title="Total Pesan" 
                            value={totalOverallMessages} 
                            icon="📧" 
                            iconColor="#3b82f6" 
                            iconBgColor="#dbeafe" 
                        />
                        <StatisticCard 
                            title="Pesan Terkirim" 
                            value={sentMessages} 
                            icon="✓" 
                            iconColor="#10b981" 
                            iconBgColor="#d1fae5" 
                        />
                        <StatisticCard 
                            title="Pesan Pending" 
                            value={pendingMessages} 
                            icon="🕒" 
                            iconColor="#f59e0b" 
                            iconBgColor="#fef3c7" 
                        />
                        <StatisticCard 
                            title="Pesan Gagal" 
                            value={failedMessages} 
                            icon="✕" 
                            iconColor="#ef4444" 
                            iconBgColor="#fee2e2" 
                        />
                    </>
                )}
            </div>

            {/* --- KARTU-KARTU BAWAH (STATISTIK DAN AKTIVITAS) --- */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Statistik Device */}
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 16px' }}>Statistik Device</h3>
                    {loadingDevices ? (
                        <p>Memuat data device...</p>
                    ) : errorDevices ? (
                        <p style={{ color: 'red' }}>Error: {errorDevices}</p>
                    ) : (
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div style={{ flexGrow: 1 }}>
                                <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>Device Aktif</p>
                                <h4 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e', margin: '8px 0 0' }}>{onlineDevices}</h4>
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>Total Device</p>
                                <h4 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: '8px 0 0' }}>{totalDevices}</h4>
                            </div>
                            <Icon color="#3b82f6" backgroundColor="#dbeafe" size="48px">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                            </Icon>
                        </div>
                    )}
                </div>

                {/* Aktivitas Terakhir */}
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 16px' }}>Aktivitas Terakhir</h3>
                    {loadingActivities ? (
                        <p>Memuat aktivitas...</p>
                    ) : errorActivities ? (
                        <p style={{ color: 'red' }}>Error: {errorActivities}</p>
                    ) : lastActivities.length > 0 ? (
                        lastActivities.slice(0, 4).map((activity, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <Icon 
                                    color="#1f2937" 
                                    backgroundColor="#f3f4f6"
                                    size="32px"
                                >
                                    {getStatusIcon(activity.status)}
                                </Icon>
                                <div style={{ flexGrow: 1 }}>
                                    <p style={{ margin: 0, fontWeight: '500' }}>Pesan ke: {activity.toNumber}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                                        Pesan: {truncateMessage(activity.message, 46)}
                                    </p>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#9ca3af' }}>{formatTime(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#6b7280' }}>Belum ada aktivitas terbaru.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

