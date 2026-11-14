import { describe, expect, it } from 'vitest'

import { mensajeDeSesion, pedidoDeSesion } from '@/sesionCompartida'

const ORIGENES = new Set(['http://localhost:5173', 'http://localhost:5175'])
const evento = (origin, data) => ({ origin, data })

describe('pedidoDeSesion', () => {
  it('un módulo que pide la sesión la recibe', () => {
    expect(pedidoDeSesion(evento('http://localhost:5173', { tipo: 'pedir-sesion' }), ORIGENES)).toBe('enviar')
  })

  it('un módulo puede pedir que el usuario inicie sesión', () => {
    expect(pedidoDeSesion(evento('http://localhost:5175', { tipo: 'iniciar-sesion' }), ORIGENES)).toBe('iniciar')
  })

  it('se ignora a una página que no es un módulo, aunque mande el mensaje correcto', () => {
    expect(pedidoDeSesion(evento('http://localhost:6666', { tipo: 'pedir-sesion' }), ORIGENES)).toBeNull()
  })

  it('se ignoran los mensajes de otro tipo o sin datos', () => {
    expect(pedidoDeSesion(evento('http://localhost:5173', { tipo: 'navegar', ruta: '/carrito' }), ORIGENES)).toBeNull()
    expect(pedidoDeSesion(evento('http://localhost:5173', null), ORIGENES)).toBeNull()
  })
})

describe('mensajeDeSesion', () => {
  it('sin sesión manda token y usuario en null', () => {
    expect(mensajeDeSesion({ token: null, usuario: null })).toEqual({ tipo: 'sesion', token: null, usuario: null })
  })

  it('copia el usuario y sus roles, para que se pueda enviar con postMessage', () => {
    const usuario = { id: 'u-1', usuario: 'admin', nombre: 'Ana', roles: ['admin'] }
    const mensaje = mensajeDeSesion({ token: 'abc', usuario })

    expect(mensaje).toEqual({ tipo: 'sesion', token: 'abc', usuario })
    expect(mensaje.usuario).not.toBe(usuario)
    expect(mensaje.usuario.roles).not.toBe(usuario.roles)
    expect(() => structuredClone(mensaje)).not.toThrow()
  })
})
