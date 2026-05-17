import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../App'
import Login from '../pages/Login'

const mockAuth = { usuario: null, login: () => {}, logout: () => {} }

describe('Login', () => {
  it('renderiza el formulario de login', () => {
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    )
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Ingresar')).toBeInTheDocument()
  })

  it('muestra error si los campos están vacíos', async () => {
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    )
    fireEvent.click(screen.getByText('Ingresar'))
    expect(await screen.findByText(/Completa todos los campos/i)).toBeInTheDocument()
  })

  it('muestra el título de la marca', () => {
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    )
    expect(screen.getByText('Tienda')).toBeInTheDocument()
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
  })
})