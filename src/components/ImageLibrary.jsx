// src/components/ImageLibrary.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaTrash, FaSpinner, FaTimes } from 'react-icons/fa'; // Import ikon

// Gaya inline untuk komponen ini (bisa dipindah ke file CSS jika diinginkan)
const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#555',
    },
    heading: {
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
    },
    uploadSection: {
        marginBottom: '30px',
        padding: '20px',
        border: '1px solid #eee',
        borderRadius: '5px',
        backgroundColor: '#f9f9f9',
    },
    fileInputContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
    },
    fileInput: {
        flexGrow: 1,
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
    },
    uploadButton: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'background-color 0.3s ease',
    },
    uploadButtonDisabled: {
        backgroundColor: '#a0c7ed',
        cursor: 'not-allowed',
    },
    message: {
        backgroundColor: '#d4edda',
        color: '#155724',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    error: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    imageList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '15px',
        marginTop: '20px',
    },
    imageItem: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer', // Tambah cursor pointer
        transition: 'transform 0.2s ease, border-color 0.2s ease',
    },
    imageItemSelected: { // Gaya untuk gambar yang terpilih
        borderColor: '#007bff',
        borderWidth: '2px',
        transform: 'scale(1.02)',
    },
    imageItemHover: { // Untuk efek hover
        transform: 'scale(1.03)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    imageThumbnail: {
        width: '100%',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '4px',
        marginBottom: '10px',
    },
    imageName: {
        fontSize: '0.9rem',
        color: '#333',
        marginBottom: '5px',
        textAlign: 'center',
        wordBreak: 'break-word', // Agar nama panjang tidak merusak layout
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        marginTop: 'auto', // Dorong ke bawah
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'background-color 0.3s ease',
    },
    deleteButtonDisabled: {
        backgroundColor: '#f0a7ad',
        cursor: 'not-allowed',
    },
    selectButton: {
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        marginTop: '5px',
        transition: 'background-color 0.3s ease',
    },
    selectButtonDisabled: {
        backgroundColor: '#a2d9b2',
        cursor: 'not-allowed',
    }
};

function ImageLibrary({ onClose, onSelectImage, selectedImageId }) { // Tambah selectedImageId sebagai prop
    const [images, setImages] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [currentSelectedImage, setCurrentSelectedImage] = useState(null); // State untuk gambar yang sedang dipilih di modal

    const API_URL = 'http://localhost:3000/api';

    useEffect(() => {
        fetchImages();
        // Set currentSelectedImage saat modal dibuka jika sudah ada gambar yang terpilih sebelumnya
        if (selectedImageId) {
            setCurrentSelectedImage(selectedImageId);
        }
    }, [selectedImageId]);

    const fetchImages = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axios.get(`${API_URL}/images`);
            setImages(response.data);
        } catch (err) {
            console.error('Error fetching images:', err);
            setError('Gagal memuat gambar: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setMessage('');
        setError('');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Pilih file gambar untuk diunggah.');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await axios.post(`${API_URL}/images/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage(response.data.message);
            setSelectedFile(null); // Reset input file
            fetchImages(); // Refresh daftar gambar
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Gagal mengunggah gambar: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (imageId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus gambar ini?')) {
            setIsLoading(true);
            setMessage('');
            setError('');
            try {
                const response = await axios.delete(`${API_URL}/images/${imageId}`);
                setMessage(response.data.message);
                fetchImages(); // Refresh daftar gambar
                if (currentSelectedImage === imageId) { // Jika gambar yang dihapus adalah yang terpilih, reset pilihan
                    setCurrentSelectedImage(null);
                    onSelectImage(null, null); // Beri tahu parent bahwa pilihan dihapus
                }
            } catch (err) {
                console.error('Error deleting image:', err);
                setError('Gagal menghapus gambar: ' + (err.response?.data?.error || err.message));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleImageClick = (image) => {
        setCurrentSelectedImage(image.id);
    };

    const handleSelectButtonClick = () => {
        const selectedImg = images.find(img => img.id === currentSelectedImage);
        if (selectedImg) {
            onSelectImage(selectedImg.id, selectedImg.url); // Kirim ID dan URL gambar
            onClose(); // Tutup modal setelah memilih
        } else {
            setError('Pilih gambar terlebih dahulu.');
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modalContent}>
                <button onClick={onClose} style={styles.closeButton}>
                    <FaTimes />
                </button>
                <h2 style={styles.heading}>Pustaka Gambar</h2>

                {message && <div style={styles.message}>{message}</div>}
                {error && <div style={styles.error}>{error}</div>}

                <div style={styles.uploadSection}>
                    <h3 style={{ marginBottom: '15px', color: '#555' }}>Unggah Gambar Baru</h3>
                    <div style={styles.fileInputContainer}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={styles.fileInput}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleUpload}
                            style={{ ...styles.uploadButton, ...(isLoading || !selectedFile ? styles.uploadButtonDisabled : {}) }}
                            disabled={isLoading || !selectedFile}
                        >
                            {isLoading ? <FaSpinner className="spin" /> : <FaUpload />} Unggah
                        </button>
                    </div>
                </div>

                <h3 style={{ marginBottom: '15px', color: '#555' }}>Gambar Tersedia</h3>
                {isLoading && <p style={{ textAlign: 'center' }}><FaSpinner className="spin" /> Memuat gambar...</p>}
                {!isLoading && images.length === 0 && <p style={{ textAlign: 'center' }}>Belum ada gambar yang diunggah.</p>}

                <div style={styles.imageList}>
                    {images.map((image) => (
                        <div
                            key={image.id}
                            style={{
                                ...styles.imageItem,
                                ...(currentSelectedImage === image.id ? styles.imageItemSelected : {}),
                                // Tambahkan efek hover
                                ':hover': styles.imageItemHover, // Ini butuh styling dengan styled-components atau library lain untuk inline
                            }}
                            onClick={() => handleImageClick(image)}
                            // Anda bisa menambahkan state hover jika ingin efek ini dengan gaya inline JS biasa
                            onMouseEnter={(e) => e.currentTarget.style.transform = styles.imageItemHover.transform}
                            onMouseLeave={(e) => e.currentTarget.style.transform = (currentSelectedImage === image.id ? styles.imageItemSelected : styles.imageItem).transform}
                        >
                            <img src={image.url} alt={image.originalName} style={styles.imageThumbnail} />
                            <p style={styles.imageName}>{image.originalName}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }} // Stop propagation agar tidak memicu handleImageClick
                                style={{ ...styles.deleteButton, ...(isLoading ? styles.deleteButtonDisabled : {}) }}
                                disabled={isLoading}
                            >
                                <FaTrash /> Hapus
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button
                        onClick={handleSelectButtonClick}
                        style={{ ...styles.selectButton, ...(isLoading || !currentSelectedImage ? styles.selectButtonDisabled : {}) }}
                        disabled={isLoading || !currentSelectedImage}
                    >
                        Pilih Gambar ({currentSelectedImage ? `ID: ${currentSelectedImage}` : 'Belum Ada'})
                    </button>
                    <button
                        onClick={() => {
                            setCurrentSelectedImage(null); // Reset pilihan
                            onSelectImage(null, null); // Beri tahu parent bahwa pilihan dihapus
                        }}
                        style={{
                            ...styles.selectButton, // Gunakan gaya yang sama atau buat baru
                            backgroundColor: '#6c757d', // Warna abu-abu
                            marginLeft: '10px',
                            ...(isLoading ? styles.selectButtonDisabled : {})
                        }}
                        disabled={isLoading}
                    >
                        Batalkan Pilihan
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImageLibrary;
