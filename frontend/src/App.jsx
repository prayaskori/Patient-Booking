import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Mail, 
  Stethoscope, 
  Search, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Copy,
  Info,
  Filter,
  BarChart3,
  CalendarCheck,
  CalendarX
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5247';

export default function App() {
  // Booking Form State
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');
  
  // Search State
  const [searchId, setSearchId] = useState('');
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Filtering State
  const [statusFilter, setStatusFilter] = useState('All');

  // UI state
  const [isBooking, setIsBooking] = useState(false);
  const [newlyBookedDetails, setNewlyBookedDetails] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState([]);

  // Add toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Helper to copy Patient ID to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    showToast('Patient ID copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Book Appointment Submit Handler
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!patientName || !patientEmail || !doctorName || !appointmentDateTime) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    setIsBooking(true);
    setNewlyBookedDetails(null);

    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName,
          patientEmail,
          doctorName,
          dateTime: new Date(appointmentDateTime).toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Appointment booked successfully!', 'success');
        setNewlyBookedDetails(data);
        // Clear fields
        setPatientName('');
        setPatientEmail('');
        setDoctorName('');
        setAppointmentDateTime('');
        
        // Auto-fill search with the booked patient ID
        if (data.patientId) {
          setSearchId(data.patientId.toString());
          fetchPatientAppointments(data.patientId.toString());
        }
      } else {
        const errorMsg = data.Message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to book appointment');
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      showToast('Server is offline or unreachable. Please try again.', 'error');
      console.error(err);
    } finally {
      setIsBooking(false);
    }
  };

  // Search Patient Appointments
  const fetchPatientAppointments = async (idToSearch) => {
    const targetId = idToSearch || searchId;
    if (!targetId) {
      showToast('Please enter a Patient ID.', 'error');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchedPatient(null);
    setAppointments([]);

    try {
      const response = await fetch(`${API_URL}/api/patients/${targetId}/appointments`);
      const data = await response.json();

      if (response.ok) {
        setSearchedPatient({
          id: data.patientId,
          name: data.patientName,
          email: data.patientEmail
        });
        setAppointments(data.appointments);
        showToast('Found patient records.', 'success');
      } else {
        setSearchError(data.Message || 'Patient not found');
        showToast(data.Message || 'Patient not found', 'error');
      }
    } catch (err) {
      setSearchError('Connection error.');
      showToast('Could not fetch records. Connection failed.', 'error');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Cancel Appointment Handler
  const handleCancelAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Appointment cancelled successfully.', 'success');
        // Update local state instead of refetching
        setAppointments(prev => 
          prev.map(app => 
            app.id === appointmentId ? { ...app, status: 'Cancelled' } : app
          )
        );
      } else {
        showToast(data.Message || 'Failed to cancel appointment', 'error');
      }
    } catch (err) {
      showToast('Connection error. Failed to cancel.', 'error');
      console.error(err);
    }
  };

  // Helper to determine appointment status (Scheduled, Completed, Cancelled)
  const getAppointmentStatus = (app) => {
    if (app.status === 'Cancelled') return 'Cancelled';
    const appointmentTime = new Date(app.dateTime);
    const now = new Date();
    if (appointmentTime < now) return 'Completed';
    return 'Scheduled';
  };

  // Format date helper
  const formatDateTime = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Stats calculation based on searched patient's appointments
  const totalCount = appointments.length;
  const activeCount = appointments.filter(a => getAppointmentStatus(a) === 'Scheduled').length;
  const cancelledCount = appointments.filter(a => getAppointmentStatus(a) === 'Cancelled').length;

  // Filtered Appointments list
  const filteredAppointments = appointments.filter(app => {
    const status = getAppointmentStatus(app);
    if (statusFilter === 'All') return true;
    return status === statusFilter;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen aurora-bg relative">
      {/* 2px Gradient Accent Line at very top */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#1D4ED8] to-[#0EA5E9] fixed top-0 left-0 z-50"></div>

      {/* Header / Navbar (Glassmorphic) */}
      <header className="glass-header py-4 px-6 sticky top-[2px] z-40">
        <div className="max-w-7xl mx-auto w-full flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="text-2xl font-bold tracking-tight text-[#0F52BA]">
              CareSync
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-blue-100/50 text-xs text-[#64748B]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
            <span>API Online</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Main Grid Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Book Appointment Form */}
          <section className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-[12px] glass-card-hover">
              <h2 className="text-lg font-semibold text-[#1E293B] mb-6 flex items-center gap-2">
                <Calendar className="text-[#1D4ED8] w-5 h-5" />
                Book Appointment
              </h2>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-[12px] uppercase tracking-wider font-semibold text-[#64748B] mb-2">Patient Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <input 
                      type="text"
                      placeholder="John Doe"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 glass-input"
                      required
                    />
                  </div>
                </div>

                {/* Patient Email */}
                <div>
                  <label className="block text-[12px] uppercase tracking-wider font-semibold text-[#64748B] mb-2">Patient Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <input 
                      type="email"
                      placeholder="john.doe@example.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 glass-input"
                      required
                    />
                  </div>
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block text-[12px] uppercase tracking-wider font-semibold text-[#64748B] mb-2">Select Doctor</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <select 
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 glass-input appearance-none bg-white/60 cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select a practitioner...</option>
                      <option value="Dr. Alice Smith">Dr. Alice Smith (General Medicine)</option>
                      <option value="Dr. Bob Johnson">Dr. Bob Johnson (Cardiology)</option>
                      <option value="Dr. Carol White">Dr. Carol White (Pediatrics)</option>
                      <option value="Dr. David Green">Dr. David Green (Orthopedics)</option>
                    </select>
                  </div>
                </div>

                {/* Date Time Picker */}
                <div>
                  <label className="block text-[12px] uppercase tracking-wider font-semibold text-[#64748B] mb-2">Appointment Date & Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <input 
                      type="datetime-local"
                      value={appointmentDateTime}
                      onChange={(e) => setAppointmentDateTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 glass-input"
                      required
                    />
                  </div>
                </div>

                {/* Gradient Confirm Booking Button */}
                <button 
                  type="submit"
                  disabled={isBooking}
                  className="w-full py-3 text-white font-semibold gradient-btn flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
                >
                  {isBooking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Confirm Booking</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Success details card (if registered) */}
            {newlyBookedDetails && (
              <div className="glass-card p-6 rounded-[12px] border-l-4 border-l-[#10B981] relative overflow-hidden animate-pulse-once">
                <div className="flex gap-3 mb-4">
                  <CheckCircle2 className="text-[#10B981] w-6 h-6 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#1E293B]">Booking Registered!</h3>
                    <p className="text-[#64748B] text-xs mt-0.5">Save the Patient ID to retrieve or cancel your bookings later.</p>
                  </div>
                </div>

                <div className="bg-white/50 p-4 rounded-[10px] space-y-2 border border-white/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#64748B] text-[12px] uppercase tracking-wider font-semibold">Patient ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1D4ED8] font-mono text-base">{newlyBookedDetails.patientId}</span>
                      <button 
                        onClick={() => copyToClipboard(newlyBookedDetails.patientId.toString())}
                        className="p-1 hover:bg-white/80 rounded transition text-[#64748B] hover:text-[#1E293B]"
                        title="Copy Patient ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-[#BFDBFE]/30 my-2"></div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-[#64748B] text-[11px] uppercase tracking-wider font-medium">Patient:</span> <span className="text-[#1E293B] font-semibold">{newlyBookedDetails.patient?.name}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B] text-[11px] uppercase tracking-wider font-medium">Doctor:</span> <span className="text-[#1E293B] font-semibold">{newlyBookedDetails.doctorName}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748B] text-[11px] uppercase tracking-wider font-medium">Time:</span> <span className="text-[#1E293B] font-semibold">{formatDateTime(newlyBookedDetails.dateTime)}</span></div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Manage Timelines */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Search Box */}
            <div className="glass-card p-6 rounded-[12px] glass-card-hover">
              <h2 className="text-lg font-semibold text-[#1E293B] mb-6 flex items-center gap-2">
                <Search className="text-[#1D4ED8] w-5 h-5" />
                Manage Bookings
              </h2>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                  <input 
                    type="number"
                    placeholder="Enter Patient ID (e.g. 1)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchPatientAppointments()}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[10px] glass-input font-mono"
                  />
                </div>
                <button 
                  onClick={() => fetchPatientAppointments()}
                  disabled={isSearching}
                  className="px-6 text-white font-semibold gradient-btn flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>
            </div>

            {/* Dashboard Display - Patient details, stat cards, lists */}
            {searchedPatient && (
              <div className="space-y-6">
                
                {/* Patient Profile Card (Glassmorphic) */}
                <div className="glass-card p-4 rounded-[12px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Active Patient Account</span>
                    <h3 className="text-base font-semibold text-[#1E293B]">{searchedPatient.name}</h3>
                    <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-[#1D4ED8]" /> {searchedPatient.email}
                    </p>
                  </div>
                  <div className="bg-white/60 text-[#1E293B] font-mono text-xs px-3 py-1.5 rounded-[8px] border border-white/80">
                    Patient ID: {searchedPatient.id}
                  </div>
                </div>

                {/* Dashboard Statistics Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Total Card */}
                  <div className="glass-card p-4 rounded-[12px] border-l-4 border-l-[#1D4ED8] flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-[#1D4ED8] hidden sm:block">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Total</div>
                      <div className="text-xl font-bold text-[#1E293B]">{totalCount}</div>
                    </div>
                  </div>

                  {/* Active Card */}
                  <div className="glass-card p-4 rounded-[12px] border-l-4 border-l-[#10B981] flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-[#10B981] hidden sm:block">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#10B981] uppercase tracking-wider">Active</div>
                      <div className="text-xl font-bold text-[#10B981]">{activeCount}</div>
                    </div>
                  </div>

                  {/* Cancelled Card */}
                  <div className="glass-card p-4 rounded-[12px] border-l-4 border-l-[#EF4444] flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 text-[#EF4444] hidden sm:block">
                      <CalendarX className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#EF4444] uppercase tracking-wider">Cancelled</div>
                      <div className="text-xl font-bold text-[#EF4444]">{cancelledCount}</div>
                    </div>
                  </div>
                </div>

                {/* Timelines and Filter Dropdowns */}
                <div className="glass-card p-6 rounded-[12px] space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/40">
                    <h3 className="font-semibold text-[#1E293B] text-sm">
                      Appointments Timeline
                    </h3>
                    
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-[#64748B]" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="py-1.5 px-3 rounded-[8px] border border-blue-105 bg-white/70 text-xs font-semibold text-[#1E293B] cursor-pointer focus:outline-none focus:border-[#3B82F6]"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Filtered Appointments List */}
                  {filteredAppointments.length > 0 ? (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {filteredAppointments.map((app) => {
                        const status = getAppointmentStatus(app);
                        return (
                          <div 
                            key={app.id} 
                            className="p-4 rounded-[10px] bg-white/50 border border-white/50 glass-card-hover transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-[#64748B] bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded">Appt #{app.id}</span>
                                
                                {/* Dynamic Badge Design matching prompt spec exactly */}
                                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-transparent ${
                                  status === 'Cancelled' 
                                    ? 'bg-[#FEE2E2] text-[#991B1B]' 
                                    : status === 'Completed'
                                    ? 'bg-[#D1FAE5] text-[#065F46]'
                                    : 'bg-[#DBEAFE] text-[#1D4ED8]'
                                }`}>
                                  {status}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1E293B]">
                                <Stethoscope className="w-4 h-4 text-[#1D4ED8]" />
                                <span>{app.doctorName}</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDateTime(app.dateTime)}</span>
                              </div>
                            </div>

                            {status === 'Scheduled' && (
                              <button 
                                onClick={() => handleCancelAppointment(app.id)}
                                className="w-full md:w-auto px-4 py-2 text-xs font-semibold text-[#EF4444] hover:text-white bg-white/60 hover:bg-[#EF4444] rounded-[10px] border border-red-200 hover:border-[#EF4444] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel Booking</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-[#BFDBFE]/40 rounded-[10px] bg-white/20">
                      <AlertCircle className="w-8 h-8 text-[#64748B]/50 mx-auto mb-2" />
                      <h4 className="text-[#64748B] font-semibold text-xs">No Appointments Found</h4>
                      <p className="text-[#64748B] text-[10px] mt-0.5">There are no appointments matching the selected status filter.</p>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* Empty Slate Display (Initial screen) */}
            {!searchedPatient && (
              <div className="glass-card p-8 rounded-[12px] text-center">
                <Info className="w-8 h-8 text-[#1D4ED8]/30 mx-auto mb-3" />
                <h4 className="text-[#1E293B] font-semibold text-sm">No Patient Account Selected</h4>
                <p className="text-[#64748B] text-xs mt-1 max-w-sm mx-auto">
                  Enter a Patient ID in the search console above (e.g. 1 or 2 for default seeded accounts) to retrieve records, filter timelines, and review statistics.
                </p>
              </div>
            )}
            
          </section>

        </main>

        {/* Footer */}
        <footer className="pt-10 text-center text-xs text-[#64748B] border-t border-white/40">
          <p>&copy; 2026 CareSync Healthcare Systems. All rights reserved. Created with ASP.NET Core & React.</p>
        </footer>

      </div>

      {/* Toast Notifications Panel */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border transition-all duration-300 transform translate-y-0 scale-100 ${
              toast.type === 'error' 
                ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]/30' 
                : 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]/30'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
            )}
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
