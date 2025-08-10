// DeviceManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [pairingDeviceName, setPairingDeviceName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');

  // Fungsi untuk mengambil daftar perangkat
  const fetchDevices = useCallback(async () => {
    try {
      // Pastikan URL ini benar
      const response = await fetch('https://wablastmgm.onrender.com/api/whatsapp/devices');
      if (!response.ok) {
        // Tangani respons non-JSON di sini
        const errorText = await response.text();
        throw new Error(`Failed to fetch devices: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setDevices(data);
      console.log('Devices fetched:', data);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setStatusMessage(`Error fetching devices: ${error.message}`);
    }
  }, []);

  // Polling devices
  useEffect(() => {
    fetchDevices();
    const intervalId = setInterval(() => {
      fetchDevices();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchDevices]);

  // Socket.IO connection
  useEffect(() => {
    console.log('Initializing Socket.IO...');
    const socket = io('https://wablastmgm.onrender.com', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected!');
      setSocketStatus('connected');
      setStatusMessage('Socket.IO terhubung');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setSocketStatus('disconnected');
      setStatusMessage('Socket.IO terputus');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket.IO connection error:', err);
      setSocketStatus('error');
      setStatusMessage('Socket.IO error: ' + err.message);
    });

    socket.on('device_status_update', (data) => {
      console.log('📱 Device status update:', data);
      
      if (data.status === 'qr_code' && data.qrCode) {
        console.log('📸 QR Code received, displaying...');
        setQrCodeData(data.qrCode);
        setPairingDeviceName(data.deviceName);
        setStatusMessage(`Silakan scan QR Code untuk ${data.deviceName}.`);
      } else if (data.status === 'connected') {
        console.log('✅ Device connected');
        setQrCodeData(null);
        setStatusMessage(`${data.deviceName} berhasil terhubung!`);
        setPairingDeviceName('');
        fetchDevices();
      } else if (data.status === 'disconnected' || data.status === 'auth_failure' || data.status === 'error') {
        console.log('❌ Device error:', data.status);
        setQrCodeData(null);
        setStatusMessage(`${data.deviceName} ${data.status.replace('_', ' ')}. Alasan: ${data.reason || data.error || 'Tidak diketahui'}`);
        setPairingDeviceName('');
        fetchDevices();
      }
    });

    socket.on('test', (data) => {
      console.log('🧪 Socket test received:', data);
      alert('Socket.IO test: ' + data.message);
    });

    return () => {
      console.log('Cleaning up Socket.IO...');
      socket.disconnect();
    };
  }, [fetchDevices]);

  // Initialize device
  const handleInitDevice = async (deviceName, isNew = false) => {
    if (!deviceName) {
      setStatusMessage('Nama perangkat tidak boleh kosong.');
      return;
    }
    
    setLoading(true);
    setQrCodeData(null);
    setPairingDeviceName('');
    setStatusMessage(`Memulai ${deviceName}...`);
    
    try {
      console.log('🚀 Starting device:', deviceName);
      // Pastikan URL ini benar
      const response = await fetch('https://wablastmgm.onrender.com/api/whatsapp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName }),
      });
      
      const data = await response.json();
      console.log('📡 Backend response:', data);
      
      if (response.ok) {
        setPairingDeviceName(deviceName);
        setStatusMessage(data.message || `Memulai inisialisasi untuk ${deviceName}. Menunggu QR Code...`);
      } else {
        throw new Error(data.error || 'Gagal menginisialisasi perangkat.');
      }
      
      fetchDevices();
    } catch (error) {
      console.error('❌ Error initializing device:', error);
      setStatusMessage(`Error: ${error.message}`);
      setQrCodeData(null);
      setPairingDeviceName('');
    } finally {
      setLoading(false);
    }
  };

  // Logout device
  const handleLogoutDevice = async (deviceName) => {
    setLoading(true);
    setStatusMessage(`Memutuskan koneksi ${deviceName}...`);
    
    try {
      // Pastikan URL ini benar
      const response = await fetch('https://wablastmgm.onrender.com/api/whatsapp/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setStatusMessage(data.message);
        setQrCodeData(null);
        setPairingDeviceName('');
      } else {
        throw new Error(data.error || 'Gagal logout perangkat.');
      }
      
      fetchDevices();
    } catch (error) {
      console.error('❌ Error logging out device:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add device form submit
  const handleAddDeviceSubmit = (e) => {
    e.preventDefault();
    handleInitDevice(newDeviceName, true);
  };

  // Test socket connection
  const testSocket = () => {
    console.log('🧪 Testing Socket.IO...');
    // Panggil rute yang sudah kita tambahkan di backend
    fetch('https://wablastmgm.onrender.com/api/socket-test')
      .then(response => response.json())
      .then(data => {
        console.log('📡 Socket test response:', data);
      })
      .catch(err => {
        console.error('❌ Socket test error:', err);
      });
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '900px', 
      margin: '20px auto', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      textAlign: 'center', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' 
    }}>
      <h2>Manajemen Perangkat WhatsApp</h2>
      
      {/* Debug Panel */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4>Debug Information</h4>
        <p><strong>Socket.IO Status:</strong> {socketStatus}</p>
        <p><strong>Pairing Device:</strong> {pairingDeviceName || 'None'}</p>
        <p><strong>QR Code:</strong> {qrCodeData ? 'Available' : 'Not Available'}</p>
        <button 
          onClick={testSocket}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '5px'
          }}
        >
          Test Socket.IO
        </button>
      </div>
      
      {/* Status Message */}
      {statusMessage && (
        <div style={{ 
          marginBottom: '20px',
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: statusMessage.includes('Error') ? '#f8d7da' : '#d4edda',
          color: statusMessage.includes('Error') ? '#721c24' : '#155724',
          border: `1px solid ${statusMessage.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {statusMessage}
        </div>
      )}
      
      {/* Add Device Form */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        borderRadius: '8px', 
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6'
      }}>
        <h3>Tambah Perangkat Baru</h3>
        <form onSubmit={handleAddDeviceSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Nama Perangkat (contoh: Kantor_1)"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            disabled={loading}
            style={{ 
              flexGrow: 1, 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da' 
            }}
            required
          />
          <button
            type="submit"
            disabled={loading || !newDeviceName.trim()}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Memulai...' : 'Tambahkan Perangkat'}
          </button>
        </form>
        
        {/* QR Code Display */}
        {qrCodeData && pairingDeviceName && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            borderRadius: '8px', 
            backgroundColor: '#e3f2fd',
            border: '2px dashed #2196f3'
          }}>
            <h4>📱 Scan QR Code untuk "{pairingDeviceName}"</h4>
            <div style={{ margin: '15px 0' }}>
              <img 
                src={qrCodeData} 
                alt="QR Code" 
                style={{ 
                  width: '256px', 
                  height: '256px', 
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }} 
              />
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: '#666',
              lineHeight: '1.5'
            }}>
              1. Buka WhatsApp di ponsel Anda<br/>
              2. Tap Menu → Pengaturan → Perangkat Tertaut<br/>
              3. Tap "Tautkan Perangkat"<br/>
              4. Scan QR code ini
            </p>
          </div>
        )}
      </div>
      
      {/* Device List */}
      <div style={{ 
        padding: '20px', 
        borderRadius: '8px', 
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6'
      }}>
        <h3>Daftar Perangkat</h3>
        
        {devices.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Belum ada perangkat yang ditambahkan.
          </p>
        ) : (
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Nama Perangkat</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr key={device.deviceName}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontWeight: 'bold' }}>{device.deviceName}</div>
                    {device.phoneNumber && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        📞 {device.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: 
                        device.status === 'connected' ? '#28a745' :
                        device.status === 'initializing' ? '#ffc107' :
                        device.status === 'qr_code' ? '#17a2b8' :
                        device.status === 'auth_failure' ? '#dc3545' :
                        device.status === 'authenticated' ? '#6f42c1' :
                        '#6c757d'
                    }}>
                      {device.status === 'connected' ? '✅ Terhubung' :
                        device.status === 'initializing' ? '⏳ Menghubungkan...' :
                        device.status === 'qr_code' ? '📱 Membutuhkan QR' :
                        device.status === 'auth_failure' ? '❌ Autentikasi Gagal' :
                        device.status === 'authenticated' ? '🔒 Terautentikasi' :
                        '❌ Terputus'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {device.status !== 'connected' && device.status !== 'initializing' && (
                      <button
                        onClick={() => handleInitDevice(device.deviceName)}
                        disabled={loading}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          marginRight: '5px',
                          fontSize: '12px'
                        }}
                      >
                        🔄 Reconnect
                      </button>
                    )}
                    <button
                      onClick={() => handleLogoutDevice(device.deviceName)}
                      disabled={loading}
                      style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🚪 Logout
                    </button>
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

export default DeviceManagement;
