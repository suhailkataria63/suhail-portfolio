// A small metaball field gives the ink merging edges and pinching tendrils.
// White pixels invert the DOM beneath the canvas through CSS difference blending.
export const INK_POINTS = 10

const vertexSource = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec2 u_size;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_opacity;
  uniform vec3 u_points[10];

  void main() {
    vec2 p = gl_FragCoord.xy / u_resolution * u_size;
    p.y = u_size.y - p.y;
    // Low-frequency domain warping breaks the roundness without noisy edges.
    vec2 warp = vec2(
      sin(p.y * 0.019 + u_time * 0.7) + sin(p.x * 0.013 - p.y * 0.009 + u_time),
      cos(p.x * 0.016 - u_time * 0.6) + sin(p.y * 0.012 + p.x * 0.007)
    ) * 7.0;
    float field = 0.0;
    for (int i = 0; i < 10; i++) {
      vec2 delta = (p + warp - u_points[i].xy) / u_points[i].z;
      field += exp(-dot(delta, delta) * 2.0);
    }
    #ifdef INK_DERIVATIVES
    float edge = max(fwidth(field), 0.002);
    #else
    float edge = 0.02;
    #endif
    float alpha = smoothstep(0.79 - edge, 0.79 + edge, field) * u_opacity;
    gl_FragColor = vec4(vec3(alpha), alpha);
  }
`

export function createInkRenderer(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, powerPreference: 'low-power',
  })
  if (!gl) return null // The semantic, static hero remains usable without WebGL.

  const compile = (type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader)
      return null
    }
    return shader
  }
  const vertex = compile(gl.VERTEX_SHADER, vertexSource)
  const derivatives = gl.getExtension('OES_standard_derivatives')
  const fragment = compile(gl.FRAGMENT_SHADER, (derivatives
    ? '#extension GL_OES_standard_derivatives : enable\n#define INK_DERIVATIVES\n'
    : '') + fragmentSource)
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex)
    if (fragment) gl.deleteShader(fragment)
    return null
  }
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.useProgram(program)
  const position = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  const uniforms = Object.fromEntries(['size', 'resolution', 'time', 'opacity', 'points[0]'].map(
    name => [name, gl.getUniformLocation(program, `u_${name}`)],
  ))
  let width = 1
  let height = 1
  let scaleX = 1
  let scaleY = 1

  return {
    resize(w, h) {
      width = Math.max(1, w)
      height = Math.max(1, h)
      // Preserve crisp edges; scissoring below bounds shader work to the ink.
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      scaleX = canvas.width / width
      scaleY = canvas.height / height
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uniforms.size, width, height)
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
    },
    clear() {
      gl.disable(gl.SCISSOR_TEST)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    },
    draw(points, time, opacity) {
      this.clear()
      let left = width, right = 0, top = height, bottom = 0
      for (let i = 0; i < points.length; i += 3) {
        const pad = points[i + 2] * 2.5 + 24
        left = Math.min(left, points[i] - pad)
        right = Math.max(right, points[i] + pad)
        top = Math.min(top, points[i + 1] - pad)
        bottom = Math.max(bottom, points[i + 1] + pad)
      }
      left = Math.max(0, left)
      right = Math.min(width, right)
      top = Math.max(0, top)
      bottom = Math.min(height, bottom)
      gl.enable(gl.SCISSOR_TEST)
      const x = Math.floor(left * scaleX)
      const y = Math.floor((height - bottom) * scaleY)
      gl.scissor(x, y,
        Math.max(0, Math.ceil(right * scaleX) - x),
        Math.max(0, Math.ceil((height - top) * scaleY) - y))
      gl.uniform3fv(uniforms['points[0]'], points)
      gl.uniform1f(uniforms.time, time)
      gl.uniform1f(uniforms.opacity, opacity)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      this.clear()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}
