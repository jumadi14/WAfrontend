// TemplateManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TemplateManagement() {
    const [templates, setTemplates] = useState([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Pastikan URL API memiliki prefix /whatsapp
    const API_URL = 'http://localhost:3000/api/whatsapp';

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axios.get(`${API_URL}/templates`);
            setTemplates(response.data);
        } catch (err) {
            console.error('Error fetching templates:', err);
            setError('Gagal memuat template: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTemplate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        if (!newTemplateName.trim() || !newTemplateContent.trim()) {
            setError('Nama dan isi template tidak boleh kosong.');
            setIsLoading(false);
            return;
        }

        try {
            await axios.post(`${API_URL}/templates`, {
                name: newTemplateName,
                content: newTemplateContent,
            });
            setMessage('Template berhasil ditambahkan!');
            setNewTemplateName('');
            setNewTemplateContent('');
            fetchTemplates();
        } catch (err) {
            console.error('Error adding template:', err);
            setError('Gagal menambahkan template: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (template) => {
        setEditingTemplate({ ...template });
        setNewTemplateName(template.name);
        setNewTemplateContent(template.content);
    };

    const handleUpdateTemplate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        if (!newTemplateName.trim() || !newTemplateContent.trim()) {
            setError('Nama dan isi template tidak boleh kosong.');
            setIsLoading(false);
            return;
        }
        if (!editingTemplate || !editingTemplate.id) {
            setError('Tidak ada template yang sedang diedit atau ID tidak ditemukan.');
            setIsLoading(false);
            return;
        }

        try {
            await axios.put(`${API_URL}/templates/${editingTemplate.id}`, {
                name: newTemplateName,
                content: newTemplateContent,
            });
            setMessage('Template berhasil diperbarui!');
            setEditingTemplate(null);
            setNewTemplateName('');
            setNewTemplateContent('');
            fetchTemplates();
        } catch (err) {
            console.error('Error updating template:', err);
            setError('Gagal memperbarui template: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTemplate = async (name) => { // Menggunakan 'name' dari backend
        if (!window.confirm('Apakah Anda yakin ingin menghapus template ini?')) {
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            await axios.delete(`${API_URL}/templates/${name}`); // Menggunakan name
            setMessage('Template berhasil dihapus!');
            fetchTemplates();
        } catch (err) {
            console.error('Error deleting template:', err);
            setError('Gagal menghapus template: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingTemplate(null);
        setNewTemplateName('');
        setNewTemplateContent('');
        setError('');
        setMessage('');
    };

    const formTitle = editingTemplate ? 'Edit Template Pesan' : 'Tambah Template Pesan Baru';
    const submitButtonText = editingTemplate ? 'Perbarui Template' : 'Tambah Template';
    const submitHandler = editingTemplate ? handleUpdateTemplate : handleAddTemplate;

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Manajemen Template Pesan</h2>

            {/* Form Tambah/Edit Template */}
            <form onSubmit={submitHandler} style={styles.form}>
                <h3 style={styles.subHeading}>{formTitle}</h3>
                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="templateName">Nama Template:</label>
                    <input
                        type="text"
                        id="templateName"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Cth: Selamat Pagi, Info Diskon"
                        required
                        style={styles.input}
                        disabled={isLoading}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="templateContent">Isi Template:</label>
                    <textarea
                        id="templateContent"
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                        placeholder="Cth: Halo {nama}, selamat pagi! Kami punya diskon menarik untuk Anda."
                        rows="4"
                        required
                        style={styles.textarea}
                        disabled={isLoading}
                    ></textarea>
                    {/* PERBAIKAN DI SINI */}
                    <p style={styles.note}>Gunakan {'`{...}`'} untuk variabel, misalnya: {'`Halo {nama}, tagihan Anda sebesar {jumlah}.`'}</p>
                </div>
                <button
                    type="submit"
                    style={{
                        ...styles.button,
                        backgroundColor: editingTemplate ? '#2196f3' : '#4CAF50',
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Memproses...' : submitButtonText}
                </button>
                {editingTemplate && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                            ...styles.button,
                            backgroundColor: '#f44336',
                            marginLeft: '10px',
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                        disabled={isLoading}
                    >
                        Batal Edit
                    </button>
                )}
            </form>

            {message && <p style={styles.successMessage}>{message}</p>}
            {error && <p style={styles.errorMessage}>{error}</p>}

            <h3 style={styles.subHeading}>Daftar Template Tersedia</h3>
            {isLoading && !templates.length ? (
                <p>Memuat template...</p>
            ) : templates.length === 0 ? (
                <p>Belum ada template. Tambahkan yang pertama!</p>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Nama Template</th>
                                <th style={styles.th}>Isi Template</th>
                                <th style={styles.th}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map((template) => (
                                <tr key={template.id}>
                                    <td style={styles.td}>{template.id}</td>
                                    <td style={styles.td}>{template.name}</td>
                                    <td style={styles.td}>{template.content}</td>
                                    <td style={styles.tdActions}>
                                        <button
                                            onClick={() => handleEditClick(template)}
                                            style={{ ...styles.actionButton, backgroundColor: '#ffc107' }}
                                            disabled={isLoading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(template.name)}
                                            style={{ ...styles.actionButton, backgroundColor: '#f44336', marginLeft: '5px' }}
                                            disabled={isLoading}
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Inline Styles (sesuai gaya Anda sebelumnya)
const styles = {
    container: {
        padding: '20px',
        maxWidth: '900px',
        margin: '20px auto',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontFamily: 'Arial, sans-serif',
    },
    heading: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
        fontSize: '24px',
    },
    subHeading: {
        color: '#555',
        marginTop: '30px',
        marginBottom: '15px',
        fontSize: '18px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
    },
    form: {
        marginBottom: '30px',
        padding: '20px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        width: 'calc(100% - 20px)',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '0.8rem',
    },
    textarea: {
        width: 'calc(100% - 20px)',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '0.8rem',
        resize: 'vertical',
    },
    note: {
        fontSize: '0.875rem',
        color: '#6b7280',
        marginTop: '4px',
    },
    button: {
        padding: '10px 15px',
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.8rem',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        textAlign: 'center',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        textAlign: 'center',
    },
    tableContainer: {
        overflowX: 'auto',
        marginTop: '20px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
    },
    th: {
        backgroundColor: '#f2f2f2',
        border: '1px solid #ddd',
        padding: '12px 8px',
        textAlign: 'left',
        fontWeight: 'bold',
        color: '#333',
    },
    td: {
        border: '1px solid #ddd',
        padding: '8px',
        verticalAlign: 'top',
    },
    tdActions: {
        border: '1px solid #ddd',
        padding: '8px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
    },
    actionButton: {
        padding: '6px 10px',
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.8rem',
    },
};

export default TemplateManagement;
