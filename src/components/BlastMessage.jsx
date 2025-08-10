// src/components/BlastMessage.jsx
import React, { useState, useEffect } from 'react';

function BlastMessage({ onMessageScheduled }) {
  const [excelFile, setExcelFile] = useState(null);
  const [blastScheduledTime, setBlastScheduledTime] = useState('');
  const [blastIntervalSeconds, setBlastIntervalSeconds] = useState(10);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [blastStatusMessage, setBlastStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [deviceStatus, setDeviceStatus] = useState('disconnected'); 
  useEffect(() => {
    const fetchDeviceStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/whatsapp/status');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDeviceStatus(data.status);
      } catch (error) {
        console.error('Error fetching device status for BlastMessage:', error);
        setDeviceStatus('error');
      }
    };
    fetchDeviceStatus();
    const intervalId = setInterval(fetchDeviceStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/templates');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMessageTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  const handleFileChange = (event) => {
    setExcelFile(event.target.files[0]);
  };

  const handleBlastExcel = async (event) => {
    event.preventDefault();

    if (!excelFile) {
      setBlastStatusMessage('Pilih file Excel terlebih dahulu.');
      return;
    }
    if (!blastScheduledTime) {
        setBlastStatusMessage('Waktu pengiriman terjadwal harus diisi (HH:MM).');
        return;
    }
    if (blastIntervalSeconds < 1) {
        setBlastStatusMessage('Jeda antar pesan harus minimal 1 detik.');
        return;
    }
    if (!['connected', 'isLogged', 'successChat'].includes(deviceStatus)) {
        setBlastStatusMessage('Error: Perangkat WhatsApp belum terhubung. Harap hubungkan perangkat terlebih dahulu.');
        return;
    }

    setLoading(true);
    setBlastStatusMessage('Mengunggah dan menjadwalkan pesan dari Excel...');

    const formData = new FormData();
    formData.append('excelFile', excelFile);
    formData.append('scheduled_time', blastScheduledTime);
    formData.append('interval_seconds', blastIntervalSeconds);
    formData.append('message_template_name', selectedTemplate || '');

    try {
      const response = await fetch('http://localhost:3000/api/blast-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setBlastStatusMessage(`Sukses: ${result.message}`);
      setExcelFile(null);
      if (document.getElementById('excelFileInput')) {
        document.getElementById('excelFileInput').value = ''; 
      }
      setBlastScheduledTime(''); 
      setBlastIntervalSeconds(10);
      setSelectedTemplate('');

      if (onMessageScheduled) {
        onMessageScheduled();
      }

    } catch (error) {
      console.error('Gagal menjadwalkan blast dari Excel:', error);
      setBlastStatusMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Kirim Pesan (Blast dari Excel)</h2>
      <div className="blast-card" style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#f9f9f9' }}>
        <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '20px' }}>
          Unggah file Excel Anda. **Kolom A** harus berisi **Nomor Telepon** (misal: 6281234567890). **Kolom B** bisa berisi **Isi Pesan** (opsional, jika tidak menggunakan template, ini akan menjadi pesan utama). **Kolom C** untuk **Nama** (`{nama}`) dan **Kolom D** untuk **Pesan Tambahan** (`{pesan_tambahan}`) jika menggunakan template.
        </p>
        <form onSubmit={handleBlastExcel}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="excelFileInput" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pilih File Excel:</label>
            <input
              type="file"
              id="excelFileInput"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              required
              disabled={loading}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="scheduledTimeInput" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Waktu Mulai Pengiriman (HH:MM):</label>
            <input
              type="time"
              id="scheduledTimeInput"
              value={blastScheduledTime}
              onChange={(e) => setBlastScheduledTime(e.target.value)}
              required
              disabled={loading}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '150px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="intervalSecondsInput" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Jeda Antar Pesan (detik):</label>
            <input
              type="number"
              id="intervalSecondsInput"
              value={blastIntervalSeconds}
              onChange={(e) => setBlastIntervalSeconds(parseInt(e.target.value, 10))}
              min="1"
              required
              disabled={loading}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="templateSelect" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pilih Template Pesan (Opsional):</label>
            <select
              id="templateSelect"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={loading}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
            >
              <option value="">-- Tanpa Template --</option>
              {messageTemplates.map(template => (
                <option key={template.id} value={template.name}>{template.name}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
              Jika template dipilih, Kolom B Excel akan ditambahkan ke akhir template. Kolom C & D akan mengisi `{nama}` dan `{pesan_tambahan}` di template.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !['connected', 'isLogged', 'successChat'].includes(deviceStatus)}
            style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', fontSize: '1em' }}
          >
            {loading ? 'Menjadwalkan...' : 'Jadwalkan Blast Pesan'}
          </button>
        </form>
        {blastStatusMessage && <p style={{ marginTop: '15px', color: blastStatusMessage.includes('Error') ? 'red' : 'green', fontWeight: 'bold' }}>{blastStatusMessage}</p>}
      </div>

      <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666', textAlign: 'center' }}>
        * Pastikan perangkat WhatsApp sudah terhubung di menu **Device Management** sebelum menjadwalkan pesan.
      </p>
    </div>
  );
}

export default BlastMessage;
