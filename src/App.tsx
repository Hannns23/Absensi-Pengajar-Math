import React, { useEffect, useState } from 'react';
import AdminPanel from './AdminPanel';

interface DataPengajarHariIni {
  uid: string;
  nama: string;
  hadir: boolean;
  status: string;
  jamMasuk: string;
  jamPulang: string;
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";
const ADMIN_PIN = "1234"; // Ganti PIN Admin di sini jika diperlukan

export default function App() {
  const [halaman, setHalaman] = useState<'publik' | 'admin'>('publik');
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");

  const [daftarHariIni, setDaftarHariIni] = useState<DataPengajarHariIni[]>([]);
  const [tanggal, setTanggal] = useState<string>("-");
  const [loading, setLoading] = useState<boolean>(true);
  const [filterPublik, setFilterPublik] = useState<'semua' | 'hadir' | 'belum'>('semua');

  const ambilDataPublik = async () => {
    if (!APPS_SCRIPT_URL) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getStatusPengajar`);
      const json = await res.json();
      setTanggal(json.tanggal || "-");
      setDaftarHariIni(json.data || []);
    } catch (err) {
      console.error("Gagal mengambil data publik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (halaman === 'publik') {
      ambilDataPublik();
      const interval = setInterval(ambilDataPublik, 30000); // Auto-refresh tiap 30 detik
      return () => clearInterval(interval);
    }
  }, [halaman]);

  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuth(true);
      setPinInput("");
    } else {
      alert("PIN Admin salah!");
    }
  };

  const totalPengajar = daftarHariIni.length;
  const totalHadir = daftarHariIni.filter((p) => p.hadir).length;
  const totalBelum = totalPengajar - totalHadir;

  const dataTampil = daftarHariIni.filter((p) => {
    if (filterPublik === 'hadir') return p.hadir;
    if (filterPublik === 'belum') return !p.hadir;
    return true;
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a' }}>
      {/* Header Navigasi */}
      <nav style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, background: '#0f172a', color: '#fff', padding: '14px 20px', borderRadius: 10, marginBottom: 24
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>🎓 Sistem Absensi Pengajar RFID</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Monitoring Kehadiran & Manajemen Database</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setHalaman('publik')}
            style={{
              padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: halaman === 'publik' ? '#2563eb' : '#1e293b', color: '#fff'
            }}
          >
            📋 Monitoring Publik
          </button>
          <button
            onClick={() => setHalaman('admin')}
            style={{
              padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: halaman === 'admin' ? '#059669' : '#1e293b', color: '#fff'
            }}
          >
            🔐 Panel Admin
          </button>
        </div>
      </nav>

      {/* Peringatan jika VITE_APPS_SCRIPT_URL belum diatur di Vercel */}
      {!APPS_SCRIPT_URL && (
        <div style={{ padding: 14, marginBottom: 20, borderRadius: 8, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: 13 }}>
          ⚠️ <strong>VITE_APPS_SCRIPT_URL</strong> belum diatur di Environment Variables Vercel. Silakan tambahkan URL Web App Google Apps Script lalu lakukan Redeploy.
        </div>
      )}

      {/* Halaman Monitoring Publik */}
      {halaman === 'publik' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Kehadiran Pengajar Hari Ini</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Tanggal: <strong>{tanggal}</strong></p>
            </div>
            <button onClick={ambilDataPublik} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              🔄 Segarkan Data
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 16, borderRadius: 10, background: '#f1f5f9', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{totalPengajar}</div>
              <div style={{ fontSize: 13 }}>Total Pengajar</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: '#dcfce7', color: '#166534', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{totalHadir}</div>
              <div style={{ fontSize: 13 }}>Sudah Absen</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: '#fee2e2', color: '#991b1b', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{totalBelum}</div>
              <div style={{ fontSize: 13 }}>Belum Absen</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setFilterPublik('semua')} style={btnFilter(filterPublik === 'semua')}>Semua ({totalPengajar})</button>
            <button onClick={() => setFilterPublik('hadir')} style={btnFilter(filterPublik === 'hadir')}>Sudah Hadir ({totalHadir})</button>
            <button onClick={() => setFilterPublik('belum')} style={btnFilter(filterPublik === 'belum')}>Belum Hadir ({totalBelum})</button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 30 }}>Memuat data kehadiran...</p>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: 11 }}>No</th>
                    <th style={{ padding: 11 }}>Nama Pengajar</th>
                    <th style={{ padding: 11 }}>Status</th>
                    <th style={{ padding: 11 }}>Jam Masuk</th>
                    <th style={{ padding: 11 }}>Jam Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTampil.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                        Belum ada data pengajar untuk kategori ini.
                      </td>
                    </tr>
                  ) : (
                    dataTampil.map((item, idx) => (
                      <tr key={item.uid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 10 }}>{idx + 1}</td>
                        <td style={{ padding: 10, fontWeight: 600 }}>{item.nama}</td>
                        <td style={{ padding: 10 }}>
                          <span style={badgeStatus(item.status)}>{item.status}</span>
                        </td>
                        <td style={{ padding: 10 }}>{item.jamMasuk}</td>
                        <td style={{ padding: 10 }}>{item.jamPulang}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Halaman Login Admin */}
      {halaman === 'admin' && !isAdminAuth && (
        <form onSubmit={handleLoginAdmin} style={{ maxWidth: 360, margin: '40px auto', padding: 28, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <h3 style={{ margin: '0 0 8px' }}>Login Panel Admin</h3>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>Masukkan PIN Admin untuk mengelola database Spreadsheet.</p>
          <input
            type="password"
            placeholder="PIN Admin..."
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: 11, marginBottom: 14, borderRadius: 8, border: '1px solid #cbd5e1', textAlign: 'center', fontSize: 16, letterSpacing: 4 }}
          />
          <button type="submit" style={{ width: '100%', padding: 11, background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            Buka Panel Admin
          </button>
        </form>
      )}

      {/* Halaman Panel Admin */}
      {halaman === 'admin' && isAdminAuth && (
        <AdminPanel
          appsScriptUrl={APPS_SCRIPT_URL}
          onLogout={() => {
            setIsAdminAuth(false);
            setHalaman('publik');
          }}
        />
      )}
    </div>
  );
}

function btnFilter(aktif: boolean): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1',
    background: aktif ? '#2563eb' : '#fff', color: aktif ? '#fff' : '#334155',
    cursor: 'pointer', fontWeight: 600, fontSize: 12
  };
}

function badgeStatus(status: string): React.CSSProperties {
  const base: React.CSSProperties = { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 };
  if (status === 'Masuk') return { ...base, background: '#dcfce7', color: '#166534' };
  if (status === 'Terlambat') return { ...base, background: '#fef3c7', color: '#92400e' };
  if (status === 'Pulang') return { ...base, background: '#dbeafe', color: '#1e40af' };
  return { ...base, background: '#fee2e2', color: '#991b1b' };
}
