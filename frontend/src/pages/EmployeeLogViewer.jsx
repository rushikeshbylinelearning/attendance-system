// frontend/src/pages/EmployeeLogViewer.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Typography, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Button, Chip, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import EventIcon from '@mui/icons-material/Event';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // CORRECTED IMPORT for PDF auto-table
import * as XLSX from 'xlsx'; // NEW IMPORT for Excel generation
import '../styles/Page.css';

const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes) => {
    if (isNaN(minutes) || minutes < 1) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
};

const DayLogCard = ({ log }) => {
    const totalWorkMinutes = (log.sessions || []).reduce((acc, session) => {
        if (session.startTime && session.endTime) {
            return acc + (new Date(session.endTime) - new Date(session.startTime));
        }
        return acc;
    }, 0) / (1000 * 60);

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <Typography variant="h6" style={{ display: 'flex', alignItems: 'center' }}><EventIcon style={{ marginRight: 8, color: '#6b7280' }} />{new Date(log.attendanceDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Typography>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Chip label={`Total Work: ${formatDuration(totalWorkMinutes)}`} color="primary" /><Chip label={`Total Break: ${formatDuration(log.totalBreakMinutes)}`} color="secondary" /></div>
            </div>
            <Divider style={{ margin: '16px 0' }} />
            <div className="flex gap-16" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}><Typography variant="subtitle1" fontWeight="bold" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><AccessTimeIcon style={{ marginRight: 8, color: '#2563eb' }} /> Work Sessions</Typography>{log.sessions?.length > 0 ? (log.sessions.map((s, i) => (<div key={`s-${i}`} className="card" style={{ background: '#f4f7fb', marginBottom: 8, padding: 12 }}><Typography variant="body2"><strong>In:</strong> {formatTime(s.startTime)} | <strong>Out:</strong> {formatTime(s.endTime)}</Typography></div>))) : (<Typography variant="body2" className="text-muted" style={{ paddingLeft: 8 }}>No work sessions recorded.</Typography>)}</div>
                <div style={{ flex: 1, minWidth: 220 }}><Typography variant="subtitle1" fontWeight="bold" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><FreeBreakfastIcon style={{ marginRight: 8, color: '#f59e0b' }} /> Breaks</Typography>{log.breaks?.length > 0 ? (log.breaks.map((b, i) => (<div key={`b-${i}`} className="card" style={{ background: '#fefce8', marginBottom: 8, padding: 12 }}><Typography variant="body2"><strong>{b.breakType}</strong> ({formatDuration(b.durationMinutes)})</Typography><Typography variant="body2" className="text-muted" style={{ fontSize: '0.8rem' }}>{formatTime(b.startTime)} - {formatTime(b.endTime)}</Typography></div>))) : (<Typography variant="body2" className="text-muted" style={{ paddingLeft: 8 }}>No breaks recorded.</Typography>)}</div>
            </div>
        </div>
    );
};

