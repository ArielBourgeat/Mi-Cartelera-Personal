import { ESTADO_LABEL } from '../lib/validation.ts'
import type { EstadoVisualizacion } from '../types/index.ts'

export function StatusBadge({ estado }: { estado: EstadoVisualizacion }) {
  return <span className={`badge badge-${estado}`}>{ESTADO_LABEL[estado]}</span>
}
