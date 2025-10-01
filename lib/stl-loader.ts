import * as THREE from 'three'

export interface STLGeometry extends THREE.BufferGeometry {
  // STL-specific properties if needed
}

export class STLLoader {
  constructor() {}

  load(url: string, onLoad: (geometry: STLGeometry) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void) {
    const loader = new THREE.FileLoader()
    loader.setResponseType('arraybuffer')

    loader.load(url, (data) => {
      try {
        const geometry = this.parse(data as ArrayBuffer)
        onLoad(geometry)
      } catch (error) {
        if (onError) onError(error as ErrorEvent)
      }
    }, onProgress, onError)
  }

  parse(data: ArrayBuffer): STLGeometry {
    const geometry = new THREE.BufferGeometry()

    if (this.isBinarySTL(data)) {
      return this.parseBinary(data)
    } else {
      return this.parseASCII(new TextDecoder().decode(data))
    }
  }

  private isBinarySTL(data: ArrayBuffer): boolean {
    const reader = new DataView(data)
    const numTriangles = reader.getUint32(80, true)
    const expectedSize = 80 + 4 + numTriangles * 50
    return data.byteLength === expectedSize
  }

  private parseBinary(data: ArrayBuffer): STLGeometry {
    const reader = new DataView(data)
    const numTriangles = reader.getUint32(80, true)

    const vertices: number[] = []
    const normals: number[] = []

    let offset = 84

    for (let i = 0; i < numTriangles; i++) {
      // Normal vector
      const nx = reader.getFloat32(offset, true)
      const ny = reader.getFloat32(offset + 4, true)
      const nz = reader.getFloat32(offset + 8, true)
      offset += 12

      // Vertices (3 vertices per triangle)
      for (let j = 0; j < 3; j++) {
        const x = reader.getFloat32(offset, true)
        const y = reader.getFloat32(offset + 4, true)
        const z = reader.getFloat32(offset + 8, true)
        offset += 12

        vertices.push(x, y, z)
        normals.push(nx, ny, nz)
      }

      offset += 2 // Skip attribute byte count
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    return geometry as STLGeometry
  }

  private parseASCII(data: string): STLGeometry {
    const vertices: number[] = []
    const normals: number[] = []

    const lines = data.split('\n')
    let currentNormal = [0, 0, 0]

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('facet normal')) {
        const parts = trimmed.split(/\s+/)
        currentNormal = [
          parseFloat(parts[2]),
          parseFloat(parts[3]),
          parseFloat(parts[4])
        ]
      } else if (trimmed.startsWith('vertex')) {
        const parts = trimmed.split(/\s+/)
        vertices.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        )
        normals.push(...currentNormal)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    return geometry as STLGeometry
  }
}