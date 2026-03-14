import { useState, useEffect } from 'react'

export default function InspectionList({ onNew, onOpen, onDelete, listInspections }) {
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadList()
  }, [])

  async function loadList() {
    setLoading(true)
    const { data } = await listInspections()
    setInspections(data)
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inspection? This cannot be undone.')) return
    await onDelete(id)
    loadList()
  }

  const statusLabel = (status) => {
    if (status === 'signed') return { text: 'SIGNED', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
    if (status === 'completed') return { text: 'COMPLETE', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
    return { text: 'IN PROGRESS', color: '#f97316', bg: 'rgba(249,115,22,0.1)' }
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', letterSpacing: 1 }}>Inspections</div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', letterSpacing: 2 }}>
            {inspections.length} TOTAL
          </div>
        </div>
        <button onClick={onNew} style={{
          background: '#f97316', border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
          cursor: 'pointer', letterSpacing: 1,
        }}>
          + NEW INSPECTION
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--mu)', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
          Loading...
        </div>
      ) : inspections.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, background: 'var(--sf)', border: '1px solid var(--bd)',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🚗</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>No Inspections Yet</div>
          <div style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', lineHeight: 1.8 }}>
            Start your first walkaround<br />by tapping the button above
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {inspections.map((insp) => {
            const st = statusLabel(insp.status)
            const vehicle = [insp.vehicle_year, insp.vehicle_make, insp.vehicle_model].filter(Boolean).join(' ')
            return (
              <div key={insp.id} style={{
                background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10,
                padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
                onClick={() => onOpen(insp.id)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--bd)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{insp.customer_name}</div>
                    <div style={{ fontSize: 14, color: 'var(--mu)' }}>{vehicle}</div>
                  </div>
                  <span style={{
                    fontSize: 9, fontFamily: "'DM Mono', monospace", padding: '3px 8px',
                    borderRadius: 4, background: st.bg, color: st.color,
                    border: `1px solid ${st.color}30`, letterSpacing: 1,
                  }}>{st.text}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--mu)' }}>
                    {insp.vehicle_vin && <span>VIN: {insp.vehicle_vin.slice(-6)}</span>}
                    {insp.ro_number && <span>RO# {insp.ro_number}</span>}
                    <span>{new Date(insp.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(insp.id); }}
                    style={{
                      background: 'none', border: '1px solid var(--bd)', borderRadius: 4,
                      padding: '3px 8px', fontSize: 10, fontFamily: "'DM Mono', monospace",
                      color: 'var(--mu)', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.color = 'var(--mu)'; }}
                  >DELETE</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}