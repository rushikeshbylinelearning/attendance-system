import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import '../styles/TicketForm.css';
import {
  X, Upload, AlertCircle, CheckCircle, Loader,
  Image, FileText, Tag, AlertTriangle
} from 'lucide-react';

// Static data remains outside the component for performance.
const componentIssues = {
  Monitor: ['Screen flickering', 'No display', 'Dead pixels', 'Color distortion', 'Screen freeze', 'Resolution issues', 'Brightness problems', 'Multiple monitor setup issues', 'Cable connection problems'],
  CPU: ['Not turning on', 'Random shutdowns', 'Overheating', 'Blue screen errors', 'Slow performance', 'Strange noises', 'USB ports not working', 'Boot failure', 'Memory errors'],
  Headphone: ['No sound', 'Sound only from one side', 'Crackling noise', 'Microphone not working', 'Connection issues', 'Volume problems', 'Bluetooth pairing issues', 'Audio delay'],
  KB: ['Keys not responding', 'Sticky keys', 'Missing keys', 'Connection problems', 'Backlighting issues', 'Wrong characters typing', 'Wireless connectivity', 'Function keys not working'],
  Mouse: ['Cursor not moving', 'Click not working', 'Scroll wheel issues', 'Connection problems', 'Sensitivity problems', 'Battery issues', 'Wireless lag', 'Double-click issues'],
  UPS: ['Not charging', 'Battery backup low', 'Beeping continuously', 'No power output', 'Display not working', 'Overload issues', 'Auto shutdown problems', 'Battery replacement needed'],
  Others: ['Network connectivity', 'Printer issues', 'Software problems', 'Email issues', 'Phone problems', 'General hardware', 'Access card problems', 'Desk setup issues']
};

const initialFormData = { component: '', issue: '', description: '', priority: 'Medium', status: 'Open', screenshotFile: null };

