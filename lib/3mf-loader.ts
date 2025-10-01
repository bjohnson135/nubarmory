import * as THREE from 'three'
import JSZip from 'jszip'

interface Material3MF {
  id: string
  name?: string
  displayColor?: string
}

interface Object3MF {
  id: string
  type: string
  pid?: string // material ID reference
  pindex?: string
  vertices: number[]
  triangles: { v1: number, v2: number, v3: number, pid?: string }[]
}

export class ThreeMFLoader {
  private materials: Map<string, Material3MF> = new Map()
  private objects: Map<string, Object3MF> = new Map()

  async load(
    url: string,
    onLoad: (group: THREE.Group) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch 3MF file: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const group = await this.parse(arrayBuffer)
      onLoad(group)
    } catch (error) {
      if (onError) onError(error as Error)
    }
  }

  async parse(data: ArrayBuffer): Promise<THREE.Group> {
    const zip = new JSZip()
    const contents = await zip.loadAsync(data)

    // 3MF files contain a 3dmodel.model file with the actual data
    const modelFile = contents.file('3D/3dmodel.model')
    if (!modelFile) {
      throw new Error('Invalid 3MF file: missing 3D/3dmodel.model')
    }

    const modelXml = await modelFile.async('string')
    const parser = new DOMParser()
    const doc = parser.parseFromString(modelXml, 'application/xml')

    // Parse materials
    this.parseMaterials(doc)

    // Parse objects
    this.parseObjects(doc)

    // Build THREE.js group
    return this.buildThreeGroup()
  }

  private parseMaterials(doc: Document) {
    const materials = doc.querySelectorAll('basematerials > base')
    materials.forEach(mat => {
      const id = mat.getAttribute('id')
      const name = mat.getAttribute('name')
      const displayColor = mat.getAttribute('displaycolor')

      if (id) {
        this.materials.set(id, {
          id,
          name: name || undefined,
          displayColor: displayColor || undefined
        })
      }
    })

    // Also parse color groups (Bambu Studio specific)
    const colorGroups = doc.querySelectorAll('colorgroup > color')
    colorGroups.forEach(color => {
      const id = color.getAttribute('id')
      const colorValue = color.getAttribute('color')

      if (id && colorValue) {
        this.materials.set(id, {
          id,
          displayColor: colorValue
        })
      }
    })
  }

  private parseObjects(doc: Document) {
    const objects = doc.querySelectorAll('resources > object')

    objects.forEach(obj => {
      const id = obj.getAttribute('id')
      const type = obj.getAttribute('type') || 'model'
      const pid = obj.getAttribute('pid') // material ID
      const pindex = obj.getAttribute('pindex')

      if (!id) return

      const vertices: number[] = []
      const triangles: { v1: number, v2: number, v3: number, pid?: string }[] = []

      // Parse vertices
      const vertexElements = obj.querySelectorAll('mesh > vertices > vertex')
      vertexElements.forEach(vertex => {
        const x = parseFloat(vertex.getAttribute('x') || '0')
        const y = parseFloat(vertex.getAttribute('y') || '0')
        const z = parseFloat(vertex.getAttribute('z') || '0')
        vertices.push(x, y, z)
      })

      // Parse triangles
      const triangleElements = obj.querySelectorAll('mesh > triangles > triangle')
      triangleElements.forEach(triangle => {
        const v1 = parseInt(triangle.getAttribute('v1') || '0')
        const v2 = parseInt(triangle.getAttribute('v2') || '0')
        const v3 = parseInt(triangle.getAttribute('v3') || '0')
        const trianglePid = triangle.getAttribute('pid') || pid // Triangle can have its own material

        // Handle Bambu Studio paint_color attribute
        const paintColor = triangle.getAttribute('paint_color')
        const materialId = paintColor ? `paint_${paintColor}` : (trianglePid || 'default')

        triangles.push({ v1, v2, v3, pid: materialId })
      })

      this.objects.set(id, {
        id,
        type,
        pid: pid || undefined,
        pindex: pindex || undefined,
        vertices,
        triangles
      })
    })
  }

  private buildThreeGroup(): THREE.Group {
    const group = new THREE.Group()

    this.objects.forEach(object => {
      const geometry = new THREE.BufferGeometry()

      // Convert vertices
      const positions = new Float32Array(object.vertices)
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      // Build faces and handle materials
      const indices: number[] = []
      const colors: number[] = []
      const materialGroups: Map<string, { start: number, count: number }> = new Map()

      // Group triangles by material first to ensure proper material groups
      const trianglesByMaterial: Map<string, { v1: number, v2: number, v3: number }[]> = new Map()

      object.triangles.forEach((triangle) => {
        const materialId = triangle.pid || object.pid || 'default'
        if (!trianglesByMaterial.has(materialId)) {
          trianglesByMaterial.set(materialId, [])
        }
        trianglesByMaterial.get(materialId)!.push(triangle)
      })


      // Now build indices and groups in material order
      let indexOffset = 0
      trianglesByMaterial.forEach((triangles, materialId) => {
        const groupStart = indexOffset

        triangles.forEach((triangle) => {
          indices.push(triangle.v1, triangle.v2, triangle.v3)
        })

        const groupCount = triangles.length * 3
        materialGroups.set(materialId, { start: groupStart, count: groupCount })
        indexOffset += groupCount

      })

      geometry.setIndex(indices)

      // Add vertex colors if available
      if (colors.length > 0) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      }

      // Compute normals
      geometry.computeVertexNormals()
      geometry.computeBoundingBox()

      // Create materials for each group
      const materials: THREE.Material[] = []
      materialGroups.forEach((group, materialId) => {
        const materialData = this.materials.get(materialId)
        let material: THREE.Material

        if (materialData?.displayColor) {
          // Standard 3MF material with displayColor
          const color = this.parseColor(materialData.displayColor)
          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color.r, color.g, color.b),
            side: THREE.DoubleSide,
            vertexColors: colors.length > 0
          })
        } else if (materialId.startsWith('paint_')) {
          // Bambu Studio paint color - create a colored material
          // For now, use distinct colors that can be overridden by ModelViewer
          const paintIndex = parseInt(materialId.replace('paint_', ''))
          const defaultPaintColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080]
          const colorHex = defaultPaintColors[paintIndex % defaultPaintColors.length] || 0xff0000

          material = new THREE.MeshPhongMaterial({
            color: colorHex,
            side: THREE.DoubleSide,
            vertexColors: colors.length > 0
          })
        } else {
          // Default material (unpainted areas)
          material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            side: THREE.DoubleSide,
            vertexColors: colors.length > 0
          })
        }

        materials.push(material)
        geometry.addGroup(group.start, group.count, materials.length - 1)
      })

      // Create mesh
      const finalMaterial = materials.length > 1 ? materials : materials[0] || new THREE.MeshPhongMaterial({ color: 0x888888 })


      const mesh = new THREE.Mesh(geometry, finalMaterial)
      group.add(mesh)
    })

    // Center and scale the group
    const box = new THREE.Box3().setFromObject(group)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    group.position.sub(center)
    group.scale.setScalar(2 / maxDim)

    return group
  }

  private parseColor(colorString: string): { r: number, g: number, b: number } {
    // Handle different color formats
    if (colorString.startsWith('#')) {
      // Hex color
      const hex = colorString.slice(1)
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16) / 255,
          g: parseInt(hex.slice(2, 4), 16) / 255,
          b: parseInt(hex.slice(4, 6), 16) / 255
        }
      } else if (hex.length === 8) {
        // With alpha
        return {
          r: parseInt(hex.slice(2, 4), 16) / 255,
          g: parseInt(hex.slice(4, 6), 16) / 255,
          b: parseInt(hex.slice(6, 8), 16) / 255
        }
      }
    } else if (colorString.match(/^\d+$/)) {
      // Integer color (0xAARRGGBB format)
      const num = parseInt(colorString)
      return {
        r: ((num >> 16) & 0xFF) / 255,
        g: ((num >> 8) & 0xFF) / 255,
        b: (num & 0xFF) / 255
      }
    }

    // Default gray
    return { r: 0.5, g: 0.5, b: 0.5 }
  }
}