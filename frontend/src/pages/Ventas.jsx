import { useEffect, useState, useCallback, useMemo, useReducer } from 'react'

const API = import.meta.env.VITE_API_URL
const OPT = { credentials: 'include' }

// ── Reducer para el carrito de detalle ───────────────────
const detalleInicial = [{ id_producto: '', cantidad: '', precio_unitario: '' }]

function detalleReducer(state, action) {
  switch (action.type) {
    case 'AGREGAR_LINEA':
      return [...state, { id_producto: '', cantidad: '', precio_unitario: '' }]
    case 'ELIMINAR_LINEA':
      return state.filter((_, idx) => idx !== action.index)
    case 'CAMBIAR_CAMPO': {
      const nuevo = state.map((item, idx) =>
        idx === action.index ? { ...item, [action.campo]: action.valor } : item
      )
      if (action.campo === 'id_producto' && action.precioAuto !== undefined) {
        nuevo[action.index].precio_unitario = action.precioAuto
      }
      return nuevo
    }
    case 'RESETEAR':
      return detalleInicial
    default:
      return state
  }
}

export default function Ventas() {
  const [ventas,    setVentas]    = useState([])
  const [clientes,  setClientes]  = useState([])
  const [empleados, setEmpleados] = useState([])
  const [productos, setProductos] = useState([])
  const [detalle, dispatch] = useReducer(detalleReducer, detalleInicial)
  const [form, setForm] = useState({ id_cliente: '', id_empleado: '' })
  const [error,   setError]   = useState('')
  const [mensaje, setMensaje] = useState('')
  const [detalleVenta,      setDetalleVenta]      = useState(null)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  const cargarVentas = useCallback(() => {
    fetch(`${API}/ventas`, OPT)
      .then(r => r.json())
      .then(setVentas)
      .catch(() => setError('Error al cargar ventas'))
  }, [])

  useEffect(() => {
    cargarVentas()
    fetch(`${API}/clientes`, OPT).then(r => r.json()).then(setClientes)
    fetch(`${API}/ventas/empleados`, OPT).then(r => r.json()).then(setEmpleados)
    fetch(`${API}/productos`, OPT).then(r => r.json()).then(setProductos)
  }, [cargarVentas])

  const stats = useMemo(() => ({
    totalVentas: ventas.length,
    totalClientes: clientes.length,
    totalEmpleados: empleados.length,
  }), [ventas, clientes, empleados])

  const subtotalDetalle = useMemo(() => {
    if (!detalleVenta) return 0
    return detalleVenta.reduce((s, d) => s + Number(d.subtotal), 0)
  }, [detalleVenta])

  const handleDetalleChange = useCallback((i, campo, valor) => {
    const prod = campo === 'id_producto'
      ? productos.find(p => p.id_producto === parseInt(valor))
      : undefined
    dispatch({
      type: 'CAMBIAR_CAMPO',
      index: i,
      campo,
      valor,
      precioAuto: prod ? prod.precio : undefined,
    })
  }, [productos])

  const handleSubmit = async () => {
    setError(''); setMensaje('')
    if (!form.id_cliente || !form.id_empleado) { setError('Selecciona cliente y empleado'); return }
    if (detalle.some(d => !d.id_producto || !d.cantidad)) { setError('Completa todos los productos'); return }
    if (detalle.some(d => Number(d.cantidad) <= 0)) { setError('La cantidad debe ser mayor a 0'); return }
    const res  = await fetch(`${API}/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, detalle })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setMensaje(`Venta #${data.id_venta} registrada correctamente`)
    setForm({ id_cliente: '', id_empleado: '' })
    dispatch({ type: 'RESETEAR' })
    cargarVentas()
  }

  const verDetalle = useCallback(async (id) => {
    setVentaSeleccionada(id)
    const res  = await fetch(`${API}/ventas/${id}/detalle`, OPT)
    const data = await res.json()
    setDetalleVenta(data)
  }, [])

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Ventas</h1>
        <p className="page-subtitle">Registro de transacciones con stock automático</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-value">{stats.totalVentas}</div><div className="stat-label">Total ventas</div></div>
        <div className="stat-card"><div className="stat-value">{stats.totalClientes}</div><div className="stat-label">Clientes</div></div>
        <div className="stat-card"><div className="stat-value">{stats.totalEmpleados}</div><div className="stat-label">Empleados</div></div>
      </div>

      {error   && <div className="alert alert-error">⚠ {error}</div>}
      {mensaje && <div className="alert alert-success">✓ {mensaje}</div>}

      <div className="card">
        <div className="card-title">＋ Nueva venta</div>
        <div className="form-row" style={{ marginBottom: 20 }}>
          <select value={form.id_cliente} onChange={e => setForm({ ...form, id_cliente: e.target.value })}>
            <option value="">-- Cliente --</option>
            {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
          </select>
          <select value={form.id_empleado} onChange={e => setForm({ ...form, id_empleado: e.target.value })}>
            <option value="">-- Empleado --</option>
            {empleados.map(e => <option key={e.id_empleado} value={e.id_empleado}>{e.nombre}</option>)}
          </select>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
          Detalle de productos
        </div>

        {detalle.map((d, i) => (
          <div key={i} className="detail-line">
            <select value={d.id_producto} style={{ flex: 2 }} onChange={e => handleDetalleChange(i, 'id_producto', e.target.value)}>
              <option value="">-- Producto --</option>
              {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre} (stock: {p.stock})</option>)}
            </select>
            <input placeholder="Cantidad" type="number" min="1" value={d.cantidad} style={{ maxWidth: 100 }} onChange={e => handleDetalleChange(i, 'cantidad', e.target.value)} />
            <input placeholder="Precio unit." type="number" value={d.precio_unitario} style={{ maxWidth: 120 }} onChange={e => handleDetalleChange(i, 'precio_unitario', e.target.value)} />
            {detalle.length > 1 && (
              <button className="btn btn-sm btn-delete" onClick={() => dispatch({ type: 'ELIMINAR_LINEA', index: i })}>✕</button>
            )}
          </div>
        ))}

        <div className="form-row" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'AGREGAR_LINEA' })}>+ Agregar producto</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Registrar venta</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-title" style={{ padding: '20px 24px 0' }}>
          Ventas registradas
          <span className="badge badge-purple" style={{ fontSize: 11, marginLeft: 8 }}>JOIN</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Empleado</th><th>Detalle</th></tr></thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id_venta}>
                  <td className="td-id">#{v.id_venta}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(v.fecha).toLocaleDateString('es-GT')}</td>
                  <td style={{ fontWeight: 500 }}>{v.cliente}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{v.empleado}</td>
                  <td><button className="btn btn-sm btn-view" onClick={() => verDetalle(v.id_venta)}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detalleVenta && (
        <div className="modal-overlay animate-in">
          <div className="modal-title">Detalle de Venta #{ventaSeleccionada}</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detalleVenta.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{d.producto}</td>
                    <td>{d.cantidad}</td>
                    <td>Q{Number(d.precio_unitario).toFixed(2)}</td>
                    <td><span className="badge badge-purple">Q{Number(d.subtotal).toFixed(2)}</span></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', paddingTop: 12 }}>TOTAL</td>
                  <td style={{ paddingTop: 12 }}><span className="badge badge-purple" style={{ fontSize: 14 }}>Q{subtotalDetalle.toFixed(2)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={() => setDetalleVenta(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}