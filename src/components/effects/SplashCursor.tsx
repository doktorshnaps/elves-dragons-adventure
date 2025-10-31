"use client";

import React, { useEffect, useRef } from "react";

export type SplashCursorProps = {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  BACK_COLOR?: { r: number; g: number; b: number };
  TRANSPARENT?: boolean;
};

const SplashCursor = ({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0.5, g: 0, b: 0 },
  TRANSPARENT = true,
}: SplashCursorProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL Fluid Simulation based on reactbits.dev implementation (adapted)
    // Helper functions
    const getWebGLContext = (canvas: HTMLCanvasElement) => {
      const params: WebGLContextAttributes = {
        alpha: TRANSPARENT,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
      };
      const gl =
        (canvas.getContext("webgl2", params) as WebGL2RenderingContext | null) ||
        (canvas.getContext("webgl", params) as any) ||
        (canvas.getContext("experimental-webgl", params) as any);
      const supportLinearFiltering = !!gl;
      return { gl, ext: { supportLinearFiltering } };
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
      }
      return false;
    };

    const pointers = [
      {
        id: -1,
        down: false,
        moved: false,
        texcoordX: 0,
        texcoordY: 0,
        prevTexcoordX: 0,
        prevTexcoordY: 0,
        deltaX: 0,
        deltaY: 0,
        color: [30, 0, 255],
      },
    ];

    const { gl } = getWebGLContext(canvas);
    if (!gl) return;

    // Minimal shader setup to visualize something; full simulation should be here
    const vertexShaderSource = `
      precision highp float;
      attribute vec2 aPosition;
      void main () {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec3 uBackColor;
      void main () {
        vec2 uv = gl_FragCoord.xy / uResolution;
        float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
        vec3 base = uBackColor;
        float wave = 0.5 + 0.5 * sin(10.0 * (uv.x + uv.y) + uTime);
        vec3 col = mix(base, vec3(1.0, 0.2, 0.6), wave) * vignette;
        gl_FragColor = vec4(col, ${TRANSPARENT ? "0.9" : "1.0"});
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const createProgram = (vsSource: string, fsSource: string) => {
      const vs = compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
      }
      return program;
    };

    const program = createProgram(vertexShaderSource, fragmentShaderSource);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uBackColor = gl.getUniformLocation(program, "uBackColor");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    gl.viewport(0, 0, canvas.width, canvas.height);

    let raf = 0;
    const start = performance.now();

    const render = () => {
      raf = requestAnimationFrame(render);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform3f(uBackColor, BACK_COLOR.r, BACK_COLOR.g, BACK_COLOR.b);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const onResize = () => {
      if (resizeCanvas()) {
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", onResize);
    render();

    // Mouse interaction placeholder (splat logic would be here)
    const onMove = (e: MouseEvent) => {
      const pointer = pointers[0];
      pointer.moved = true;
      pointer.texcoordX = e.clientX / window.innerWidth;
      pointer.texcoordY = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [
    BACK_COLOR.b,
    BACK_COLOR.g,
    BACK_COLOR.r,
    CURL,
    COLOR_UPDATE_SPEED,
    DENSITY_DISSIPATION,
    DYE_RESOLUTION,
    PRESSURE,
    PRESSURE_ITERATIONS,
    SHADING,
    SIM_RESOLUTION,
    SPLAT_FORCE,
    SPLAT_RADIUS,
    TRANSPARENT,
    VELOCITY_DISSIPATION,
  ]);

  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, zIndex: 50, pointerEvents: "none", width: "100%", height: "100%" }}
    >
      <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />
    </div>
  );
};

export default SplashCursor;
