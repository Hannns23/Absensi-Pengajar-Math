import React, { useEffect, useState } from 'react';

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

interface AdminPanelProps {
  appsScriptUrl: string;
  onLogout: () => void;
}

export default function AdminPanel({ appsScriptUrl, onLogout }: AdminPanelProps) {
  const [subTab, setSubTab] = useState<'log' | 'master' | 'tambah'>('log');
  const [masterPengajar, setMasterPengajar] = useState<MasterPengajar[]>([]);
  const [riwayatAbsensi, setRiwayatAbsensi] = useState<LogAbsensi[]>([]);
  const [batasJamMasuk, setBatasJamMasuk] = useState<string>("07:30:00");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [proses, setProses] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ tipe: 'ok' | 'err'; teks: string } | null>(null);

  const [cariTeks, setCariTeks] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("SEMUA");

  const [editRow, setEditRow] = useState<number | null>(null);
  const [editNamaVal, setEditNamaVal] = useState<string>("");
  const [newUid, setNewUid] = useState<string>("");
  const [newNama, setNewNama] = useState<string>("");

  const tampilNotif = (tipe: 'ok' | 'err', teks: string) => {
    setNotif({ tipe, teks });
    setTimeout(() => setNotif(null), 4000);
  };

  const muatSemuaData = async () => {
    if (!appsScriptUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`${appsScriptUrl}?action=getAllAdminData`);
      const json = await res.json();
      setBatasJamMasuk(json.batasJamMasuk || "07:30:00");
      setMasterPengajar(json.masterPengajar || []);
      setRiwayatAbsensi(json.riwayatAbsensi || []);
    } catch {
      tampilNotif('err', "Gagal memuat database Spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatSemuaData();
  }, []);

  const handleSimpanJam = async () => {
    const formatJam = batasJamMasuk.length === 5 ? `${batasJamMasuk}:00` : batasJamMasuk;
    setProses(true);
    try {
      await fetch(`${appsScriptUrl}?action=setBatasJam&jam=${encodeURIComponent(formatJam)}`);
      setBatasJamMasuk(formatJam);
      tampilNotif('ok', `Batas jam masuk disimpan: ${formatJam}`);
    } catch {
      tampilNotif('err', "Gagal menyimpan batas jam masuk.");
    } finally {
      setProses(false);
    }
  };

  const handleUpdateNama = async (row: number) => {
    if (!editNamaVal.trim()) return;
    setProses(true);
    try {
      await fetch(`${appsScriptUrl}?action=updatePengajar&row=${row}&nama=${encodeURIComponent(editNamaVal.trim())}`);
      setEditRow(null);
      tampilNotif('ok', "Nama pengajar diperbarui.");
      await muatSemuaData();
    } catch {
      tampilNotif('err', "Gagal memperbarui nama.");
    } finally {
      setProses(false);
    }
  };

  const handleTambahPengajar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid.trim() || !newNama.trim()) return;
    setProses(true);
    try {
      const res = await fetch(
        `${appsScriptUrl}?action=addPengajar&uid=${encodeURIComponent(newUid.trim().toUpperCase())}&nama=${encodeURIComponent(newNama.trim())}`
      );
      const json = await res.json();
      if (json.success === false) {
        tampilNotif('err', json.message || "UID sudah terdaftar!");
      } else {
        setNewUid("");
        setNewNama("");
        tampilNotif('ok', "Pengajar baru berhasil ditambahkan!");
        await muatSemuaData();
        setSubTab('master');
      }
    } catch {
      tampilNotif('err', "Gagal menambahkan pengajar.");
    } finally {
      setProses(false);
    }
  };

  const handleHapusBaris = async (sheet: 'Master_Pengajar' | 'Data_Absensi', row: number, label: string) => {
    if (!window.confirm(`Yakin ingin menghapus "${label}" dari sheet ${sheet}?`)) return;
    setProses(true);
    try {
      await fetch(`${appsScriptUrl}?action=deleteRow&sheet=${sheet}&row=${row}`);
      tampilNotif('ok', `Data "${label}" berhasil dihapus.`);
      await muatSemuaData();
    } catch {
      tampilNotif('err', "Gagal menghapus data.");
    } finally {
      setProses(false);
    }
  };

 const exportKeCSV = () => {
  const separator = ";";
  const header = ["Tanggal", "Waktu", "UID Kartu", "Nama Pengajar", "Status"].join(separator);

  const rows = filterLogAbsensi.map((r) =>
    [r.tanggal, r.waktu, r.uid, r.nama, r.status]
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(separator)
  );

  const csvContent = ["sep=;", header, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Rekap_Absensi_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

    const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekap_Absensi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };;

  const filterLogAbsensi = riwayatAbsensi.filter((item) => {
    const cocokTeks =
      item.nama.toLowerCase().includes(cariTeks.toLowerCase()) ||
      item.tanggal.toLowerCase().includes(cariTeks.toLowerCase()) ||
      item.uid.toLowerCase().includes(cariTeks.toLowerCase());
    const cocokStatus = filterStatus === "SEMUA" || item.status === filterStatus;
    return cocokTeks && cocokStatus;
  });

  const filterMasterPengajar = masterPengajar.filter(
    (item) =>
      item.nama.toLowerCase().includes(cariTeks.toLowerCase()) ||
      item.uid.toLowerCase().includes(cariTeks.toLowerCase())
  );

  const kartuBelumDinamai = masterPengajar.filter((m) => m.nama.startsWith("Pengajar_")).length;

  return (
    <div>
      {notif && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13,
          background: notif.tipe === 'ok' ? '#ecfdf5' : '#fef2f2',
          color: notif.tipe === 'ok' ? '#065f46' : '#991b1b',
          border: `1px solid ${notif.tipe === 'ok' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {notif.tipe === 'ok' ? '✅' : '⚠️'} {notif.teks}
        </div>
      )}

      {/* Kartu Ringkasan Statistik */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={statCard('#eff6ff', '#1e40af')}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{masterPengajar.length}</div>
          <div style={{ fontSize: 12 }}>Total Kartu Pengajar</div>
        </div>
        <div style={statCard('#fef3c7', '#92400e')}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{kartuBelumDinamai}</div>
          <div style={{ fontSize: 12 }}>Kartu Baru Belum Dinamai</div>
        </div>
        <div style={statCard('#f1f5f9', '#0f172a')}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{riwayatAbsensi.length}</div>
          <div style={{ fontSize: 12 }}>Total Riwayat Scan</div>
        </div>
      </div>

      {/* Bar Pengaturan Jam Masuk & Aksi Cepat */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>⏰ Batas Jam Masuk:</span>
          <input
            type="time"
            step="1"
            value={batasJamMasuk}
            onChange={(e) => setBatasJamMasuk(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
          <button onClick={handleSimpanJam} disabled={proses} style={btnPrimary}>Simpan Jam</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={exportKeCSV} style={btnSuccess}>📥 Export CSV</button>
          <button onClick={muatSemuaData} style={btnOutline}>🔄 Refresh Data</button>
          <button onClick={onLogout} style={btnDanger}>Keluar Admin</button>
        </div>
      </div>

      {/* Tab Navigasi Sub-Menu & Kolom Pencarian */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={() => setSubTab('log')} style={btnTab(subTab === 'log')}>
            📑 Semua Log Absensi ({riwayatAbsensi.length})
          </button>
          <button onClick={() => setSubTab('master')} style={btnTab(subTab === 'master')}>
            🪪 Master Pengajar ({masterPengajar.length})
          </button>
          <button onClick={() => setSubTab('tambah')} style={btnTab(subTab === 'tambah')}>
            ➕ Tambah Pengajar Manual
          </button>
        </div>

        {subTab !== 'tambah' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subTab === 'log' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              >
                <option value="SEMUA">Semua Status</option>
                <option value="Masuk">Masuk</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Pulang">Pulang</option>
              </select>
            )}
            <input
              type="text"
              placeholder="Cari nama, UID, atau tanggal..."
              value={cariTeks}
              onChange={(e) => setCariTeks(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #cbd5e1', minWidth: 220, fontSize: 13 }}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Memuat seluruh data dari Google Spreadsheet...</div>
      ) : (
        <>
          {/* Tab 1: Semua Log Absensi */}
          {subTab === 'log' && (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={thStyle}>Baris</th>
                    <th style={thStyle}>Tanggal</th>
                    <th style={thStyle}>Waktu</th>
                    <th style={thStyle}>UID Kartu</th>
                    <th style={thStyle}>Nama Pengajar</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filterLogAbsensi.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Tidak ada data log absensi.</td></tr>
                  ) : (
                    filterLogAbsensi.map((log) => (
                      <tr key={log.row} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ ...tdStyle, color: '#64748b' }}>#{log.row}</td>
                        <td style={tdStyle}>{log.tanggal}</td>
                        <td style={tdStyle}>{log.waktu}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{log.uid}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{log.nama}</td>
                        <td style={tdStyle}><span style={badgeStyle(log.status)}>{log.status}</span></td>
                        <td style={tdStyle}>
                          <button onClick={() => handleHapusBaris('Data_Absensi', log.row, `${log.nama} (${log.tanggal})`)} style={btnMiniDanger}>
                            🗑️ Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Master Pengajar */}
          {subTab === 'master' && (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={thStyle}>Baris</th>
                    <th style={thStyle}>UID Kartu</th>
                    <th style={thStyle}>Nama Pengajar</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filterMasterPengajar.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Belum ada pengajar terdaftar.</td></tr>
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
                              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #2563eb', width: '90%' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 600, color: m.nama.startsWith('Pengajar_') ? '#b45309' : '#0f172a' }}>
                              {m.nama}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {editRow === m.row ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleUpdateNama(m.row)} disabled={proses} style={btnSuccess}>Simpan</button>
                              <button onClick={() => setEditRow(null)} style={btnOutline}>Batal</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => { setEditRow(m.row); setEditNamaVal(m.nama); }} style={btnMiniEdit}>✏️ Edit</button>
                              <button onClick={() => handleHapusBaris('Master_Pengajar', m.row, m.nama)} style={btnMiniDanger}>🗑️ Hapus</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Tambah Pengajar Manual */}
          {subTab === 'tambah' && (
            <form onSubmit={handleTambahPengajar} style={{ maxWidth: 460, background: '#ffffff', padding: 24, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: 16 }}>➕ Daftarkan Pengajar Baru Secara Manual</h3>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>UID Kartu RFID (Hex):</label>
              <input
                type="text"
                placeholder="Contoh: A1B2C3D4"
                value={newUid}
                onChange={(e) => setNewUid(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 14, textTransform: 'uppercase', fontFamily: 'monospace' }}
                required
              />
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Nama Lengkap & Gelar Pengajar:</label>
              <input
                type="text"
                placeholder="Contoh: Drs. Ahmad Fauzi, M.Pd."
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 18 }}
                required
              />
              <button type="submit" disabled={proses} style={{ ...btnPrimary, width: '100%', padding: 11 }}>
                {proses ? 'Menyimpan...' : 'Simpan ke Master_Pengajar'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' };
const thStyle: React.CSSProperties = { padding: '11px 12px', fontWeight: 700, color: '#334155' };
const tdStyle: React.CSSProperties = { padding: '10px 12px' };
const btnPrimary: React.CSSProperties = { padding: '7px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const btnSuccess: React.CSSProperties = { padding: '7px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const btnOutline: React.CSSProperties = { padding: '7px 14px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const btnDanger: React.CSSProperties = { padding: '7px 14px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const btnMiniEdit: React.CSSProperties = { padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const btnMiniDanger: React.CSSProperties = { padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 };

function statCard(bg: string, color: string): React.CSSProperties {
  return { padding: 14, borderRadius: 10, background: bg, color, textAlign: 'center' };
}

function btnTab(aktif: boolean): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1',
    background: aktif ? '#0f172a' : '#fff', color: aktif ? '#fff' : '#334155',
    cursor: 'pointer', fontWeight: 600, fontSize: 12
  };
}

function badgeStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = { padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 };
  if (status === 'Masuk') return { ...base, background: '#dcfce7', color: '#166534' };
  if (status === 'Terlambat') return { ...base, background: '#fef3c7', color: '#92400e' };
  if (status === 'Pulang') return { ...base, background: '#dbeafe', color: '#1e40af' };
  return { ...base, background: '#fee2e2', color: '#991b1b' };
}
