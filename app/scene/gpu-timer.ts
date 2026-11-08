/**
 * GPU time of one draw, from EXT_disjoint_timer_query_webgl2 where the browser offers it. One query is in flight
 * at a time; its answer arrives a few frames later and is reported then. Without the extension, read() is null.
 */
type TimerExtension = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };

export type GpuTimer = {
  begin: () => void;
  end: () => void;
  /** Seconds of GPU time for the last finished query, once; otherwise null. */
  read: () => number | null;
};

const NO_TIMER: GpuTimer = {
  begin: () => undefined,
  end: () => undefined,
  read: () => null,
};

export function createGpuTimer(gl: WebGL2RenderingContext): GpuTimer {
  const ext = gl.getExtension(
    "EXT_disjoint_timer_query_webgl2",
  ) as TimerExtension | null;
  if (!ext) {
    return NO_TIMER;
  }
  let pending: WebGLQuery | null = null;
  let running = false;
  return {
    begin() {
      if (pending || running) {
        return;
      }
      pending = gl.createQuery();
      if (pending) {
        gl.beginQuery(ext.TIME_ELAPSED_EXT, pending);
        running = true;
      }
    },
    end() {
      if (running) {
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        running = false;
      }
    },
    read() {
      if (
        !pending ||
        running ||
        !gl.getQueryParameter(pending, gl.QUERY_RESULT_AVAILABLE)
      ) {
        return null;
      }
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) as boolean;
      const nanoseconds = gl.getQueryParameter(
        pending,
        gl.QUERY_RESULT,
      ) as number;
      gl.deleteQuery(pending);
      pending = null;
      return disjoint ? null : nanoseconds / 1e9;
    },
  };
}