const EmployeeLogViewer = () => {
    const [employees, setEmployees] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const { data } = await api.get('/admin/employees');
                if (Array.isArray(data)) setEmployees(data);
            } catch (err) { setError('Could not load the employee list.'); }
        };
        fetchEmployees();
    }, []);

    const handleSearch = async () => {
        if (!selectedEmployee || !startDate || !endDate) {
            setError('Please select an employee (or "All Employees") and a valid date range.');
            return;
        }
        setError('');
        setLoading(true);
        setSearched(true);
        setLogs([]);

        try {
            let response;
            const params = {
                startDate: startDate.toISOString().slice(0, 10),
                endDate: endDate.toISOString().slice(0, 10)
            };
            if (selectedEmployee === 'ALL') {
                response = await api.get('/admin/bulk-attendance-logs', { params });
            } else {
                params.employeeId = selectedEmployee;
                response = await api.get('/admin/attendance-logs', { params });
            }
            setLogs(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('Failed to fetch logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getReportData = () => logs.map(log => {
        const firstSession = log.sessions?.[0];
        const lastSession = log.sessions?.[log.sessions.length - 1];
        const totalWorkMinutes = (log.sessions || []).reduce((acc, s) => acc + (s.startTime && s.endTime ? (new Date(s.endTime) - new Date(s.startTime)) : 0), 0) / (1000 * 60);
        const user = selectedEmployee === 'ALL' ? log.user : employees.find(e => e._id === selectedEmployee);

        return {
            employeeName: user?.fullName || 'N/A',
            employeeId: user?.employeeCode || 'N/A',
            date: new Date(log.attendanceDate).toLocaleDateString(),
            checkIn: firstSession ? formatTime(firstSession.startTime) : 'N/A',
            checkOut: lastSession ? formatTime(lastSession.endTime) : 'N/A',
            shift: user?.shiftGroup?.shiftName || 'N/A',
            workHours: formatDuration(totalWorkMinutes),
            breakTime: formatDuration(log.totalBreakMinutes),
            status: 'Present',
        };
    });

    const handleDownloadPdf = () => {
        if (logs.length === 0) return;
        const doc = new jsPDF({ orientation: 'landscape' });
        const reportData = getReportData();
        const tableColumn = ["Emp Name", "Emp ID", "Date", "Shift", "Check-in", "Check-out", "Work Hours", "Break Time", "Status"];
        const tableRows = reportData.map(data => [data.employeeName, data.employeeId, data.date, data.shift, data.checkIn, data.checkOut, data.workHours, data.breakTime, data.status]);

        doc.setFontSize(18);
        doc.text('Employee Attendance Report', 14, 22);

        // --- BUG FIX ---
        // Call autoTable as a function, passing the doc instance to it.
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });

        const pdfName = `attendance_report_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(pdfName);
    };
    
    // --- NEW & CORRECTED EXCEL DOWNLOAD ---
    const handleDownloadExcel = () => {
        if (logs.length === 0) return;
        
        // Prepare data with user-friendly headers
        const reportData = getReportData();
        const excelData = reportData.map(row => ({
            "Employee Name": row.employeeName,
            "Employee ID": row.employeeId,
            "Date": row.date,
            "Shift": row.shift,
            "Check-in": row.checkIn,
            "Check-out": row.checkOut,
            "Work Hours": row.workHours,
            "Break Time": row.breakTime,
            "Status": row.status
        }));
        
        // Create a new workbook and a worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");
        
        // Generate and trigger download of the .xlsx file
        const fileName = `attendance_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header" style={{ marginBottom: 24 }}><Typography variant="h4">Employee Log Viewer</Typography></div>
            <div className="card" style={{ marginBottom: 24, position: 'sticky', top: 70, zIndex: 1100, background: '#fff' }}>
                <div className="flex gap-16" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl style={{ minWidth: 200, flex: 1 }}><InputLabel>Employee</InputLabel><Select value={selectedEmployee} label="Employee" onChange={e => setSelectedEmployee(e.target.value)}><MenuItem value="ALL"><strong>All Employees</strong></MenuItem>{employees.map(emp => (<MenuItem key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeCode})</MenuItem>))}</Select></FormControl>
                    <DatePicker label="Start Date" value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true } }} />
                    <DatePicker label="End Date" value={endDate} onChange={setEndDate} slotProps={{ textField: { fullWidth: true } }} />
                    <Button variant="contained" onClick={handleSearch} disabled={loading} style={{ height: 56 }}>{loading ? <CircularProgress size={24} /> : 'Search'}</Button>
                    <Button variant="outlined" color="primary" onClick={handleDownloadPdf} disabled={loading || logs.length === 0} startIcon={<DownloadIcon />} style={{ height: 56 }}>PDF</Button>
                    <Button variant="outlined" color="success" onClick={handleDownloadExcel} disabled={loading || logs.length === 0} startIcon={<DownloadIcon />} style={{ height: 56 }}>Excel (.xlsx)</Button>
                </div>
                {error && <Alert severity="warning" style={{ marginTop: 16 }}>{error}</Alert>}
            </div>
            <div>
                {loading && <div className="flex-center" style={{ padding: 32 }}><CircularProgress /></div>}
                {!loading && searched && (logs.length > 0 ? (selectedEmployee === 'ALL' ? (<div className="card" style={{ padding: 32, textAlign: 'center' }}><Typography variant="h6">{logs.length} attendance records found.</Typography><Typography color="text.secondary">Ready to export as PDF or Excel.</Typography></div>) : (logs.map(log => <DayLogCard key={log.id || log._id} log={log} />))) : (<div className="card" style={{ padding: 32, textAlign: 'center' }}><Typography>No attendance data found for the selected criteria.</Typography></div>))}
            </div>
        </div>
    );
};

export default EmployeeLogViewer;