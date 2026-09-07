import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../api/axios';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AuthContext } from '../context/AuthContext';
import { Camera, MapPin, CheckCircle, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const EmployeeAttendance = () => {
  const { empId, empName, outletId, username } = useContext(AuthContext);

  // Time & Date States
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance State Machine
  // 'idle', 'requesting_gps', 'requesting_camera', 'camera_active', 'submitting', 'success', 'error'
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Location State
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  // Camera State
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  // Success Details from API
  const [successDetails, setSuccessDetails] = useState({
    checkInTime: '',
    distance: 0,
    photoUrl: '',
    date: ''
  });

  // Local storage locking key for today
  const todayStr = new Date().toISOString().split('T')[0];
  const lockKey = `attendance_marked_${empId || 'guest'}_${todayStr}`;

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if attendance is already marked today
  useEffect(() => {
    if (empId) {
      const savedAttendance = localStorage.getItem(lockKey);
      if (savedAttendance) {
        try {
          const parsed = JSON.parse(savedAttendance);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSuccessDetails({
            checkInTime: parsed.checkIn,
            distance: parsed.distance,
            photoUrl: parsed.photoUrl || '',
            date: parsed.date
          });
          setStatus('success');
        } catch (e) {
          console.error('Failed to parse saved attendance details', e);
        }
      }
    }
  }, [empId, lockKey]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Phase 1: Click Mark Attendance -> Fetch GPS Location
  const startMarkAttendance = () => {
    setStatus('requesting_gps');
    setErrorMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      setStatus('error');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        // Proceed to Phase 2: Start Camera Stream
        startCameraStream();
      },
      (error) => {
        let msg = 'Failed to acquire location. ';
        if (error.code === error.PERMISSION_DENIED) {
          msg += 'Please grant location access permissions in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg += 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg += 'Location request timed out. Please try again.';
        } else {
          msg += error.message;
        }
        setErrorMessage(msg);
        setStatus('error');
      },
      geoOptions
    );
  };

  // Phase 2: Open Device Camera
  const startCameraStream = async () => {
    setStatus('requesting_camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      setCameraStream(stream);
      setStatus('camera_active');
      
      // Delay slightly to ensure video element is rendered and bound
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      let msg = 'Failed to access camera. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg += 'Please grant camera access permission in your browser settings.';
      } else {
        msg += err.message;
      }
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  // Phase 3: Capture Selfie Frame and post payload
  const captureAndSubmit = async () => {
    if (!videoRef.current || !coords.latitude || !coords.longitude) {
      setErrorMessage('Device camera or GPS coordinate mapping is incomplete.');
      setStatus('error');
      return;
    }

    setStatus('submitting');

    try {
      // Draw frame to canvas to export Base64 string
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      // Mirror feed if desired (since it is a selfie front camera)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Compress and export base64
      const base64Data = canvas.toDataURL('image/jpeg', 0.8);
      const rawBase64 = base64Data.split(',')[1]; // get pure base64 string

      // Stop camera feed immediately
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      // Construct API Payload
      const payload = {
        phone: username || '9952050460',
        outletId: outletId || 'OUT009',
        latitude: coords.latitude,
        longitude: coords.longitude,
        photo: rawBase64
      };

      const data = await api.post('/outlet/attendance/selfie', payload);
      
      // Save details to state
      const successData = {
        checkInTime: data.checkIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        distance: data.distance ?? 0,
        photoUrl: data.photoUrl || base64Data, // Fallback to captured Base64 if no AWS URL returned
        date: data.date || todayStr
      };

      setSuccessDetails(successData);

      // Lock locally for the rest of today
      localStorage.setItem(lockKey, JSON.stringify({
        checkIn: successData.checkInTime,
        distance: successData.distance,
        photoUrl: successData.photoUrl,
        date: successData.date
      }));

      setStatus('success');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Submission failed. Geolocation might be out of bounds.');
      setStatus('error');
      
      // Ensure camera stops if we fail
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
  };

  // Reset attendance error state and return to idle
  const handleReset = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setStatus('idle');
    setErrorMessage('');
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '1rem' }}>
      <Card style={{ 
        borderRadius: '16px', 
        overflow: 'hidden', 
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)'
      }}>
        
        {/* Portal Header banner */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #35537d 100%)', 
          color: 'white',
          padding: '1.75rem 1.5rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Attendance Check-In</h2>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.85, fontSize: '0.9rem' }}>Welcome, {empName || 'Employee'}</p>
            </div>
            
            {/* Live Clock display */}
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              backdropFilter: 'blur(4px)',
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              textAlign: 'right' 
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: '500' }}>
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <CardContent style={{ padding: '2rem' }}>
          
          {/* Status Indicator Panel */}
          {status === 'idle' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(74, 111, 165, 0.1)', 
                display: 'inline-flex',
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem',
                color: 'var(--color-primary)'
              }}>
                <MapPin size={42} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Ready to check in?</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '380px', margin: '0 auto 2rem auto' }}>
                Please make sure you are at your assigned outlet and that camera and location permissions are enabled.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '280px', margin: '0 auto' }}>
                <Button 
                  variant="primary" 
                  onClick={startMarkAttendance}
                  style={{ 
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(74, 111, 165, 0.2)'
                  }}
                >
                  <Camera size={18} /> Mark Attendance
                </Button>
                
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Assigned Outlet: <strong>{outletId || 'OUT001'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Loading GPS state */}
          {status === 'requesting_gps' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1.5rem auto', animation: 'spin 1.5s linear infinite' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Acquiring GPS Coordinates</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Retrieving your live coordinates to verify outlet boundary...</p>
            </div>
          )}

          {/* Loading Camera state */}
          {status === 'requesting_camera' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1.5rem auto', animation: 'spin 1.5s linear infinite' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Activating Camera Feed</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Initializing front device lens for attendance capture...</p>
            </div>
          )}

          {/* Active Camera Viewport */}
          {status === 'camera_active' && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Camera size={18} /> Center Your Face
              </h3>
              
              <div style={{ 
                position: 'relative', 
                maxWidth: '440px', 
                margin: '0 auto 1.5rem auto',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#000',
                border: '3px solid var(--color-primary)',
                boxShadow: 'var(--shadow-md)',
                aspectRatio: '4/3'
              }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transform: 'scaleX(-1)' // Mirror feed display
                  }} 
                />
                
                <div style={{ 
                  position: 'absolute', 
                  bottom: '12px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}>
                  <MapPin size={12} color="#10b981" /> Boundary Verified
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <Button variant="secondary" onClick={handleReset}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={captureAndSubmit}>
                  Capture & Submit
                </Button>
              </div>
            </div>
          )}

          {/* Submitting API Payload */}
          {status === 'submitting' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1.5rem auto', animation: 'spin 1.5s linear infinite' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Uploading Attendance Data</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Uploading selfie security record and logging time on server...</p>
            </div>
          )}

          {/* Error Handler Panel */}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                backgroundColor: '#fef2f2', 
                display: 'inline-flex',
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem',
                color: 'var(--color-red)',
                border: '1px solid #fee2e2'
              }}>
                <AlertCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Check-In Blocked</h3>
              
              <div style={{ 
                backgroundColor: '#fef2f2', 
                color: 'var(--color-red)', 
                padding: '1rem', 
                borderRadius: '8px', 
                fontSize: '0.875rem',
                marginBottom: '2rem',
                border: '1px solid #fee2e2',
                maxWidth: '440px',
                margin: '0 auto 2rem auto',
                lineHeight: '1.5'
              }}>
                {errorMessage}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <Button variant="secondary" onClick={handleReset}>
                  Dismiss
                </Button>
                <Button variant="primary" onClick={startMarkAttendance} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={16} /> Retry
                </Button>
              </div>
            </div>
          )}

          {/* Success Checked-In Panel */}
          {status === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--color-green)',
                marginBottom: '0.5rem'
              }}>
                <CheckCircle size={56} style={{ fill: '#ecfdf5' }} />
              </div>
              
              <h3 style={{ fontSize: '1.4rem', color: 'var(--color-green)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Attendance Recorded Today
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Date: {successDetails.date || todayStr}
              </p>

              {/* Attendance metrics details grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: '1rem',
                backgroundColor: 'var(--color-secondary)',
                padding: '1.25rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <Clock size={18} color="var(--color-text-muted)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Check-In Time</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{successDetails.checkInTime}</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={18} color="var(--color-text-muted)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Boundary Shift</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{successDetails.distance} meters</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={18} color="var(--color-green)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Status</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-green)' }}>ACTIVE</strong>
                </div>
              </div>

              {/* Uploaded image preview */}
              {successDetails.photoUrl && (
                <div style={{ margin: '1rem auto 0 auto', maxWidth: '180px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>Selfie Upload Record</span>
                  <div style={{ 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    border: '2px solid var(--color-border)', 
                    boxShadow: 'var(--shadow-sm)',
                    aspectRatio: '1'
                  }}>
                    <img 
                      src={successDetails.photoUrl} 
                      alt="Verified selfie record" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </CardContent>
        
        {/* Footer instructions */}
        <div style={{
          textAlign: 'center',
          padding: '1.25rem',
          backgroundColor: '#fafbfc',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.825rem',
          color: 'var(--color-text-muted)'
        }}>
          Assigned Outlet: <strong>{outletId || 'OUT001'}</strong> &bull; Employee ID: <strong>{empId || 'Guest'}</strong>
        </div>
      </Card>
      
      {/* Styles for dynamic camera container animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default EmployeeAttendance;
