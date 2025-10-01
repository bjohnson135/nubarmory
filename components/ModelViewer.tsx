'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { STLLoader } from '@/lib/stl-loader'
import { ThreeMFLoader } from '@/lib/3mf-loader'

interface ColorZone {
  id: string
  name: string
  color: string
  // Future: material indices for multi-material models
}

interface ModelViewerProps {
  modelUrl?: string
  selectedColors: string[]
  colorZones?: ColorZone[]
  className?: string
  width?: number
  height?: number
  initialRotation?: { x: number; y: number; z: number }
}

export default function ModelViewer({
  modelUrl,
  selectedColors,
  colorZones = [],
  className = '',
  width = 400,
  height = 400,
  initialRotation = { x: 0, y: 0, z: 0 }
}: ModelViewerProps) {
  console.log('ModelViewer: Component rendering with props:', { modelUrl, selectedColors, width, height })

  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const modelRef = useRef<THREE.Mesh | null>(null)
  const frameRef = useRef<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    console.log('ModelViewer: useEffect triggered for scene initialization', { width, height, hasMount: !!mountRef.current })
    console.log('ModelViewer: mountRef.current:', mountRef.current)

    // Add a timeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      console.log('ModelViewer: Timeout triggered, checking mountRef again:', mountRef.current)
      if (!mountRef.current) {
        console.log('ModelViewer: mountRef.current is still null after timeout, skipping initialization')
        return
      }

      initializeScene()
    }, 100)

    const initializeScene = () => {
      if (!mountRef.current) {
        console.log('ModelViewer: mountRef.current is null in initializeScene, skipping initialization')
        return
      }

      // Clear any existing children to prevent multiple canvas elements
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild)
      }

      console.log('ModelViewer: Initializing Three.js scene', { width, height, mountRef: mountRef.current })

      try {
        // Scene setup
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf5f5f5)
        sceneRef.current = scene
        console.log('ModelViewer: Scene created successfully')

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        camera.position.set(0, 0, 5)
        console.log('ModelViewer: Camera created successfully')

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        rendererRef.current = renderer
        console.log('ModelViewer: Renderer created successfully', { width, height })

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(1, 1, 1)
        directionalLight.castShadow = true
        scene.add(directionalLight)

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
        fillLight.position.set(-1, -1, -1)
        scene.add(fillLight)
        console.log('ModelViewer: Lighting setup complete')

        // Controls (simple rotation)
        let mouseDown = false
        let mouseX = 0
        let mouseY = 0
        let rotationX = initialRotation.x  // Start with configured X rotation
        let rotationY = initialRotation.y  // Start with configured Y rotation

        const handleMouseDown = (event: MouseEvent) => {
          mouseDown = true
          mouseX = event.clientX
          mouseY = event.clientY
        }

        const handleMouseUp = () => {
          mouseDown = false
        }

        const handleMouseMove = (event: MouseEvent) => {
          if (!mouseDown) return

          const deltaX = event.clientX - mouseX
          const deltaY = event.clientY - mouseY

          rotationY += deltaX * 0.01
          rotationX += deltaY * 0.01

          // Limit vertical rotation to prevent flipping
          rotationX = Math.max(-Math.PI, Math.min(0, rotationX))

          if (modelRef.current) {
            modelRef.current.rotation.x = rotationX
            modelRef.current.rotation.y = rotationY
          }

          mouseX = event.clientX
          mouseY = event.clientY
        }

        const handleWheel = (event: WheelEvent) => {
          event.preventDefault()
          const scale = event.deltaY > 0 ? 0.9 : 1.1
          if (modelRef.current) {
            modelRef.current.scale.multiplyScalar(scale)
          }
        }

        // Add event listeners
        renderer.domElement.addEventListener('mousedown', handleMouseDown)
        renderer.domElement.addEventListener('mouseup', handleMouseUp)
        renderer.domElement.addEventListener('mousemove', handleMouseMove)
        renderer.domElement.addEventListener('wheel', handleWheel)

        // Animation loop
        const animate = () => {
          frameRef.current = requestAnimationFrame(animate)
          renderer.render(scene, camera)
        }
        animate()
        console.log('ModelViewer: Animation loop started')

        // Mount to DOM
        mountRef.current.appendChild(renderer.domElement)
        console.log('ModelViewer: Canvas mounted to DOM')

      } catch (error) {
        console.error('ModelViewer: Error initializing Three.js scene:', error)
        setError('Failed to initialize 3D viewer')
      }
    }

    // Execute immediately if DOM is ready, otherwise wait for timeout
    if (mountRef.current) {
      console.log('ModelViewer: DOM ready, initializing immediately')
      clearTimeout(timeoutId)
      initializeScene()
    }

    // Cleanup
    return () => {
      console.log('ModelViewer: Cleaning up Three.js scene')
      clearTimeout(timeoutId)
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      if (rendererRef.current?.domElement) {
        const renderer = rendererRef.current
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement)
        }
        renderer.dispose()
      }
    }
  }, [width, height])

  // Update model rotation when initialRotation prop changes
  useEffect(() => {
    if (modelRef.current && initialRotation) {
      console.log('ModelViewer: Updating rotation from prop change:', initialRotation)
      modelRef.current.rotation.x = initialRotation.x
      modelRef.current.rotation.y = initialRotation.y
      modelRef.current.rotation.z = initialRotation.z
    }
  }, [initialRotation])

  // Load 3D model
  useEffect(() => {
    console.log('ModelViewer: Model loading useEffect triggered', { modelUrl, hasScene: !!sceneRef.current, loading })
    if (!modelUrl || !sceneRef.current) {
      console.log('ModelViewer: Skipping model load', { modelUrl, hasScene: !!sceneRef.current })
      return
    }

    console.log('ModelViewer: Starting to load model:', modelUrl)
    setLoading(true)
    setError(null)

    // Determine file type from extension
    const fileExtension = modelUrl.split('.').pop()?.toLowerCase()
    const is3MF = fileExtension === '3mf'
    const isSTL = fileExtension === 'stl'

    if (is3MF) {
      // Load 3MF file with color information
      const loader = new ThreeMFLoader()
      loader.load(
        modelUrl,
        (group) => {
          console.log('ModelViewer: 3MF loaded successfully', group)
          try {
            // Remove existing model
            if (modelRef.current && sceneRef.current) {
              sceneRef.current.remove(modelRef.current)
            }

            // The 3MF loader already centers and scales the group
            console.log('ModelViewer: 3MF group type:', group.constructor.name, group)

            // Set shadow properties - handle both Group and individual meshes
            if (group instanceof THREE.Group && typeof group.traverse === 'function') {
              group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true
                  child.receiveShadow = true
                }
              })
            } else if (group instanceof THREE.Mesh) {
              group.castShadow = true
              group.receiveShadow = true
            }

            // Store the original URL for file type detection
            (group as any)._originalUrl = modelUrl

            // Apply configured rotation or default rotation for 3MF models
            group.rotation.x = initialRotation.x
            group.rotation.y = initialRotation.y
            group.rotation.z = initialRotation.z

            // Store as model reference (it's a group, not a mesh)
            modelRef.current = group as any
            sceneRef.current!.add(group)

            console.log('ModelViewer: 3MF model added to scene with colors')
            setLoading(false)
          } catch (err) {
            console.error('ModelViewer: Error processing 3MF model:', err)
            setError('Failed to process 3MF model')
            setLoading(false)
          }
        },
        (progress) => {
          console.log('ModelViewer: Loading progress:', progress)
        },
        (error) => {
          console.error('ModelViewer: Error loading 3MF model:', error)
          setError('Failed to load 3MF model')
          setLoading(false)
        }
      )
    } else if (isSTL) {
      // Load STL file (existing code)
      const loader = new STLLoader()
      loader.load(
        modelUrl,
        (geometry) => {
          console.log('ModelViewer: STL loaded successfully', geometry)
          try {
            // Remove existing model
            if (modelRef.current && sceneRef.current) {
              sceneRef.current.remove(modelRef.current)
            }

            // Center and scale geometry
            geometry.computeBoundingBox()
            const box = geometry.boundingBox!
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)

            geometry.translate(-center.x, -center.y, -center.z)
            geometry.scale(2 / maxDim, 2 / maxDim, 2 / maxDim)

            // Create material with the first selected color
            const color = selectedColors.length > 0 ? selectedColors[0] : '#888888'
            const material = new THREE.MeshLambertMaterial({
              color: color,
              side: THREE.DoubleSide
            })

            // Create mesh
            const mesh = new THREE.Mesh(geometry, material)
            mesh.castShadow = true
            mesh.receiveShadow = true

            // Apply configured rotation
            mesh.rotation.x = initialRotation.x
            mesh.rotation.y = initialRotation.y
            mesh.rotation.z = initialRotation.z

            modelRef.current = mesh
            sceneRef.current!.add(mesh)

            console.log('ModelViewer: STL model mesh created and added to scene')
            setLoading(false)
          } catch (err) {
            console.error('ModelViewer: Error processing STL model:', err)
            setError('Failed to process STL model')
            setLoading(false)
          }
        },
        (progress) => {
          console.log('ModelViewer: Loading progress:', progress)
        },
        (error) => {
          console.error('ModelViewer: Error loading STL model:', error)
          setError('Failed to load STL model')
          setLoading(false)
        }
      )
    } else {
      setError(`Unsupported file format: ${fileExtension}`)
      setLoading(false)
    }
  }, [modelUrl])

  // Update colors in real-time
  useEffect(() => {
    if (!modelRef.current) return

    const model = modelRef.current
    const modelUrl = (model as any)._originalUrl || ''
    const is3MF = modelUrl.toLowerCase().includes('.3mf')

    // For 3MF files, preserve the original colors from Bambu Studio only if no colors selected or using default gray
    if (is3MF && (selectedColors.length === 0 || (selectedColors.length === 1 && selectedColors[0] === '#888888'))) {
      console.log('ModelViewer: 3MF file detected, preserving original colors from Bambu Studio')
      return
    }

    if (selectedColors.length === 0) return

    // Helper function to update a material's color
    const updateMaterialColor = (material: THREE.Material, colorHex: string) => {
      if (material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial) {
        material.color.setHex(parseInt(colorHex.replace('#', '0x')))
        material.needsUpdate = true
      }
    }

    console.log('ModelViewer: Updating colors to:', selectedColors)

    // Handle different model types
    if (model instanceof THREE.Mesh) {
      // Single mesh (STL files)
      const material = model.material
      if (Array.isArray(material)) {
        // Multiple materials
        material.forEach((mat, index) => {
          const colorIndex = Math.min(index, selectedColors.length - 1)
          updateMaterialColor(mat, selectedColors[colorIndex])
        })
      } else if (material) {
        // Single material
        updateMaterialColor(material, selectedColors[0])
      }
    } else if (model && typeof model === 'object' && (model as any) instanceof THREE.Group) {
      // Group of meshes (3MF files)
      console.log('ModelViewer: Updating 3MF group colors, selected colors:', selectedColors)
      let meshIndex: number = 0
      (model as any).traverse((child: any) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material
          if (Array.isArray(material)) {
            // Multiple materials on this mesh (Bambu Studio painted areas)
            material.forEach((mat, index) => {
              const colorIndex = index % selectedColors.length
              console.log(`ModelViewer: Applying color ${selectedColors[colorIndex]} to material ${index} on mesh ${meshIndex}`)
              updateMaterialColor(mat, selectedColors[colorIndex])
            })
          } else {
            // Single material on this mesh
            const colorIndex = meshIndex % selectedColors.length
            console.log(`ModelViewer: Applying color ${selectedColors[colorIndex]} to mesh ${meshIndex}`)
            updateMaterialColor(material, selectedColors[colorIndex])
            meshIndex++
          }
        }
      })
    }
  }, [selectedColors])

  if (!modelUrl) {
    console.log('ModelViewer: No modelUrl provided, showing placeholder')
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-sm">No 3D model uploaded</div>
        </div>
      </div>
    )
  }

  console.log('ModelViewer: About to render 3D viewer container', { loading, error })

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-100 ${className}`} style={{ width, height }}>
      <div ref={mountRef} style={{ width, height }} className="relative overflow-hidden bg-gray-200" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <div className="text-sm">Loading 3D model...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 border border-red-300 rounded-lg">
          <div className="text-red-700 text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  )
}