import { describe, expect, it } from 'vitest'

import { entradaDeRuta, tituloDePagina } from '@/modulos'

describe('entradaDeRuta', () => {
  it('encuentra el módulo de la ruta, con o sin subruta', () => {
    expect(entradaDeRuta('/catalogo').nombre).toBe('Catálogo')
    expect(entradaDeRuta('/catalogo/admin/nuevo').nombre).toBe('Catálogo')
    expect(entradaDeRuta('/busqueda').nombre).toBe('Búsqueda')
  })

  it('gana la entrada más específica: /carrito/pedidos es Órdenes y no Carro', () => {
    expect(entradaDeRuta('/carrito').nombre).toBe('Carro')
    expect(entradaDeRuta('/carrito/pedidos').nombre).toBe('Órdenes')
    expect(entradaDeRuta('/carrito/pedidos/123').nombre).toBe('Órdenes')
  })

  it('no confunde rutas que solo empiezan igual', () => {
    expect(entradaDeRuta('/catalogos')).toBeNull()
    expect(entradaDeRuta('/otra-cosa')).toBeNull()
  })
})

describe('tituloDePagina', () => {
  it('pone la sección delante del nombre de la tienda', () => {
    expect(tituloDePagina('/catalogo/674000000000000000000001')).toBe('Catálogo · Tienda Virtual')
    expect(tituloDePagina('/carrito/pedidos')).toBe('Órdenes · Tienda Virtual')
  })

  it('fuera de los módulos queda solo el nombre de la tienda', () => {
    expect(tituloDePagina('/no-existe')).toBe('Tienda Virtual')
  })
})
