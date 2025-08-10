// src/components/SendMessage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FaWhatsapp, FaSpinner, FaImage } from 'react-icons/fa';

function SendMessage() {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [intervalSeconds, setIntervalSeconds] = useState(10);
    const [excelFile, setExcelFile] = useState(null);
    const [uploadedContacts, setUploadedContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [imageFileToUpload, setImageFileToUpload] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [imageId, setImageId] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const [skipValidation, setSkipValidation] = useState(false);
    const [blastStatus, setBlastStatus] = useState(null);
    const [messageStatuses, setMessageStatuses] = useState({});
    
    const API_URL = 'http://localhost:3000/api';
    
    useEffect(() => {
        fetchDevices();
        fetchTemplates();
        // Set waktu default ke 10 menit dari sekarang
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setScheduledTime(`${hours}:${minutes}`);
    }, []);
    
    const fetchDevices = async () => {
        try {
            const response = await axios.get(`${API_URL}/whatsapp/devices`);
            setDevices(response.data);
            // Cari device yang connected
            const connectedDevice = response.data.find(device => device.status === 'connected');
            if (connectedDevice) {
                setSelectedDevice(connectedDevice.deviceName);
            } else if (response.data.length > 0) {
                setSelectedDevice(response.data[0].deviceName);
            }
        } catch (err) {
            console.error('Error fetching devices:', err);
            setError('Gagal mengambil daftar perangkat.');
        }
    };
    
    const fetchTemplates = async () => {
        try {
            // Perbaikan ada di sini: Mengganti URL API menjadi /api/whatsapp/templates
            const response = await axios.get(`${API_URL}/whatsapp/templates`);
            setTemplates(response.data);
        } catch (err) {
            console.error('Error fetching templates:', err);
            setError('Gagal mengambil daftar template.');
        }
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setExcelFile(file);
        setUploadedContacts([]);
        setMessage('');
        setError('');
    };
    
    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        setImageFileToUpload(file);
        if (file) {
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setImagePreviewUrl('');
        }
        setError('');
        setMessage('');
    };
    
    const handleReadExcel = async () => {
        if (!excelFile) {
            setError('Pilih file Excel terlebih dahulu.');
            return;
        }
        setIsLoading(true);
        setMessage('');
        setError('');
        setUploadedContacts([]);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    setError('File Excel kosong atau tidak memiliki data.');
                    setIsLoading(false);
                    return;
                }
                
                const contactsFromExcel = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const rawRecipientName = row[0];
                    const rawPhoneNumber = row[1];
                    
                    if (rawPhoneNumber) {
                        let phoneNumber = String(rawPhoneNumber).replace(/\D/g, '');
                        
                        // Handle different formats
                        if (phoneNumber.startsWith('0')) {
                            // Replace leading 0 with 62
                            phoneNumber = '62' + phoneNumber.substring(1);
                        } else if (phoneNumber.startsWith('+62')) {
                            // Remove + and keep 62
                            phoneNumber = phoneNumber.substring(1);
                        } else if (phoneNumber.startsWith('62')) {
                            // Already in correct format, do nothing
                        } else if (phoneNumber.length > 5) {
                            // Assume international format without country code, add 62
                            phoneNumber = '62' + phoneNumber;
                        }
                        
                        // Validate final phone number
                        if (phoneNumber.length >= 10 && phoneNumber.length <= 15 && phoneNumber.startsWith('62')) {
                            contactsFromExcel.push({
                                number: phoneNumber,
                                recipientName: String(rawRecipientName || '').trim(),
                                additionalMessage: '',
                                extraMessage: ''
                            });
                        } else {
                            console.warn(`Baris ${i + 1}: Nomor telepon '${rawPhoneNumber}' tidak valid, dilewati.`);
                        }
                    } else {
                        console.warn(`Baris ${i + 1}: Nomor telepon kosong, dilewati.`);
                    }
                }
                
                if (contactsFromExcel.length === 0) {
                    setError('Tidak ada kontak valid ditemukan di file Excel Anda.');
                } else {
                    setUploadedContacts(contactsFromExcel);
                    setMessage(`${contactsFromExcel.length} kontak berhasil dibaca dari Excel. Siap untuk dijadwalkan.`);
                }
            } catch (err) {
                console.error('Error reading Excel file:', err);
                setError('Gagal membaca file Excel. Pastikan formatnya benar (Kolom A: Nama, Kolom B: Nomor HP).');
            } finally {
                setIsLoading(false);
            }
        };
        
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            setError('Terjadi kesalahan saat membaca file.');
            setIsLoading(false);
        };
        
        reader.readAsArrayBuffer(excelFile);
    };
    const replacePlaceholders = (templateContent, contact) => {
    let finalMessage = templateContent;
    if (contact && contact.recipientName) {
        // Ganti placeholder {Nama} atau {nama} dengan nama penerima
        finalMessage = finalMessage.replace(/{Nama}/g, contact.recipientName);
        finalMessage = finalMessage.replace(/{nama}/g, contact.recipientName);
    }
    return finalMessage;
};

    const validateNumbers = async (contacts) => {
    const validNumbers = [];
    const invalidNumbers = [];
    
    // Buat array dari nomor-nomor yang akan divalidasi
    const numbersToValidate = contacts.map(contact => contact.number);
    
    try {
        // Kirim request dengan format yang benar (array numbers)
        const response = await axios.post(`${API_URL}/whatsapp/validate-number`, {
            deviceName: selectedDevice,
            numbers: numbersToValidate  // Kirim sebagai array, bukan single value
        });
        
        // Proses hasil validasi
        if (response.data && response.data.validationResults) {
            response.data.validationResults.forEach((result, index) => {
                const contact = contacts[index];
                if (result.isValid) {
                    validNumbers.push(contact);
                } else {
                    invalidNumbers.push({
                        ...contact,
                        error: result.error || 'Nomor tidak terdaftar di WhatsApp'
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error validating numbers:', error);
        // Jika error, tambahkan semua kontak ke invalidNumbers
        contacts.forEach(contact => {
            invalidNumbers.push({
                ...contact,
                error: 'Gagal memvalidasi nomor'
            });
        });
    }
    
    return { validNumbers, invalidNumbers };
};
    
    
    const checkBlastStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/debug/scheduler`);
            setBlastStatus(response.data);
            
            // Ambil status pesan
            const messagesResponse = await axios.get(`${API_URL}/messages?status=pending,sent,failed&deviceName=${selectedDevice}`);
            const statuses = {};
            messagesResponse.data.forEach(msg => {
                statuses[msg.id] = msg.status;
            });
            setMessageStatuses(statuses);
        } catch (err) {
            console.error('Error checking blast status:', err);
        }
    };
    
    const resetForm = () => {
        setUploadedContacts([]);
        setExcelFile(null);
        setImageFileToUpload(null);
        setImagePreviewUrl('');
        setImageId('');
        setSelectedTemplate('');
        setError('');
        setMessage('');
        setDebugInfo('');
        setBlastStatus(null);
        setMessageStatuses({});
        setSkipValidation(false);
        
        // Reset file input elements
        if (document.getElementById('excelFile')) {
            document.getElementById('excelFile').value = '';
        }
        if (document.getElementById('imageUpload')) {
            document.getElementById('imageUpload').value = '';
        }
        
        // Set waktu default ke 10 menit dari sekarang
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setScheduledTime(`${hours}:${minutes}`);
        
        // Reset interval ke default
        setIntervalSeconds(10);
    };
    
    const handleScheduleBlast = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setDebugInfo('');
        
        // Validasi input
        if (!selectedDevice) {
            setError('Pilih perangkat WhatsApp.');
            return;
        }
        if (uploadedContacts.length === 0) {
            setError('Belum ada kontak yang diunggah atau dibaca dari Excel.');
            return;
        }
        if (!scheduledTime) {
            setError('Pilih waktu pengiriman terjadwal.');
            return;
        }
        if (intervalSeconds <= 0) {
            setError('Jeda antar pesan harus lebih dari 0 detik.');
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Konversi waktu terjadwal ke ISO string
            const [hours, minutes] = scheduledTime.split(':').map(Number);
            const now = new Date();
            let baseScheduledDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
            
            // Jika waktu yang dijadwalkan sudah lewat hari ini, atur untuk besok
            if (baseScheduledDateTime.getTime() <= now.getTime()) {
                baseScheduledDateTime.setDate(baseScheduledDateTime.getDate() + 1);
            }
            
            const scheduledTimeISO = baseScheduledDateTime.toISOString();
            
            let finalImageId = imageId;
             let finalImagePath = null;
            // Upload gambar jika ada dan belum diupload
           if (imageFileToUpload && !imageId) {
            const formData = new FormData();
            formData.append('image', imageFileToUpload);
            
            try {
                console.log("Mengunggah gambar ke backend...");
                const uploadResponse = await axios.post(`${API_URL}/images/upload`, formData);
                finalImageId = uploadResponse.data.imageId;
                finalImagePath = `/uploads/${finalImageId}`; // Tetapkan nilai variabel di sini
                setImageId(finalImageId);
                setMessage('Gambar berhasil diunggah.');
                console.log("Gambar berhasil diunggah. ID:", finalImageId);
            } catch (uploadErr) {
                console.error('Error uploading image for blast:', uploadErr);
                setError('Gagal mengunggah gambar: ' + (uploadErr.response?.data?.error || uploadErr.message));
                setIsLoading(false);
                return;
            }
        } else if (imageId) {
            // Jika imageId sudah ada (sudah diupload sebelumnya), gunakan itu
            finalImagePath = `/uploads/${imageId}`;
        }
            
            let finalContacts = uploadedContacts;
            
            if (!skipValidation) {
                // Validasi nomor WhatsApp terlebih dahulu
                const { validNumbers, invalidNumbers } = await validateNumbers(uploadedContacts);
                
                if (invalidNumbers.length > 0) {
                    setError(`${invalidNumbers.length} nomor tidak valid atau tidak terdaftar di WhatsApp`);
                    console.log('Invalid numbers:', invalidNumbers);
                }
                
                if (validNumbers.length === 0) {
                    setError('Tidak ada nomor valid yang bisa dikirim');
                    setIsLoading(false);
                    return;
                }
                
                finalContacts = validNumbers;
            }
            
            // Siapkan payload untuk backend
       const template = templates.find(t => t.name === selectedTemplate);
        if (!template) {
            setError('Template tidak ditemukan.');
            setIsLoading(false);
            return;
        }

        const messagesToSend = finalContacts.map(contact => ({
	    to: contact.number,
	    message: replacePlaceholders(template.content, contact), // Hanya ganti nama
	    recipientName: contact.recipientName,
	    mediaPath: finalImagePath,
	    imageId: finalImageId,
	}));

	const payload = {
	    contacts: finalContacts, // Kirimkan array kontak langsung
	    scheduledTime: scheduledTimeISO,
	    intervalSeconds: parseInt(intervalSeconds),
	    templateName: selectedTemplate, // Kirimkan nama template
	    deviceName: selectedDevice,
	    imageId: finalImageId, // Kirimkan ID gambar
	};

	console.log("Payload yang akan dikirim ke backend:", payload);
	setDebugInfo(`Mengirim ${finalContacts.length} pesan ke backend...`);
            
            // Kirim ke backend
            // Perbaikan di sini: Mengubah URL API menjadi /api/whatsapp/blast-excel
            const response = await axios.post(`${API_URL}/whatsapp/blast-excel`, payload);
            
            console.log("Response dari backend:", response.data);
            
            setMessage(response.data.message);
            
            // Tampilkan warning jika ada
            if (response.data.warning) {
                setError(`Peringatan: ${response.data.warning}`);
            }
            
            if (response.data.failedMessages && response.data.failedMessages.length > 0) {
                setDebugInfo(`Pesan gagal disimpan:\n${response.data.failedMessages.map(m => 
                    `${m.contact.recipientName || m.contact.number}: ${m.error}`
                ).join('\n')}`);
            }
            
            // Reset form setelah sukses
            resetForm();
            
        } catch (err) {
            console.error('Error scheduling blast:', err);
            
            // Tampilkan detail error untuk debugging
            let errorMessage = 'Gagal menjadwalkan blast.';
            let debugDetails = '';
            
            if (err.response) {
                console.error('Error response status:', err.response.status);
                console.error('Error response data:', err.response.data);
                
                if (err.response.data && err.response.data.error) {
                    errorMessage = err.response.data.error;
                }
                
                if (err.response.data && err.response.data.details) {
                    errorMessage += ` Detail: ${err.response.data.details}`;
                }
                
                // Tambahkan debug details
                debugDetails = `Status: ${err.response.status}\n`;
                debugDetails += `Response: ${JSON.stringify(err.response.data, null, 2)}`;
            } else {
                errorMessage = err.message;
                debugDetails = `Error: ${err.message}\n`;
                debugDetails += `Stack: ${err.stack}`;
            }
            
            setError(errorMessage);
            setDebugInfo(`Error: ${errorMessage}\n\nDebug Details:\n${debugDetails}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const spinnerStyle = {
        marginRight: '8px',
        animation: 'spin 1s linear infinite',
    };
    
    const inputStyle = {
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        appearance: 'none',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        width: '100%',
        padding: '8px 12px',
        color: '#374151',
        lineHeight: '1.5',
        outline: 'none',
        fontSize: '0.9rem',
    };
    
    const labelStyle = {
        display: 'block',
        color: '#374151',
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '8px',
    };
    
    const formGroupStyle = {
        marginBottom: '16px',
    };
    
    const buttonStyle = {
        backgroundColor: '#22c55e',
        color: 'white',
        fontWeight: 'bold',
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        width: '100%',
        cursor: 'pointer',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };
    
    return (
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
            <div style={{
                backgroundColor: '#ffffff',
                padding: '16px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                marginBottom: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <FaWhatsapp style={{ marginRight: '10px', fontSize: '1.2rem', color: '#374151' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                    Jadwalkan Blast Pesan WhatsApp
                </h2>
            </div>
            
            {message && <div style={{ backgroundColor: '#dcfce7', borderLeft: '4px solid #22c55e', color: '#166534', padding: '16px', marginBottom: '16px', borderRadius: '4px', fontSize: '1rem' }} role="alert">{message}</div>}
            {error && <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '16px', marginBottom: '16px', borderRadius: '4px', fontSize: '1rem' }} role="alert">{error}</div>}
            
            {/* Debug Info */}
            {debugInfo && (
                <div style={{ 
                    backgroundColor: '#f3f4f6', 
                    border: '1px solid #d1d5db', 
                    padding: '12px', 
                    marginBottom: '16px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    <strong>Debug Info:</strong><br />
                    {debugInfo}
                </div>
            )}
            
            <form onSubmit={handleScheduleBlast} style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                maxWidth: '60rem',
                margin: '0 auto'
            }}>
                {/* Perangkat WhatsApp */}
                <div style={formGroupStyle}>
                    <label htmlFor="device" style={labelStyle}>Pilih Perangkat WhatsApp:</label>
                    <select
                        id="device"
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        required
                        style={{ ...inputStyle, fontSize: '0.7rem' }}
                    >
                        <option value="">-- Pilih Perangkat --</option>
                        {devices.map(device => (
                            <option 
                                key={device.deviceName} 
                                value={device.deviceName} 
                                disabled={device.status !== 'connected'} 
                                style={{ fontSize: '1rem' }}
                            >
                                {device.deviceName} ({device.status === 'connected' ? 'Connected' : device.status === 'auth_failure' ? 'Auth Failure' : 'Disconnected'})
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Upload Excel */}
                <div style={formGroupStyle}>
                    <label htmlFor="excelFile" style={labelStyle}>
                        Upload File Excel (Kolom A: Nama Penerima, Kolom B: Nomor HP):
                    </label>
                    <input
                        type="file"
                        id="excelFile"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        style={{ ...inputStyle, display: 'block', backgroundColor: '#f9fafb', cursor: 'pointer' }}
                        required
                    />
                    <button
                        type="button"
                        onClick={handleReadExcel}
                        style={{
                            marginTop: '12px', 
                            backgroundColor: '#3b82f6', 
                            color: 'white', 
                            fontWeight: 'bold', 
                            padding: '8px 16px', 
                            borderRadius: '4px', 
                            border: 'none', 
                            cursor: 'pointer',
                            opacity: (!excelFile || isLoading) ? 0.5 : 1,
                            pointerEvents: (!excelFile || isLoading) ? 'none' : 'auto',
                            fontSize: '0.7rem',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center'
                        }}
                        disabled={!excelFile || isLoading}
                    >
                        {isLoading && excelFile ? (
                            <>
                                <FaSpinner style={spinnerStyle} /> <span style={{ fontSize: '1rem' }}>Membaca...</span>
                            </>
                        ) : <span style={{ fontSize: '0.7rem' }}>Baca Excel</span>}
                    </button>
                    {uploadedContacts.length > 0 && (
                        <p style={{ fontSize: '1rem', color: '#4b5563', marginTop: '8px' }}>
                            {uploadedContacts.length} kontak berhasil dibaca dari Excel. Siap untuk dijadwalkan.
                        </p>
                    )}
                </div>
                
                {/* Daftar Kontak yang Diunggah */}
                {uploadedContacts.length > 0 && (
                    <div style={{ 
                        marginBottom: '24px', 
                        backgroundColor: '#eff6ff', 
                        padding: '16px', 
                        borderRadius: '6px', 
                        boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)', 
                        maxHeight: '240px', 
                        overflowY: 'auto' 
                    }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e40af', marginBottom: '12px' }}>Daftar Kontak dari Excel:</h4>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '1rem', color: '#4b5563' }}>
                            {uploadedContacts.slice(0, 10).map((contact, index) => (
                                <li key={index} style={{ fontSize: '1rem' }}>
                                    {contact.recipientName || 'Nama Kosong'} - {contact.number}
                                </li>
                            ))}
                            {uploadedContacts.length > 10 && (
                                <li style={{ fontSize: '1rem', color: '#4b5563' }}>... dan {uploadedContacts.length - 10} kontak lainnya.</li>
                            )}
                        </ul>
                    </div>
                )}
                
                {/* Opsi Validasi */}
                <div style={formGroupStyle}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                        <input
                            type="checkbox"
                            checked={skipValidation}
                            onChange={(e) => setSkipValidation(e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        Lewati validasi nomor WhatsApp (tidak disarankan)
                    </label>
                </div>
                
                {/* Pilih Template Pesan */}
                <div style={formGroupStyle}>
                    <label htmlFor="template" style={labelStyle}>Pilih Template Pesan:</label>
                    <select
                        id="template"
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="">-- Pilih Template (Opsional) --</option>
                        {templates.map(template => (
                            <option key={template.id} value={template.name} style={{ fontSize: '1rem' }}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                    <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '4px' }}>
                        Template akan otomatis mengganti `{'nama'}` dengan nama dari Excel.
                    </p>
                </div>
                
                {/* Upload Gambar */}
                <div style={formGroupStyle}>
                    <label htmlFor="imageUpload" style={labelStyle}>Unggah Gambar (Opsional):</label>
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ ...inputStyle, display: 'block', backgroundColor: '#f9fafb', cursor: 'pointer' }}
                        disabled={isLoading}
                    />
                    {imagePreviewUrl && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '5px',
                            backgroundColor: '#f9f9f9',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <img src={imagePreviewUrl} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                            <span style={{ fontSize: '0.9em', color: '#555' }}>{imageFileToUpload ? imageFileToUpload.name : 'Gambar terpilih'}</span>
                            <button
                                type="button"
                                onClick={() => { 
                                    setImageFileToUpload(null); 
                                    setImagePreviewUrl(''); 
                                    setImageId('');
                                }}
                                style={{
                                    marginLeft: 'auto',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em'
                                }}
                            >
                                Hapus
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Waktu Terjadwal */}
                <div style={formGroupStyle}>
                    <label htmlFor="scheduledTime" style={labelStyle}>Waktu Pengiriman Terjadwal Hari Ini (HH:MM):</label>
                    <input
                        type="time"
                        id="scheduledTime"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        required
                        style={inputStyle}
                    />
                    <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '4px' }}>
                        Jika waktu ini sudah lewat hari ini, pesan akan dijadwalkan untuk besok di waktu yang sama.
                    </p>
                </div>
                
                {/* Jeda Antar Pesan */}
                <div style={{ marginBottom: '24px' }}>
                    <label htmlFor="intervalSeconds" style={labelStyle}>Jeda Antar Pesan (detik):</label>
                    <input
                        type="number"
                        id="intervalSeconds"
                        min="1"
                        value={intervalSeconds}
                        onChange={(e) => setIntervalSeconds(parseInt(e.target.value, 10))}
                        required
                        style={inputStyle}
                    />
                    <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '4px' }}>
                        Pesan akan dikirim dengan jeda waktu ini untuk menghindari blokir. Minimal 10 detik direkomendasikan.
                    </p>
                </div>
                
                {/* Tombol Jadwalkan */}
                <button
                    type="submit"
                    style={{
                        ...buttonStyle,
                        opacity: (isLoading || uploadedContacts.length === 0 || !selectedDevice || !scheduledTime || intervalSeconds <= 0) ? 0.5 : 1,
                        pointerEvents: (isLoading || uploadedContacts.length === 0 || !selectedDevice || !scheduledTime || intervalSeconds <= 0) ? 'none' : 'auto',
                    }}
                    disabled={isLoading || uploadedContacts.length === 0 || !selectedDevice || !scheduledTime || intervalSeconds <= 0}
                >
                    {isLoading ? (
                        <>
                            <FaSpinner style={spinnerStyle} /> <span style={{ fontSize: '1rem' }}>Menjadwalkan...</span>
                        </>
                    ) : (
                        <>
                            <FaWhatsapp style={{ marginRight: '8px', fontSize: '1rem' }} /> <span style={{ fontSize: '1rem' }}>Jadwalkan Pesan Blast</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default SendMessage;
