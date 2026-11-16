import React, { useEffect, useState } from 'react';

interface DataPengajarHariIni {
  uid: string;
  nama: string;
  hadir: boolean;
  status: string;
  jamMasuk: string;
  jamPulang: string;
}

interface MasterPengajar {
  row: number;
  uid: string;
  nama: string;
}

interface LogAbsensi {
  row: number;
  tanggal: string;
  waktu: string;
  uid: string;
  nama: string;
  status: string;
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";
const ADMIN_PIN = "1234"; // Ubah PIN login admin sesuai kebutuhan

export default function App() {
  const [halaman, setHalaman] = useState<'publik' | 'admin'>('publik');
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");

  const [daftarHariIni, setDaftarHariIni] = useState<DataPengajarHariIni[]>([]);
  const [tanggal, setTanggal] = useState<string>("-");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [filterPublik, setFilterPublik] = useState<'semua' | 'hadir' | 'belum'>('semua');

  const [subTabAdmin, setSubTabAdmin] = useState<'log' | 'master'>('log');
  const [masterPengajar, setMasterPengajar] = useState<MasterPengajar[]>([]);
  const [riwayatAbsensi, setRiwayatAbsensi] = useState<LogAbsensi[]>([]);
  const [batasJamMasuk, setBatasJamMasuk] = useState<string>("07:30:00");
  const [cariTeks, setCariTeks] = useState<string>("");
  const [editRow, setEditRow] = useState<number | null>(null);
  const [editNamaVal, setEditNamaVal] = useState<string>("");
  const [pesanAdmin, setPesanAdmin] = useState<string>("");
  const [sedangMenyimpan, setSedangMenyimpan] = useState<boolean>(false);

  const ambilDataPublik = async () => {
    if (!APPS_SCRIPT_URL) {
      setErrorMsg("URL Google Apps Script (VITE_APPS_SCRIPT_URL) belum diatur di Environment Variables.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getStatusPengajar`);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const json = await res.json();
      setTanggal(json.tanggal || "-");
      setDaftarHariIni(json.data || []);
    } catch (err) {
      console.error("Gagal mengambil data publik:", err);
      setErrorMsg("Gagal terhubung ke server Google Spreadsheet. Periksa koneksi atau URL Apps Script.");
    } finally {
      setLoading(false);
    }
  };

  const ambilSemuaDataAdmin = async () => {
    if (!APPS_SCRIPT_URL) {
      setErrorMsg("URL Google Apps Script (VITE_APPS_SCRIPT_URL) belum diatur di Environment Variables.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getAllAdminData`);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const json = await res.json();
      setBatasJamMasuk(json.batasJamMasuk || "07:30:00");
      setMasterPengajar(json.masterPengajar || []);
      setRiwayatAbsensi(json.riwayatAbsensi || []);
    } catch (err) {
      console.error("Gagal mengambil data admin:", err);
      setErrorMsg("Gagal memuat seluruh database Spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (halaman === 'publik') {
      ambilDataPublik();
      const interval = setInterval(ambilDataPublik, 30000);
      return () => clearInterval(interval);
    } else if (halaman === 'admin' && isAdminAuth) {
      ambilSemuaDataAdmin();
    }
  }, [halaman, isAdminAuth]);

  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuth(true);
      setPinInput("");
      setErrorMsg("");
    } else {
      alert("PIN Admin salah! Silakan coba lagi.");
    }
  };

  const simpanNamaBaru = async (row: number) => {
    if (!editNamaVal.trim()) {
      alert("Nama pengajar tidak boleh kosong!");
      return;
    }
    setSedangMenyimpan(true);
    setPesanAdmin("Menyimpan perubahan nama ke Spreadsheet...");
    try {
      const url = `${APPS_SCRIPT_URL}?action=updatePengajar&row=${row}&nama=${encodeURIComponent(editNamaVal.trim())}`;
      await fetch(url);
      setEditRow(null);
      setPesanAdmin("Nama pengajar berhasil diperbarui!");
      await ambilSemuaDataAdmin();
    } catch (err) {
      console.error("Gagal update nama:", err);
      setPesanAdmin("Gagal memperbarui nama pengajar.");
    } finally {
      setSedangMenyimpan(false);
      setTimeout(() => setPesanAdmin(""), 3500);
    }
  };

  const simpanJamBaru = async () => {
    const formatJam = batasJamMasuk.length === 5 ? `${batasJamMasuk}:00` : batasJamMasuk;
    setSedangMenyimpan(true);
    setPesanAdmin("Menyimpan pengaturan batas jam masuk...");
    try {
      const url = `${APPS_SCRIPT_URL}?action=setBatasJam&jam=${encodeURIComponent(formatJam)}`;
      await fetch(url);
      setBatasJamMasuk(formatJam);
      setPesanAdmin(`Batas jam masuk berhasil diubah ke ${formatJam}`);
    } catch (err) {
      console.error("Gagal simpan jam:", err);
      setPesanAdmin("Gagal menyimpan pengaturan jam.");
    } finally {
      setSedangMenyimpan(false);
      setTimeout(() => setPesanAdmin(""), 3500);
    }
  };

  const filterLogAbsensi = riwayatAbsensi.filter(
    (item) =>
      item.nama.toLowerCase().includes(cariTeks.toLowerCase()) ||
      item.tanggal.toLowerCase().includes(cariTeks.toLowerCase()) ||
      item.status.toLowerCase().includes(cariTeks.toLowerCase()) ||
      item.uid.toLowerCase().includes(cariTeks.toLowerCase())
  );

  const filterMasterPengajar = masterPengajar.filter(
    (item) =>
      item.nama.toLowerCase().includes(cariTeks.toLowerCase()) ||
      item.uid.toLowerCase().includes(cariTeks.toLowerCase())
  );

  const totalPengajar = daftarHariIni.length;
  const totalHadir = daftarHariIni.filter((p) => p.hadir).length;
  const totalBelum = totalPengajar - totalHadir;

  const dataPublikTampil = daftarHariIni.filter((p) => {
    if (filterPublik === 'hadir') return p.hadir;
    if (filterPublik === 'belum') return !p.hadir;
    return true;
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, color: '#1f2937' }}>
      <nav style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        background: '#0f172a',
        color: '#ffffff',
        padding: '14px 20px',
        borderRadius: 10,
        marginBottom: 24,
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>🎓 Sistem Absensi Pengajar RFID</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Monitoring Kehadiran & Manajemen Database</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setHalaman('publik')}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: halaman === 'publik' ? '#2563eb' : '#1e293b',
              color: '#ffffff'
            }}
          >
            📋 Monitoring Publik
          </button>
          <button
            onClick={() => setHalaman('admin')}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: halaman === 'admin' ? '#059669' : '#1e293b',
              color: '#ffffff'
            }}
          >
            🔐 Panel Admin
          </button>
        </div>
      </nav>

      {errorMsg && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: 12,
          borderRadius: 8,
          marginBottom: 18,
          fontSize: 13,
          fontWeight: 600
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {halaman === 'publik' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Kehadiran Pengajar Hari Ini</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Tanggal: <strong>{tanggal}</strong> (Pembaruan otomatis setiap 30 detik)
              </p>
            </div>
            <button onClick={ambilDataPublik} style={btnSecondary}>
              🔄 Segarkan Data
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={cardStat('#f1f5f9', '#0f172a')}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{totalPengajar}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Total Pengajar Terdaftar</div>
            </div>
            <div style={cardStat('#dcfce7', '#166534')}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{totalHadir}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Sudah Absen Hari Ini</div>
            </div>
            <div style={cardStat('#fee2e2', '#991b1b')}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{totalBelum}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Belum Absen</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setFilterPublik('semua')} style={btnFilter(filterPublik === 'semua')}>
              Semua ({totalPengajar})
            </button>
            <button onClick={() => setFilterPublik('hadir')} style={btnFilter(filterPublik === 'hadir')}>
              Sudah Hadir ({totalHadir})
            </button>
            <button onClick={() => setFilterPublik('belum')} style={btnFilter(filterPublik === 'belum')}>
              Belum Hadir ({totalBelum})
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Memuat data kehadiran pengajar...</div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={thStyle}>No</th>
                    <th style={thStyle}>Nama Pengajar</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Jam Masuk</th>
                    <th style={thStyle}>Jam Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPublikTampil.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                        Tidak ada data pengajar untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    dataPublikTampil.map((item, idx) => (
                      <tr key={item.uid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={tdStyle}>{idx + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a' }}>{item.nama}</td>
                        <td style={tdStyle}>
                          <span style={badgeStatus(item.status)}>{item.status}</span>
                        </td>
                        <td style={tdStyle}>{item.jamMasuk}</td>
                        <td style={tdStyle}>{item.jamPulang}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {halaman === 'admin' && !isAdminAuth && (
        <form
          onSubmit={handleLoginAdmin}
          style={{
            maxWidth: 360,
            margin: '40px auto',
            padding: 28,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Akses Panel Admin</h3>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
            Masukkan PIN Admin untuk melihat dan mengelola seluruh data Spreadsheet.
          </p>
          <input
            type="password"
            placeholder="Masukkan PIN Admin..."
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            style={{
              width: '100%',
              padding: 11,
              marginBottom: 14,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              textAlign: 'center',
              fontSize: 16,
              letterSpacing: 4
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 11,
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Buka Database Admin
          </button>
        </form>
      )}

      {halaman === 'admin' && isAdminAuth && (
        <div>
          {pesanAdmin && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontWeight: 600,
              fontSize: 13
            }}>
              ✅ {pesanAdmin}
            </div>
          )}

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            background: '#ffffff',
            padding: 16,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <label style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                ⏰ Batas Jam Masuk Pengajar:
              </label>
              <input
                type="time"
                step="1"
                value={batasJamMasuk}
                onChange={(e) => setBatasJamMasuk(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
              <button
                onClick={simpanJamBaru}
                disabled={sedangMenyimpan}
                style={{
                  padding: '7px 14px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13
                }}
              >
                Simpan Jam
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={ambilSemuaDataAdmin} style={btnSecondary}>
                🔄 Muat Ulang Spreadsheet
              </button>
              <button
                onClick={() => setIsAdminAuth(false)}
                style={{ ...btnSecondary, background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}
              >
                Keluar Admin
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setSubTabAdmin('log')} style={btnFilter(subTabAdmin === 'log')}>
                📑 Sheet Data_Absensi ({riwayatAbsensi.length} Baris)
              </button>
              <button onClick={() => setSubTabAdmin('master')} style={btnFilter(subTabAdmin === 'master')}>
                🪪 Sheet Master_Pengajar ({masterPengajar.length} Kartu)
              </button>
            </div>

            <input
              type="text"
              placeholder="Cari nama, UID, tanggal, atau status..."
              value={cariTeks}
              onChange={(e) => setCariTeks(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                minWidth: 260,
                fontSize: 13
              }}
            />
          </div>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Mengambil seluruh isi Spreadsheet...</div>
          ) : (
            <>
              {subTabAdmin === 'log' && (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={thStyle}>Baris</th>
                        <th style={thStyle}>Tanggal</th>
                        <th style={thStyle}>Waktu</th>
                        <th style={thStyle}>UID Kartu</th>
                        <th style={thStyle}>Nama Pengajar</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterLogAbsensi.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                            Tidak ada catatan absensi yang cocok.
                          </td>
                        </tr>
                      ) : (
                        filterLogAbsensi.map((log) => (
                          <tr key={log.row} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ ...tdStyle, color: '#64748b' }}>#{log.row}</td>
                            <td style={tdStyle}>{log.tanggal}</td>
                            <td style={tdStyle}>{log.waktu}</td>
                            <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{log.uid}</td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{log.nama}</td>
                            <td style={tdStyle}>
                              <span style={badgeStatus(log.status)}>{log.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {subTabAdmin === 'master' && (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={thStyle}>Baris</th>
                        <th style={thStyle}>UID Kartu</th>
                        <th style={thStyle}>Nama Pengajar</th>
                        <th style={thStyle}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterMasterPengajar.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                            Tidak ada data pengajar di Master_Pengajar.
                          </td>
                        </tr>
                      ) : (
                        filterMasterPengajar.map((m) => (
                          <tr key={m.row} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ ...tdStyle, color: '#64748b' }}>#{m.row}</td>
                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700 }}>{m.uid}</td>
                            <td style={tdStyle}>
                              {editRow === m.row ? (
                                <input
                                  type="text"
                                  value={editNamaVal}
                                  onChange={(e) => setEditNamaVal(e.target.value)}
                                  placeholder="Masukkan nama lengkap & gelar..."
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    border: '1px solid #2563eb',
                                    width: '90%',
                                    fontSize: 13
                                  }}
                                />
                              ) : (
                                <span style={{
                                  fontWeight: 600,
                                  color: m.nama.startsWith('Pengajar_') ? '#b45309' : '#0f172a'
                                }}>
                                  {m.nama}
                                </span>
                              )}
                            </td>
                            <td style={tdStyle}>
                              {editRow === m.row ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onClick={() => simpanNamaBaru(m.row)}
                                    disabled={sedangMenyimpan}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#059669',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      fontSize: 12
                                    }}
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    onClick={() => setEditRow(null)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#64748b',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      fontSize: 12
                                    }}
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditRow(m.row);
                                    setEditNamaVal(m.nama);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    border: '1px solid #bae6fd',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: 12
                                  }}
                                >
                                  ✏️ Edit Nama
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  textAlign: 'left',
  background: '#ffffff'
};

const thStyle: React.CSSProperties = {
  padding: '11px 12px',
  fontWeight: 700,
  color: '#334155'
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px'
};

const btnSecondary: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 12
};

function cardStat(bg: string, color: string): React.CSSProperties {
  return {
    padding: 16,
    borderRadius: 10,
    background: bg,
    color: color,
    textAlign: 'center'
  };
}

function btnFilter(aktif: boolean): React.CSSProperties {
  return {
    padding: '7px 14px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: aktif ? '#2563eb' : '#ffffff',
    color: aktif ? '#ffffff' : '#334155',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12
  };
}

function badgeStatus(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-block'
  };
  if (status === 'Masuk') return { ...base, background: '#dcfce7', color: '#166534' };
  if (status === 'Terlambat') return { ...base, background: '#fef3c7', color: '#92400e' };
  if (status === 'Pulang') return { ...base, background: '#dbeafe', color: '#1e40af' };
  return { ...base, background: '#fee2e2', color: '#991b1b' };
}
