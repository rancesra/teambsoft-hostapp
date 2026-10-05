// Los tres módulos que monta el cascarón. Es el único sitio donde el Host App sabe que existen:
// agregar un cuarto módulo es agregar una entrada aquí y su variable en .env.development.
//
// Cada módulo es dueño de su prefijo (contrato del Host App, sección 2) y no pinta nada fuera de él.

export const MODULOS = [
  {
    clave: 'catalogo',
    nombre: 'Catálogo',
    equipo: 'Equipo B',
    url: import.meta.env.VITE_MODULO_CATALOGO,
  },
  {
    clave: 'busqueda',
    nombre: 'Búsqueda',
    equipo: 'Equipo A',
    url: import.meta.env.VITE_MODULO_BUSQUEDA,
  },
  {
    clave: 'carrito',
    nombre: 'Carro',
    equipo: 'Equipo C',
    url: import.meta.env.VITE_MODULO_CARRO,
  },
]

export function buscarModulo(clave) {
  return MODULOS.find((m) => m.clave === clave) ?? null
}