import { describe, expect, it } from 'vitest'

import { base64Url, generarVerificador, leerToken, retoDe } from '@/sesion'

// Un token con la forma de los de Keycloak. La firma no importa: el Host App no la comprueba.
function tokenDePrueba(datos) {
  const parte = (objeto) => base64Url(new TextEncoder().encode(JSON.stringify(objeto)))
  return `${parte({ alg: 'RS256' })}.${parte(datos)}.firma`
}

describe('PKCE', () => {
  it('calcula el reto del ejemplo del estándar (RFC 7636, apéndice B)', async () => {
    expect(await retoDe('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    )
  })

  it('genera verificadores de 43 caracteres válidos en una URL y distintos cada vez', () => {
    const uno = generarVerificador()
    expect(uno).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(generarVerificador()).not.toBe(uno)
  })

  it('base64Url no deja +, / ni =', () => {
    expect(base64Url(new Uint8Array([251, 255, 191]))).toBe('-_-_')
    expect(base64Url(new Uint8Array([1]))).toBe('AQ')
  })
})

describe('leerToken', () => {
  it('saca el usuario, el nombre, los roles y el vencimiento', () => {
    const token = tokenDePrueba({
      sub: 'u-1',
      preferred_username: 'admin',
      name: 'Ana Administradora',
      realm_access: { roles: ['admin', 'cliente'] },
      exp: 1_800_000_000,
    })

    expect(leerToken(token)).toEqual({
      id: 'u-1',
      usuario: 'admin',
      nombre: 'Ana Administradora',
      roles: ['admin', 'cliente'],
      vence: 1_800_000_000_000,
    })
  })

  it('lee bien las tildes del nombre', () => {
    expect(leerToken(tokenDePrueba({ sub: 'u', name: 'Rancés Ramírez', exp: 1 })).nombre).toBe('Rancés Ramírez')
  })

  it('sin nombre usa el usuario, y sin roles devuelve una lista vacía', () => {
    const leido = leerToken(tokenDePrueba({ sub: 'u-2', preferred_username: 'cliente', exp: 1 }))
    expect(leido.nombre).toBe('cliente')
    expect(leido.roles).toEqual([])
  })
})