function TicketForm({ open, handleClose, ticket, onSave }) {
  const [formData, setFormData] = useState(initialFormData);
  const [existingScreenshotUrl, setExistingScreenshotUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const isAdminOrTech = user.role === 'admin' || user.role === 'technician';

  useEffect(() => {
    if (ticket) {
      setFormData({ component: ticket.component || '', issue: ticket.issue || '', description: ticket.description || '', priority: ticket.priority || 'Medium', status: ticket.status || 'Open', screenshotFile: null });
      setExistingScreenshotUrl(ticket.screenshot || '');
    } else {
      setFormData(initialFormData);
      setExistingScreenshotUrl('');
    }
    setError(''); setSuccess('');
  }, [ticket, open]);

  const displayUrl = useMemo(() => {
    if (formData.screenshotFile) return URL.createObjectURL(formData.screenshotFile);
    return existingScreenshotUrl;
  }, [formData.screenshotFile, existingScreenshotUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'component' && { issue: '' }) }));
  };

  const handleFileChange = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please upload a valid image file (PNG, JPG, etc.)'); return; }
    setFormData(prev => ({ ...prev, screenshotFile: file }));
    setError('');
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true); else if (e.type === 'dragleave') setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.component || !formData.issue || !formData.description) { setError("Please fill out all required fields: Component, Issue, and Description."); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      let finalScreenshotUrl = existingScreenshotUrl;
      if (formData.screenshotFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.screenshotFile);
        const uploadResponse = await api.post('/upload', uploadFormData);
        finalScreenshotUrl = uploadResponse.data.url;
      }
      const ticketData = { ...formData, screenshot: finalScreenshotUrl };
      delete ticketData.screenshotFile;

      if (ticket) { await api.put(`/tickets/${ticket._id}`, ticketData); setSuccess('Ticket updated successfully!'); } 
      else { await api.post('/tickets', ticketData); setSuccess('Ticket created successfully!'); }

      setTimeout(() => { onSave(); handleClose(); }, 1500);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save ticket. Please try again.'); } 
    finally { setLoading(false); }
  };
  
  if (!open) return null;

  return (
    <>
      <div className="ticket-form-overlay">
        <div className="ticket-form-container">
          <header className="ticket-form-header">
            <div className="form-title-section">
              <h2 className="form-title">{ticket ? 'Edit Ticket' : 'Create New Ticket'}</h2>
              <p className="form-subtitle">Fill out the details below to submit a request.</p>
            </div>
            <button onClick={handleClose} className="form-close-btn" aria-label="Close form"><X /></button>
          </header>

          <form onSubmit={handleSubmit} className="ticket-form" noValidate>
            <div className="form-grid">
              <div className="form-group"><label className="form-label"><Tag /> Component *</label><select name="component" value={formData.component} onChange={handleInputChange} className="form-select" required><option value="">Select Component...</option>{Object.keys(componentIssues).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label"><AlertTriangle /> Issue *</label><select name="issue" value={formData.issue} onChange={handleInputChange} className="form-select" required disabled={!formData.component}><option value="">Select Issue...</option>{(componentIssues[formData.component] || []).map(issue => <option key={issue} value={issue}>{issue}</option>)}</select></div>
              <div className="form-group full-width"><label className="form-label"><AlertCircle /> Priority *</label><select name="priority" value={formData.priority} onChange={handleInputChange} className="form-select" required><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
              {isAdminOrTech && ticket && (<div className="form-group full-width"><label className="form-label"><CheckCircle /> Status</label><select name="status" value={formData.status} onChange={handleInputChange} className="form-select"><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select></div>)}
            </div>

            <div className="form-group full-width"><label className="form-label"><FileText /> Description *</label><textarea name="description" value={formData.description} onChange={handleInputChange} className="form-textarea" rows={4} required placeholder="Please provide as much detail as possible..." /></div>
            
            {/* ======================= CONDITIONAL SCREENSHOT SECTION ======================= */}
            <div className="form-group full-width">
              {/* If user is Admin/Tech AND is editing a ticket... */}
              {isAdminOrTech && ticket ? (
                // ...and that ticket HAS a screenshot, show the read-only preview.
                ticket.screenshot && (
                  <>
                    <label className="form-label"><Image /> Attached Screenshot</label>
                    <div className="file-preview-readonly">
                      <img src={displayUrl} alt="Attached screenshot" onClick={() => setIsImageModalOpen(true)} />
                    </div>
                  </>
                )
                // If the ticket has NO screenshot, this part renders nothing, effectively hiding it.
              ) : (
                // ELSE (if it's a new ticket for any user), show the full uploader.
                <>
                  <label className="form-label"><Image /> Screenshot (Optional)</label>
                  <div className={`file-upload-area ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                    <div className="upload-placeholder">
                      <Upload />
                      <p className="upload-text">Drop image here or <span>browse</span></p>
                      <p className="upload-hint">PNG, JPG up to 5MB</p>
                      <div className="file-input-wrapper">
                        <label htmlFor="file-input-id" className="file-input-button">Choose File</label>
                        <span className="file-input-status">
                          {formData.screenshotFile ? formData.screenshotFile.name : 'No file chosen'}
                        </span>
                      </div>
                      <input id="file-input-id" type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files[0])} className="file-input-hidden" />
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* ======================= END OF CONDITIONAL SECTION ======================= */}

            <div className="form-actions">
              <button type="button" onClick={handleClose} className="form-btn secondary" disabled={loading}>Cancel</button>
              <button type="submit" className="form-btn primary" disabled={loading || success}>
                {loading ? <Loader className="animate-spin" /> : (ticket ? 'Update Ticket' : 'Create Ticket')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isImageModalOpen && displayUrl && (<div className="image-zoom-modal-overlay" onClick={() => setIsImageModalOpen(false)}><div className="image-zoom-content" onClick={(e) => e.stopPropagation()}><img src={displayUrl} alt="Zoomed Screenshot" className="zoomed-image" /></div></div>)}
    </>
  );
}

export default TicketForm;