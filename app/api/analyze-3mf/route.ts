import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { DOMParser } from '@xmldom/xmldom'

// Fixed NodeList forEach issues with Array.from()

export async function POST(request: NextRequest) {
  console.log('3MF Analysis API: Request received')
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('3MF Analysis API: File received:', file?.name, file?.size)

    if (!file) {
      console.log('3MF Analysis API: No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.3mf')) {
      console.log('3MF Analysis API: File is not 3MF:', file.name)
      return NextResponse.json({ error: 'File must be a 3MF file' }, { status: 400 })
    }

    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Parse the 3MF file (it's a ZIP archive)
    const zip = new JSZip()
    const contents = await zip.loadAsync(arrayBuffer)


    // Find the main model file
    const modelFile = contents.file('3D/3dmodel.model')
    if (!modelFile) {
      return NextResponse.json({ error: 'Invalid 3MF file - missing 3dmodel.model' }, { status: 400 })
    }

    // Parse the XML content
    const xmlContent = await modelFile.async('string')
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'application/xml')

    // Check for parsing errors (xmldom doesn't use querySelector)
    if (!doc || !doc.documentElement) {
      return NextResponse.json({ error: 'Invalid XML in 3MF file' }, { status: 400 })
    }

    // Analyze the 3MF structure
    const analysis = {
      filename: file.name,
      fileSize: file.size,
      materials: [] as any[],
      objects: [] as any[],
      meshes: [] as any[],
      colorZones: 0,
      hasMaterials: false,
      hasColors: false,
      xmlStructure: {
        hasResources: false,
        hasBaseMaterials: false,
        hasColorGroups: false,
        hasObjects: false,
        hasBuild: false
      }
    }

    console.log('3MF Analysis: Starting analysis of', file.name)

    // Analyze resources section
    const resourcesElements = doc.getElementsByTagName('resources')
    const resources = resourcesElements.length > 0 ? resourcesElements[0] : null

    if (resources) {
      analysis.xmlStructure.hasResources = true

      // Analyze materials
      const baseMaterials = resources.getElementsByTagName('basematerial')
      analysis.xmlStructure.hasBaseMaterials = baseMaterials.length > 0
      analysis.hasMaterials = baseMaterials.length > 0

      Array.from(baseMaterials).forEach((material, index) => {
        const materialElement = material as Element
        const name = materialElement.getAttribute('name') || `Material ${index + 1}`
        const displayColor = materialElement.getAttribute('displaycolor') || '#808080'

        analysis.materials.push({
          id: materialElement.getAttribute('id') || index.toString(),
          name,
          displayColor,
          index
        })
      })

      // Analyze color groups
      const colorGroups = resources.getElementsByTagName('colorgroup')
      analysis.xmlStructure.hasColorGroups = colorGroups.length > 0
      analysis.hasColors = colorGroups.length > 0

      Array.from(colorGroups).forEach((colorGroup, index) => {
        const colorGroupElement = colorGroup as Element
        const colors = colorGroupElement.getElementsByTagName('color')
        Array.from(colors).forEach((color, colorIndex) => {
          const colorElement = color as Element
          const colorValue = colorElement.getAttribute('color') || '#808080'
          analysis.materials.push({
            id: `colorgroup_${index}_${colorIndex}`,
            name: `Color ${colorIndex + 1} from Group ${index + 1}`,
            displayColor: colorValue,
            type: 'color',
            groupIndex: index,
            colorIndex
          })
        })
      })

      // Analyze objects
      const objects = resources.getElementsByTagName('object')
      analysis.xmlStructure.hasObjects = objects.length > 0

      Array.from(objects).forEach((object, index) => {
        const objectElement = object as Element
        const objectId = objectElement.getAttribute('id') || index.toString()
        const objectType = objectElement.getAttribute('type') || 'model'
        const name = objectElement.getAttribute('name') || `Object ${index + 1}`

        // Count triangles in this object
        const triangles = objectElement.getElementsByTagName('triangle')

        // Check for material assignments and other attributes including Bambu Studio paint colors
        const materialAssignments = new Set()
        const paintColors = new Set()
        const allAttributes = new Set()
        Array.from(triangles).forEach((triangle, triIndex) => {
          const pid = triangle.getAttribute('pid')
          const p1 = triangle.getAttribute('p1')
          const p2 = triangle.getAttribute('p2')
          const p3 = triangle.getAttribute('p3')
          const paintColor = triangle.getAttribute('paint_color')


          // Collect all unique attribute names
          Array.from(triangle.attributes).forEach(attr => allAttributes.add(attr.name))

          // Collect standard material assignments
          if (pid) materialAssignments.add(pid)
          if (p1) materialAssignments.add(p1)
          if (p2) materialAssignments.add(p2)
          if (p3) materialAssignments.add(p3)

          // Collect Bambu Studio paint colors - track both painted and unpainted triangles
          if (paintColor) {
            paintColors.add(paintColor)
          } else {
            // Triangles without paint_color attribute represent the "default" color
            paintColors.add('default')
          }
        })



        const materialIdsArray = Array.from(materialAssignments)
        const paintColorsArray = Array.from(paintColors)

        // Combine standard materials and Bambu Studio paint colors for total color zones
        const allColors = new Set([...materialIdsArray, ...paintColorsArray])
        const totalColorCount = allColors.size

        analysis.objects.push({
          id: objectId,
          name,
          type: objectType,
          triangleCount: triangles.length,
          materialIds: materialIdsArray,
          paintColors: paintColorsArray,
          hasMultipleMaterials: materialAssignments.size > 1,
          hasMultipleColors: totalColorCount > 1,
          totalColors: totalColorCount
        })

        // Each object with triangles represents a mesh
        if (triangles.length > 0) {
          analysis.meshes.push({
            objectId,
            name,
            triangleCount: triangles.length,
            materialCount: materialAssignments.size,
            paintColorCount: paintColors.size,
            totalColorCount: totalColorCount
          })
        }
      })
    }

    // Check build section
    const buildElements = doc.getElementsByTagName('build')
    const build = buildElements.length > 0 ? buildElements[0] : null
    analysis.xmlStructure.hasBuild = !!build

    // Calculate color zones (unique material assignments + paint colors)
    const allMaterialIds = new Set()
    const allPaintColors = new Set()
    analysis.objects.forEach(obj => {
      obj.materialIds.forEach((id: string) => allMaterialIds.add(id))
      if (obj.paintColors) {
        obj.paintColors.forEach((color: string) => allPaintColors.add(color))
      }
    })

    // Total unique colors from both standard materials and Bambu Studio paint colors
    const allUniqueColors = new Set([...Array.from(allMaterialIds), ...Array.from(allPaintColors)])
    analysis.colorZones = allUniqueColors.size


    // Add summary
    const summary = {
      totalMaterials: analysis.materials.length,
      totalObjects: analysis.objects.length,
      totalMeshes: analysis.meshes.length,
      colorZones: analysis.colorZones,
      supportsMultiColor: analysis.colorZones > 1 || analysis.meshes.length > 1,
      recommendedColors: Math.min(analysis.meshes.length, 4) // Cap at 4 colors
    }

    return NextResponse.json({
      success: true,
      analysis,
      summary,
      recommendations: {
        numberOfColors: summary.recommendedColors,
        reason: summary.supportsMultiColor
          ? `This 3MF has ${analysis.meshes.length} mesh(es) and ${analysis.colorZones} color zone(s), supporting multi-color printing`
          : 'This 3MF appears to be single-color only'
      }
    })

  } catch (error) {
    console.error('3MF Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze 3MF file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}