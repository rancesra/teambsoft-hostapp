import { describe, expect, it } from 'vitest'

import { origenesDeModulos, rutaANavegar } from '@/navegacion'

const ORIGENES = new Set(['http://localhost:5173', 'http://localhost:5175'])
const navegar = (ruta, origin = 'http://localhost:5173') => rutaANavegar({ origin, data: { tipo: 'navegar', ruta } }, ORIGENES)

describe('rutaANavegar', () => {
  it('acepta las rutas de los tres módulos, con o sin subruta y parámetros', () => {
    expect(navegar('/carrito?agregar=674000000000000000000001')).toBe('/carrito?agregar=674000000000000000000001')
    expect(navegar('/catalogo')).toBe('/catalogo')
    expect(navegar('/busqueda/resultados#arriba')).toBe('/busqueda/resultados#arriba')
    expect(navegar('/carrito/pedidos')).toBe('/carrito/pedidos')
  })

  it('rechaza un mensaje que no viene de un módulo', () => {
    expect(navegar('/carrito', 'http://localhost:5050')).toBeNull()
    expect(navegar('/carrito', 'https://otro-sitio.com')).toBeNull()
  })

  it('rechaza rutas que solo se parecen o que llevan a otro sitio', () => {
    for (const ruta of ['/carritos', '/admin', '//otro-sitio.com', 'https://otro-sitio.com', 'carrito', '']) {
      expect(navegar(ruta), ruta).toBeNull()
    }
  })

  it('rechaza mensajes de otro tipo o sin ruta de texto', () => {
    const de = (data) => rutaANavegar({ origin: 'http://localhost:5173', data }, ORIGENES)
    expect(de({ tipo: 'sesion', ruta: '/carrito' })).toBeNull()
    expect(de({ tipo: 'navegar', ruta: 42 })).toBeNull()
    expect(de(null)).toBeNull()
  })
})

describe('origenesDeModulos', () => {
  it('toma el origen de los módulos con dirección y salta los que no tienen', () => {
    const origenes = origenesDeModulos([
      { url: 'http://localhost:5173/' },
      { url: undefined },
      { url: 'http://localhost:5175' },
    ])
    expect([...origenes]).toEqual(['http://localhost:5173', 'http://localhost:5175'])
  })
})
