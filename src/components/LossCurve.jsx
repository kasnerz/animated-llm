import { useId } from 'react';

// Chart geometry in SVG user units
const WIDTH = 260;
const HEIGHT = 190;
const MARGIN = { top: 16, right: 16, bottom: 34, left: 40 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

// Errors above this value are drawn at the top edge with an "off the chart" marker
const MAX_ERROR = 5;

const xScale = (p) => MARGIN.left + p * PLOT_W;
const yScale = (err) => MARGIN.top + PLOT_H - (Math.min(err, MAX_ERROR) / MAX_ERROR) * PLOT_H;

// Sample -log(p) on a log-spaced grid so the steep part near p = 0 stays smooth
const CURVE_PATH = Array.from({ length: 81 }, (_, i) => {
  const err = MAX_ERROR * (1 - i / 80);
  const p = Math.exp(-err);
  return `${i === 0 ? 'M' : 'L'} ${xScale(p).toFixed(2)} ${yScale(err).toFixed(2)}`;
}).join(' ');

const X_TICKS = [0, 0.25, 0.5, 0.75, 1];
const Y_TICKS = [0, 1, 2, 3, 4, 5];

/**
 * Plot of the cross-entropy error −log(p) against the predicted probability p
 * of the target token, with an animated marker at the current training step.
 *
 * @param {number} prob - Predicted probability of the target token
 * @param {number} error - Model error for this step (−log(p))
 * @param {string} probLabel - Axis label for the probability
 * @param {string} errorLabel - Axis label for the error
 */
function LossCurve({ prob, error, probLabel, errorLabel }) {
  const clipId = useId();
  const markerX = xScale(Math.max(0, Math.min(1, prob)));
  const markerY = yScale(error);
  const isOffChart = error > MAX_ERROR;
  // Keep the value label inside the chart: put it left of the marker near p = 100%
  const labelOnLeft = markerX > MARGIN.left + PLOT_W * 0.7;
  const errorText = Number.isFinite(error) ? error.toFixed(3) : '∞';
  const moveStyle = (x, y) => ({ transform: `translate(${x}px, ${y}px)` });

  return (
    <svg
      className="loss-curve"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${errorLabel} ${error.toFixed(3)}`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={MARGIN.left} y={MARGIN.top - 8} width={PLOT_W + 8} height={PLOT_H + 8} />
        </clipPath>
      </defs>

      {/* Grid and axes */}
      {Y_TICKS.map((tick) => (
        <g key={`y-${tick}`}>
          <line
            className="loss-curve-grid"
            x1={MARGIN.left}
            x2={MARGIN.left + PLOT_W}
            y1={yScale(tick)}
            y2={yScale(tick)}
          />
          <text
            className="loss-curve-tick"
            x={MARGIN.left - 6}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {tick}
          </text>
        </g>
      ))}
      {X_TICKS.map((tick) => (
        <text
          key={`x-${tick}`}
          className="loss-curve-tick"
          x={xScale(tick)}
          y={MARGIN.top + PLOT_H + 18}
          textAnchor="middle"
        >
          {`${tick * 100}%`}
        </text>
      ))}
      <line
        className="loss-curve-axis"
        x1={MARGIN.left}
        x2={MARGIN.left + PLOT_W}
        y1={MARGIN.top + PLOT_H}
        y2={MARGIN.top + PLOT_H}
      />
      <text
        className="loss-curve-axis-label"
        x={MARGIN.left + PLOT_W}
        y={HEIGHT - 2}
        textAnchor="end"
      >
        {probLabel}
      </text>
      <text
        className="loss-curve-axis-label"
        x={4}
        y={MARGIN.top + PLOT_H / 2}
        textAnchor="middle"
        transform={`rotate(-90 4 ${MARGIN.top + PLOT_H / 2})`}
        dominantBaseline="hanging"
      >
        {errorLabel}
      </text>

      <path className="loss-curve-line" d={CURVE_PATH} />

      {/* Guide lines from the marker to both axes, clipped to the plot area */}
      <g clipPath={`url(#${clipId})`}>
        <g className="loss-curve-moving" style={moveStyle(markerX, markerY)}>
          <line className="loss-curve-guide prob" x1={0} y1={0} x2={0} y2={HEIGHT} />
          <line className="loss-curve-guide error" x1={0} y1={0} x2={-WIDTH} y2={0} />
        </g>
      </g>

      <g className="loss-curve-moving" style={moveStyle(markerX, markerY)}>
        {isOffChart && <path className="loss-curve-offchart" d="M -5 -11 L 0 -18 L 5 -11 Z" />}
        <circle className="loss-curve-marker" r={6} />
        <text
          className="loss-curve-value"
          x={labelOnLeft ? -12 : 12}
          y={isOffChart ? 4 : -10}
          textAnchor={labelOnLeft ? 'end' : 'start'}
        >
          {`${errorLabel}: ${errorText}`}
        </text>
      </g>
    </svg>
  );
}

export default LossCurve;
