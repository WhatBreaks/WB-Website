import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { HERO_NODES, HERO_EDGES } from '../mockData'
import { InfraNode } from '../types'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useTheme } from '../themeContext'

type SimulationPhase =
  | 'HEALTHY'
  | 'CHANGE_PROPOSED'
  | 'TRACE'
  | 'IMPACT'
  | 'BLAST_RADIUS'
  | 'SETTLED'
  | 'RESETTING'

interface NodeScreenPos {
  id: string
  x: number
  y: number
  visible: boolean
}

export const HeroDependencySimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const dimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const { theme } = useTheme()
  const themeRef = useRef(theme)

  useEffect(() => {
    themeRef.current = theme
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(theme === 'dark' ? 0x202020 : 0xE9E8E2)
    }
  }, [theme])

  // Simulation state
  const [phase, setPhase] = useState<SimulationPhase>('HEALTHY')
  const [phaseProgress, setPhaseProgress] = useState<number>(0)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('postgresql')
  const [simulatedRemovalId, setSimulatedRemovalId] = useState<string | null>(null)
  const [isManualMode, setIsManualMode] = useState<boolean>(false)
  const [screenPositions, setScreenPositions] = useState<Record<string, NodeScreenPos>>({})

  // Mouse tracking
  const mousePosRef = useRef<{ x: number; y: number } | null>(null)
  const mouseNormRef = useRef<THREE.Vector2>(new THREE.Vector2(-100, -100))

  // Loop clock
  const loopTimeRef = useRef<number>(0)

  // Fast node map
  const nodesMap = useMemo(() => {
    const map = new Map<string, InfraNode>()
    HERO_NODES.forEach((n) => map.set(n.id, n))
    return map
  }, [])

  // Check affected nodes
  const isDirectlyAffected = useCallback((nodeId: string) => {
    return nodeId === 'auth-service' || nodeId === 'user-service' || nodeId === 'billing-service'
  }, [])

  const isIndirectlyAffected = useCallback((nodeId: string) => {
    return nodeId === 'redis' || nodeId === 'worker' || nodeId === 'analytics'
  }, [])

  // Removal interaction
  const handleToggleRemove = (nodeId: string) => {
    if (simulatedRemovalId === nodeId) {
      setSimulatedRemovalId(null)
      setIsManualMode(false)
    } else {
      setSimulatedRemovalId(nodeId)
      setIsManualMode(true)
    }
  }

  const handleRestore = () => {
    setSimulatedRemovalId(null)
    setIsManualMode(false)
  }

  // Ref tracking current dynamic state for Three.js render loop
  const stateRef = useRef({
    phase: 'HEALTHY' as SimulationPhase,
    phaseProgress: 0,
    hoveredNodeId: null as string | null,
    selectedNodeId: 'postgresql' as string | null,
    simulatedRemovalId: null as string | null,
    isManualMode: false
  })

  useEffect(() => {
    stateRef.current = {
      phase,
      phaseProgress,
      hoveredNodeId,
      selectedNodeId,
      simulatedRemovalId,
      isManualMode
    }
  }, [phase, phaseProgress, hoveredNodeId, selectedNodeId, simulatedRemovalId, isManualMode])

  // Three.js scene setup
  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvasContainerRef.current
    if (!canvas || !container) return

    const initialW = container.clientWidth || 300
    const initialH = container.clientHeight || 300
    dimsRef.current = { w: initialW, h: initialH }

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(themeRef.current === 'dark' ? 0x202020 : 0xE9E8E2)
    sceneRef.current = scene

    // Camera with subtle perspective, adapting distance for narrow mobile viewports
    const initialAspect = initialW / (initialH || 1)
    const initialZ = initialAspect < 1.2 ? Math.max(8.5, 9.8 / initialAspect) : 8.5
    const camera = new THREE.PerspectiveCamera(38, initialAspect, 0.1, 100)
    camera.position.set(0, -0.05, initialZ)
    camera.lookAt(0, -0.05, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    })
    renderer.setSize(initialW, initialH, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Subtle lighting - minimal, architectural studio setup
    const ambientLight = new THREE.AmbientLight(0xf5f4ee, 1.15)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.75)
    dirLight.position.set(5, 10, 7)
    scene.add(dirLight)

    const backLight = new THREE.DirectionalLight(0xd8d6cc, 0.5)
    backLight.position.set(-5, -5, -5)
    scene.add(backLight)

    // 3D Nodes creation
    const nodeMeshes = new Map<string, THREE.Group>()
    const nodeHitSpheres = new Map<string, THREE.Mesh>()
    const raycastTargets: THREE.Mesh[] = []

    // Spatial node coordinates mapping with true 3D depth
    const spatialCoords: Record<string, [number, number, number]> = {
      'api-gateway': [0, 1.85, 0.5],
      'auth-service': [-1.95, 0.75, 0.2],
      'user-service': [0, 0.75, -0.3],
      'billing-service': [1.95, 0.75, 0.4],
      'postgresql': [-0.85, -0.65, -0.5],
      'redis': [-2.35, -0.7, 0.6],
      'queue': [1.1, -0.7, 0.2],
      'worker': [0.15, -1.85, -0.2],
      'analytics': [2.2, -1.8, 0.5]
    }

    HERO_NODES.forEach((node) => {
      const group = new THREE.Group()
      const [x, y, z] = spatialCoords[node.id] || [node.x, node.y, 0]
      group.position.set(x, y, z)

      // Base geometry based on service type
      let mainMesh: THREE.Mesh
      const material = new THREE.MeshStandardMaterial({
        color: 0x22242a,
        roughness: 0.55,
        metalness: 0.15
      })

      if (node.type === 'database') {
        // Architectural database cylinder
        const geo = new THREE.CylinderGeometry(0.32, 0.32, 0.36, 24)
        mainMesh = new THREE.Mesh(geo, material)
      } else if (node.type === 'gateway') {
        // Octagonal prism gateway
        const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 8)
        mainMesh = new THREE.Mesh(geo, material)
        mainMesh.rotation.y = Math.PI / 8
      } else if (node.type === 'cache') {
        // Torus / disc cache shape
        const geo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 20)
        mainMesh = new THREE.Mesh(geo, material)
      } else {
        // Microservice architectural block
        const geo = new THREE.BoxGeometry(0.52, 0.28, 0.28)
        mainMesh = new THREE.Mesh(geo, material)
      }

      mainMesh.name = `mesh-${node.id}`
      group.add(mainMesh)

      // Fine wireframe border outline
      const edgeGeo = new THREE.EdgesGeometry(mainMesh.geometry)
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x5a5e6d,
        linewidth: 1
      })
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat)
      edgeLine.name = `edge-${node.id}`
      group.add(edgeLine)

      // Status indicator pip on top of the node
      const pipGeo = new THREE.SphereGeometry(0.06, 12, 12)
      const pipMat = new THREE.MeshBasicMaterial({ color: 0x166534 })
      const pipMesh = new THREE.Mesh(pipGeo, pipMat)
      pipMesh.position.set(0, 0.22, 0)
      pipMesh.name = `pip-${node.id}`
      group.add(pipMesh)

      // Invisible larger sphere for reliable mouse raycasting
      const hitGeo = new THREE.SphereGeometry(0.48, 12, 12)
      const hitMat = new THREE.MeshBasicMaterial({ visible: false })
      const hitMesh = new THREE.Mesh(hitGeo, hitMat)
      hitMesh.userData = { nodeId: node.id }
      group.add(hitMesh)

      nodeMeshes.set(node.id, group)
      nodeHitSpheres.set(node.id, hitMesh)
      raycastTargets.push(hitMesh)
      scene.add(group)
    })

    // 3D Dependency Edges creation
    interface Edge3D {
      id: string
      source: string
      target: string
      lineMesh: THREE.Line
      pulseMesh: THREE.Mesh
      sourcePos: THREE.Vector3
      targetPos: THREE.Vector3
    }

    const edges3D: Edge3D[] = []

    HERO_EDGES.forEach((edge) => {
      const sourceCoord = spatialCoords[edge.source]
      const targetCoord = spatialCoords[edge.target]
      if (!sourceCoord || !targetCoord) return

      const sourcePos = new THREE.Vector3(...sourceCoord)
      const targetPos = new THREE.Vector3(...targetCoord)

      const lineGeo = new THREE.BufferGeometry().setFromPoints([sourcePos, targetPos])
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x555865,
        transparent: true,
        opacity: 0.5
      })
      const lineMesh = new THREE.Line(lineGeo, lineMat)
      scene.add(lineMesh)

      // Moving pulse particle along the 3D edge
      const pulseGeo = new THREE.SphereGeometry(0.04, 8, 8)
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.75 })
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat)
      pulseMesh.position.copy(sourcePos)
      scene.add(pulseMesh)

      edges3D.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        lineMesh,
        pulseMesh,
        sourcePos,
        targetPos
      })
    })

    // Raycaster
    const raycaster = new THREE.Raycaster()

    // Animation frame loop
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const totalTime = clock.getElapsedTime()

      const {
        phase: curPhase,
        phaseProgress: curProg,
        hoveredNodeId: curHover,
        selectedNodeId: curSelect,
        simulatedRemovalId: curRemoval,
        isManualMode: curManual
      } = stateRef.current

      // Advance 24s loop clock unless manual removal
      if (!curManual) {
        loopTimeRef.current = (loopTimeRef.current + delta) % 24
        const t = loopTimeRef.current

        let nextPhase: SimulationPhase = 'HEALTHY'
        let nextProg = 0

        if (t < 4.5) {
          nextPhase = 'HEALTHY'
          nextProg = t / 4.5
        } else if (t < 8.0) {
          nextPhase = 'CHANGE_PROPOSED'
          nextProg = (t - 4.5) / 3.5
        } else if (t < 12.0) {
          nextPhase = 'TRACE'
          nextProg = (t - 8.0) / 4.0
        } else if (t < 16.0) {
          nextPhase = 'IMPACT'
          nextProg = (t - 12.0) / 4.0
        } else if (t < 19.0) {
          nextPhase = 'BLAST_RADIUS'
          nextProg = (t - 16.0) / 3.0
        } else if (t < 21.5) {
          nextPhase = 'SETTLED'
          nextProg = (t - 19.0) / 2.5
        } else {
          nextPhase = 'RESETTING'
          nextProg = (t - 21.5) / 2.5
        }

        setPhase(nextPhase)
        setPhaseProgress(nextProg)
      }

      const curW = dimsRef.current.w || container.clientWidth
      const curH = dimsRef.current.h || container.clientHeight
      const curAsp = curW / (curH || 1)

      // Very subtle calm camera sway (smooth perspective micro-movement, no dramatic spin)
      const swayX = Math.sin(totalTime * 0.2) * (curAsp < 1.2 ? 0.06 : 0.2)
      const swayY = Math.cos(totalTime * 0.15) * (curAsp < 1.2 ? 0.05 : 0.08) - 0.05
      camera.position.x = swayX
      camera.position.y = swayY
      camera.lookAt(0, -0.05, 0)

      // Raycasting for hover detection
      raycaster.setFromCamera(mouseNormRef.current, camera)
      const intersects = raycaster.intersectObjects(raycastTargets)

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.nodeId as string
        if (hitId !== curHover) {
          setHoveredNodeId(hitId)
        }
      } else if (curHover !== null && mousePosRef.current) {
        setHoveredNodeId(null)
      }

      // Update Node 3D visual states
      nodeMeshes.forEach((group, nodeId) => {
        const isHover = curHover === nodeId
        const isSelect = curSelect === nodeId
        const isOffline = curRemoval === nodeId
        const isChanged = nodeId === 'postgresql' && (curPhase === 'CHANGE_PROPOSED' || curPhase === 'TRACE' || curPhase === 'IMPACT' || curPhase === 'BLAST_RADIUS' || curPhase === 'SETTLED')

        let isImpacted = false
        let isConflict = false

        if (curManual && curRemoval) {
          if (isDirectlyAffected(nodeId)) isImpacted = true
          if (isIndirectlyAffected(nodeId)) isConflict = true
        } else if (curPhase === 'IMPACT' || curPhase === 'BLAST_RADIUS' || curPhase === 'SETTLED') {
          if (nodeId === 'auth-service' || nodeId === 'billing-service') isImpacted = true
          if (nodeId === 'redis' || nodeId === 'worker') isConflict = true
        }

        const mainMesh = group.getObjectByName(`mesh-${nodeId}`) as THREE.Mesh
        const edgeLine = group.getObjectByName(`edge-${nodeId}`) as THREE.LineSegments
        const pipMesh = group.getObjectByName(`pip-${nodeId}`) as THREE.Mesh

        if (mainMesh && edgeLine && pipMesh) {
          const mat = mainMesh.material as THREE.MeshStandardMaterial
          const edgeMat = edgeLine.material as THREE.LineBasicMaterial
          const pipMat = pipMesh.material as THREE.MeshBasicMaterial

          const isDark = themeRef.current === 'dark'

          if (isOffline) {
            mat.color.setHex(isDark ? 0x242424 : 0x22242a)
            mat.opacity = 0.35
            mat.transparent = true
            edgeMat.color.setHex(isDark ? 0xEF4444 : 0xB91C1C)
            pipMat.color.setHex(isDark ? 0xEF4444 : 0xB91C1C)
          } else if (isImpacted) {
            mat.color.setHex(isDark ? 0x3D1E22 : 0x381E22)
            mat.opacity = 1
            mat.transparent = false
            edgeMat.color.setHex(isHover || isSelect ? (isDark ? 0xFFFFFF : 0x171717) : (isDark ? 0xEF4444 : 0xB91C1C))
            pipMat.color.setHex(isDark ? 0xEF4444 : 0xB91C1C)
          } else if (isConflict || isChanged) {
            mat.color.setHex(isDark ? 0x3A2E1C : 0x352818)
            mat.opacity = 1
            mat.transparent = false
            edgeMat.color.setHex(isHover || isSelect ? (isDark ? 0xFFFFFF : 0x171717) : (isDark ? 0xF59E0B : 0xD97706))
            pipMat.color.setHex(isDark ? 0xF59E0B : 0xD97706)
          } else {
            // Healthy calm state
            mat.color.setHex(isDark ? 0x2A2B33 : 0x22242a)
            mat.opacity = 1
            mat.transparent = false
            edgeMat.color.setHex(isHover || isSelect ? (isDark ? 0xFFFFFF : 0x171717) : (isDark ? 0x4E5264 : 0x5A5E6D))
            pipMat.color.setHex(isDark ? 0x22C55E : 0x166534)
          }

          // Subtle gentle vertical breathe on hovered/selected
          if (isHover || isSelect) {
            group.scale.set(1.06, 1.06, 1.06)
          } else {
            group.scale.set(1, 1, 1)
          }
        }
      })

      // Update 3D Edge states and moving pulses
      edges3D.forEach((edge, eIdx) => {
        const isHoverEdge = curHover === edge.source || curHover === edge.target
        const isSelectEdge = curSelect === edge.source || curSelect === edge.target
        const isSevered = curRemoval === edge.source || curRemoval === edge.target
        const isDark = themeRef.current === 'dark'

        let isEdgeTraced = false
        if (curPhase === 'TRACE') {
          if (edge.source === 'postgresql' || edge.target === 'postgresql') isEdgeTraced = true
          if (curProg > 0.4 && (edge.source === 'auth-service' || edge.target === 'auth-service')) isEdgeTraced = true
        }

        const lineMat = edge.lineMesh.material as THREE.LineBasicMaterial
        const pulseMat = edge.pulseMesh.material as THREE.MeshBasicMaterial

        if (isSevered) {
          lineMat.color.setHex(isDark ? 0xEF4444 : 0xB91C1C)
          lineMat.opacity = 0.65
          edge.pulseMesh.visible = false
        } else if (isHoverEdge || isSelectEdge) {
          lineMat.color.setHex(isDark ? 0xFFFFFF : 0x171717)
          lineMat.opacity = 0.95
          edge.pulseMesh.visible = true
          pulseMat.color.setHex(isDark ? 0xFFFFFF : 0x171717)
        } else if (isEdgeTraced) {
          lineMat.color.setHex(isDark ? 0xF59E0B : 0xD97706)
          lineMat.opacity = 0.85
          edge.pulseMesh.visible = true
          pulseMat.color.setHex(isDark ? 0xF59E0B : 0xD97706)
        } else {
          lineMat.color.setHex(isDark ? 0x383C4A : 0x555865)
          lineMat.opacity = isDark ? 0.6 : 0.45
          edge.pulseMesh.visible = true
          pulseMat.color.setHex(isDark ? 0xF5F5F2 : 0x33363F)
        }

        // Pulse position along 3D edge vector
        if (!isSevered) {
          const tProgress = ((totalTime * 0.4 + eIdx * 0.15) % 1)
          edge.pulseMesh.position.lerpVectors(edge.sourcePos, edge.targetPos, tProgress)
        }
      })

      // Project 3D node coordinates to 2D screen coordinates for crisp typography overlay
      // using dynamic real-time container dimensions so labels are 100% synchronized
      const newScreenPos: Record<string, NodeScreenPos> = {}
      HERO_NODES.forEach((node) => {
        const group = nodeMeshes.get(node.id)
        if (!group) return
        const worldPos = group.position.clone()
        worldPos.project(camera)

        const sx = ((worldPos.x + 1) * curW) / 2
        const sy = ((-worldPos.y + 1) * curH) / 2
        newScreenPos[node.id] = {
          id: node.id,
          x: sx,
          y: sy,
          visible: worldPos.z < 1
        }
      })
      setScreenPositions(newScreenPos)

      renderer.render(scene, camera)
    }

    animate()

    // Robust resize handler with responsive camera distance
    const handleResize = () => {
      if (!container || !canvas) return
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return

      dimsRef.current = { w, h }
      const asp = w / h
      camera.aspect = asp
      camera.position.z = asp < 1.2 ? Math.max(8.5, 9.8 / asp) : 8.5
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }

    // Direct ResizeObserver on canvas container for instant response to viewport & grid changes
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(container)
    }

    window.addEventListener('resize', handleResize)
    requestAnimationFrame(handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      renderer.dispose()
    }
  }, [nodesMap, isDirectlyAffected, isIndirectlyAffected])

  // Mouse move handler for raycaster mapped precisely to canvas container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = canvasContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    mousePosRef.current = { x, y }
    mouseNormRef.current.x = (x / rect.width) * 2 - 1
    mouseNormRef.current.y = -(y / rect.height) * 2 + 1
  }

  // Touch move handler for mobile devices
  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = canvasContainerRef.current
    if (!container || !e.touches[0]) return
    const rect = container.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    mousePosRef.current = { x, y }
    mouseNormRef.current.x = (x / rect.width) * 2 - 1
    mouseNormRef.current.y = -(y / rect.height) * 2 + 1
  }

  const handleTouchEnd = () => {
    if (hoveredNodeId) {
      setSelectedNodeId(hoveredNodeId)
    }
  }

  const handleMouseLeave = () => {
    mousePosRef.current = null
    mouseNormRef.current.set(-100, -100)
    setHoveredNodeId(null)
  }

  const handleClick = () => {
    if (hoveredNodeId) {
      setSelectedNodeId(hoveredNodeId)
    }
  }

  const activeNode = selectedNodeId ? nodesMap.get(selectedNodeId) : (hoveredNodeId ? nodesMap.get(hoveredNodeId) : null)
  const hoveredNode = hoveredNodeId ? nodesMap.get(hoveredNodeId) : null;
  
  return (
    <div className="hero-simulation-wrapper" ref={mountRef}>
      {/* Whisper-quiet status chip in top-left */}
      <div className="hero-sim-status-chip">
        <span className={`sim-indicator-dot ${isManualMode ? 'sim-indicator-dot-warning' : ''}`} />
        <span className="mono text-muted" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
          {isManualMode
            ? `SIMULATED OUTAGE: ${simulatedRemovalId?.toUpperCase()} SEVERED`
            : phase === 'HEALTHY'
            ? 'SYSTEM HEALTHY'
            : phase === 'CHANGE_PROPOSED'
            ? 'CHANGE PROPOSED (PostgreSQL 15 → 16)'
            : phase === 'TRACE'
            ? 'TRACING DEPENDENCIES'
            : phase === 'IMPACT'
            ? 'IMPACT EVALUATED'
            : phase === 'BLAST_RADIUS'
            ? 'BLAST RADIUS IDENTIFIED'
            : phase === 'SETTLED'
            ? 'ANALYSIS SETTLED'
            : 'RESTORING STATE'}
        </span>
      </div>

      {/* 3D WebGL Canvas */}
      <div
        className="sim-canvas-container"
        ref={canvasContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'relative' }}
      >
        <canvas ref={canvasRef} className="sim-canvas" />

        {/* Crisp HTML Node Labels overlayed accurately onto 3D projected coordinates */}
        <div className="sim-3d-labels-layer">
          {HERO_NODES.map((node) => {
            const pos = screenPositions[node.id]
            if (!pos || !pos.visible) return null

            const isHover = hoveredNodeId === node.id
            const isSelect = selectedNodeId === node.id
            const isOffline = simulatedRemovalId === node.id
            const isChanged = node.id === 'postgresql' && phase !== 'HEALTHY' && phase !== 'RESETTING' && !isManualMode

            return (
              <div
                key={node.id}
                className="sim-node-label"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y + 24}px`,
                  opacity: hoveredNodeId && hoveredNodeId !== node.id && !isSelect ? 0.35 : 1
                }}
              >
                <div
                  className="sim-node-label-title"
                  style={{
                    color: theme === 'dark' ? (isHover || isSelect ? '#FFFFFF' : '#F5F5F2') : (isHover || isSelect ? '#000000' : '#171717'),
                  }}
                >
                  {node.name}
                </div>
                <div
                  className="sim-node-label-sub mono"
                  style={{
                    color: isOffline
                      ? (theme === 'dark' ? '#EF4444' : '#B91C1C')
                      : isChanged
                      ? (theme === 'dark' ? '#F59E0B' : '#B45309')
                      : isHover || isSelect
                      ? (theme === 'dark' ? '#FFFFFF' : '#171717')
                      : (theme === 'dark' ? '#B8B8B3' : '#5F5F5A'),
                  }}
                >
                  {isOffline ? 'OFFLINE' : isChanged ? '15.4 → 16.1' : node.version || 'v1.0'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Small clean hover tooltip */}
        {hoveredNodeId && hoveredNode && mousePosRef.current && (
          <div
            className="sim-tooltip"
            style={{
              left: Math.min(Math.max(mousePosRef.current.x + 14, 10), (dimsRef.current.w || 320) - 230),
              top: Math.max(mousePosRef.current.y - 45, 10)
            }}
          >
            <div className="sim-tooltip-name">{hoveredNode.name.toUpperCase()}</div>
            <div className="sim-tooltip-sub mono text-muted">{hoveredNode.version || 'v1.0'}</div>
            <div className="sim-tooltip-row">
              <span className="text-muted">Type</span>
              <span className="mono">{hoveredNode.type}</span>
            </div>
            <div className="sim-tooltip-row">
              <span className="text-muted">Direct dependents</span>
              <span className="mono">{hoveredNode.directDependentsCount}</span>
            </div>
          </div>
        )}

        {/* Minimal Blast Radius metric pill during Phase 5 & 6 */}
        {(phase === 'BLAST_RADIUS' || phase === 'SETTLED' || isManualMode) && (
          <div className="sim-blast-pill">
            <span className="mono text-muted">BLAST RADIUS:</span>
            <span className="mono text-primary" style={{ fontWeight: 500 }}>
              3 affected services · 2 config conflicts · 1 high-risk path · 7 dependencies
            </span>
          </div>
        )}
      </div>

      {/* Sleek inline contextual inspector bar */}
      {activeNode && (
        <div className="hero-sim-context-bar">
          <div className="context-bar-left">
            <span className="context-node-name">{activeNode.name.toUpperCase()}</span>
            <span className="context-node-meta mono text-muted">
              {activeNode.type} · {activeNode.version} · {activeNode.directDependentsCount} dependents
            </span>
          </div>

          <div className="context-bar-actions">
            {simulatedRemovalId === activeNode.id ? (
              <button
                type="button"
                className="btn-context-action btn-context-restore"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRestore()
                }}
              >
                <RefreshCw size={12} />
                <span>Restore topology</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-context-action btn-context-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleRemove(activeNode.id)
                }}
              >
                <AlertTriangle size={12} />
                <span>Simulate removal</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
