import "./style.css"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { BokehPass } from "./Passes/BokehPass"
import terrainVertexShader from "./shaders/terrain/vertex.glsl"
import terrainFragmentShader from "./shaders/terrain/fragment.glsl"
import terrainDepthVertexShader from "./shaders/terrainDepth/vertex.glsl"
import terrainDepthFragmentShader from "./shaders/terrainDepth/fragment.glsl"

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
}

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

  // Update camera
  camera.instance.aspect = sizes.width / sizes.height
  camera.instance.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.pixelRatio)

  // Update effect composer
  effectComposer.setSize(sizes.width, sizes.height)
  effectComposer.setPixelRatio(sizes.pixelRatio)

  //Update passes
  bokehPass.renderTargetDepth.width = sizes.width * sizes.pixelRatio
  bokehPass.renderTargetDepth.height = sizes.height * sizes.pixelRatio
})

/**
 * Camera
 */
const camera = {}
camera.position = new THREE.Vector3()
camera.rotation = new THREE.Euler()
camera.rotation.reorder("YXZ")

// Base camera
camera.instance = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.instance.rotation.reorder("YXZ")
scene.add(camera.instance)

// Orbit Controls
const orbitControls = new OrbitControls(camera.instance, canvas)
orbitControls.enableDamping = true
orbitControls.enabled = false

/**
 * Terrain
 */

const terrain = {}

// Texture
terrain.texture = {}
terrain.texture.visible = false
terrain.texture.linesCount = 5
terrain.texture.bigLineWidth = 0.06
terrain.texture.smallLineWidth = 0.01
terrain.texture.smallLineAlpha = 0.5
terrain.texture.width = 32
terrain.texture.height = 128
terrain.texture.canvas = document.createElement("canvas")
terrain.texture.canvas.width = terrain.texture.width
terrain.texture.canvas.height = terrain.texture.height
terrain.texture.canvas.style.position = "fixed"
terrain.texture.canvas.style.top = 0
terrain.texture.canvas.style.left = 0
terrain.texture.canvas.style.zIndex = 1

if (terrain.texture.visible) {
  document.body.append(terrain.texture.canvas)
}

terrain.texture.context = terrain.texture.canvas.getContext("2d")

terrain.texture.instance = new THREE.CanvasTexture(terrain.texture.canvas)
terrain.texture.instance.wrapS = THREE.RepeatWrapping
terrain.texture.instance.wrapT = THREE.RepeatWrapping
terrain.texture.instance.magFilter = THREE.NearestFilter

terrain.texture.update = () => {
  terrain.texture.context.clearRect(
    0,
    0,
    terrain.texture.width,
    terrain.texture.height
  )

  //Big Lines
  const actualBigLineWidth = Math.round(
    terrain.texture.height * terrain.texture.bigLineWidth
  )
  terrain.texture.context.globalAlpha = 1
  terrain.texture.context.fillStyle = "#ffffff"
  terrain.texture.context.fillRect(
    0,
    0,
    terrain.texture.width,
    actualBigLineWidth
  )

  // Small Lines
  const actualSmallLineWidth = Math.round(
    terrain.texture.height * terrain.texture.smallLineWidth
  )
  const smallLinesCount = terrain.texture.linesCount - 1

  for (let i = 0; i < smallLinesCount; i++) {
    terrain.texture.context.globalAlpha = terrain.texture.smallLineAlpha
    terrain.texture.context.fillStyle = "#0858e2"
    terrain.texture.context.fillRect(
      0,
      actualBigLineWidth +
        Math.round(
          (terrain.texture.height - actualBigLineWidth) /
            terrain.texture.linesCount
        ) *
          (i + 1),
      terrain.texture.width,
      actualSmallLineWidth
    )
  }
}

terrain.texture.update()

//Geometry
terrain.geometry = new THREE.PlaneGeometry(1, 1, 1000, 1000)
terrain.geometry.rotateX(-Math.PI * 0.5)

//Uniforms
terrain.uniforms = {
  uTexture: { value: terrain.texture.instance },
  uElevation: { value: 2 },
  uTextureFrequency: { value: 10 },
  uTime: { value: 0 },
}

//Material
terrain.material = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.DoubleSide,
  vertexShader: terrainVertexShader,
  fragmentShader: terrainFragmentShader,
  uniforms: terrain.uniforms,
})

// Depth Material
const uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib.common,
  THREE.UniformsLib.displacementmap,
])

for (const uniformKey in terrain.uniforms) {
  uniforms[uniformKey] = terrain.uniforms[uniformKey]
}

terrain.depthMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: terrainDepthVertexShader,
  fragmentShader: terrainDepthFragmentShader,
})

terrain.depthMaterial.depthPacking = THREE.RGBADepthPacking
terrain.depthMaterial.blending = THREE.NoBlending

//Mesh
terrain.mesh = new THREE.Mesh(terrain.geometry, terrain.material)
terrain.mesh.scale.set(10, 10, 10)
terrain.mesh.userData.depthMaterial = terrain.depthMaterial
scene.add(terrain.mesh)

/**
 * Renderer
 */
// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
})
renderer.setClearColor(0x111111, 1) //change bg colour
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

//Effect Composer
const renderTarget = new THREE.WebGLMultipleRenderTargets(800, 600, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  // encoding: THREE.sRGBEncoding,
})
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(sizes.pixelRatio)

// Render Pass
const renderPass = new RenderPass(scene, camera.instance)
effectComposer.addPass(renderPass)

//Bokeh Pass
const bokehPass = new BokehPass(scene, camera.instance, {
  focus: 1.0,
  aperture: 0.01,
  maxblur: 0.012,

  width: sizes.width * sizes.pixelRatio,
  height: sizes.height * sizes.pixelRatio,
})

// bokehPass.enabled = false
effectComposer.addPass(bokehPass)

/**
 * View
 */

const view = {
  position: {
    x: 2.1,
    y: 0.7,
    z: 1.5,
  },
  rotation: { x: -0.667, y: -Math.PI, z: 0 },
}

console.log(view)

// Parallax
view.parallax = {}
view.parallax.target = {}
view.parallax.target.x = 0
view.parallax.target.y = 0
view.parallax.eased = {}
view.parallax.eased.x = 0
view.parallax.eased.y = 0
view.parallax.eased.multiplier = 4
view.parallax.multiplier = 0.1

window.addEventListener("mousemove", (_event) => {
  view.parallax.target.x =
    (_event.clientX / sizes.width - 0.5) * view.parallax.multiplier
  view.parallax.target.y =
    -(_event.clientY / sizes.height - 0.5) * view.parallax.multiplier
})

camera.position.copy(view.position)
camera.rotation.x = view.rotation.x
camera.rotation.y = view.rotation.y

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - lastElapsedTime
  lastElapsedTime = elapsedTime

  //Update terrain
  terrain.uniforms.uTime.value = elapsedTime

  // Update controls
  if (orbitControls.enabled) {
    orbitControls.update()
  }

  // Camera
  camera.instance.position.copy(camera.position)

  view.parallax.eased.x +=
    (view.parallax.target.x - view.parallax.eased.x) *
    deltaTime *
    view.parallax.eased.multiplier
  view.parallax.eased.y +=
    (view.parallax.target.y - view.parallax.eased.y) *
    deltaTime *
    view.parallax.eased.multiplier

  camera.instance.translateX(view.parallax.eased.x)
  camera.instance.translateY(view.parallax.eased.y)

  camera.instance.rotation.x = camera.rotation.x
  camera.instance.rotation.y = camera.rotation.y

  // Render
  // renderer.render(scene, camera.instance)
  effectComposer.render()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
