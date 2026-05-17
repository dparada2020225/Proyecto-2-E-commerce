import { useEffect, useState, useCallback, useMemo } from 'react'

const API = import.meta.env.VITE_API_URL
const OPT = { credentials: 'include' }

export default function Clientes() {
  const [clientes,  setClientes]  = useState([])
  const [conVentas, setConVentas] = useState([])
  const [form, setForm] = useState({ nombre: '', correo: '' })
  const [editId,  setEditId]  = useState(null)
  const [error,   setError]   = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargarClientes = useCallback(() => {
    fetch(`${API}/clientes`, OPT)
      .then(r => r.json())
      .then(setClientes)
      .catch(() => setError('Error al cargar clientes'))
  }, [])

  const cargarConVentas = useCallback(() => {
    fetch(`${API}/clientes/con-ventas`, OPT).then(r => r.json()).then(setConVentas)
  }, [])

  useEffect(() => {
    cargarClientes()
    cargarConVentas()
  }, [cargarClientes, cargarConVentas])

  // useMemo: estadísticas derivadas
  const stats = useMemo(() => ({
    total: clientes.length,
    conCompras: conVentas.length,
    sinCompras: clientes.length - conVentas.length,
  }), [clientes, conVentas])

  const handleSubmit = async () => {
    setError(''); setMensaje('')
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.correo.trim()) { setError('El correo es obligatorio'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) { setError('El correo no tiene un formato válido'); return }
    const url    = editId ? `${API}/clientes/${editId}` : `${API}/clientes`
    const method = editId ? 'PUT' : 'POST'
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setMensaje(editId ? 'Cliente actualizado' : 'Cliente creado')
    setForm({ nombre: '', correo: '' }); setEditId(null)
    cargarClientes(); cargarConVentas()
  }

  const handleEditar = useCallback((c) => {
    setEditId(c.id_cliente); setForm({ nombre: c.nombre, correo: c.correo })
    setError(''); setMensaje(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleEliminar = useCallback(async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return
    const res  = await fetch(`${API}/clientes/${id}`, { method: 'DELETE', ...OPT })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setMensaje('Cliente eliminado'); cargarClientes(); cargarConVentas()
  }, [cargarClientes, cargarConVentas])

  const cancelar = () => { setEditId(null); setForm({ nombre: '', correo: '' }); setError(''); setMensaje('') }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <p className="page-subtitle">Registro y gestión de clientes</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total clientes</div></div>
        <div className="stat-card"><div className="stat-value">{stats.conCompras}</div><div className="stat-label">Con compras</div></div>
        <div className="stat-card"><div className="stat-value">{stats.sinCompras}</div><div className="stat-label">Sin compras</div></div>
      </div>

      {error   && <div className="alert alert-error">⚠ {error}</div>}
      {mensaje && <div className="alert alert-success">✓ {mensaje}</div>}

      <div className="card">
        <div className="card-title">{editId ? '✏ Editar cliente' : '＋ Nuevo cliente'}</div>
        <div className="form-row">
          <input placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={{ minWidth: 200 }} />
          <input placeholder="Correo electrónico" type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} style={{ minWidth: 220 }} />
          <button className="btn btn-primary" onClick={handleSubmit}>{editId ? 'Actualizar' : 'Crear cliente'}</button>
          {editId && <button className="btn btn-ghost" onClick={cancelar}>Cancelar</button>}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-title" style={{ padding: '20px 24px 0' }}>Todos los clientes</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Acciones</th></tr></thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id_cliente}>
                  <td className="td-id">#{c.id_cliente}</td>
                  <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.correo}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-sm btn-edit" onClick={() => handleEditar(c)}>Editar</button>
                      <button className="btn btn-sm btn-delete" onClick={() => handleEliminar(c.id_cliente)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-title" style={{ padding: '20px 24px 0' }}>
          Clientes con ventas registradas
          <span className="badge badge-purple" style={{ fontSize: 11, marginLeft: 8 }}>Subquery IN</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th></tr></thead>
            <tbody>
              {conVentas.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.correo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}